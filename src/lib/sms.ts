/** Pack the daily decision into one SMS (≤160 chars) + WhatsApp share. */
import type { DecisionResult } from "./types";
import { getCrop } from "./crops";
import type { Plot } from "./types";

export function decisionSms(plot: Plot, d: DecisionResult): string {
  const crop = getCrop(plot.cropId);
  const amount =
    d.litersPerPlant !== null
      ? `${Math.round(d.litersPerPlant)}L ea`
      : `${d.mmPerPlot}mm`;
  const salt =
    d.saltRiskIfHabit === "low"
      ? "Salt ok"
      : d.saltRiskIfHabit === "medium"
        ? "Salt watch"
        : "Salt high if usual";
  const saved =
    d.waterSavedVsHabitLiters > 0
      ? ` Saved ${Math.round(d.waterSavedVsHabitLiters)}L vs usual.`
      : d.waterSavedVsHabitLiters < 0
        ? ` +${Math.abs(Math.round(d.waterSavedVsHabitLiters))}L for leach.`
        : "";
  let msg = `${plot.name} ${crop.nameEn}: ${amount} ${d.bestTimeStart}. ${salt}.${saved}`;
  if (msg.length > 160) {
    msg = msg.slice(0, 157) + "...";
  }
  return msg;
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
