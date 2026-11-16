/** Plots — add a plot in under 30 seconds. */
"use client";

import { useState } from "react";
import { listCrops, type CropId, getCrop } from "@/lib/crops";
import { EVIDENCE } from "@/lib/evidence";
import { useFarmStore } from "@/store/farm-store";

export default function PlotsPage() {
  const plots = useFarmStore((s) => s.plots);
  const addPlot = useFarmStore((s) => s.addPlot);
  const removePlot = useFarmStore((s) => s.removePlot);
  const updateHabit = useFarmStore((s) => s.updateHabit);

  const [name, setName] = useState("New plot");
  const [cropId, setCropId] = useState<CropId>("date_palm");
  const [plants, setPlants] = useState(20);
  const [area, setArea] = useState(0);
  const [ecKnown, setEcKnown] = useState(false);
  const [ec, setEc] = useState(2.5);

  const crop = getCrop(cropId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const areaM2 = area > 0 ? area : plants * crop.canopyM2;
    addPlot({
      name,
      cropId,
      plantCount: crop.usesPlants ? plants : 0,
      areaM2,
      waterEc: ecKnown ? ec : null,
      waterEcUnknown: !ecKnown,
    });
    setName("New plot");
  }

  return (
    <div className="space-y-4">
      <form className="card-panel space-y-3 p-4" onSubmit={submit}>
        <h2 className="text-xl font-black text-date">➕ Add plot</h2>
        <label className="block text-sm font-bold">
          Name
          <input
            className="touch-btn mt-1 w-full border border-date/20 bg-white px-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-bold">
          Crop
          <select
            className="touch-btn mt-1 w-full border border-date/20 bg-white px-3"
            value={cropId}
            onChange={(e) => setCropId(e.target.value as CropId)}
          >
            {listCrops().map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.nameEn}
              </option>
            ))}
          </select>
        </label>
        {crop.usesPlants ? (
          <label className="block text-sm font-bold">
            Plants
            <input
              type="number"
              min={1}
              className="touch-btn mt-1 w-full border border-date/20 bg-white px-3"
              value={plants}
              onChange={(e) => setPlants(Number(e.target.value))}
            />
          </label>
        ) : (
          <label className="block text-sm font-bold">
            Area (m²)
            <input
              type="number"
              min={1}
              className="touch-btn mt-1 w-full border border-date/20 bg-white px-3"
              value={area || 100}
              onChange={(e) => setArea(Number(e.target.value))}
            />
          </label>
        )}
        <fieldset className="space-y-2">
          <legend className="text-sm font-bold">Water source EC</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!ecKnown}
              onChange={(e) => setEcKnown(!e.target.checked)}
            />
            I don&apos;t know (uses {EVIDENCE["uae-default-well-ec"].value} dS/m
            — demo assumption)
          </label>
          {ecKnown && (
            <input
              type="number"
              step={0.1}
              min={0.1}
              className="touch-btn w-full border border-date/20 bg-white px-3"
              value={ec}
              onChange={(e) => setEc(Number(e.target.value))}
            />
          )}
        </fieldset>
        <button type="submit" className="touch-btn w-full bg-green text-white">
          Save plot
        </button>
      </form>

      <section className="space-y-3">
        {plots.map((p) => {
          const c = getCrop(p.cropId);
          return (
            <article key={p.id} className="card-panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold">
                    {c.icon} {p.name}
                  </h3>
                  <p className="text-sm text-muted">
                    {c.nameEn}
                    {c.usesPlants ? ` · ${p.plantCount} plants` : ""} ·{" "}
                    {p.areaM2} m²
                  </p>
                  <p className="text-sm">
                    Water EC:{" "}
                    {p.waterEcUnknown
                      ? `unknown → ${EVIDENCE["uae-default-well-ec"].value} (assumption)`
                      : `${p.waterEc} dS/m`}
                  </p>
                </div>
                <button
                  type="button"
                  className="touch-btn border border-danger/40 px-3 text-danger"
                  onClick={() => removePlot(p.id)}
                >
                  Remove
                </button>
              </div>
              <label className="mt-3 block text-sm font-bold">
                Habit liters / amount
                <input
                  type="number"
                  className="touch-btn mt-1 w-full border border-date/20 bg-white px-3"
                  value={p.habit.amount}
                  onChange={(e) =>
                    updateHabit(p.id, Number(e.target.value), p.habit.hour)
                  }
                />
              </label>
            </article>
          );
        })}
      </section>
    </div>
  );
}
