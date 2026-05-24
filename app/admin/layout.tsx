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

  const adminIds = (process.env.ADMIN_USER_ID ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  if (!user || !adminIds.includes(user.id)) {
    redirect("/planner");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="flex items-center justify-between bg-[#1A4731] px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <span className="font-semibold">BiteSync Admin</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">Internal only</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Link href="/admin/prices" className="text-green-200 hover:text-white">
            Prices
          </Link>
          <Link href="/admin/nutrition" className="text-green-200 hover:text-white">
            Nutrition
          </Link>
          <Link href="/planner" className="text-green-200 hover:text-white">
            ← App
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
