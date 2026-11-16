/** Registers the SaltSense service worker for offline-first use. */
"use client";

import { useEffect } from "react";
import { armOnlineFlush } from "@/lib/sync-queue";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* demo still works without SW */
    });
    return armOnlineFlush();
  }, []);
  return null;
}
