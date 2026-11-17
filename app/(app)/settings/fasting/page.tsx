import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FastingSettingsForm } from "@/components/fasting/FastingSettingsForm";
import { fastingModeVisible } from "@/lib/fasting/access";
import { expectedRamadan, FASTING_PRESETS, presetDates } from "@/lib/fasting/hijri";
import { getFastingSettings } from "@/lib/fasting/server";
import { createClient } from "@/lib/supabase/server";
import { toLocalISO } from "@/lib/utils/dates";
import { ds } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function FastingSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!fastingModeVisible(user.id)) notFound();

  const settings = await getFastingSettings(supabase, user.id);
  const today = toLocalISO(new Date());
  const ramadan = expectedRamadan(today);
  const presets = FASTING_PRESETS.map((p) => ({ ...p, dates: presetDates(p.id, today) }));

  return (
    <div className={`${ds.mobilePage} ${ds.pageContent}`}>
      <div className={ds.gradientHeaderCompact}>
        <Link
          href="/settings"
          className={`mb-3 inline-flex min-h-8 items-center text-sm font-semibold ${ds.pageSubtitle} hover:text-[var(--text-on-header)]`}
        >
          ← Settings
        </Link>
        <span className={ds.kicker}>FASTING</span>
        <h1 className={`mb-1.5 ${ds.pageTitle}`}>Ramadan &amp; fasting days</h1>
        <p className={ds.pageSubtitle}>Suhoor, iftar and a late snack that still hit your protein.</p>
      </div>
      <div className={`${ds.mobileGutter} ${ds.overlap} pt-2`}>
        <FastingSettingsForm initial={settings} expectedRamadan={ramadan} presets={presets} todayISO={today} />
      </div>
    </div>
  );
}
