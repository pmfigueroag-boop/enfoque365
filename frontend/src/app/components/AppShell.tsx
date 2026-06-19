"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import PlanIndicator from "./PlanIndicator";

const NO_SIDEBAR_ROUTES = ["/onboarding"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = NO_SIDEBAR_ROUTES.some((r) => pathname.startsWith(r));

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh" }}>
        <header style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "8px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.15)",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}>
          <PlanIndicator />
        </header>
        <main className="main-content" style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
