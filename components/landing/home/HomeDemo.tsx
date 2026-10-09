"use client";

import { useEffect, useRef, useState } from "react";

const STEP_MS = 5000;

const STEPS = [
  {
    title: "Plan your week",
    body: "Fill the week from your recipes — daily calories and protein update as you go.",
  },
  {
    title: "Get one grocery list",
    body: "A merged shopping list from that exact week. Check items off as you shop.",
  },
  {
    title: "Hit your targets",
    body: "Today shows your calorie ring, macro bars and every meal against your goals.",
  },
  {
    title: "Spot micronutrient gaps",
    body: "See what your week is missing — iron, iodine, vitamin D — against UK reference values.",
    pro: true,
  },
] as const;

function Bar({
  label,
  width,
  value,
  low = false,
  order,
}: {
  label: string;
  width: string;
  value: string;
  low?: boolean;
  /** Position in the list: each bar starts a beat after the one above. */
  order: number;
}) {
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className="bar">
        <i
          className={low ? "low" : undefined}
          style={{ ["--w" as string]: width, transitionDelay: `${order * 110}ms` }}
        />
      </div>
      <span>{value}</span>
    </div>
  );
}

/** The example content behind each step. Illustrative figures, labelled as an example where it matters. */
function Screen({ step }: { step: number }) {
  if (step === 0) {
    return (
      <>
        <h4>Example week</h4>
        <div className="list-row"><b>Mon</b><span>Porridge · Turkey bowl · Cod &amp; quinoa · Eggs</span></div>
        <div className="list-row"><b>Tue</b><span>Porridge · Turkey &amp; potatoes · Chicken bowl · Eggs</span></div>
        <div className="list-row"><b>Wed</b><span>Eggs on toast · Lentil curry · Turkey &amp; potato · Yoghurt pot</span></div>
        <div className="list-row"><b>Thu</b><span>Overnight oats · Cod &amp; quinoa · Chicken bowl · Seeds</span></div>
        <div className="note">Every day lands within your calorie band, with protein on target.</div>
      </>
    );
  }
  if (step === 1) {
    return (
      <>
        <h4>Grocery list</h4>
        <div className="list-row"><span><i className="tick done" />Chicken breast</span><b>600 g</b></div>
        <div className="list-row"><span><i className="tick done" />Porridge oats</span><b>320 g</b></div>
        <div className="list-row"><span><i className="tick" />Sweet potatoes</span><b>900 g</b></div>
        <div className="list-row"><span><i className="tick" />Cod fillets</span><b>2 × 150 g</b></div>
        <div className="list-row"><span><i className="tick" />Broccoli</span><b>1 head</b></div>
        <div className="note">Already have rice in the cupboard? Pantry items are skipped.</div>
      </>
    );
  }
  if (step === 2) {
    return (
      <>
        <h4>Today</h4>
        <div className="today-demo">
          <div className="big-ring">
            <div>
              <span>
                <b>2,004</b>
                <small>of 2,200 kcal</small>
              </span>
            </div>
          </div>
          <div className="bars">
            <Bar order={0} label="Protein" width="96%" value="134 g" />
            <Bar order={1} label="Carbs" width="88%" value="231 g" />
            <Bar order={2} label="Fat" width="84%" value="62 g" />
            <Bar order={3} label="Fibre" width="100%" value="33 g" />
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <h4>This week&apos;s micronutrients</h4>
      <div className="bars">
        <Bar order={0} label="Iron" width="72%" value="72%" low />
        <Bar order={1} label="Iodine" width="64%" value="64%" low />
        <Bar order={2} label="Vitamin D" width="38%" value="38%" low />
        <Bar order={3} label="Calcium" width="96%" value="96%" />
        <Bar order={4} label="Vitamin C" width="100%" value="100%+" />
      </div>
      <div className="note">
        Example week. Low on iodine? Snacks like yoghurt or milk can be prioritised next time you plan.
      </div>
    </>
  );
}

/**
 * Four steps that advance on their own every five seconds, with a progress bar
 * on the open step. Stops for good once someone picks a step, and never runs
 * for people who prefer reduced motion.
 */
export function HomeDemo() {
  const [step, setStep] = useState(0);
  // The step whose bars have been told to grow. A newly opened step renders
  // with its bars at zero (this still points at the old step), and only gets
  // the "play" class after that zero width has been painted — otherwise the
  // bars appear already full and never visibly move.
  const [playedStep, setPlayedStep] = useState<number | null>(null);
  const [auto, setAuto] = useState(true);
  const progressRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAuto(false);
  }, []);

  // Bars and ring grow from zero each time a step opens: paint at zero first.
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setPlayedStep(step));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [step]);

  useEffect(() => {
    // The bar is driven directly, not through state, so it doesn't re-render
    // the demo sixty times a second; it is reset by hand when the step moves on.
    const bar = progressRef.current;
    if (!auto || !bar) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / STEP_MS, 1);
      bar.style.width = `${p * 100}%`;
      if (p >= 1) setStep((s) => (s + 1) % STEPS.length);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      bar.style.width = "0";
    };
  }, [auto, step]);

  return (
    <div className="demo lp-reveal">
      <div className="tabs" role="tablist" aria-label="How BiteSync works">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            id={`how-tab-${i}`}
            aria-selected={step === i}
            aria-controls="how-panel"
            className="tab"
            onClick={() => {
              setAuto(false);
              setStep(i);
            }}
          >
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <h3>
              {s.title}
              {"pro" in s && s.pro ? <span className="pro-chip">PRO</span> : null}
            </h3>
            <p>{s.body}</p>
            <span className="progress" ref={step === i ? progressRef : undefined} style={{ width: 0 }} aria-hidden />
          </button>
        ))}
      </div>
      <div className="panel" role="tabpanel" id="how-panel" aria-labelledby={`how-tab-${step}`}>
        <div key={step} className={`screen${playedStep === step ? " play" : ""}`}>
          <Screen step={step} />
        </div>
      </div>
    </div>
  );
}
