import crypto from "crypto";
import { getCalendarClient, BOOKING_CONFIG } from "@/lib/google-calendar";
import { sendBookingEmails } from "@/lib/resend";

const WEBHOOK_SECRET = process.env.YOCO_WEBHOOK_SECRET; // whsec_...
const TOLERANCE_SECONDS = 3 * 60; // Yoco's recommended replay window

// Keep in sync with the barbers in Booking.jsx and the checkout route
const BARBERS = {
  marcus: "Marcus",
  dev: "Dev",
  tomas: "Tomas",
};

// Prices in Rand. Keep in sync with Booking.jsx and the checkout route
const SERVICES = {
  classic: { name: "Classic cut", price: 25 },
  fade: { name: "Skin fade", price: 30 },
  buzz: { name: "Buzz cut", price: 15 },
  kids: { name: "Kids' cut", price: 18 },
  beard: { name: "Beard trim", price: 15 },
  shave: { name: "Hot towel shave", price: 28 },
  "cut-beard": { name: "Cut and beard", price: 38 },
  "cut-shave": { name: "Cut and hot towel shave", price: 50 },
};

// Yoco signs webhooks the same way Svix / Standard Webhooks does:
// https://developer.yoco.com/online/api-reference/webhooks/verifying-events/
function isValidSignature({ id, timestamp, rawBody, signatureHeader }) {
  if (!id || !timestamp || !signatureHeader) return false;

  // Reject stale or replayed webhooks
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (Number.isNaN(age) || age > TOLERANCE_SECONDS) return false;

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const secretBytes = Buffer.from(WEBHOOK_SECRET.split("_")[1], "base64");
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");
  const expectedBuffer = Buffer.from(expected, "base64");

  // The header can carry more than one "v1,<signature>" entry, space separated
  return signatureHeader
    .split(" ")
    .map((entry) => entry.split(",")[1])
    .filter(Boolean)
    .some((candidate) => {
      const candidateBuffer = Buffer.from(candidate, "base64");
      return (
        candidateBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(candidateBuffer, expectedBuffer)
      );
    });
}

// POST /api/webhooks/yoco
export async function POST(request) {
  // Signature verification needs the exact raw bytes, before any JSON parsing
  const rawBody = await request.text();

  const valid = isValidSignature({
    id: request.headers.get("webhook-id"),
    timestamp: request.headers.get("webhook-timestamp"),
    rawBody,
    signatureHeader: request.headers.get("webhook-signature"),
  });

  if (!valid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Only a successful payment creates a booking; acknowledge everything else
  if (event.type !== "payment.succeeded") {
    return Response.json({ received: true });
  }

  const { start, barber, service, name, email } = event.payload?.metadata || {};
  const barberName = BARBERS[barber];
  const serviceInfo = SERVICES[service];

  if (!start || !barberName || !serviceInfo || !name || !email) {
    console.error("Booking details missing from Yoco webhook metadata:", event.payload?.metadata);
    // Acknowledge anyway so Yoco doesn't keep retrying a payment we can't turn into a booking
    return Response.json({ received: true });
  }

  const { calendarId, timezone, slotMinutes } = BOOKING_CONFIG;
  const startTime = new Date(start);
  const endTime = new Date(startTime.getTime() + slotMinutes * 60000);

  try {
    const calendar = getCalendarClient();

    // Don't create a second event if Yoco ever delivers this webhook twice
    const existing = await calendar.events.list({
      calendarId,
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      privateExtendedProperty: `barber=${barber}`,
    });

    if ((existing.data.items || []).length === 0) {
      await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: `${serviceInfo.name} with ${barberName} \u2013 ${name}`,
          description: `Booked and paid for via the website.\nService: ${serviceInfo.name} (R${serviceInfo.price})\nBarber: ${barberName}\nClient: ${name} (${email})\nDeposit paid: R${(event.payload.amount / 100).toFixed(2)}\nPayment: ${event.payload.id}`,
          start: { dateTime: startTime.toISOString(), timeZone: timezone },
          end: { dateTime: endTime.toISOString(), timeZone: timezone },
          extendedProperties: {
            private: { barber, service, paymentId: event.payload.id },
          },
        },
      });

      // The calendar event is the source of truth: a failed email shouldn't fail the booking
      try {
        await sendBookingEmails({
          start,
          barber,
          barberName,
          service: serviceInfo.name,
          name,
          email,
          timezone,
        });
      } catch (emailErr) {
        console.error("Booking notification email failed:", emailErr);
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("Booking creation from webhook failed:", err);
    // A non-2xx response tells Yoco to retry the webhook later
    return Response.json({ error: "Could not create booking" }, { status: 500 });
  }
}