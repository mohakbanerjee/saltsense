/** Optional leaf photo check — Gemini if keyed, else symptom checklist. */
"use client";

import { useState } from "react";
import { FLAGS } from "@/lib/flags";
import Link from "next/link";

const CHECKLIST = [
  {
    id: "salt",
    label: "Leaf tips / margins scorched, older leaves first",
    advice:
      "Likely salt burn — raise leaching share; check water EC with a cheap meter. See Today decision.",
  },
  {
    id: "heat",
    label: "Sudden wilt in midday heat, recovers evening",
    advice:
      "Likely heat stress — keep early-morning irrigation; do not skip water on heatwave days.",
  },
  {
    id: "water",
    label: "Whole plant droops, soil very dry, young leaves soft",
    advice:
      "Likely water stress — follow today’s liter target; sandy soil drains fast.",
  },
  {
    id: "pest",
    label: "Spots, webs, holes, or insects visible",
    advice:
      "Likely pest / disease — not a salinity fix. Scout and treat separately.",
  },
];

export default function LeafPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  if (!FLAGS.leafAi) {
    return (
      <p className="card-panel p-4">
        Leaf check hidden by feature flag.{" "}
        <Link href="/">Back</Link>
      </p>
    );
  }

  async function runAi() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const b64 = btoa(
        new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ""),
      );
      const res = await fetch("/api/leaf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mimeType: file.type || "image/jpeg",
          imageBase64: b64,
        }),
      });
      const data = (await res.json()) as { ok: boolean; text: string; mode: string };
      setResult(
        data.mode === "checklist"
          ? `${data.text}\n\n(No GEMINI_API_KEY — using checklist fallback.)`
          : data.text,
      );
    } catch {
      setResult("Could not reach AI. Use the checklist below.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="card-panel space-y-3 p-4">
        <h2 className="text-2xl font-black text-date">Leaf check</h2>
        <p className="text-sm">
          Optional. With <code>GEMINI_API_KEY</code>, classify salt burn vs heat
          vs water vs pest. Without a key, use the guided checklist — app still
          works fully.
        </p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="touch-btn w-full text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Leaf preview"
            className="max-h-48 w-full rounded-xl object-cover"
          />
        )}
        <button
          type="button"
          className="touch-btn w-full bg-water text-white disabled:opacity-50"
          disabled={!file || loading}
          onClick={runAi}
        >
          {loading ? "Checking…" : "Analyze photo"}
        </button>
        {result && (
          <pre className="whitespace-pre-wrap rounded-xl bg-white/70 p-3 text-sm">
            {result}
          </pre>
        )}
      </section>

      <section className="card-panel space-y-2 p-4">
        <h3 className="text-lg font-bold">Symptom checklist</h3>
        {CHECKLIST.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`touch-btn w-full px-3 text-left text-sm ${
              picked === c.id ? "bg-green/20" : "bg-white/70"
            }`}
            onClick={() => setPicked(c.id)}
          >
            {c.label}
          </button>
        ))}
        {picked && (
          <p className="rounded-xl bg-[color-mix(in_srgb,var(--deep-green)_12%,white)] p-3 text-sm">
            {CHECKLIST.find((c) => c.id === picked)?.advice}
          </p>
        )}
      </section>
    </div>
  );
}
