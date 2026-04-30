import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />
      <div className="flex w-full flex-1 flex-col">
        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
