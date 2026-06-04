# BiteSync Landing Page — UI Improvements Brief

All changes are in `app/page.tsx`, `components/landing/PhoneFrame.tsx`, and `components/landing/LandingPhoneMockups.tsx` unless noted otherwise.

---

## 1. Hero — Remove "Sign in" button from the CTA row

**File:** `app/page.tsx` lines 200–205

The hero has two equal-weight pill buttons: "Start planning for free" and "Sign in". The Sign In action is already in the nav. Having it in the hero splits attention and dilutes the primary CTA.

**Change:** Delete the Sign In `<Link>` from the hero CTA row entirely. The "Start planning for free" button should be the only CTA here. Change the `<div className="flex flex-col items-center justify-center gap-3 sm:flex-row">` to remove the second child and center the single button naturally.

---

## 2. Hero — Add visual depth to the background

**File:** `app/page.tsx` line 179

Current: `bg-gradient-to-b from-[#3a5a40] via-[#3d6144] to-[#4a7a50]`

The gradient is nearly imperceptible — it's essentially a flat dark green. This makes the hero feel solid and heavy, with no visual warmth or life.

**Change:** Use a more directional, multi-stop gradient and add a subtle noise/grain texture overlay using a pseudo-element via a `before:` Tailwind utility or an absolutely positioned `<div>` with `opacity-[0.03]` and a CSS grain background. A good gradient to try:

```
bg-[radial-gradient(ellipse_at_top_left,_#4a7a50_0%,_#3a5a40_40%,_#2d4a33_100%)]
```

Also add `relative overflow-hidden` to the `<header>` and place this inside it before the content div:

```tsx
<div
  aria-hidden
  className="pointer-events-none absolute inset-0 opacity-[0.04]"
  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", backgroundSize: "200px 200px" }}
/>
```

---

## 3. Hero — Bring the product into the hero section

**File:** `app/page.tsx` lines 179–211

Currently users see only text on a green background. They have to scroll before they see what they're signing up for. Every strong SaaS hero shows the product immediately.

**Change:** After the `<p className="mt-6 text-xs text-white/60">` trust line, add a hero product preview. Import `MockPlanner` (or a simplified version) from `LandingPhoneMockups.tsx` and export it so it can be used here. Alternatively, render one phone mockup directly in the hero with `mt-10 -mb-16 relative z-10` so it bleeds into the next section:

```tsx
<div className="mt-10 hidden sm:flex justify-center">
  {/* Single phone mockup showing the weekly planner — desktop only */}
  <div className="relative z-10 -mb-20 drop-shadow-2xl">
    <MockPlanner />
  </div>
</div>
```

**Hide on mobile:** The `hidden sm:flex` ensures the mockup only appears at `sm` breakpoint and above. On smaller screens a phone-inside-a-phone reads as cramped and the text CTA is sufficient on its own. Do not show any fallback element — the hero stands alone on mobile.

Make `MockPlanner` a named export from `LandingPhoneMockups.tsx` so it can be imported in `page.tsx`.

Add `pb-10 sm:pb-28` to the `<header>` so mobile gets normal bottom padding and desktop gets the extra space to accommodate the bleed.

---

## 4. Phone frames — Lighten the device bezels

**File:** `components/landing/PhoneFrame.tsx` line 15

Current: `border-slate-900 bg-slate-900`

The dark navy border (`slate-900`) is very heavy and dated. It dominates the mockup section and competes with the app content inside.

**Change:** Switch to a lighter, neutral frame:

```tsx
className="relative w-[200px] rounded-[2rem] border-[5px] border-slate-300 bg-slate-300 p-1 shadow-xl shadow-black/10 sm:w-[220px]"
```

And update the dynamic island notch on line 17:

```tsx
className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-300"
```

This gives a silver/neutral device feel, letting the green app UI read clearly without fighting a dark border.

---

## 5. "See it in action" section — Off-white background

**File:** `app/page.tsx` line 238

Current: `bg-white`

The section drops from a dark green hero to pure white, which is jarring. It also makes the section feel disconnected from the brand.

**Change:** `bg-[#f5f9f5]` (a very light warm green). This ties back to the brand colour without being heavy and creates a visual separation from the white features section below.

