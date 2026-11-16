/** Root layout — PWA metadata, desert fonts, app chrome. */
import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { OfflineBadge } from "@/components/OfflineBadge";
import { PwaRegister } from "@/components/PwaRegister";
import { WeatherBootstrap } from "@/components/WeatherBootstrap";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "SaltSense — Smart farming for the desert",
  description:
    "Minimum water that meets crop demand and flushes salt. Built for small UAE farms.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SaltSense",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#5C3A1E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full pb-24 font-[family-name:var(--font-body)] antialiased">
        <PwaRegister />
        <WeatherBootstrap />
        <header className="sticky top-0 z-30 border-b border-[color-mix(in_srgb,var(--date-brown)_15%,transparent)] bg-[color-mix(in_srgb,var(--sand)_85%,white)]/90 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-date-soft">
                Breaking Bytes A-001
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-black text-date">
                SaltSense
              </h1>
            </div>
            <OfflineBadge />
          </div>
        </header>
        <main className="mx-auto w-full max-w-lg px-4 py-4">{children}</main>
        <AppNav />
      </body>
    </html>
  );
}
