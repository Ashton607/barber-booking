"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bevan, Figtree } from "next/font/google";
import styles from "./Navbar.module.css";

const bevan = Bevan({ subsets: ["latin"], weight: "400" });
const figtree = Figtree({ subsets: ["latin"] });

const BRAND = "Old Mill Barbers";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/barbers", label: "Our barbers" },
  { href: "/prices", label: "Prices" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Find us" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu after navigating
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // While the mobile menu is open: Escape closes it and the page doesn't scroll
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`${styles.header} ${figtree.className}`}>
      <nav className={styles.bar} aria-label="Main">
        <Link href="/" className={`${styles.brand} ${bevan.className}`}>
          {BRAND}
        </Link>

        <ul className={styles.links}>
          {LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={styles.link}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <Link href="/book" className={`${styles.cta} ${styles.ctaDesktop}`}>
          Book a cut
        </Link>

        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={styles.bars} aria-hidden="true" />
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={styles.panel}
        data-open={open}
        hidden={!open}
      >
        <ul className={styles.panelLinks}>
          {LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={styles.panelLink}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link href="/book" className={`${styles.cta} ${styles.ctaMobile}`}>
          Book a cut
        </Link>
      </div>

      {/* Barber pole stripe */}
      <div className={styles.pole} aria-hidden="true" />
    </header>
  );
}