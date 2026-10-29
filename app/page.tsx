import type { Metadata } from "next";
import Link from "next/link";
import { Newsreader } from "next/font/google";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardList,
  Link2,
  Lock,
  Package,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { JsonLd } from "@/components/shared/JsonLd";
import { HomeDemo } from "@/components/landing/home/HomeDemo";
import { HomeFaq } from "@/components/landing/home/HomeFaq";
import { HomeNav, type HomeNavLink } from "@/components/landing/home/HomeNav";
import { HomePricing } from "@/components/landing/home/HomePricing";
import { HomeReveal } from "@/components/landing/home/HomeReveal";
import { FAQ_ITEMS } from "@/components/landing/LandingFaq";
import { TESTIMONIALS } from "@/components/landing/LandingTestimonials";
import { faqPageSchema, softwareApplicationSchema } from "@/lib/seo/structuredData";
import { TRIAL_DAYS } from "@/lib/billing/access";
import { loadAllPosts, type Post } from "@/content/blog/posts";
import { FOUNDER, FOUNDER_BYLINE } from "@/lib/founder";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/support";
import "./home.css";

/** Only the headline's italic phrase uses it. */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["500"],
  display: "swap",
});

// The homepage had no canonical, and www.bitesync.io served a full copy of it
// (next.config.ts now redirects www). Every other public page already names
// its one address.
export const metadata: Metadata = {
  alternates: { canonical: "https://bitesync.io" },
};

const NAV_LINKS: readonly HomeNavLink[] = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "#blog", label: "Blog" },
  { href: "/about", label: "About" },
];

/** The landing strip shows the newest few; the full list lives at /blog. */
const FEATURED_POST_COUNT = 3;

/**
 * Footer labels for comparison posts. "BiteSync vs X: …" titles shorten to the
 * part before the colon; the ones that don't follow that pattern are named here.
 */
const COMPARISON_LABELS: Partial<Record<string, string>> = {
  "best-meal-planner-apps-macros": "Best meal planners for macros",
  "mealime-alternatives": "Mealime alternatives",
};

function comparisonLabel(post: Post): string {
  return COMPARISON_LABELS[post.slug] ?? post.title.split(":")[0];
}

function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** The example card in the hero. Illustrative figures, described for screen readers as an example. */
function HeroPlannerExample() {
  return (
    <div
      className="mock-wrap"
      role="img"
      aria-label="Example of a planned week in BiteSync: Wednesday at 1,690 of 1,850 calories, with lunch and dinner planned"
    >
      <div className="mock-float mock-float--top" aria-hidden>
        <span className="mock-float-icon">
          <Target className="h-[17px] w-[17px]" />
        </span>
        <span>
          <b>On track</b>
          <small>Daily targets balanced</small>
        </span>
      </div>
      <div className="mock" aria-hidden>
        <div className="mock-head">
          <div>
            <span className="mock-eyebrow">WEEKLY PLAN</span>
            <h3>May 12–18</h3>
          </div>
          <span className="mock-action">
            <CalendarDays className="h-[18px] w-[18px]" />
          </span>
        </div>
        <div className="mock-days">
          {[
            ["M", 12],
            ["T", 13],
            ["W", 14],
            ["T", 15],
            ["F", 16],
            ["S", 17],
            ["S", 18],
          ].map(([d, n]) => (
            <span key={n} className={`mock-day${n === 14 ? " on" : ""}`}>
              <span>{d}</span>
              <b>{n}</b>
            </span>
          ))}
        </div>
        <div className="mock-goal">
          <div className="mock-goal-copy">
            <span>Wednesday&apos;s goal</span>
            <b>
              1,690 <small>/ 1,850 kcal</small>
            </b>
          </div>
          <div className="mock-ring">
            <span>91%</span>
          </div>
        </div>
        <div className="mock-macros">
          <span>
            <i />
            Protein <b>112g</b>
          </span>
          <span>
            <i className="carbs" />
            Carbs <b>148g</b>
          </span>
          <span>
            <i className="fat" />
            Fat <b>54g</b>
          </span>
        </div>
        <div className="mock-label">
          <span>Today&apos;s meals</span>
          <span>2 planned</span>
        </div>
        {[
          { type: "LUNCH", name: "Chicken quinoa bowl", info: "485 kcal · 42g protein", warm: false },
          { type: "DINNER", name: "Pesto pasta primavera", info: "620 kcal · 28g protein", warm: true },
        ].map((m) => (
          <div key={m.name} className="mock-meal">
            <div className={`mock-art${m.warm ? " warm" : ""}`}>
              {m.warm ? <Package className="h-[19px] w-[19px]" /> : <Sparkles className="h-[19px] w-[19px]" />}
            </div>
            <div className="mock-meal-copy">
              <small>{m.type}</small>
              <b>{m.name}</b>
              <span>{m.info}</span>
            </div>
            <span className="mock-check">
              <Check className="h-3.5 w-3.5" />
            </span>
          </div>
        ))}
      </div>
      <div className="mock-float mock-float--bottom" aria-hidden>
        <span className="mock-float-icon warm">
          <ShoppingBasket className="h-[17px] w-[17px]" />
        </span>
        <span>
          <b>Grocery list ready</b>
          <small>One list from your week</small>
        </span>
      </div>
    </div>
  );
}

