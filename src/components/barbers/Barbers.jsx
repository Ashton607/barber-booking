import Image from "next/image";
import Link from "next/link";
import { Bevan, Figtree } from "next/font/google";
import styles from "./Barbers.module.css";

const bevan = Bevan({ subsets: ["latin"], weight: "400" });
const figtree = Figtree({ subsets: ["latin"] });

export const metadata = {
  title: "Our barbers | Old Mill Barbers",
  description:
    "Meet the barbers at Old Mill Barbers and book a chair with the one you like.",
};

// Placeholder team: replace names, quotes, images and social links.
// Put portrait photos (4:5, at least 800px wide) in /public/barbers/
const BARBERS = [
  {
    name: "Marcus",
    role: "Master barber",
    image: "/barbers/barber1.webp",
    quote: "A good fade is quiet. People notice you, not the haircut.",
    socials: {
      instagram: "https://instagram.com/",
      facebook: "https://facebook.com/",
      x: "https://x.com/",
    },
  },
  {
    name: "Dev",
    role: "Senior barber",
    image: "/barbers/barber2.jpg",
    quote: "Take your time in the chair. I'll take mine on the details.",
    socials: {
      instagram: "https://instagram.com/",
      facebook: "https://facebook.com/",
    },
  },
  {
    name: "Tomas",
    role: "Barber",
    image: "/barbers/barber3.webp",
    quote: "Every head is different, so no two cuts should be the same.",
    socials: {
      instagram: "https://instagram.com/",
      x: "https://x.com/",
    },
  },
];

const SOCIAL_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
};

function SocialIcon({ name }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: "false",
  };

  if (name === "instagram") {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </svg>
    );
  }

  if (name === "facebook") {
    return (
      <svg {...props}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M4 4l11.7 16H20L8.3 4z" />
      <path d="M4 20l6.8-6.8M13.2 10.8L20 4" />
    </svg>
  );
}

export default function Barbers() {
  return (
    <main className={`${styles.page} ${figtree.className}`}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={`${styles.title} ${bevan.className}`}>Our barbers</h1>
          <p className={styles.lead}>
            Three barbers, one chair each. Every one of them will ask what
            you&rsquo;re after before the clippers come out.
          </p>
        </header>

        <ul className={styles.grid}>
          {BARBERS.map((barber) => (
            <li key={barber.name} className={styles.card}>
              <div className={styles.media}>
                <Image
                  src={barber.image}
                  alt={`Portrait of ${barber.name}`}
                  fill
                  sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 384px"
                  className={styles.photo}
                />

                {/* Tinted overlay with quote: shows on hover or focus,
                    and stays visible on small screens and touch devices */}
                <div className={styles.tint}>
                  <blockquote className={styles.quote}>
                    <p>{barber.quote}</p>
                  </blockquote>
                </div>

                <ul
                  className={styles.socials}
                  aria-label={`${barber.name} on social media`}
                >
                  {Object.entries(barber.socials).map(([network, url]) => (
                    <li key={network}>
                      <a
                        href={url}
                        className={styles.social}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${barber.name} on ${SOCIAL_LABELS[network]}`}
                      >
                        <SocialIcon name={network} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.stripe} aria-hidden="true" />

              <div className={styles.caption}>
                <h2 className={`${styles.name} ${bevan.className}`}>
                  {barber.name}
                </h2>
                <p className={styles.role}>{barber.role}</p>
                <Link
                  href={`/book?barber=${encodeURIComponent(barber.name)}`}
                  className={styles.textLink}
                >
                  Book with {barber.name}
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <section className={styles.closing} aria-labelledby="closing-title">
          <h2
            id="closing-title"
            className={`${styles.closingTitle} ${bevan.className}`}
          >
            Not sure who to pick? Take any open chair.
          </h2>
          <Link href="/book" className={styles.book}>
            Book a cut
          </Link>
        </section>
      </div>
    </main>
  );
}