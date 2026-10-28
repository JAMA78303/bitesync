import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();

 const adminIds = (process.env.ADMIN_USER_ID ??"")
 .split(",")
 .map((v) => v.trim())
 .filter(Boolean);

 if (!user || !adminIds.includes(user.id)) {
 redirect("/planner");
 }

 return (
 <div className="min-h-screen bg-[var(--surface-muted)]">
 <nav className="flex items-center justify-between bg-[var(--admin-nav-bg)] px-6 py-4 text-[var(--text-on-brand)]">
 <div className="flex items-center gap-3">
 <span className="font-semibold">BiteSync Admin</span>
 <span className="rounded-full bg-[var(--surface-overlay)]/20 px-2 py-0.5 text-xs">Internal only</span>
 </div>
 <div className="flex items-center gap-4 text-xs">
 <Link href="/admin/nutrition" className="text-[var(--text-on-brand-muted)] hover:text-[var(--text-on-brand)]">
 Nutrition
 </Link>
 <Link href="/admin/macro-recompute" className="text-[var(--text-on-brand-muted)] hover:text-[var(--text-on-brand)]">
 Macro recompute
 </Link>
 <Link href="/admin/ai-visits" className="text-[var(--text-on-brand-muted)] hover:text-[var(--text-on-brand)]">
 AI visits
 </Link>
 <Link href="/admin/halal-waitlist" className="text-[var(--text-on-brand-muted)] hover:text-[var(--text-on-brand)]">
 Halal waitlist
 </Link>
 <Link href="/planner" className="text-[var(--text-on-brand-muted)] hover:text-[var(--text-on-brand)]">
 ← App
 </Link>
 </div>
 </nav>
 <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
 </div>
 );
}