const PROOF = [
  { Icon: ShieldCheck, title: "Built by a dietitian", detail: "Targets and portions from clinical practice" },
  { Icon: BarChart3, title: "Official food data", detail: "Nutrition from government food composition tables" },
  { Icon: Lock, title: "Private by default", detail: "No ads, data never sold" },
  { Icon: CircleDollarSign, title: `${TRIAL_DAYS}-day free trial`, detail: "No card needed" },
] as const;

const COMPARE_BEFORE = [
  "Work out what to eat, every day",
  "Find out you're short on protein at 9pm",
  "A shopping trip for each recipe",
  "Calories only — gaps in iron or vitamin D go unseen",
] as const;

const COMPARE_AFTER = [
  "The whole week decided in one go",
  "Every day sized to your protein and calories before you start",
  "One merged list for the week",
  "Micronutrient gaps flagged across the week",
] as const;

const FEATURES = [
  {
    Icon: Target,
    title: "Personal calorie & protein targets",
    body: "Worked out from your weight, activity and whether you want to lose, maintain or build.",
  },
  {
    Icon: Sparkles,
    title: "AI weekly meal plans",
    body: "Fill the whole week from your own recipes in seconds, sized to your calorie and protein targets.",
  },
  {
    Icon: ClipboardList,
    title: "Automatic nutrition",
    body: "Calories, protein, carbs, fat and fibre calculated from your ingredients, using official food composition data.",
  },
  {
    Icon: Package,
    title: "Pantry-aware shopping",
    body: "Tell it what's in the cupboard and the grocery list skips it — buy less, waste less.",
  },
  {
    Icon: Link2,
    title: "Recipe import",
    body: "Paste a link from a recipe site and get the ingredients and nutrition in seconds.",
  },
] as const;

