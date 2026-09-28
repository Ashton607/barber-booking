"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bevan, Figtree } from "next/font/google";
import styles from "./Gallery.module.css";

const bevan = Bevan({ subsets: ["latin"], weight: "400" });
const figtree = Figtree({ subsets: ["latin"] });

// How many cuts to show before the "Show more" button
const INITIAL_COUNT = 6;

// Placeholder gallery: replace with your own photos and details.
// Put the images in /public/gallery/. Use portrait photos (4:5, at least
// 800px wide), and shoot each before and after from the same angle and
// distance so the slider lines up.
const ITEMS = [
  { id: 1, title: "Skin fade", barber: "Marcus", before: "/gallery/01-before.webp", after: "/gallery/01-after.webp" },
  { id: 2, title: "Classic cut", barber: "Dev", before: "/gallery/02-before.webp", after: "/gallery/02-after.webp" },
  { id: 3, title: "Beard trim", barber: "Tomas", before: "/gallery/03-before.webp", after: "/gallery/03-after.webp" },
  { id: 4, title: "Buzz cut", barber: "Marcus", before: "/gallery/02-before.webp", after: "/gallery/04-after.webp" },
  { id: 5, title: "Cut and beard", barber: "Dev", before: "/gallery/02-before.webp", after: "/gallery/03-after.webp" },
  { id: 6, title: "Hot towel shave", barber: "Tomas", before: "/gallery/03-before.webp", after: "/gallery/03-after.webp" },
  { id: 7, title: "Kids' cut", barber: "Marcus", before: "/gallery/07-before.jpg", after: "/gallery/07-after.jpg" },
  { id: 8, title: "Skin fade", barber: "Dev", before: "/gallery/08-before.jpg", after: "/gallery/08-after.jpg" },
  { id: 9, title: "Classic cut", barber: "Tomas", before: "/gallery/09-before.jpg", after: "/gallery/09-after.jpg" },
];

// The before/after slider. A native range input sits invisibly over the
// image, so dragging, touch and the arrow keys all work with no extra code.
function Compare({ item, sizes }) {
  const [pos, setPos] = useState(50);

  return (
    <div className={styles.compare} style={{ "--pos": `${pos}%` }}>
      <Image
        src={item.before}
        alt={`${item.title} by ${item.barber}, before`}
        fill
        sizes={sizes}
        className={styles.photo}
      />

      {/* The "after" photo is clipped so it only shows to the right of the divider */}
      <div className={styles.afterWrap}>
        <Image
          src={item.after}
          alt={`${item.title} by ${item.barber}, after`}
          fill
          sizes={sizes}
          className={styles.photo}
        />
      </div>

      <span className={`${styles.chip} ${styles.chipBefore}`}>Before</span>
      <span className={`${styles.chip} ${styles.chipAfter}`}>After</span>

      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className={styles.range}
        aria-label={`Before and after slider: ${item.title} by ${item.barber}`}
        aria-valuetext={`Divider at ${pos} percent`}
      />

      <span className={styles.handle} aria-hidden="true">
        <span className={styles.knob}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
          >
            <path d="M9 6l-6 6 6 6" />
            <path d="M15 6l6 6-6 6" />
          </svg>
        </span>
      </span>
    </div>
  );
}

export default function Gallery() {
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState(null);
  const dialogRef = useRef(null);

  const visible = showAll ? ITEMS : ITEMS.slice(0, INITIAL_COUNT);
  const hiddenCount = ITEMS.length - INITIAL_COUNT;

  // Open and close the native dialog as `active` changes
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active && !dialog.open) dialog.showModal();
    if (!active && dialog.open) dialog.close();
  }, [active]);

  // Stop the page scrolling behind the open dialog
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);

  return (
    <section
      className={`${styles.section} ${figtree.className}`}
      aria-labelledby="gallery-title"
      id="gallery"
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 id="gallery-title" className={`${styles.title} ${bevan.className}`}>
            Our work
          </h1>
          <p className={styles.lead}>
            Real cuts from our chairs. Drag the slider on any photo to see the
            before and after.
          </p>
        </header>

        <ul className={styles.grid}>
          {visible.map((item) => (
            <li key={item.id} className={styles.card}>
              <Compare
                item={item}
                sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 384px"
              />

              <div className={styles.stripe} aria-hidden="true" />

              <div className={styles.caption}>
                <div>
                  <h2 className={`${styles.name} ${bevan.className}`}>
                    {item.title}
                  </h2>
                  <p className={styles.by}>by {item.barber}</p>
                </div>

                <button
                  type="button"
                  className={styles.expand}
                  onClick={() => setActive(item)}
                  aria-label={`Expand ${item.title} by ${item.barber}`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M15 3h6v6" />
                    <path d="M9 21H3v-6" />
                    <path d="M21 3l-7 7" />
                    <path d="M3 21l7-7" />
                  </svg>
                  Expand
                </button>
              </div>
            </li>
          ))}
        </ul>

        {hiddenCount > 0 && (
          <div className={styles.moreWrap}>
            <button
              type="button"
              className={styles.more}
              aria-expanded={showAll}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? "Show fewer cuts"
                : `Show ${hiddenCount} more ${hiddenCount === 1 ? "cut" : "cuts"}`}
            </button>
          </div>
        )}

        <div className={styles.closing}>
          <h2 className={`${styles.closingTitle} ${bevan.className}`}>
            Want a cut like these?
          </h2>
          <Link href="#booking" className={styles.book}>
            Book a cut
          </Link>
        </div>
      </div>

      {/* Enlarged view. The native dialog handles Escape, focus and the backdrop. */}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="gallery-dialog-title"
        onClose={() => setActive(null)}
        onClick={(e) => {
          // Only a click on the backdrop lands on the dialog element itself
          if (e.target === dialogRef.current) setActive(null);
        }}
      >
        {active && (
          <div className={styles.dialogInner}>
            <div className={styles.dialogHead}>
              <div>
                <h2
                  id="gallery-dialog-title"
                  className={`${styles.dialogTitle} ${bevan.className}`}
                >
                  {active.title}
                </h2>
                <p className={styles.by}>by {active.barber}</p>
              </div>

              <button
                type="button"
                className={styles.close}
                onClick={() => setActive(null)}
                aria-label="Close"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <Compare
              key={active.id}
              item={active}
              sizes="(max-width: 600px) 92vw, 34rem"
            />

            <p className={styles.hint}>
              Drag the slider, or use the arrow keys, to compare.
            </p>
          </div>
        )}
      </dialog>
    </section>
  );
}