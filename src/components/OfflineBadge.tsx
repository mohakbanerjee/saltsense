/** Shows online / offline status for desert weak-connectivity demos. */
"use client";

import { useEffect, useState } from "react";
import { useFarmStore } from "@/store/farm-store";
import { t } from "@/i18n/strings";

export function OfflineBadge() {
  const locale = useFarmStore((s) => s.settings.locale);
  const s = t(locale);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <span className={`badge ${online ? "badge-ok" : "badge-off"}`} aria-live="polite">
      <span aria-hidden>{online ? "📶" : "📴"}</span>
      {online ? s.online : s.offline}
    </span>
  );
}
