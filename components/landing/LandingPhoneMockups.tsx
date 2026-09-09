import { PhoneFrame } from "@/components/landing/PhoneFrame";
import { MealThumbnail } from "@/components/ui/MealThumbnail";

function MiniRing() {
 const size = 44;
 const r = 16;
 const c = 2 * Math.PI * r;
 const p = 0.92;
 const half = size / 2;
 return (
 <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden>
 <circle cx={half} cy={half} r={r} fill="none" stroke="var(--progress-track)" strokeWidth={5} />
 <circle
 cx={half}
 cy={half}
 r={r}
 fill="none"
 stroke="var(--brand-action)"
 strokeWidth={5}
 strokeLinecap="round"
 strokeDasharray={c}
 strokeDashoffset={c * (1 - p)}
 transform={`rotate(-90 ${half} ${half})`}
 />
 </svg>
 );
}

export function MockToday() {
 return (
 <PhoneFrame label="BiteSync Today dashboard preview">
 <section className="bg-gradient-to-b from-[var(--header-from)] to-[var(--header-to)] px-3 pt-7 pb-3">
 <p className="text-2xs text-[var(--text-on-brand-muted)]">Saturday, 16 May</p>
 <p className="text-xs font-bold text-[var(--text-on-brand)]">Your Goals</p>
 </section>
 <section className="space-y-2 px-2 pb-3 pt-2">
 <article className="rounded-xl bg-[var(--surface-card)] p-2 shadow-sm">
 <div className="flex items-center gap-2">
 <MiniRing />
 <div>
 <p className="text-2xs text-[var(--text-muted)]">Calories</p>
 <p className="text-sm font-bold text-[var(--text-primary)]">
 1,850 <span className="text-2xs font-normal text-[var(--text-muted)]">/ 2,000</span>
 </p>
 </div>
 </div>
 <div className="mt-2 grid grid-cols-2 gap-1.5">
 <MacroMini label="Protein" value={78} color="var(--brand-action)" />
 <MacroMini label="Carbs" value={120} color="#f97316" />
 </div>
 </article>
 <MealRow name="Greek yoghurt & berries" meta="320 kcal · 24g protein" mealType="breakfast" />
 </section>
 </PhoneFrame>
 );
}

function MacroMini({ label, value, color }: { label: string; value: number; color: string }) {
 return (
 <div>
 <div className="mb-0.5 flex justify-between text-2xs text-[var(--text-muted)]">
 <span>{label}</span>
 <span>{value}g</span>
 </div>
 <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
 <div className="h-full w-[55%] rounded-full" style={{ backgroundColor: color }} />
 </div>
 </div>
 );
}

function MealRow({ name, meta, mealType }: { name: string; meta: string; mealType: string }) {
 return (
 <article className="flex gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-2">
 <MealThumbnail recipeName={name} mealType={mealType} size="sm" />
 <div className="min-w-0 flex-1">
 <p className="truncate text-2xs font-semibold text-[var(--text-primary)]">{name}</p>
 <p className="text-2xs text-[var(--text-muted)]">{meta}</p>
 </div>
 </article>
 );
}

export function MockPlanner() {
 const days = ["M","T","W","T","F","S","S"];
 return (
 <PhoneFrame label="BiteSync weekly planner preview">
 <section className="bg-gradient-to-b from-[var(--header-from)] to-[var(--header-to)] px-2 pt-7 pb-2">
 <p className="text-xs font-bold text-[var(--text-on-brand)]">Weekly Plan</p>
 <div className="mt-2 flex gap-1">
 {days.map((label, i) => (
 <span
 key={`${label}-${i}`}
 className={`flex flex-col items-center rounded-lg px-1 py-1 text-2xs ${
 i === 5 ?"bg-[var(--surface-card)] text-[var(--text-link)]" :"text-[var(--text-on-brand-muted)]"
 }`}
 >
 <span>{label}</span>
 <span className="font-bold">{10 + i}</span>
 </span>
 ))}
 </div>
 </section>
 <section className="space-y-1.5 px-2 pb-3 pt-2">
 <p className="text-2xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Lunch</p>
 <MealRow name="Chicken quinoa bowl" meta="485 kcal · 42g P" mealType="lunch" />
 <p className="text-2xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Dinner</p>
 <MealRow name="Pesto pasta primavera" meta="620 kcal · 28g P" mealType="dinner" />
 </section>
 </PhoneFrame>
 );
}

