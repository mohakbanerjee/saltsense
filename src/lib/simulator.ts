/** Seeded realistic soil sensor stream for the demo farm. */
export type SensorReading = {
  date: string;
  moisturePct: number;
  soilEcDsM: number;
  soilTempC: number;
  sensorAlive: boolean;
};

export type ScenarioId = "normal" | "heatwave" | "brackish_rising" | "sensor_dropout";

export type Scenario = {
  id: ScenarioId;
  nameEn: string;
  nameAr: string;
  description: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "normal",
    nameEn: "Normal",
    nameAr: "عادي",
    description: "Typical Al Ain week — simulated soil sensors.",
  },
  {
    id: "heatwave",
    nameEn: "Heatwave",
    nameAr: "موجة حر",
    description: "ET and soil temp spike; plan should water earlier / enough.",
  },
  {
    id: "brackish_rising",
    nameEn: "Well getting saltier",
    nameAr: "بئر يزداد ملوحة",
    description: "Irrigation water EC rises day by day — leaching share grows.",
  },
  {
    id: "sensor_dropout",
    nameEn: "Sensor dies",
    nameAr: "تعطل الحساس",
    description: "Falls back to weather + model; confidence drops.",
  },
];

/** Mulberry32 seeded PRNG for repeatable demos. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function irrigationEcForScenario(
  scenario: ScenarioId,
  dayIndex: number,
  baseEc: number,
): number {
  if (scenario === "brackish_rising") {
    return baseEc + dayIndex * 0.05;
  }
  return baseEc;
}

export function et0Multiplier(scenario: ScenarioId): number {
  return scenario === "heatwave" ? 1.35 : 1;
}

/**
 * Generate simulated soil sensor readings (label: simulated soil sensor data).
 */
export function simulateSensorStream(
  dates: string[],
  scenario: ScenarioId = "normal",
  seed = 42,
): SensorReading[] {
  const rand = mulberry32(seed);
  return dates.map((date, i) => {
    const dropout =
      scenario === "sensor_dropout" && i >= Math.floor(dates.length * 0.4);
    if (dropout) {
      return {
        date,
        moisturePct: 0,
        soilEcDsM: 0,
        soilTempC: 0,
        sensorAlive: false,
      };
    }
    const heat = scenario === "heatwave" ? 6 : 0;
    const saltBump = scenario === "brackish_rising" ? i * 0.04 : 0;
    return {
      date,
      moisturePct: Math.round((28 + rand() * 18 - (scenario === "heatwave" ? 8 : 0)) * 10) / 10,
      soilEcDsM: Math.round((2.2 + rand() * 0.8 + saltBump) * 100) / 100,
      soilTempC: Math.round((29 + rand() * 6 + heat) * 10) / 10,
      sensorAlive: true,
    };
  });
}

export const SENSOR_DATA_LABEL = "simulated soil sensor data" as const;
