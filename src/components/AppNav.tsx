/** Bottom nav — big targets, icons + text, mobile first. */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FLAGS } from "@/lib/flags";
import { useFarmStore } from "@/store/farm-store";
import { t } from "@/i18n/strings";

const LINKS = [
  { href: "/", key: "today" as const, icon: "💧" },
  { href: "/plots", key: "plots" as const, icon: "🪴" },
  { href: "/why", key: "why" as const, icon: "❓" },
  { href: "/compare", key: "compare" as const, icon: "📊" },
  { href: "/cost", key: "cost" as const, icon: "💰", flag: "costPage" as const },
  { href: "/demo", key: "demo" as const, icon: "🎬", flag: "runDemo" as const },
  { href: "/about", key: "about" as const, icon: "ℹ️" },
];

export function AppNav() {
  const pathname = usePathname();
  const locale = useFarmStore((s) => s.settings.locale);
  const s = t(locale);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t-2 border-[color-mix(in_srgb,var(--date-brown)_20%,transparent)] bg-[color-mix(in_srgb,white_88%,var(--sand))] backdrop-blur-md"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 overflow-x-auto px-1 py-1">
        {LINKS.filter((l) => !("flag" in l) || FLAGS[l.flag!]).map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href} className="flex-1 min-w-[3.2rem]">
              <Link
                href={link.href}
                className={`touch-btn flex flex-col items-center justify-center gap-0.5 px-1 text-[0.65rem] ${
                  active
                    ? "bg-[color-mix(in_srgb,var(--deep-green)_18%,white)] text-green"
                    : "text-muted"
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {link.icon}
                </span>
                <span>{s[link.key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
