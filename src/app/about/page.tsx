/** About — angle, audience, data labels, evidence table, privacy, AI. */
"use client";

import Link from "next/link";
import { evidenceList } from "@/lib/evidence";
import { FLAGS } from "@/lib/flags";

export default function AboutPage() {
  const evidence = evidenceList();

  return (
    <div className="space-y-4">
      <section className="card-panel space-y-3 p-4">
        <h2 className="text-2xl font-black text-date">About SaltSense</h2>
        <p>
          <strong>Problem inside the problem:</strong> not just “when to water”,
          but how much water flushes <em>salt</em> without wasting the desert&apos;s
          scarce supply.
        </p>
        <p>
          <strong>Who:</strong> small UAE farm owners / workers — date palms plus
          a vegetable plot, basic phone, patchy signal, little time.
        </p>
        <p>
          <strong>Privacy:</strong> farm data stays on the phone (localStorage /
          cache). No account required for the core demo.
        </p>
        <p>
          <strong>AI:</strong> optional leaf check only if{" "}
          <code>GEMINI_API_KEY</code> is set. Core decisions are rule-based
          (FAO-56 / FAO-29). See <code>AI_USAGE.md</code>.
        </p>
        {FLAGS.leafAi && (
          <Link className="touch-btn inline-flex bg-water px-4 text-white" href="/leaf">
            Leaf check
          </Link>
        )}
      </section>

      <section className="card-panel space-y-2 p-4">
        <h3 className="text-lg font-bold">Real vs simulated</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Weather / ET0 — real weather data (Open-Meteo)</li>
          <li>Soil moisture / soil EC stream — simulated soil sensor data</li>
          <li>Crop Kc, salt thresholds, LR formula — FAO evidence table</li>
          <li>Prices / some depths — demo assumptions</li>
        </ul>
      </section>

      <section className="card-panel p-4">
        <h3 className="mb-3 text-lg font-bold">Evidence</h3>
        <div className="max-h-96 space-y-3 overflow-y-auto text-sm">
          {evidence.map((e) => (
            <article key={e.id} className="rounded-lg bg-white/60 p-3">
              <p className="font-mono text-xs text-muted">{e.id}</p>
              <p className="font-bold">
                {e.value} {e.unit}
              </p>
              <p>{e.meaning}</p>
              {e.demoAssumption ? (
                <p className="badge badge-warn mt-1">demo assumption</p>
              ) : e.sourceUrl ? (
                <a
                  className="mt-1 inline-block text-water underline"
                  href={e.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {e.sourceTitle}
                </a>
              ) : (
                <p className="text-muted">{e.sourceTitle}</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
