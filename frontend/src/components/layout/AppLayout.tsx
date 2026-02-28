import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[230px] flex flex-col transition-all duration-300">
        <TopNavbar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
