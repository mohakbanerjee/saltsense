/** Open-Meteo fetch + cache + offline fallback for UAE demo sites. */
import sampleAlain from "@/data/weather-alain-sample.json";

export type FarmSite = "dubai" | "al_ain" | "liwa";

export type DailyWeather = {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  humidityMean: number;
  windMaxKmh: number;
  radiationMj: number;
  et0Mm: number;
};

export type WeatherBundle = {
  site: FarmSite;
  source: "open-meteo-live" | "open-meteo-cached-sample";
  label: "real weather data (Open-Meteo)";
  fetchedAt: string;
  daily: DailyWeather[];
};

const SITES: Record<FarmSite, { lat: number; lon: number; name: string }> = {
  dubai: { lat: 25.2, lon: 55.27, name: "Dubai" },
  al_ain: { lat: 24.21, lon: 55.74, name: "Al Ain" },
  liwa: { lat: 23.13, lon: 53.78, name: "Liwa" },
};

const CACHE_KEY = "saltsense-weather-v1";

function parseOpenMeteo(json: typeof sampleAlain, site: FarmSite, source: WeatherBundle["source"]): WeatherBundle {
  const d = json.daily;
  const daily: DailyWeather[] = d.time.map((date, i) => ({
    date,
    tempMaxC: d.temperature_2m_max[i] ?? 0,
    tempMinC: d.temperature_2m_min[i] ?? 0,
    humidityMean: d.relative_humidity_2m_mean[i] ?? 0,
    windMaxKmh: d.wind_speed_10m_max[i] ?? 0,
    radiationMj: d.shortwave_radiation_sum[i] ?? 0,
    et0Mm: d.et0_fao_evapotranspiration[i] ?? 0,
  }));
  return {
    site,
    source,
    label: "real weather data (Open-Meteo)",
    fetchedAt: json.daily.time[json.daily.time.length - 1] ?? "cached",
    daily,
  };
}

export function offlineWeatherSample(site: FarmSite = "al_ain"): WeatherBundle {
  return parseOpenMeteo(sampleAlain, site, "open-meteo-cached-sample");
}

function readCache(): WeatherBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WeatherBundle;
  } catch {
    return null;
  }
}

function writeCache(bundle: WeatherBundle): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(bundle));
  } catch {
    /* quota — ignore */
  }
}

export async function fetchWeather(site: FarmSite = "al_ain"): Promise<WeatherBundle> {
  const { lat, lon } = SITES[site];
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max,shortwave_radiation_sum,et0_fao_evapotranspiration` +
    `&timezone=Asia%2FDubai&past_days=30&forecast_days=7`;

  try {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return readCache() ?? offlineWeatherSample(site);
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const json = (await res.json()) as typeof sampleAlain;
    const bundle = parseOpenMeteo(json, site, "open-meteo-live");
    writeCache(bundle);
    return bundle;
  } catch {
    return readCache() ?? offlineWeatherSample(site);
  }
}

export function siteName(site: FarmSite): string {
  return SITES[site].name;
}

export function listSites(): FarmSite[] {
  return ["dubai", "al_ain", "liwa"];
}

/**
 * Pick a day from the bundle. Prefer an explicit ISO date; otherwise the
 * last day in the series (avoids `new Date()` during prerender).
 */
export function todayWeather(bundle: WeatherBundle, dateISO?: string): DailyWeather {
  if (dateISO) {
    const hit = bundle.daily.find((d) => d.date === dateISO);
    if (hit) return hit;
  }
  return bundle.daily[bundle.daily.length - 1]!;
}

/** Client-only: resolve calendar today against the bundle when available. */
export function resolveTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
