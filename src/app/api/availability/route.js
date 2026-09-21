import { getCalendarClient, BOOKING_CONFIG } from "@/lib/google-calendar";

// GET /api/availability?date=2026-09-20
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return Response.json({ error: "Missing date parameter" }, { status: 400 });
  }

  const { calendarId, timezone, startHour, endHour, slotMinutes } = BOOKING_CONFIG;

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  // block out weekends by default — adjust as needed
  const day = dayStart.getDay();
  if (day === 0 || day === 6) {
    return Response.json({ slots: [] });
  }

  try {
    const calendar = getCalendarClient();

    const freeBusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        timeZone: timezone,
        items: [{ id: calendarId }],
      },
    });

    const busy = freeBusy.data.calendars[calendarId]?.busy || [];

    // build every possible slot for the business day
    const allSlots = [];
    for (let hour = startHour; hour < endHour; hour += slotMinutes / 60) {
      const slotStart = new Date(date);
      slotStart.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60000);
      allSlots.push({ start: slotStart, end: slotEnd });
    }

    // filter out any slot that overlaps a busy period, and past slots for today
    const now = new Date();
    const availableSlots = allSlots.filter(({ start, end }) => {
      if (start < now) return false;
      const overlapsBusy = busy.some((b) => {
        const busyStart = new Date(b.start);
        const busyEnd = new Date(b.end);
        return start < busyEnd && end > busyStart;
      });
      return !overlapsBusy;
    });

    return Response.json({
      slots: availableSlots.map((s) => ({
        start: s.start.toISOString(),
        label: s.start.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      })),
    });
  } catch (err) {
    console.error("Availability fetch failed:", err);
    return Response.json({ error: "Could not load availability" }, { status: 500 });
  }
}