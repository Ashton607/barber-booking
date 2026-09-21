import { google } from "googleapis";

export function getCalendarClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

export const BOOKING_CONFIG = {
  calendarId: process.env.GOOGLE_CALENDAR_ID,
  timezone: process.env.BOOKING_TIMEZONE || "Africa/Johannesburg",
  startHour: Number(process.env.BOOKING_START_HOUR || 9),
  endHour: Number(process.env.BOOKING_END_HOUR || 17),
  slotMinutes: Number(process.env.BOOKING_SLOT_MINUTES || 60),
};