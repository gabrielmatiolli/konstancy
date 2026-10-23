import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { RegistrarServiceWorker } from "@/componentes/RegistrarServiceWorker";
import "./globals.css";

// Fonte variável servida pelo próprio app (sem Google em runtime): o mesmo
// desenho em todo sistema, inclusive Android antigo sem fontes modernas.
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Konstancy", template: "%s · Konstancy" },
  description: "Check-ins diários de atividade física em família.",
  applicationName: "Konstancy",
  appleWebApp: { capable: true, title: "Konstancy", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1110" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${figtree.variable} h-full`}>
      <body className="min-h-full">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
