"use client";

import { useEffect, useMemo, useState } from "react";
import { Bevan, Figtree } from "next/font/google";
import styles from "./Booking.module.css";

const bevan = Bevan({ subsets: ["latin"], weight: "400" });
const figtree = Figtree({ subsets: ["latin"] });

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Open Tuesday to Saturday (0 = Sunday)
const OPEN_DAYS = [2, 3, 4, 5, 6];

const BARBERS = [
  { id: "marcus", name: "Marcus", role: "Master barber" },
  { id: "dev", name: "Dev", role: "Senior barber" },
  { id: "tomas", name: "Tomas", role: "Barber" },
];

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Builds the weeks for a given month, no external date library
function buildMonthGrid(year, month) {
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  // Leading padding from the previous month
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ date: new Date(year, month, i - startWeekday + 1), inMonth: false });
  }

  // Days of this month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }

  // Trailing padding so the grid always fills full weeks
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }

  return cells;
}

function ChevronIcon({ direction }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

export default function Booking() {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Start on the next day the shop is open
  const firstOpenDay = useMemo(() => {
    const d = new Date(today);
    while (!OPEN_DAYS.includes(d.getDay())) d.setDate(d.getDate() + 1);
    return d;
  }, [today]);

  const [viewDate, setViewDate] = useState(
    new Date(firstOpenDay.getFullYear(), firstOpenDay.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(firstOpenDay);
  const [barberId, setBarberId] = useState(BARBERS[0].id);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({ name: "", email: "" });
  // idle | redirecting | success | cancelled | failed | error
  const [status, setStatus] = useState("idle");

  const barber = BARBERS.find((b) => b.id === barberId);

  const grid = useMemo(
    () => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  const isCurrentMonthView =
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth();

  // Preselect a barber from links like /book?barber=Marcus, and pick up
  // the payment outcome Yoco appends when it redirects the customer back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const name = params.get("barber");
    const match = BARBERS.find((b) => b.name.toLowerCase() === name?.toLowerCase());
    if (match) setBarberId(match.id);

    const paymentStatus = params.get("status");
    if (["success", "cancelled", "failed"].includes(paymentStatus)) {
      setStatus(paymentStatus);
      // Drop ?status= from the URL so a refresh doesn't repeat it
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Load available times whenever the day or barber changes
  useEffect(() => {
    let cancelled = false;
    setSelectedSlot(null);
    setLoadingSlots(true);

    fetch(`/api/availability?date=${toISODate(selectedDate)}&barber=${barberId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSlots(data.slots || []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, barberId, refreshKey]);

  function isDisabled(date) {
    return date < today || !OPEN_DAYS.includes(date.getDay());
  }

  function changeMonth(delta) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedSlot) return;

    setStatus("redirecting");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: selectedSlot.start, barber: barberId, ...form }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirectUrl) throw new Error("Checkout failed");

      // The actual booking is created by the Yoco webhook once payment succeeds,
      // so we hand off to their hosted checkout rather than showing success here
      window.location.href = data.redirectUrl;
    } catch {
      setStatus("error");
    }
  }

  function bookAnother() {
    setStatus("idle");
    setSelectedSlot(null);
    setForm({ name: "", email: "" });
    setRefreshKey((k) => k + 1);
  }

  if (status === "success") {
    return (
      <section id="booking" className={`${styles.booking} ${figtree.className}`}>
        <div className={styles.inner}>
          <div className={`${styles.panel} ${styles.confirmation}`}>
            <div className={styles.confirmIcon}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
            <h1 className={`${styles.confirmTitle} ${bevan.className}`}>
              Payment received
            </h1>
            <p className={styles.confirmText}>
              Your chair is booked. A confirmation email is on its way, and
              the details are also in your inbox from Yoco.
            </p>
            <button type="button" className={styles.secondary} onClick={bookAnother}>
              Book another cut
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className={`${styles.booking} ${figtree.className}`}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={`${styles.heading} ${bevan.className}`}>Book a cut</h1>
          <p className={styles.subtext}>
            Pick a day, a time and your barber. It takes about a minute.
          </p>
          {status === "cancelled" && (
            <p className={styles.errorText} role="alert">
              Payment was cancelled. Nothing was charged, and no slot was booked.
            </p>
          )}
          {status === "failed" && (
            <p className={styles.errorText} role="alert">
              The payment didn&rsquo;t go through. Please try again.
            </p>
          )}
        </header>

        <form onSubmit={handleSubmit} className={styles.layout}>
          {/* Calendar */}
          <div className={`${styles.panel} ${styles.calendar}`}>
            <h2 className={`${styles.panelTitle} ${bevan.className}`}>Pick a day</h2>

            <div className={styles.calendarHeader}>
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                disabled={isCurrentMonthView}
                className={styles.monthNav}
                aria-label="Previous month"
              >
                <ChevronIcon direction="left" />
              </button>
              <span className={styles.monthLabel} aria-live="polite">
                {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className={styles.monthNav}
                aria-label="Next month"
              >
                <ChevronIcon direction="right" />
              </button>
            </div>

            <div className={styles.weekdayRow} aria-hidden="true">
              {WEEKDAYS.map((w) => (
                <span key={w} className={styles.weekdayLabel}>
                  {w}
                </span>
              ))}
            </div>

            <div className={styles.dayGrid}>
              {grid.map(({ date, inMonth }, i) => {
                if (!inMonth) {
                  return <span key={i} className={styles.dayBlank} aria-hidden="true" />;
                }

                const selected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);

                return (
                  <button
                    type="button"
                    key={i}
                    disabled={isDisabled(date)}
                    onClick={() => setSelectedDate(date)}
                    aria-pressed={selected}
                    aria-label={formatDate(date)}
                    className={`${styles.day} ${isToday ? styles.dayToday : ""} ${
                      selected ? styles.daySelected : ""
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available times */}
          <div className={styles.panel}>
            <h2 className={`${styles.panelTitle} ${bevan.className}`}>
              {formatDate(selectedDate)}
            </h2>

            <div aria-live="polite">
              {loadingSlots && <p className={styles.helperText}>Loading available times…</p>}
              {!loadingSlots && slots.length === 0 && (
                <p className={styles.helperText}>
                  No chairs free on this day with {barber.name}. Try another day or barber.
                </p>
              )}
            </div>

            <div className={styles.slotGrid}>
              {slots.map((slot) => (
                <button
                  type="button"
                  key={slot.start}
                  onClick={() => setSelectedSlot(slot)}
                  aria-pressed={selectedSlot?.start === slot.start}
                  className={`${styles.slot} ${
                    selectedSlot?.start === slot.start ? styles.slotSelected : ""
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          {/* Your details */}
          <div className={styles.panel}>
            <h2 className={`${styles.panelTitle} ${bevan.className}`}>Your details</h2>

            <label htmlFor="name" className={styles.label}>
              Name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={styles.input}
              autoComplete="name"
              required
            />

            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={styles.input}
              autoComplete="email"
              required
            />
          </div>

          {/* Barber and confirm */}
          <div className={styles.panel}>
            <h2 className={`${styles.panelTitle} ${bevan.className}`}>Your barber</h2>

            <label htmlFor="barber" className={styles.label}>
              Who would you like to see?
            </label>
            <select
              id="barber"
              value={barberId}
              onChange={(e) => setBarberId(e.target.value)}
              className={styles.select}
            >
              {BARBERS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}, {b.role.toLowerCase()}
                </option>
              ))}
            </select>

            <div className={styles.summary} aria-live="polite">
              <p className={styles.summaryLabel}>Your booking</p>
              <p className={styles.summaryText}>
                {selectedSlot
                  ? `${formatDate(selectedDate)} at ${selectedSlot.label} with ${barber.name}`
                  : "Choose a time to continue."}
              </p>
            </div>

            <button
              type="submit"
              disabled={!selectedSlot || !form.name || !form.email || status === "redirecting"}
              className={styles.submitButton}
            >
              {status === "redirecting" ? "Redirecting to payment…" : "Pay and confirm booking"}
            </button>

            <p className={styles.helperText}>
              A R50 deposit is charged now, by card, to hold your slot.
            </p>

            {status === "error" && (
              <p className={styles.errorText} role="alert">
                Something went wrong starting the payment. Please try again.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}