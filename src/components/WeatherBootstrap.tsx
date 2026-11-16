/** Fetch Open-Meteo on load when online; fall back to cached sample. */
"use client";

import { useEffect } from "react";
import { fetchWeather } from "@/lib/weather";
import { useFarmStore } from "@/store/farm-store";

export function WeatherBootstrap() {
  const site = useFarmStore((s) => s.settings.site);
  const setWeather = useFarmStore((s) => s.setWeather);

  useEffect(() => {
    let cancelled = false;
    fetchWeather(site).then((bundle) => {
      if (!cancelled) setWeather(bundle);
    });
    return () => {
      cancelled = true;
    };
  }, [site, setWeather]);

  return null;
}