export function MockGrocery() {
 const items = [
 { name:"Chicken breast", qty:"500g", checked: true },
 { name:"Greek yoghurt", qty:"500g", checked: true },
 { name:"Quinoa", qty:"250g", checked: false },
 { name:"Spinach", qty:"200g", checked: false },
 ] as const;

 return (
 <PhoneFrame label="BiteSync grocery list preview">
 <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 pt-7 pb-2">
 <p className="text-xs font-bold text-[var(--text-primary)]">Grocery list</p>
 <p className="text-xs text-[var(--text-secondary)]">12 items · Mon–Sun</p>
 </header>
 <ul className="space-y-1 px-2 py-2">
 {items.map((item) => (
 <li
 key={item.name}
 className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
 item.checked ?"border-[var(--border-subtle)] bg-[var(--surface-muted)]" :"border-[var(--border-subtle)] bg-[var(--surface-card)]"
 }`}
 >
 <span
 className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs leading-none ${
 item.checked ?"border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--text-on-brand)]" :"border-[var(--border-default)]"
 }`}
 aria-hidden
 >
 {item.checked ?"✓" :""}
 </span>
 <span
 className={`min-w-0 flex-1 truncate text-xs font-medium ${
 item.checked ?"text-[var(--text-secondary)] line-through" :"text-[var(--text-primary)]"
 }`}
 >
 {item.name}
 </span>
 <span className="shrink-0 text-2xs font-medium text-[var(--text-muted)]">{item.qty}</span>
 </li>
 ))}
 </ul>
 </PhoneFrame>
 );
}

export function MockTargets() {
 return (
 <PhoneFrame label="BiteSync calorie and macro targets preview">
 <section className="bg-gradient-to-b from-[var(--header-from)] to-[var(--header-to)] px-3 pt-7 pb-3">
 <p className="text-2xs text-[var(--text-on-brand-muted)]">Nutrition &amp; goals</p>
 <p className="text-xs font-bold text-[var(--text-on-brand)]">Calorie &amp; macro targets</p>
 </section>
 <section className="space-y-2 px-2 pb-3 pt-2">
 <article className="rounded-xl bg-[var(--surface-card)] p-2.5 shadow-sm">
 <p className="text-2xs text-[var(--text-muted)]">Daily target</p>
 <p className="text-lg font-bold text-[var(--text-primary)]">2,200 kcal</p>
 <p className="mt-1 text-2xs text-[var(--text-muted)]">155g protein · lose weight</p>
 </article>
 <div className="grid grid-cols-3 gap-1.5">
 {[
 { label: "Protein", value: "155g" },
 { label: "Carbs", value: "220g" },
 { label: "Fat", value: "73g" },
 ].map((m) => (
 <div key={m.label} className="rounded-lg bg-[var(--surface-brand-subtle)] p-2 text-center">
 <p className="text-2xs font-bold text-[var(--text-primary)]">{m.value}</p>
 <p className="text-2xs text-[var(--text-muted)]">{m.label}</p>
 </div>
 ))}
 </div>
 <p className="text-2xs text-[var(--text-muted)]">Based on TDEE, activity &amp; goal</p>
 </section>
 </PhoneFrame>
 );
}

export function MockRecipeNutrition() {
 return (
 <PhoneFrame label="BiteSync recipe nutrition preview">
 <section className="bg-[var(--surface-action-subtle)] px-3 pt-7 pb-4 text-center">
 <p className="text-xs font-bold text-[var(--text-primary)]">Chicken quinoa bowl</p>
 </section>
 <section className="px-2 pb-3 pt-2">
 <div className="mb-2 grid grid-cols-4 gap-1">
 {[
 { label: "kcal", value: "485" },
 { label: "Protein", value: "42g" },
 { label: "Carbs", value: "51g" },
 { label: "Fat", value: "12g" },
 ].map((m) => (
 <div key={m.label} className="rounded-lg bg-[var(--surface-brand-subtle)] p-1.5 text-center">
 <p className="text-2xs font-bold text-[var(--text-primary)]">{m.value}</p>
 <p className="text-[10px] text-[var(--text-muted)]">{m.label}</p>
 </div>
 ))}
 </div>
 <p className="text-2xs font-semibold text-[var(--text-muted)]">Ingredients</p>
 <ul className="mt-1 space-y-1 text-2xs text-[var(--text-secondary)]">
 <li>Chicken breast · 140g</li>
 <li>Quinoa · 60g</li>
 <li>Broccoli · 100g</li>
 </ul>
 </section>
 </PhoneFrame>
 );
}