export default async function LandingPage() {
  // Same registry as the blog routes and sitemap, so publishing a post
  // surfaces it here automatically.
  // Comparison posts are for people choosing between apps (and the AI
  // answers they ask); the homepage strip shows the nutrition writing.
  const allPosts = await loadAllPosts();
  const featuredPosts = allPosts.filter((post) => post.category !== "Comparisons").slice(0, FEATURED_POST_COUNT);
  // The footer links every comparison instead: links from the homepage count
  // most with search engines, and these are the pages that answer "best app
  // for X" and "alternative to X".
  const comparisonPosts = allPosts.filter((post) => post.category === "Comparisons");
  const quote = TESTIMONIALS[0];

  return (
    <div className={`lp ${newsreader.variable}`}>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd data={faqPageSchema(FAQ_ITEMS)} />
      <HomeNav links={NAV_LINKS} />

      <main id="main-content">
        <section className="hero">
          <div className="hero-dot hero-dot--one" aria-hidden />
          <div className="hero-dot hero-dot--two" aria-hidden />
          <div className="hero-dot hero-dot--three" aria-hidden />
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <h1>
                A week of meals,
                <br />
                <em>planned to your macros.</em>
              </h1>
              <p className="hero-lead">
                Bring your recipes, nutrition targets and grocery list together — so eating well takes less
                thinking.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary" href="/signup">
                  Plan my week — {TRIAL_DAYS} days free <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                </Link>
                <a className="hero-text-link" href="#how-it-works">
                  See how it works <span aria-hidden>↓</span>
                </a>
              </div>
              <div className="hero-trust">
                <span className="seal" aria-hidden>
                  RD
                </span>
                <span>
                  <b>Built by a registered dietitian</b>
                  <small>
                    {TRIAL_DAYS}-day free trial · No card needed ·{" "}
                    <Link href="/privacy">Private by default</Link>
                  </small>
                </span>
              </div>
            </div>
            <HeroPlannerExample />
          </div>
        </section>

        <section className="proof" aria-label="Why BiteSync">
          <div className="wrap">
            {PROOF.map(({ Icon, title, detail }) => (
              <div key={title} className="proof-item">
                <Icon className="h-[22px] w-[22px]" aria-hidden />
                <div>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="block" id="how-it-works">
          <div className="wrap">
            <div className="split-head lp-reveal">
              <div>
                <p className="kicker">How it works</p>
                <h2 className="h2">From plan to plate in four steps</h2>
              </div>
              <p className="body">
                Set your targets once. BiteSync connects planning, shopping, daily tracking and micronutrient
                analysis — the full picture, not just calories.
              </p>
            </div>
            <HomeDemo />
          </div>
        </section>

        <section className="metrics band" aria-label="BiteSync in numbers">
          <div className="wrap">
            <div className="metric">
              <b>2,886</b>
              <span>foods with official nutrition data</span>
            </div>
            <div className="metric">
              <b>12</b>
              <span>vitamins &amp; minerals checked against recommended intakes</span>
            </div>
            <div className="metric">
              <b>7 days</b>
              <span>planned in one go, to your targets</span>
            </div>
            <div className="metric">
              <b>Free</b>
              <span>for your first {TRIAL_DAYS} days — no card needed</span>
            </div>
          </div>
        </section>

        <section className="block" id="features">
          <div className="wrap">
            <div className="center-head lp-reveal">
              <p className="kicker">Features</p>
              <h2 className="h2">Built for people with a nutrition goal</h2>
              <p className="body">Everything else you need to plan, shop and eat to your targets.</p>
            </div>
            <div className="features lp-reveal">
              <article className="feature feature--wide">
                <div>
                  <span className="f-ico" aria-hidden>
                    <BarChart3 className="h-5 w-5" />
                  </span>
                  <h3>
                    See what your week is missing
                  </h3>
                  <p>
                    Iron, iodine, vitamin D and nine more, checked across the whole week against recommended
                    intakes. Something no calorie counter shows you.
                  </p>
                </div>
                <div className="mini-chart" aria-hidden>
                  <div>
                    <i className="low" style={{ height: 72 }} />
                    Iron
                  </div>
                  <div>
                    <i className="low" style={{ height: 64 }} />
                    Iodine
                  </div>
                  <div>
                    <i className="low" style={{ height: 38 }} />
                    Vit D
                  </div>
                  <div>
                    <i style={{ height: 96 }} />
                    Calcium
                  </div>
                </div>
              </article>
              {FEATURES.map(({ Icon, title, body }) => (
                <article key={title} className="feature">
                  <span className="f-ico" aria-hidden>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3>
                    {title}
                  </h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="block block--flush" id="story">
          <div className="wrap">
            <div className="story lp-reveal">
              <div className="story-copy">
                <p className="kicker">Why I built it</p>
                <h2 className="h2">Knowing your goal isn&apos;t the hard part</h2>
                <p>
                  As a dietitian, there&apos;s one problem I see more than any other. People know the goal they
                  want to reach, but not the steps that get them there. Planning meals in advance closes that gap —
                  you can see your intake before you eat it, track it as you go, and change it while there&apos;s
                  still time.
                </p>
                <p>
                  <Link href={FOUNDER.path}>Read why I built BiteSync →</Link>
                </p>
                <div className="signoff">
                  <span className="seal" aria-hidden>
                    RD
                  </span>
                  <div>
                    <b>{FOUNDER.name}</b>
                    <span>{FOUNDER.credential}, founder of BiteSync</span>
                  </div>
                </div>
              </div>
              {quote ? (
                <div>
                  <p className="quote-label">From people using it</p>
                  <figure className="quote-card">
                    <blockquote>“{quote.quote}”</blockquote>
                    <figcaption>
                      <span className="avatar" aria-hidden>
                        {quote.name.charAt(0)}
                      </span>
                      {quote.name}
                      {quote.context ? `, ${quote.context}` : null}
                    </figcaption>
                  </figure>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="block block--flush">
          <div className="wrap">
            <div className="center-head lp-reveal">
              <p className="kicker">The difference</p>
              <h2 className="h2">A plan, not another log</h2>
            </div>
            <div className="compare lp-reveal">
              <div className="compare-card compare-card--before">
                <h3>Counting as you go</h3>
                <ul>
                  {COMPARE_BEFORE.map((item) => (
                    <li key={item}>
                      <span className="compare-ico" aria-hidden>
                        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="compare-card compare-card--after">
                <h3>Planning with BiteSync</h3>
                <ul>
                  {COMPARE_AFTER.map((item) => (
                    <li key={item}>
                      <span className="compare-ico" aria-hidden>
                        <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="block band" id="pricing">
          <HomePricing />
        </section>

        <section className="block" id="faq">
          <div className="wrap faq">
            <div className="faq-head">
              <p className="kicker">FAQ</p>
              <h2 className="h2">Questions, answered</h2>
              <p className="body" style={{ marginTop: 16 }}>
                Something else? Email <a href={supportMailto()}>{SUPPORT_EMAIL}</a>.
              </p>
            </div>
            <HomeFaq />
          </div>
        </section>

        {/* The homepage's links are how search engines and AI assistants reach the articles. */}
        <section className="block band" id="blog">
          <div className="wrap">
            <div className="split-head lp-reveal">
              <div>
                <p className="kicker">From the blog</p>
                <h2 className="h2">Nutrition science, made practical</h2>
              </div>
              <p className="body">Evidence-based articles on planning, portions and the nutrients most apps miss.</p>
            </div>
            <div className="posts lp-reveal">
              {featuredPosts.map((post) => (
                <article key={post.slug} className="post">
                  <p className="post-cat">{post.category}</p>
                  <h3>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="post-desc">{post.description}</p>
                  <p className="post-meta">
                    <time dateTime={post.datePublished}>{formatPostDate(post.datePublished)}</time>
                    {post.reviewedBy === "founder" ? ` · Reviewed by ${FOUNDER_BYLINE}` : null}
                  </p>
                  {/* Starts with the visible words, so a voice-control user can say
                      "click Read article" (WCAG 2.5.3); the title keeps the three
                      links distinguishable for screen readers. */}
                  <Link className="post-more" href={`/blog/${post.slug}`} aria-label={`Read article: ${post.title}`}>
                    Read article →
                  </Link>
                </article>
              ))}
            </div>
            {/* The index is how a crawler finds posts that aren't featured here. */}
            <p className="all-posts">
              <Link className="btn btn-outline btn-sm" href="/blog">
                All posts →
              </Link>
            </p>
          </div>
        </section>

        <section className="block block--last">
          <div className="wrap">
            <div className="cta lp-reveal">
              <h2 className="h2">Hit your macros without the spreadsheet</h2>
              <p>
                Plan your week, shop once and track every day — free for {TRIAL_DAYS} days, no card needed.
              </p>
              <Link className="btn btn-light" href="/signup">
                Start free trial <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
              </Link>
              <p className="small-print">
                Private by default — no ads, data never sold. <Link href="/privacy">Privacy policy</Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap">
          <div className="footer-top">
            <Logo size="sm" href="/" />
            <nav aria-label="Footer">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
              <Link href="/login">Sign in</Link>
            </nav>
          </div>
          {comparisonPosts.length > 0 ? (
            <nav aria-label="Compare BiteSync with other apps" className="footer-compare">
              <span className="footer-compare-label">Compare</span>
              {comparisonPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  {comparisonLabel(post)}
                </Link>
              ))}
            </nav>
          ) : null}
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} BiteSync</span>
            <span className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/macro-calculator">Macro calculator</Link>
              <Link href="/privacy">Privacy policy</Link>
              <Link href="/terms">Terms</Link>
              <a href={supportMailto()}>Help: {SUPPORT_EMAIL}</a>
            </span>
          </div>
        </div>
      </footer>

      <HomeReveal />
    </div>
  );
}
