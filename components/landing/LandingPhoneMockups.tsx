import { PhoneFrame } from "@/components/landing/PhoneFrame";

function MiniRing() {
  const size = 44;
  const r = 16;
  const c = 2 * Math.PI * r;
  const p = 0.62;
  const half = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden>
      <circle cx={half} cy={half} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} />
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke="#3a5a40"
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
      <section className="bg-gradient-to-b from-[#3a5a40] to-[#4a7a50] px-3 pt-7 pb-3">
        <p className="text-[9px] text-white/70">Saturday, 16 May</p>
        <p className="text-xs font-bold text-white">Your Goals</p>
      </section>
      <section className="space-y-2 px-2 pb-3 pt-2">
        <article className="rounded-xl bg-white p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <MiniRing />
            <div>
              <p className="text-[8px] text-gray-400">Calories</p>
              <p className="text-sm font-bold text-gray-900">
                1,240 <span className="text-[9px] font-normal text-gray-400">/ 2,000</span>
              </p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <MacroMini label="Protein" value={78} color="#3a5a40" />
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
      <div className="mb-0.5 flex justify-between text-[7px] text-gray-500">
        <span>{label}</span>
        <span>{value}g</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full w-[55%] rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

function MealRow({ emoji, name, meta }: { emoji: string; name: string; meta: string }) {
  return (
    <article className="flex gap-2 rounded-lg border border-gray-100 bg-white p-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f7f0] text-base">{emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-bold text-gray-900">{name}</p>
        <p className="text-[8px] text-gray-400">{meta}</p>
      </div>
    </article>
  );
}

export function MockPlanner() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <PhoneFrame label="BiteSync weekly planner preview">
      <section className="bg-gradient-to-b from-[#3a5a40] to-[#4a7a50] px-2 pt-7 pb-2">
        <p className="text-xs font-bold text-white">Weekly Plan</p>
        <div className="mt-2 flex gap-1">
          {days.map((label, i) => (
            <span
              key={`${label}-${i}`}
              className={`flex flex-col items-center rounded-lg px-1 py-1 text-[8px] ${
                i === 5 ? "bg-white text-[#3a5a40]" : "text-white/70"
              }`}
            >
              <span>{label}</span>
              <span className="font-bold">{10 + i}</span>
            </span>
          ))}
        </div>
      </section>
      <section className="space-y-1.5 px-2 pb-3 pt-2">
        <p className="text-[7px] font-bold uppercase tracking-wide text-gray-400">Lunch</p>
        <MealRow emoji="🥗" name="Chicken quinoa bowl" meta="485 kcal · 42g P" />
        <p className="text-[7px] font-bold uppercase tracking-wide text-gray-400">Dinner</p>
        <MealRow emoji="🍝" name="Pesto pasta primavera" meta="620 kcal · 28g P" />
      </section>
    </PhoneFrame>
  );
}

function MockGrocery() {
  const items = [
    { name: "Chicken breast", store: "Tesco", checked: true },
    { name: "Greek yoghurt", store: "Aldi", checked: true },
    { name: "Quinoa", store: "Asda", checked: false },
    { name: "Spinach", store: "Tesco", checked: false },
  ] as const;
  const storeColor: Record<string, string> = { Tesco: "#00539f", Asda: "#68a51c", Aldi: "#00005f" };

  return (
    <PhoneFrame label="BiteSync grocery list preview">
      <header className="border-b border-gray-100 bg-white px-3 pt-7 pb-2">
        <p className="text-xs font-bold text-gray-900">Grocery list</p>
        <p className="text-[8px] text-gray-400">12 items · Mon–Sun</p>
      </header>
      <ul className="space-y-1 px-2 py-2">
        {items.map((item) => (
          <li
            key={item.name}
            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
              item.checked ? "border-gray-100 bg-gray-50 opacity-70" : "border-gray-100 bg-white"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[8px] ${
                item.checked ? "border-[#3a5a40] bg-[#3a5a40] text-white" : "border-gray-300"
              }`}
            >
              {item.checked ? "✓" : ""}
            </span>
            <span
              className={`min-w-0 flex-1 truncate text-[9px] font-medium ${
                item.checked ? "text-gray-400 line-through" : "text-gray-800"
              }`}
            >
              {item.name}
            </span>
            <span
              className="rounded px-1 py-0.5 text-[7px] font-bold text-white"
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