export function MockAiPlans() {
 return (
 <PhoneFrame label="BiteSync AI weekly meal plan preview">
 <section className="bg-gradient-to-b from-[var(--header-from)] to-[var(--header-to)] px-2 pt-7 pb-2">
 <p className="text-xs font-bold text-[var(--text-on-brand)]">Weekly Plan</p>
 <p className="mt-1 text-2xs text-[var(--text-on-brand-muted)]">AI-filled from your library</p>
 </section>
 <section className="space-y-1.5 px-2 pb-2 pt-2">
 <MealRow name="Turkey & sweet potato" meta="Lunch · 520 kcal" mealType="lunch" />
 <MealRow name="Salmon tray bake" meta="Dinner · 610 kcal" mealType="dinner" />
 </section>
 <div className="mx-2 mb-3 rounded-lg bg-[var(--brand-primary)] px-2 py-1.5 text-center text-2xs font-semibold text-[var(--text-on-brand)]">
 Generate week · macros on target
 </div>
 </PhoneFrame>
 );
}

export function MockRecipeImport() {
 return (
 <PhoneFrame label="BiteSync recipe import preview">
 <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 pt-7 pb-2">
 <p className="text-xs font-bold text-[var(--text-primary)]">Import recipe</p>
 </header>
 <section className="space-y-2 px-3 py-3">
 <p className="text-2xs text-[var(--text-muted)]">Paste a recipe URL</p>
 <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-2 py-1.5 text-2xs text-[var(--text-secondary)]">
 bbcgoodfood.com/recipes/...
 </div>
 <div className="rounded-lg bg-[var(--brand-primary)] py-1.5 text-center text-2xs font-semibold text-[var(--text-on-brand)]">
 Fetch recipe
 </div>
 <p className="text-2xs text-[var(--text-muted)]">Ingredients &amp; nutrition pulled automatically</p>
 </section>
 </PhoneFrame>
 );
}

export function MockDietary() {
 const prefs = ["Vegetarian", "Gluten-free", "High protein"];
 return (
 <PhoneFrame label="BiteSync dietary preferences preview">
 <section className="bg-gradient-to-b from-[var(--header-from)] to-[var(--header-to)] px-3 pt-7 pb-3">
 <p className="text-xs font-bold text-[var(--text-on-brand)]">Dietary preferences</p>
 </section>
 <section className="space-y-1.5 px-2 pb-3 pt-2">
 {prefs.map((pref, i) => (
 <div
 key={pref}
 className={`rounded-lg border px-2 py-1.5 text-2xs font-medium ${
 i < 2
 ? "border-[var(--brand-primary)] bg-[var(--surface-brand-subtle)] text-[var(--text-primary)]"
 : "border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)]"
 }`}
 >
 {pref}
 </div>
 ))}
 <p className="pt-1 text-2xs text-[var(--text-muted)]">Used for AI plans &amp; recipe generation</p>
 </section>
 </PhoneFrame>
 );
}

export function MockMicros() {
 const rows = [
 { name: "Vitamin D", pct: "97%", tone: "green" },
 { name: "Iron", pct: "112%", tone: "green" },
 { name: "Iodine", pct: "86%", tone: "amber" },
 ] as const;
 return (
 <PhoneFrame label="BiteSync micronutrient analysis preview">
 <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 pt-7 pb-2">
 <p className="text-xs font-bold text-[var(--text-primary)]">Weekly nutrition</p>
 <p className="text-2xs text-[var(--text-muted)]">Micronutrients vs DRVs</p>
 </header>
 <ul className="space-y-1.5 px-2 py-2">
 {rows.map((row) => (
 <li key={row.name} className="flex items-center gap-2 rounded-lg bg-[var(--surface-card)] px-2 py-1.5">
 <span
 className={`h-2 w-2 shrink-0 rounded-full ${
 row.tone === "green" ? "bg-[var(--semantic-success-text)]" : "bg-[var(--semantic-warn-text)]"
 }`}
 aria-hidden
 />
 <span className="flex-1 text-2xs text-[var(--text-secondary)]">{row.name}</span>
 <span className="text-2xs font-medium text-[var(--text-muted)]">{row.pct}</span>
 </li>
 ))}
 </ul>
 </PhoneFrame>
 );
}

