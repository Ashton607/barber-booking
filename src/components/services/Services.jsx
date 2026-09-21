import Link from "next/link";
import { Bevan, Figtree } from "next/font/google";
import styles from "./Services.module.css";

const bevan = Bevan({ subsets: ["latin"], weight: "400" });
const figtree = Figtree({ subsets: ["latin"] });

export const metadata = {
  title: "Services and prices | Old Mill Barbers",
  description:
    "Haircuts, beard trims, hot towel shaves and combinations, with prices and how long each one takes.",
};

// Change this to your currency symbol
const CURRENCY = "R";

// Placeholder menu: replace with your real services and prices
const GROUPS = [
  {
    id: "haircuts",
    title: "Haircuts",
    note: "Every haircut ends with a hot towel and a check that you're happy.",
    items: [
      {
        name: "Classic cut",
        mins: 40,
        price: 30,
        desc: "Scissors, clippers or both, shaped to suit your head and the way you part your hair.",
      },
      {
        name: "Skin fade",
        mins: 45,
        price: 60,
        desc: "Faded down to the skin and blended into the length on top.",
      },
      {
        name: "Buzz cut",
        mins: 20,
        price: 35,
        desc: "One guard all over, with the neckline and edges tidied.",
      },
      {
        name: "Kids' cut",
        mins: 30,
        price: 30,
        desc: "For under 12s. Any style, and no fuss if they wriggle.",
      },
    ],
  },
  {
    id: "beard",
    title: "Beard and shave",
    note: "Shaves are done with a straight razor after warm towels and lather.",
    items: [
      {
        name: "Beard trim",
        mins: 20,
        price: 25,
        desc: "Shaped, lined up and tidied with clippers and a razor.",
      },
      {
        name: "Hot towel shave",
        mins: 30,
        price: 25,
        desc: "Warm towels, lather and a slow, close shave, finished with balm.",
      },
    ],
  },
  {
    id: "combos",
    title: "Cut and more",
    note: "Two services in one visit for a little less than booking them separately.",
    items: [
      {
        name: "Cut and beard",
        mins: 60,
        price: 80,
        desc: "A classic cut or skin fade, plus a beard trim.",
      },
      {
        name: "Cut and hot towel shave",
        mins: 70,
        price: 70,
        desc: "A classic cut or skin fade, then a full hot towel shave.",
      },
    ],
  },
  {
    id: "extras",
    title: "Extras",
    note: "Add these to any service when you book.",
    items: [
      {
        name: "Wash and style",
        mins: 10,
        price: 20,
        desc: "Shampoo, blow dry and styling product.",
      },
      {
        name: "Eyebrow tidy",
        mins: 5,
        price: 25,
        desc: "Stray hairs trimmed back with clippers or thread.",
      },
    ],
  },
];

const GOOD_TO_KNOW = [
  {
    title: "Booking and walk-ins",
    text: "Book online or drop in. Walk-ins are seated as soon as a chair is free, and booking guarantees your time.",
  },
  {
    title: "Changing plans",
    text: "Tell us at least 4 hours ahead and you can cancel or move your slot for free.",
  },
  {
    title: "Paying",
    text: "We take card and cash. Tips go to the barber who cut your hair.",
  },
];

export default function Services() {
  return (
    <main id="services" className={`${styles.page} ${figtree.className}`}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={`${styles.title} ${bevan.className}`}>
            Services and prices
          </h1>
          <p className={styles.lead}>
            Every price is for the full service, and the times below are how
            long to set aside for your chair.
          </p>
        </header>

        <div className={styles.board}>
          {GROUPS.map((group) => (
            <section
              key={group.id}
              className={styles.group}
              aria-labelledby={`group-${group.id}`}
            >
              <div className={styles.groupIntro}>
                <h2
                  id={`group-${group.id}`}
                  className={`${styles.groupTitle} ${bevan.className}`}
                >
                  {group.title}
                </h2>
                <p className={styles.groupNote}>{group.note}</p>
              </div>

              <ul className={styles.list}>
                {group.items.map((item) => (
                  <li key={item.name} className={styles.row}>
                    <div className={styles.rowHead}>
                      <h3 className={styles.name}>{item.name}</h3>
                      <span className={styles.leader} aria-hidden="true" />
                      <span className={styles.price}>
                        {CURRENCY}
                        {item.price}
                      </span>
                    </div>
                    <p className={styles.desc}>
                      <span className={styles.mins}>{item.mins} min</span>
                      {item.desc}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className={styles.know} aria-labelledby="know-title">
          <h2 id="know-title" className={`${styles.knowTitle} ${bevan.className}`}>
            Good to know
          </h2>
          <dl className={styles.knowList}>
            {GOOD_TO_KNOW.map((item) => (
              <div key={item.title} className={styles.knowItem}>
                <dt className={styles.knowTerm}>{item.title}</dt>
                <dd className={styles.knowText}>{item.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <h2
            id="closing-title"
            className={`${styles.closingTitle} ${bevan.className}`}
          >
            Pick a time that suits you.
          </h2>
          <Link href="/book" className={styles.book}>
            Book a cut
          </Link>
        </section>
      </div>
    </main>
  );
}