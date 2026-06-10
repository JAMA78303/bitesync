const FAQ_ITEMS = [
 {
 q:"Does BiteSync work on my phone?",
 a:"Yes. BiteSync is a web app that works on any device including iPhone and Android. No download needed.",
 },
 {
 q:"Do I need to create recipes from scratch?",
 a:"No. Add recipes manually in minutes, or paste a URL from many recipe websites — BiteSync imports ingredients so you can tweak them before saving. Nutrition is calculated automatically either way.",
 },
 {
 q:"What is the difference between Free and Pro nutrition tracking?",
 a:"Free users see calories and protein per meal. Pro users get all four macros plus micronutrient analysis against UK dietary reference values.",
 },
 {
 q:"Is my data private?",
 a:"Yes. Your recipes, meal plans, and nutrition data are private to your account. Payments are handled securely by Stripe.",
 },
 {
 q:"What supermarkets do you compare?",
 a:"Currently Tesco, Asda, and Aldi. Prices are manually verified and shown as estimates.",
 },
 {
 q:"Can I cancel my Pro subscription?",
 a:"Yes. Cancel anytime from settings and keep access until the current billing period ends.",
 },
 {
 q:"Is BiteSync only for people in the UK?",
 a:"BiteSync is built for UK users with GBP pricing and UK nutrition references.",
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
 <h2 className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">Questions answered</h2>
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
