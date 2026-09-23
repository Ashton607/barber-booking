import Link from "next/link";
import { Bevan, Figtree } from "next/font/google";
import styles from "./BookingSuccess.module.css";

const bevan = Bevan({ subsets: ["latin"], weight: "400" });
const figtree = Figtree({ subsets: ["latin"] });

export const metadata = {
  title: "Booking confirmed | Old Mill Barbers",
};

export default function BookingSuccess() {
  return (
    <section className={`${styles.section} ${figtree.className}`}>
      <div className={styles.inner}>
        <div className={styles.ticket}>
          <div className={styles.icon}>
            <svg
              width="30"
              height="30"
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

          <h1 className={`${styles.title} ${bevan.className}`}>
            Payment received
          </h1>

          <p className={styles.text}>
            Your chair is booked. A confirmation is on its way to your inbox,
            with the receipt from Yoco alongside it.
          </p>

          <div className={styles.stub}>
            <p className={styles.stubLabel}>What happens next</p>
            <p className={styles.stubText}>
              Show up a few minutes early. If anything comes up, just reply to
              the confirmation email and we&rsquo;ll sort out a new time.
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/book" className={styles.book}>
              Book another cut
            </Link>
            <Link href="/" className={styles.textLink}>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}