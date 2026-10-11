/**
 * Exported so the FAQPage structured data is generated from the same array the
 * page renders. Search and answer engines discard (and Google penalises) markup
 * describing content a visitor cannot see, so these must not be allowed to drift.
 */
import { FOUNDER } from "@/lib/founder";
import { SUPPORT_EMAIL } from "@/lib/support";
export const FAQ_ITEMS = [
 {
 q:"Does BiteSync work on my phone?",
 a:"Yes. BiteSync is a web app that works on any device including iPhone and Android. No download needed.",
 },
 // The next three answer what an AI assistant said it couldn't confirm when
 // asked for the best macro meal planner: automatic generation, how closely
 // plans hit targets, and the nutrient data. Numbers come from
 // lib/planner/calorie-bands.ts, PROTEIN_FLOOR_RATIO in plan-calorie-tuning.ts
 // and scripts/verify-micro-coverage.ts (run in CI) — change them together.
 {
 q:"Does BiteSync plan my meals automatically?",
 a:"On Pro, yes. The AI fills your whole week — breakfast, lunch, dinner and snacks — from your recipe library in seconds, sized to your calorie and protein targets, and favours recipes rich in any vitamins or minerals your week is short on. On Free, you place meals yourself and each day's totals update as you go. Either way, you get one grocery list for the week.",
 },
 {
 q:"How close do plans get to my calorie and protein targets?",
 a:"AI weekly plans aim to put every day within 150 kcal of your calorie target (or 7%, whichever is tighter), keep the week's average within 5%, and give each day at least 95% of your protein target. If your recipe library can't get a day there, BiteSync tells you which days are off and by how much rather than hiding it — adding a lighter or snack-sized recipe usually fixes it.",
 },
 {
 q:"How accurate is the nutrition data?",
 a:"Nutrition is calculated from each recipe's ingredients and their weights, using CoFID — the UK government's official food composition tables, covering 2,886 foods. Every food used in BiteSync's generated recipes is checked automatically on every update to confirm its vitamin and mineral data is complete, so a missing value can't quietly show up as a shortfall.",
 },
 {
 q:"Do I need to create recipes from scratch?",
 a:"No. Add recipes manually in minutes, or paste a URL from many recipe websites — BiteSync imports ingredients so you can tweak them before saving. Nutrition is calculated automatically either way.",
 },
 {
 q:"What is the difference between Free and Pro nutrition tracking?",
 a:"Free users see calories and protein per meal. Pro users get all four macros plus micronutrient analysis against published dietary reference values.",
 },
 {
 q:"Is my data private?",
 a:"Yes. Your recipes, meal plans, and nutrition data are private to your account. Payments are handled securely by Stripe.",
 },
 {
 q:"Can I cancel my Pro subscription?",
 a:"Yes. Pro renews automatically each month or year until you cancel. Cancel anytime from settings and keep access until the end of the period you've paid for.",
 },
 {
 q:"How do I get help?",
 a: `Email ${SUPPORT_EMAIL} — it goes straight to ${FOUNDER.name}, who built BiteSync. You can also send feedback from Settings in the app.`,
 },
 {
 q:"Can I use BiteSync in any country?",
 a:"Yes. BiteSync runs in any browser, and food composition data describes the food itself, so it travels — a chicken breast has the same protein wherever you shop. Two things to know: subscriptions are billed in pounds (GBP), so your bank converts the price to your currency, and vitamin and mineral targets follow UK dietary reference values, which closely match European (EFSA) and WHO guidance for most nutrients.",
 },
 {
 q:"Who built BiteSync?",
 a: `${FOUNDER.name}, a registered dietitian, who built it to give people working towards a nutrition goal the structure to reach it. The targets, portion logic and micronutrient analysis come from clinical practice rather than from whatever a calorie-counting app happened to do first.`,
 },
 {
 q:"What happens when I reach the 10 recipe limit on Free?",
 a:"You will see a warning as you approach the limit. Archive older recipes to free up space or upgrade to Pro.",
 },
 {
 q:"Can I import recipes from other websites?",
 a:"Yes. Open Recipes while logged in, use import from URL, and paste a link. We extract ingredients where the page structure allows; you can edit anything before saving. Coverage varies by site.",
 },
] as const;

export function LandingFaq() {
 return (
 <section id="faq" className="mx-auto max-w-4xl scroll-mt-24 px-4 py-20">
 <div className="mb-8 text-center">
 <h2 className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl text-balance">Questions answered</h2>
 <p className="text-sm text-[var(--text-muted)]">Everything you need to know before you get started.</p>
 </div>
 <div className="space-y-3">
 {FAQ_ITEMS.map((item) => (
 <details
 key={item.q}
 className="group rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 open:shadow-sm dark:open:shadow-none"
 >
 <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--text-primary)] marker:content-none [&::-webkit-details-marker]:hidden">
 <span className="flex items-center justify-between gap-3">
 {item.q}
 <span className="text-[var(--text-muted)] transition-transform group-open:rotate-180" aria-hidden>
 ▾
 </span>
 </span>
 </summary>
 <p className="mt-3 pr-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.a}</p>
 </details>
 ))}
 </div>
 </section>
 );
}
