import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { Logo } from "@/components/shared/Logo";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Sidebar />
      <div className="flex w-full flex-1 flex-col">
        <header className="border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <Logo size="sm" href="/today" />
        </header>
        <main className="page-content flex-1 p-4 md:p-8 md:pb-8">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
