"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bevan, Figtree } from "next/font/google";
import styles from "./Hero.module.css";

const bevan = Bevan({ subsets: ["latin"], weight: "400" });
const figtree = Figtree({ subsets: ["latin"] });

// Keep in sync with the barbers in Booking.jsx and the availability route
const BARBERS = [
  { id: "marcus", name: "Marcus" },
  { id: "dev", name: "Dev" },
  { id: "tomas", name: "Tomas" },
];

// Keep in sync with BOOKING_TIMEZONE in lib/google-calendar.js
const SHOP_TIMEZONE = "Africa/Johannesburg";

// How many chairs to show, and how many days ahead to look
// when today is closed, fully booked, or already over
const MAX_SLOTS = 6;
const DAYS_TO_CHECK = 7;

// A YYYY-MM-DD date in the shop's time zone, offset by a number of days
function shopDate(offsetDays = 0) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIMEZONE,
  }).format(new Date());
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + offsetDays)).toISOString().slice(0, 10);
}

function formatDay(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Scrolls to the booking section when it's on the same page. If it isn't,
// the link's own href takes the visitor to /book instead.
function scrollToBooking(e) {
  const target = document.getElementById("booking");
  if (!target) return;

  e.preventDefault();

  // Leave room for the sticky navbar
  const navbar = document.querySelector("header");
  const offset = navbar ? navbar.offsetHeight : 0;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
}

export default function Hero() {
  // status: loading | ready | empty | error
  const [state, setState] = useState({
    status: "loading",
    slots: [],
    more: 0,
    date: null,
    isToday: true,
  });
  const [selectedId, setSelectedId] = useState(null);

  // Load live availability for every barber, starting today and moving
  // forward until a day with open chairs turns up
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        for (let offset = 0; offset < DAYS_TO_CHECK; offset++) {
          if (cancelled) return;
          const date = shopDate(offset);

          const results = await Promise.allSettled(
            BARBERS.map(async (barber) => {
              const res = await fetch(
                `/api/availability?date=${date}&barber=${barber.id}`
              );
              if (!res.ok) throw new Error(`Availability failed (${res.status})`);
              const data = await res.json();

              return (data.slots || []).map((slot) => ({
                id: `${barber.id}-${slot.start}`,
                start: slot.start,
                time: slot.label,
                barber: barber.name,
              }));
            })
          );

          // If every barber's request failed, that's an error, not an empty day
          if (results.every((r) => r.status === "rejected")) {
            throw new Error("Could not load availability");
          }

          const all = results
            .filter((r) => r.status === "fulfilled")
            .flatMap((r) => r.value)
            .sort((a, b) => new Date(a.start) - new Date(b.start));

          if (all.length > 0) {
            if (cancelled) return;
            const shown = all.slice(0, MAX_SLOTS);
            setState({
              status: "ready",
              slots: shown,
              more: all.length - shown.length,
              date,
              isToday: offset === 0,
            });
            setSelectedId(shown[0].id);
            return;
          }
        }

        if (!cancelled) {
          setState({ status: "empty", slots: [], more: 0, date: null, isToday: false });
        }
      } catch {
        if (!cancelled) {
          setState({ status: "error", slots: [], more: 0, date: null, isToday: false });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const { status, slots, more, date, isToday } = state;
  const selected = slots.find((s) => s.id === selectedId);

  const legend =
    status === "ready" ? (isToday ? "Open chairs today" : "Next open chairs") : "Open chairs";

  return (
    <section
      className={`${styles.hero} ${figtree.className}`}
      aria-labelledby="hero-title"
    >
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h1 id="hero-title" className={`${styles.title} ${bevan.className}`}>
            A proper cut, right on time.
          </h1>
          <p className={styles.lead}>
            Three chairs, one barber each, and no waiting around. Pick a time
            and we&rsquo;ll have your chair ready.
          </p>
          <p className={styles.hours}>Open Tuesday to Saturday, 9 am to 6 pm</p>
          <Link href="#services" className={styles.textLink}>
            See services and prices
          </Link>
        </div>

        <form className={styles.ticket} onSubmit={(e) => e.preventDefault()}>
          <fieldset className={styles.fieldset}>
            <legend className={`${styles.legend} ${bevan.className}`}>
              {legend}
            </legend>
            <p className={styles.note}>
              {status === "ready" ? `${isToday ? "Today" : formatDay(date)} · ` : ""}
              A cut and finish takes about 40 minutes.
            </p>

            {status === "loading" && (
              <div
                className={styles.slots}
                role="status"
                aria-label="Checking open chairs"
              >
                {Array.from({ length: MAX_SLOTS }).map((_, i) => (
                  <div key={i} className={styles.skeleton} aria-hidden="true" />
                ))}
              </div>
            )}

            {status === "error" && (
              <p className={styles.status} role="alert">
                We couldn&rsquo;t load the open chairs. You can still book below.
              </p>
            )}

            {status === "empty" && (
              <p className={styles.status}>
                No open chairs in the next week. Use the booking form to check
                later dates.
              </p>
            )}

            {status === "ready" && (
              <>
                <div className={styles.slots}>
                  {slots.map((slot) => (
                    <div key={slot.id}>
                      <input
                        className={styles.input}
                        type="radio"
                        name="slot"
                        id={`slot-${slot.id}`}
                        value={slot.id}
                        checked={selectedId === slot.id}
                        onChange={() => setSelectedId(slot.id)}
                      />
                      <label className={styles.slot} htmlFor={`slot-${slot.id}`}>
                        <span className={styles.time}>{slot.time}</span>
                        <span className={styles.barber}>with {slot.barber}</span>
                      </label>
                    </div>
                  ))}
                </div>

                {more > 0 && (
                  <p className={`${styles.status} ${styles.statusMore}`}>
                    {more} more open {more === 1 ? "chair" : "chairs"}. Pick a day
                    and time in the booking form.
                  </p>
                )}
              </>
            )}
          </fieldset>

          <div className={styles.foot}>
            <Link
              href="/book#booking"
              className={styles.book}
              onClick={scrollToBooking}
            >
              {selected
                ? `Book ${selected.time} with ${selected.barber}`
                : status === "empty"
                  ? "Book for another day"
                  : "Book a cut"}
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}