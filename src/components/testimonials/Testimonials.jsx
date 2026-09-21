"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Bevan, Figtree } from "next/font/google";
import styles from "./Testimonials.module.css";

const bevan = Bevan({ subsets: ["latin"], weight: "400" });
const figtree = Figtree({ subsets: ["latin"] });

// Placeholder summary: replace with your real numbers
const SUMMARY = { average: 4.9, count: 212 };

// How many reviews to show before the "Show more reviews" button
const INITIAL_COUNT = 6;

// Placeholder reviews: replace with real ones
const REVIEWS = [
  {
    id: 1,
    name: "Andre K.",
    rating: 5,
    service: "Skin fade with Marcus",
    date: "August 2026",
    text: "I've been going to the same guy for years and I was nervous about switching. Marcus asked me three questions before he picked up the clippers, showed me the back in the mirror twice, and the fade has grown out cleanly for weeks. I've already booked my next one.",
  },
  {
    id: 2,
    name: "Priya S.",
    rating: 5,
    service: "Kids' cut with Dev",
    date: "August 2026",
    text: "Brought my six-year-old, who hates haircuts. Dev let him pick the music and he sat still the whole time. We'll be back.",
  },
  {
    id: 3,
    name: "Liam T.",
    rating: 5,
    service: "Hot towel shave",
    date: "August 2026",
    text: "The first proper shave I've ever had. The warm towels, the lather, the slow razor work. I walked out feeling like I'd had a nap. Worth every penny.",
  },
  {
    id: 4,
    name: "Jordan M.",
    rating: 4,
    service: "Classic cut with Tomas",
    date: "July 2026",
    text: "Great cut and Tomas really listened. The only reason it isn't five stars is that I waited ten minutes past my slot on a busy Saturday. He apologised and finished the job properly, which I'd much rather than a rushed one.",
  },
  {
    id: 5,
    name: "Sam O.",
    rating: 5,
    service: "Cut and beard",
    date: "July 2026",
    text: "Cut and beard in an hour and it still looks sharp on day five. The shop is clean, the chairs are comfortable and nobody rushes you.",
  },
  {
    id: 6,
    name: "Nadia R.",
    rating: 5,
    service: "Buzz cut",
    date: "July 2026",
    text: "Quick, tidy and exactly what I asked for. In and out in twenty minutes.",
  },
  {
    id: 7,
    name: "Callum B.",
    rating: 5,
    service: "Skin fade with Dev",
    date: "June 2026",
    text: "I showed Dev a photo I'd saved months ago and he told me honestly which parts would suit my head and which wouldn't. That honesty is why I'm a regular now. The blend was clean, the neckline was sharp, and the hot towel at the end is a lovely touch.",
  },
  {
    id: 8,
    name: "Ben W.",
    rating: 4,
    service: "Beard trim",
    date: "June 2026",
    text: "A solid beard trim, shaped up well and cleaner than I've ever managed at home. I'd like to see a few more evening slots, but otherwise no complaints.",
  },
  {
    id: 9,
    name: "Yusuf A.",
    rating: 5,
    service: "Cut and hot towel shave with Tomas",
    date: "May 2026",
    text: "I booked this as a treat before my brother's wedding and it was the best hour of my week. Tomas took his time, explained what he was doing, and I looked sharp in every photo. He also spotted that one side sat lower than the other and fixed it without me saying a word.",
  },
];

function Stars({ rating, size = 18 }) {
  return (
    <span
      className={styles.stars}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={n <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const textRef = useRef(null);
  const textId = useId();

  // Only offer "Read more" when the text is actually cut off
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const check = () => {
      if (expanded) return;
      setCanExpand(el.scrollHeight > el.clientHeight + 1);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded]);

  return (
    <li className={styles.card}>
      <Stars rating={review.rating} />

      <p
        id={textId}
        ref={textRef}
        className={`${styles.text} ${expanded ? "" : styles.clamped}`}
      >
        {review.text}
      </p>

      {(canExpand || expanded) && (
        <button
          type="button"
          className={styles.expand}
          aria-expanded={expanded}
          aria-controls={textId}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      <div className={styles.foot}>
        <p className={styles.author}>{review.name}</p>
        <p className={styles.meta}>
          {review.service}, {review.date}
        </p>
      </div>
    </li>
  );
}

export default function Testimonial() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? REVIEWS : REVIEWS.slice(0, INITIAL_COUNT);
  const hiddenCount = REVIEWS.length - INITIAL_COUNT;

  return (
    <section
      className={`${styles.section} ${figtree.className}`}
      aria-labelledby="testimonial-title"
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1
            id="testimonial-title"
            className={`${styles.title} ${bevan.className}`}
          >
            What our customers say
          </h1>
          <p className={styles.lead}>
            Honest words from the people who sit in our chairs, good and not
            quite perfect.
          </p>
          <p className={styles.summary}>
            <Stars rating={Math.round(SUMMARY.average)} size={22} />
            <span>
              {SUMMARY.average} average from {SUMMARY.count} reviews
            </span>
          </p>
        </header>

        <ul className={styles.grid}>
          {visible.map((review) => (
            <ReviewCard key={review.id} review={review} />
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
                ? "Show fewer reviews"
                : `Show ${hiddenCount} more ${hiddenCount === 1 ? "review" : "reviews"}`}
            </button>
          </div>
        )}

        <div className={styles.closing}>
          <h2 className={`${styles.closingTitle} ${bevan.className}`}>
            Come and see for yourself.
          </h2>
          <Link href="/book" className={styles.book}>
            Book a cut
          </Link>
        </div>
      </div>
    </section>
  );
}