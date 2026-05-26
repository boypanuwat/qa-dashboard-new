import { Sidebar } from "@/components/dashboard/sidebar";
import { requireAuth } from "@/lib/auth-helpers";
import { ConfigAlertBanner } from "@/components/config-alert-banner";

export default async function TestCyclesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Require authentication - will redirect to login if not authenticated
  await requireAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <ConfigAlertBanner />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