---

## 6. Features grid — Break the uniformity

**File:** `app/page.tsx` lines 258–271

The 9 identical cards in a `lg:grid-cols-3` grid is the default SaaS template pattern. It's correct but has zero personality.

**Changes:**

**a) Larger icons:** The icon container is currently `h-10 w-10`. Increase to `h-12 w-12` and the icon itself from `h-5 w-5` to `h-6 w-6`.

**b) Softer section background:** The section is currently `bg-white` (line 248). Change to `bg-slate-50` so it doesn't bleed into the white sections around it and the cards read as elevated.

**c) Mark Pro features:** Features where `desc` contains "on Pro" or "Pro users" should show a small "Pro" badge. Add a `isPro` flag to the `FEATURES` array and render:

```tsx
{isPro && (
  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
    Pro
  </span>
)}
```

next to the title. This also communicates the free/pro boundary without waiting for pricing.

---

## 7. Add a social proof section

**File:** `app/page.tsx` — insert between the mockup section (line 246) and the features section (line 248)

There is no social proof anywhere on the page. Add a testimonials or stat strip between the demo and features.

Use real quotes from early users — check any feedback received via email, the onboarding flow, or direct messages. Do not use placeholder or invented quotes.

Structure the component as a three-quote strip using this shape:

```tsx
<section className="bg-white py-12 border-y border-slate-100">
  <div className="mx-auto max-w-5xl px-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
    {TESTIMONIALS.map((quote, i) => (
      <figure key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <blockquote className="text-sm leading-relaxed text-slate-700">&ldquo;{quote}&rdquo;</blockquote>
      </figure>
    ))}
  </div>
</section>
```

Define `TESTIMONIALS` at the top of `page.tsx` as a plain `string[]`, populated with real early user feedback. No names, no locations — quotes only. If fewer than three quotes are available, render only what exists. If none are available yet, omit the section entirely.

---

## 8. Pricing — Make the annual option more prominent

**File:** `app/page.tsx` lines 307–310

Current: `"or £59/year — save 30%"` in `text-xs text-white/70` — it's almost invisible.

**Change:** Wrap it in a more visible pill and make the monthly-equivalent price explicit:

```tsx
<div className="mt-2 flex items-center gap-2">
  <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
    SAVE 30%
  </span>
  <span className="text-xs text-white/70">£59/year · works out to £4.92/mo</span>
</div>
```

---

## 9. Blog cards — Add a CTA back to signup

**File:** `app/page.tsx` lines 372–387

Blog cards are dead ends. After reading the title/description, there's no action to take except clicking through to the article — and many users won't.

**Change:** Add a small "Try BiteSync free →" link at the bottom of each card:

```tsx
<Link
  href="/signup"
  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#3a5a40] hover:underline"
>
  Try BiteSync free <ChevronRight className="h-3 w-3" />
</Link>
```

Place this after `<p className="mt-4 text-xs text-slate-400">{post.readTime}</p>`.

---

## 10. Footer — Add social links and GDPR badge

**File:** `app/page.tsx` lines 407–422

The footer is minimal to the point of feeling unfinished.

**Changes:**

**a)** Add social icon links (Twitter/X, Instagram) using Lucide icons or inline SVGs between the nav links and the copyright line.

**b)** Add a small GDPR / privacy note next to copyright:

```tsx
<p className="text-xs text-slate-400">
  © {new Date().getFullYear()} BiteSync · GDPR compliant · 
  <Link href="/privacy" className="hover:underline ml-1">Privacy</Link>
</p>
```

---

## Priority order

| Priority | Change |
|----------|--------|
| 1 | Remove Sign In button from hero (#1) |
| 2 | Add product mockup inside hero (#3) |
| 3 | Add social proof section (#7) |
| 4 | Lighten phone bezels (#4) |
| 5 | Off-white mockup section background (#5) |
| 6 | Hero gradient depth (#2) |
| 7 | Annual pricing visibility (#8) |
| 8 | Feature grid improvements (#6) |
| 9 | Blog card CTAs (#9) |
| 10 | Footer polish (#10) |
