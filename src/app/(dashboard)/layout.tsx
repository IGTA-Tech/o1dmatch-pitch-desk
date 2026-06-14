import { TopBar } from "@/components/pitch-desk/top-bar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <TopBar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
