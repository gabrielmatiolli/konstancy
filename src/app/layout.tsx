import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { RegistrarServiceWorker } from "@/componentes/RegistrarServiceWorker";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Saúde Check", template: "%s · Saúde Check" },
  description: "Check-ins diários de atividade física em família.",
  applicationName: "Saúde Check",
  appleWebApp: { capable: true, title: "Saúde Check", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
