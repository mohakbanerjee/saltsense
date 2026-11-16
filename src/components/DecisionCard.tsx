/** One big decision card per plot — amount, time, why, habit comparison. */
"use client";

import { useMemo, useState } from "react";
import { getCrop } from "@/lib/crops";
import type { DecisionResult, Plot } from "@/lib/types";
import { decisionSms, whatsappShareUrl } from "@/lib/sms";
import { FLAGS } from "@/lib/flags";
import { useFarmStore } from "@/store/farm-store";
import { t } from "@/i18n/strings";

type Props = {
  plot: Plot;
  decision: DecisionResult;
};

export function DecisionCard({ plot, decision: d }: Props) {
  const locale = useFarmStore((s) => s.settings.locale);
  const setLocale = useFarmStore((s) => s.setLocale);
  const logDone = useFarmStore((s) => s.logDone);
  const s = t(locale);
  const crop = getCrop(plot.cropId);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const sms = useMemo(() => decisionSms(plot, d), [plot, d]);

  const amountLabel =
    d.litersPerPlant !== null
      ? `${Math.round(d.litersPerPlant)} L`
      : `${d.mmPerPlot} mm`;
  const unitLabel =
    d.litersPerPlant !== null
      ? plot.cropId === "date_palm"
        ? s.perPalm
        : s.perPlant
      : s.mmPlot;

  const riskLabel =
    d.saltRiskIfHabit === "low"
      ? s.low
      : d.saltRiskIfHabit === "medium"
        ? s.medium
        : s.high;

  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const text =
      locale === "ar"
        ? `${s.water} ${amountLabel} ${unitLabel}. ${d.bestTimeStart}.`
        : `${s.water} ${amountLabel} ${unitLabel}, ${d.bestTimeStart} to ${d.bestTimeEnd}. ${sms}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale === "ar" ? "ar-AE" : "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  return (
    <article className="card-panel p-4 sm:p-5" dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-muted">
            <span aria-hidden className="mr-1">
              {crop.icon}
            </span>
            {plot.name}
          </p>
          <h2 className="mt-1 text-3xl font-black leading-tight text-date sm:text-4xl">
            {s.water} {amountLabel}
            <span className="mt-1 block text-lg font-bold text-green sm:text-xl">
              {unitLabel}
            </span>
          </h2>
          <p className="mt-2 text-lg font-bold text-water">
            {d.bestTimeStart} – {d.bestTimeEnd}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {FLAGS.arabic && (
            <button
              type="button"
              className="touch-btn border-2 border-date/20 bg-white/70 px-3 text-sm"
              onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            >
              {locale === "en" ? "العربية" : "English"}
            </button>
          )}
          <span className="badge">
            {s.confidence} {Math.round(d.confidence * 100)}%
          </span>
        </div>
      </header>

      {d.sensorFallback && (
        <p className="badge badge-warn mb-3">{s.sensorFallback}</p>
      )}

      <div className="mb-3 rounded-xl bg-[color-mix(in_srgb,var(--water-blue)_10%,white)] p-3">
        <p className="text-sm font-semibold text-muted">{s.yourUsual}</p>
        <p className="text-lg font-bold">
          {Math.round(d.habitLiters / Math.max(plot.plantCount, 1))}
          {plot.habit.usesPlants ? " L" : " mm"} {s.atNoon} {d.habitTime}
        </p>
        <p
          className={`mt-1 font-bold ${
            d.waterSavedVsHabitLiters >= 0 ? "text-ok" : "text-warn"
          }`}
        >
          {d.waterSavedVsHabitLiters >= 0
            ? `↓ ${Math.abs(Math.round(d.waterSavedVsHabitLiters))} L ${s.saved}`
            : `↑ ${Math.abs(Math.round(d.waterSavedVsHabitLiters))} L ${s.extraForSalt}`}
        </p>
        <p className="mt-1 text-sm">
          {s.saltRisk}:{" "}
          <strong
            className={
              d.saltRiskIfHabit === "high"
                ? "text-danger"
                : d.saltRiskIfHabit === "medium"
                  ? "text-warn"
                  : "text-ok"
            }
          >
            {riskLabel}
          </strong>
        </p>
      </div>

      <button
        type="button"
        className="mb-2 w-full text-left text-sm font-bold text-date underline"
        onClick={() => setOpen((v) => !v)}
      >
        {s.whyExpand}
      </button>
      {open && (
        <ul className="mb-3 space-y-2 rounded-xl bg-white/60 p-3 text-sm">
          {d.reasons.map((r) => (
            <li key={r.text}>
              {r.text}
              {r.evidenceIds.length > 0 && (
                <span className="mt-0.5 block text-xs text-muted">
                  [{r.evidenceIds.join(", ")}]
                </span>
              )}
            </li>
          ))}
          <li className="text-xs text-muted">
            {d.dataLabels.join(" · ")}
          </li>
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="touch-btn flex-1 bg-green px-4 text-white disabled:opacity-60"
          disabled={done}
          onClick={() => {
            logDone(plot.id, d.totalLiters, d.totalLiters);
            setDone(true);
          }}
        >
          {done ? `✓ ${s.done}` : s.done}
        </button>
        <button
          type="button"
          className="touch-btn flex-1 border-2 border-date/30 bg-white/80 px-4"
          onClick={speak}
        >
          🔊 {s.readAloud}
        </button>
      </div>

      {FLAGS.smsSummary && (
        <div className="mt-3 rounded-xl border border-dashed border-date/30 p-3 text-sm">
          <p className="font-bold">{s.sms}</p>
          <p className="mt-1 font-mono text-xs leading-relaxed">{sms}</p>
          <p className="mt-1 text-xs text-muted">{sms.length}/160</p>
          <a
            className="touch-btn mt-2 inline-flex items-center bg-water px-4 text-white"
            href={whatsappShareUrl(sms)}
            target="_blank"
            rel="noreferrer"
          >
            {s.shareWa}
          </a>
        </div>
      )}
    </article>
  );
}
