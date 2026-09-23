const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Keep in sync with the barbers in Booking.jsx and the webhook route
const BARBERS = {
  marcus: "Marcus",
  dev: "Dev",
  tomas: "Tomas",
};

// Charged online to secure the slot; the rest is paid in the shop.
// Change this to whatever deposit (or full price) you want to take up front.
const DEPOSIT_AMOUNT_CENTS = 5000; // R50.00

// POST /api/checkout
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { start, barber, name, email } = body;

  if (!start || !barber || !name || !email) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const barberName = BARBERS[barber];
  if (!barberName) {
    return Response.json({ error: "Unknown barber" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  const startTime = new Date(start);
  if (Number.isNaN(startTime.getTime()) || startTime < new Date()) {
    return Response.json({ error: "Invalid start time" }, { status: 400 });
  }

  try {
    const res = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: DEPOSIT_AMOUNT_CENTS,
        currency: "ZAR",
        successUrl: `${SITE_URL}/book?status=success`,
        cancelUrl: `${SITE_URL}/book?status=cancelled`,
        failureUrl: `${SITE_URL}/book?status=failed`,
        // Read back out in the webhook once payment succeeds, to create the
        // actual calendar booking. Nothing is booked until that happens.
        metadata: { start, barber, name, email },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Yoco checkout creation failed:", data);
      return Response.json({ error: "Could not start payment" }, { status: 502 });
    }

    return Response.json({ redirectUrl: data.redirectUrl });
  } catch (err) {
    console.error("Checkout request failed:", err);
    return Response.json({ error: "Could not start payment" }, { status: 500 });
  }
}