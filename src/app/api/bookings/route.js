import { getCalendarClient, BOOKING_CONFIG } from "@/lib/google-calendar";
import { sendBookingEmails } from "@/lib/resend";

// Keep in sync with the barbers in Booking.jsx
const BARBERS = {
  marcus: "Marcus",
  dev: "Dev",
  tomas: "Tomas",
};

// POST /api/bookings
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { start, barber } = body;

  if (!start || !barber) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const barberName = BARBERS[barber];
  if (!barberName) {
    return Response.json({ error: "Unknown barber" }, { status: 400 });
  }

  const startTime = new Date(start);
  if (Number.isNaN(startTime.getTime()) || startTime < new Date()) {
    return Response.json({ error: "Invalid start time" }, { status: 400 });
  }

  const { calendarId, timezone, slotMinutes } = BOOKING_CONFIG;
  const endTime = new Date(startTime.getTime() + slotMinutes * 60000);

  try {
    const calendar = getCalendarClient();

    // Don't double-book the same barber if two people pick the same slot
    const existing = await calendar.events.list({
      calendarId,
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      privateExtendedProperty: `barber=${barber}`,
    });

    if ((existing.data.items || []).length > 0) {
      return Response.json(
        { error: "That time has just been taken" },
        { status: 409 }
      );
    }

    const event = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `Haircut with ${barberName}`,
        description: `Booked via the website.\nBarber: ${barberName}`,
        start: { dateTime: startTime.toISOString(), timeZone: timezone },
        end: { dateTime: endTime.toISOString(), timeZone: timezone },
        // Lets the availability route and the check above filter by barber
        extendedProperties: { private: { barber } },
      },
    });

    // The calendar event is the source of truth: a failed email shouldn't fail the booking
    try {
      await sendBookingEmails({ start, barber, barberName, timezone });
    } catch (emailErr) {
      console.error("Booking notification email failed:", emailErr);
    }

    return Response.json({
      success: true,
      eventId: event.data.id,
      barber: barberName,
    });
  } catch (err) {
    console.error("Booking creation failed:", err);
    return Response.json({ error: "Could not create booking" }, { status: 500 });
  }
}