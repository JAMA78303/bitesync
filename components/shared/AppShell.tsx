import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { Logo } from "@/components/shared/Logo";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />
      <div className="flex w-full flex-1 flex-col">
        <header className="border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <Logo size="sm" href="/planner" />
        </header>
        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
