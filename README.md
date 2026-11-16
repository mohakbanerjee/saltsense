# SaltSense

Smart farming for desert soil — GDGoC BPDC Breaking Bytes (A-001).

**Working name:** SaltSense (team may rename).

## What

SaltSense computes the **minimum water** that both meets crop demand **and** flushes enough salt (leaching). Everyone else builds “when to water”; the hidden desert problem is **salt** in the root zone.

## Who

Small UAE farm owners / workers (date palms + vegetable plot). Basic phone, patchy signal, little time.

## Why

In sandy, salty desert soil, under-watering lets salt build up and kill yield; over-watering wastes scarce water. Growers guess. We show a decision and why it beats the usual habit.

## Run

```bash
npm install
npm run dev
```

Tests: `npm test` · Build: `npm run build` · Deploy: Vercel (no paid APIs required for core).

Optional AI leaf check: set `GEMINI_API_KEY` in `.env.local`. App works fully without it.

## Real vs simulated data

| Data | Source | Label in UI |
|------|--------|-------------|
| Weather (temp, humidity, wind, radiation, ET0) | Open-Meteo (Dubai / Al Ain / Liwa) | real weather data (Open-Meteo) |
| Crop coefficients Kc, ET math | FAO-56 | evidence table |
| Salt thresholds, leaching formula | FAO-29 | evidence table |
| Soil moisture / soil EC stream | Seeded simulator | simulated soil sensor data |
| Water cost AED/m³, cheap sensor prices | Demo assumptions | demo assumption badge |

Offline: weather is fetched when online, cached, and a sample JSON is committed under `src/data/`.

## Architecture

```
src/
  app/           # App Router screens (Today, Plots, Why, Compare, Cost, About, Demo, Leaf)
  components/    # UI (decision card, nav, charts wrappers)
  lib/           # Agronomy brain: weather, et, salinity, soil, decision, habit, evidence
  data/          # Cached Open-Meteo sample + demo farm
  store/         # Zustand + localStorage / IndexedDB persistence
  i18n/          # EN / AR strings for decision card
  sw/            # Service worker (PWA, offline)
```

Team hooks: `src/lib/crops.ts`, `src/lib/evidence.ts`, `src/lib/flags.ts`, `TEAM_IDEAS.md`.

## Design

Earthy desert palette (sand, date brown, deep green, water blue). High contrast, big touch targets, sunlight-readable, icons + text.

## Docs

- `TODO_TEAM.md` — blockers and leftovers
- `TEAM_IDEAS.md` — Mohak / Saachi inputs
- `AI_USAGE.md` — Cursor-generated code; idea/decisions by the team
