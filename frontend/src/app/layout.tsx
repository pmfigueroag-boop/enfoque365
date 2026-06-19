import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./components/AppShell";
import { ToastProvider } from "./components/Toast";

export const metadata: Metadata = {
  title: "ENFOQUE 365 - Planificacion Estrategica Institucional",
  description: "Sistema de Planificacion Estrategica como Servicio (StaaS) para instituciones gubernamentales y corporativas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
