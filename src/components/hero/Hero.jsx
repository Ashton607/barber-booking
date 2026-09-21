"use client";

import { useState } from "react";
import Link from "next/link";
import { Bevan, Figtree } from "next/font/google";
import styles from "./Hero.module.css";

const bevan = Bevan({ subsets: ["latin"], weight: "400" });
const figtree = Figtree({ subsets: ["latin"] });

// Placeholder data: replace with your real availability
const SLOTS = [
  { id: "1030", time: "10:30 am", barber: "Marcus", taken: false },
  { id: "1100", time: "11:00 am", barber: "Dev", taken: true },
  { id: "1200", time: "12:00 pm", barber: "Tomas", taken: false },
  { id: "1330", time: "1:30 pm", barber: "Marcus", taken: false },
  { id: "1500", time: "3:00 pm", barber: "Dev", taken: false },
  { id: "1630", time: "4:30 pm", barber: "Tomas", taken: true },
];

export default function Hero() {
  const firstOpen = SLOTS.find((s) => !s.taken);
  const [selectedId, setSelectedId] = useState(firstOpen?.id);
  const selected = SLOTS.find((s) => s.id === selectedId);

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
          <Link href="/services" className={styles.textLink}>
            See services and prices
          </Link>
        </div>

        <form
          className={styles.ticket}
          onSubmit={(e) => e.preventDefault()}
        >
          <fieldset className={styles.fieldset}>
            <legend className={`${styles.legend} ${bevan.className}`}>
              Open chairs today
            </legend>
            <p className={styles.note}>A cut and finish takes about 40 minutes.</p>

            <div className={styles.slots}>
              {SLOTS.map((slot) => (
                <div key={slot.id}>
                  <input
                    className={styles.input}
                    type="radio"
                    name="slot"
                    id={`slot-${slot.id}`}
                    value={slot.id}
                    checked={selectedId === slot.id}
                    disabled={slot.taken}
                    onChange={() => setSelectedId(slot.id)}
                  />
                  <label
                    className={styles.slot}
                    htmlFor={`slot-${slot.id}`}
                  >
                    <span className={styles.time}>{slot.time}</span>
                    <span className={styles.barber}>
                      {slot.taken ? "Booked" : `with ${slot.barber}`}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          <div className={styles.foot}>
            {selected ? (
              <Link
                href={`/book?slot=${selected.id}&barber=${selected.barber}`}
                className={styles.book}
              >
                Book {selected.time} with {selected.barber}
              </Link>
            ) : (
              <Link href="/book" className={styles.book}>
                Book for another day
              </Link>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}