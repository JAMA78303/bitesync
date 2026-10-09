"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { ThemeSwitch } from "@/components/shared/ThemeSwitch";

export type HomeNavLink = { href: string; label: string };

export function HomeNav({ links }: { links: readonly HomeNavLink[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Underline the section in the middle of the screen.
  useEffect(() => {
    const sections = links
      .filter((l) => l.href.startsWith("#"))
      .map((l) => document.getElementById(l.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(`#${entry.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [links]);

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`} aria-label="Main">
      <div className="wrap">
        <Logo size="md" href="/" />
        <div className="nav-links">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={active === link.href ? "active" : undefined}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="nav-cta">
          <ThemeSwitch />
          <Link className="signin" href="/login">
            Sign in
          </Link>
          <Link className="btn btn-primary btn-sm" href="/signup">
            <span className="nav-cta-long">Get started free</span>
            <span className="nav-cta-short">Start free</span>
          </Link>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={menuOpen}
            aria-controls="home-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>
      {menuOpen ? (
        <div className="menu-panel" id="home-menu">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link href="/login" onClick={() => setMenuOpen(false)}>
            Sign in
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
