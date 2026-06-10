import { PhoneFrame } from "@/components/landing/PhoneFrame";

function MiniRing() {
 const size = 44;
 const r = 16;
 const c = 2 * Math.PI * r;
 const p = 0.62;
 const half = size / 2;
 return (
 <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden>
 <circle cx={half} cy={half} r={r} fill="none" stroke="var(--progress-track)" strokeWidth={5} />
 <circle
 cx={half}
 cy={half}
 r={r}
 fill="none"
 stroke="var(--brand-primary)"
 strokeWidth={5}
 strokeLinecap="round"
 strokeDasharray={c}
 strokeDashoffset={c * (1 - p)}
 transform={`rotate(-90 ${half} ${half})`}
 />
 </svg>
 );
}

function MockToday() {
 return (
 <PhoneFrame label="BiteSync Today dashboard preview">
 <section className="bg-gradient-to-b from-[var(--header-from)] to-[var(--header-to)] px-3 pt-7 pb-3">
 <p className="text-[9px] text-[var(--text-on-brand-muted)]">Saturday, 16 May</p>
 <p className="text-xs font-bold text-[var(--text-on-brand)]">Your Goals</p>
 </section>
 <section className="space-y-2 px-2 pb-3 pt-2">
 <article className="rounded-xl bg-[var(--surface-card)] p-2 shadow-sm">
 <div className="flex items-center gap-2">
 <MiniRing />
 <div>
 <p className="text-[8px] text-[var(--text-muted)]">Calories</p>
 <p className="text-sm font-bold text-[var(--text-primary)]">
 1,240 <span className="text-[9px] font-normal text-[var(--text-muted)]">/ 2,000</span>
 </p>
 </div>
 </div>
 <div className="mt-2 grid grid-cols-2 gap-1.5">
 <MacroMini label="Protein" value={78} color="var(--brand-primary)" />
 <MacroMini label="Carbs" value={120} color="#f97316" />
 </div>
 </article>
 <MealRow emoji="🥣" name="Greek yoghurt & berries" meta="320 kcal · 24g protein" />
 </section>
 </PhoneFrame>
 );
}

function MacroMini({ label, value, color }: { label: string; value: number; color: string }) {
 return (
 <div>
 <div className="mb-0.5 flex justify-between text-[7px] text-[var(--text-muted)]">
 <span>{label}</span>
 <span>{value}g</span>
 </div>
 <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
 <div className="h-full w-[55%] rounded-full" style={{ backgroundColor: color }} />
 </div>
 </div>
 );
}

function MealRow({ emoji, name, meta }: { emoji: string; name: string; meta: string }) {
 return (
 <article className="flex gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-2">
 <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-brand-subtle)] text-base">{emoji}</span>
 <div className="min-w-0 flex-1">
 <p className="truncate text-[10px] font-bold text-[var(--text-primary)]">{name}</p>
 <p className="text-[8px] text-[var(--text-muted)]">{meta}</p>
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
 className={`flex flex-col items-center rounded-lg px-1 py-1 text-[8px] ${
 i === 5 ?"bg-[var(--surface-card)] text-[var(--brand-primary)]" :"text-[var(--text-on-brand-muted)]"
 }`}
 >
 <span>{label}</span>
 <span className="font-bold">{10 + i}</span>
 </span>
 ))}
 </div>
 </section>
 <section className="space-y-1.5 px-2 pb-3 pt-2">
 <p className="text-[7px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Lunch</p>
 <MealRow emoji="🥗" name="Chicken quinoa bowl" meta="485 kcal · 42g P" />
 <p className="text-[7px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Dinner</p>
 <MealRow emoji="🍝" name="Pesto pasta primavera" meta="620 kcal · 28g P" />
 </section>
 </PhoneFrame>
 );
}

function MockGrocery() {
 const items = [
 { name:"Chicken breast", store:"Tesco", checked: true },
 { name:"Greek yoghurt", store:"Aldi", checked: true },
 { name:"Quinoa", store:"Asda", checked: false },
 { name:"Spinach", store:"Tesco", checked: false },
 ] as const;
 const storeColor: Record<string, string> = { Tesco:"#00539f", Asda:"#68a51c", Aldi:"#00005f" };

 return (
 <PhoneFrame label="BiteSync grocery list preview">
 <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 pt-7 pb-2">
 <p className="text-xs font-bold text-[var(--text-primary)]">Grocery list</p>
 <p className="text-[8px] text-[var(--text-muted)]">12 items · Mon–Sun</p>
 </header>
 <ul className="space-y-1 px-2 py-2">
 {items.map((item) => (
 <li
 key={item.name}
 className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
 item.checked ?"border-[var(--border-subtle)] bg-[var(--surface-muted)] opacity-70" :"border-[var(--border-subtle)] bg-[var(--surface-card)]"
 }`}
 >
 <span
 className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[8px] ${
 item.checked ?"border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--text-on-brand)]" :"border-[var(--border-default)]"
 }`}
 >
 {item.checked ?"✓" :""}
 </span>
 <span
 className={`min-w-0 flex-1 truncate text-[9px] font-medium ${
 item.checked ?"text-[var(--text-muted)] line-through" :"text-[var(--text-secondary)]"
 }`}
 >
 {item.name}
 </span>
 <span
 className="rounded px-1 py-0.5 text-[7px] font-bold text-[var(--text-on-brand)]"
 style={{ backgroundColor: storeColor[item.store] }}
 >
 {item.store}
 </span>
 </li>
 ))}
 </ul>
 </PhoneFrame>
 );
}

export function LandingPhoneMockups() {
 return (
 <section className="flex items-end justify-center gap-3 px-4 sm:gap-6" aria-label="App screenshots">
 <div className="mb-0 hidden translate-y-6 sm:block">
 <MockToday />
 </div>
 <div className="z-10 -translate-y-4 scale-105 sm:scale-110">
 <MockPlanner />
 </div>
 <div className="mb-0 hidden translate-y-6 sm:block">
 <MockGrocery />
 </div>
 <div className="sm:hidden">
 <MockPlanner />
 </div>
 </section>
 );
}
