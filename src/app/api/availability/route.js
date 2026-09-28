import { getCalendarClient, BOOKING_CONFIG } from "@/lib/google-calendar";

// Keep in sync with the barbers in Booking.jsx and the booking routes
const BARBERS = ["marcus", "dev", "tomas"];

// Milliseconds the given time zone is ahead of UTC at a given instant
function getOffsetMs(timestamp, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(timestamp));

  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - timestamp;
}

// Turns a wall-clock time in the shop's time zone into the correct UTC instant.
// The server runs in UTC, so we can't rely on its local clock for this.
function zonedTimeToUtc(dateStr, minutesIntoDay, timeZone) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcGuess = Date.UTC(y, m - 1, d, 0, minutesIntoDay);
  return new Date(utcGuess - getOffsetMs(utcGuess, timeZone));
}

// GET /api/availability?date=2026-09-20&barber=marcus
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const barber = searchParams.get("barber");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Missing or invalid date parameter" }, { status: 400 });
  }

  if (!BARBERS.includes(barber)) {
    return Response.json({ error: "Missing or unknown barber" }, { status: 400 });
  }

  try {
    const { calendarId, timezone, startHour, endHour, slotMinutes } = BOOKING_CONFIG;

    // Day of the week for the calendar date itself, independent of server time zone
    const day = new Date(`${date}T00:00:00Z`).getUTCDay();

    // Closed Sunday. Keep in sync with OPEN_DAYS in Booking.jsx
    if (day === 0) {   
    return Response.json({ slots: [] });
    }

    const dayStart = zonedTimeToUtc(date, 0, timezone);
    const dayEnd = zonedTimeToUtc(date, 24 * 60, timezone);

    const calendar = getCalendarClient();

    // List the day's events (rather than free/busy) so each one can be
    // matched to a barber through the tag the booking routes save on it
    const result = await calendar.events.list({
      calendarId,
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      singleEvents: true,
      maxResults: 250,
    });

    const busy = (result.data.items || [])
      // Ignore cancelled events and ones marked "free"
      .filter((ev) => ev.status !== "cancelled" && ev.transparency !== "transparent")
      // An event blocks this barber if it's tagged with them. Events with no
      // barber tag (a lunch break, a holiday you added by hand) block everyone.
      .filter((ev) => {
        const tagged = ev.extendedProperties?.private?.barber;
        return !tagged || tagged === barber;
      })
      .map((ev) => ({
        // All-day events have a date instead of a dateTime: block the whole day
        start: ev.start?.dateTime ? new Date(ev.start.dateTime) : dayStart,
        end: ev.end?.dateTime ? new Date(ev.end.dateTime) : dayEnd,
      }));

    // Every possible slot for the business day, in the shop's time zone
    const allSlots = [];
    for (
      let mins = startHour * 60;
      mins + slotMinutes <= endHour * 60;
      mins += slotMinutes
    ) {
      const start = zonedTimeToUtc(date, mins, timezone);
      const end = new Date(start.getTime() + slotMinutes * 60000);
      allSlots.push({ start, end });
    }

    // Drop slots in the past, and any that overlap one of this barber's bookings
    const now = new Date();
    const availableSlots = allSlots.filter(({ start, end }) => {
      if (start < now) return false;
      return !busy.some((b) => start < b.end && end > b.start);
    });

    return Response.json({
      slots: availableSlots.map(({ start }) => ({
        start: start.toISOString(),
        // Formatted in the shop's time zone, so it matches the email and calendar
        label: start.toLocaleTimeString("en-US", {
          timeZone: timezone,
          hour: "numeric",
          minute: "2-digit",
        }),
      })),
    });
  } catch (err) {
    console.error("Availability fetch failed:", err);
    // TEMPORARY: exposes the real error in the Network tab for debugging.
    // Remove the `detail` line once you're happy everything works.
    return Response.json(
      { error: "Could not load availability", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}