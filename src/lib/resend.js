import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Who gets emailed about every booking (the shop's inbox)
const SHOP_EMAIL = process.env.BOOKING_NOTIFY_EMAIL;

// Optional: also email the barber who was booked. Leave blank to skip.
const BARBER_EMAILS = {
  marcus: "",
  dev: "",
  tomas: "",
};

// Must be an address on a domain you've verified in Resend.
// For testing you can use "onboarding@resend.dev", which only delivers
// to the email address on your own Resend account.
const FROM = process.env.BOOKING_FROM_EMAIL || "Old Mill Barbers <onboarding@resend.dev>";

export async function sendBookingEmails({ start, barber, barberName, name, email, timezone }) {
  const when = new Date(start).toLocaleString("en-US", {
    timeZone: timezone,
    dateStyle: "full",
    timeStyle: "short",
  });

  const results = await Promise.allSettled([
    sendShopNotification({ when, barber, barberName, name, email }),
    sendCustomerConfirmation({ when, barberName, name, email }),
  ]);

  const failed = results.find((r) => r.status === "rejected");
  if (failed) throw failed.reason;
}

async function sendShopNotification({ when, barber, barberName, name, email }) {
  const to = [SHOP_EMAIL, BARBER_EMAILS[barber]].filter(Boolean);
  if (to.length === 0) return;

  // Resend returns an error object instead of throwing, so check for it
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `New booking: ${barberName}, ${when}`,
    html: `
      <p>A new booking has come in through the website.</p>
      <p>
        <strong>Barber:</strong> ${barberName}<br />
        <strong>When:</strong> ${when}<br />
        <strong>Client:</strong> ${name} <br/>
        <strong>Client Email:</strong> ${email}
      </p>
      <p>It has been added to the shop calendar.</p>
    `,
  });

  if (error) throw error;
}

async function sendCustomerConfirmation({ when, barberName, name, email }) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `You're booked with ${barberName}`,
    html: `
      <p>Hi ${name},</p>
      <p>
        You're booked in with <strong>${barberName}</strong> on
        <strong>${when}</strong>. See you then.
      </p>
      <p>If your plans change, just reply to this email.</p>
    `,
  });

  if (error) throw error;
}