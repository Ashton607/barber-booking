const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
const SITE_URL = process.env.SITE_URL;

// Keep in sync with the barbers in Booking.jsx and the webhook route
const BARBERS = {
  marcus: "Marcus",
  dev: "Dev",
  tomas: "Tomas",
};

// Prices in Rand. Keep in sync with Booking.jsx and the webhook route
const SERVICES = {
  classic: { name: "Classic cut", price: 30 },
  fade: { name: "Skin fade", price: 60 },
  buzz: { name: "Buzz cut", price: 35 },
  kids: { name: "Kids' cut", price: 30 },
  beard: { name: "Beard trim", price: 25 },
  shave: { name: "Hot towel shave", price: 25 },
  "cut-beard": { name: "Cut and beard", price: 80 },
  "cut-shave": { name: "Cut and hot towel shave", price: 70 },
  "wash-style": { name: "Wash & style", price: 20 },
  "eyebrows": { name: "Eyebrow tidy", price: 25 },
};

// POST /api/checkout
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { start, barber, service, name, email } = body;

  if (!start || !barber || !service || !name || !email) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const barberName = BARBERS[barber];
  if (!barberName) {
    return Response.json({ error: "Unknown barber" }, { status: 400 });
  }

  const serviceInfo = SERVICES[service];
  if (!serviceInfo) {
    return Response.json({ error: "Unknown service" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  const startTime = new Date(start);
  if (Number.isNaN(startTime.getTime()) || startTime < new Date()) {
    return Response.json({ error: "Invalid start time" }, { status: 400 });
  }

  // Half the service price, in cents, rounded to avoid fractional cents
  const depositAmountCents = Math.round((serviceInfo.price * 100) / 2);

  try {
    const res = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: depositAmountCents,
        currency: "ZAR",
        successUrl: `${SITE_URL}/book/success`,
        cancelUrl: `${SITE_URL}/book?status=cancelled`,
        failureUrl: `${SITE_URL}/book?status=failed`,
        // Read back out in the webhook once payment succeeds, to create the
        // actual calendar booking. Nothing is booked until that happens.
        metadata: { start, barber, service, name, email },
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