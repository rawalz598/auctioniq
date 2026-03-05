"use client";

import { useEffect, useState } from "react";
import type { AppSettings, FeeModel } from "../../../lib/types";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "../../../lib/appState";

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <label className="block rounded-2xl border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      <input
        type="number"
        className="mt-2 w-full rounded-xl border px-3 py-2"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => setS(loadSettings()), []);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSaved(false);
    setS((p) => ({ ...p, [key]: value }));
  }

  function onSave() {
    saveSettings(s);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white shadow-sm p-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-slate-600 mt-1">
            Defaults used by the calculator (fees, transport, profit rules, risk buffer).
          </p>
        </div>
        <button
          className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
          onClick={onSave}
        >
          Save
        </button>
      </div>

      {saved ? (
        <div className="rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-800 p-3 text-sm">
          Saved ✅
        </div>
      ) : null}

      <div className="rounded-2xl bg-white border shadow-sm p-4">
        <h2 className="font-semibold">Profit rules</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Target profit ($)" value={s.targetProfit} onChange={(v) => update("targetProfit", v)} />
          <Field label="Min profit margin (%)" value={s.minProfitMarginPct} onChange={(v) => update("minProfitMarginPct", v)} />
        </div>
      </div>

      <div className="rounded-2xl bg-white border shadow-sm p-4">
        <h2 className="font-semibold">Fees</h2>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">Fee model</label>
          <select
            className="rounded-xl border px-3 py-2 bg-white text-sm"
            value={s.feeModel}
            onChange={(e) => update("feeModel", e.target.value as FeeModel)}
          >
            <option value="SIMPLE">SIMPLE (flat + %)</option>
            <option value="TIERED">TIERED (preset tiers)</option>
          </select>

          <div className="text-xs text-slate-600">
            Tiered is an MVP approximation. We’ll tune with real receipts.
          </div>
        </div>

        {s.feeModel === "SIMPLE" ? (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Fee flat ($)" value={s.feeFlat} onChange={(v) => update("feeFlat", v)} />
            <Field label="Fee percent (%)" value={s.feePct} onChange={(v) => update("feePct", v)} />
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">
            Tiered fees use built-in tiers based on bid amount (good-enough for MVP).
            <div className="text-xs text-slate-600 mt-1">
              Next iteration: we’ll add a “copart/iaa preset” selector + editable tiers.
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white border shadow-sm p-4">
        <h2 className="font-semibold">Transport + Repair</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Default transport ($)" value={s.transportAverage} onChange={(v) => update("transportAverage", v)} />
          <Field label="Risk buffer on repair (%)" value={s.riskBufferPct} onChange={(v) => update("riskBufferPct", v)} hint="Used for Max Bid" />
          <Field label="Labor rate ($/hr)" value={s.laborRate} onChange={(v) => update("laborRate", v)} />
        </div>
      </div>

      <div className="rounded-2xl bg-white border shadow-sm p-4">
        <h2 className="font-semibold">Risk tuning</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="High mileage threshold" value={s.highMileageThreshold} onChange={(v) => update("highMileageThreshold", v)} />
          <Field label="Very high mileage threshold" value={s.veryHighMileageThreshold} onChange={(v) => update("veryHighMileageThreshold", v)} />
        </div>

        <label className="mt-3 flex items-center gap-2 rounded-2xl border p-3">
          <input
            type="checkbox"
            checked={s.acceptFloodRisk}
            onChange={(e) => update("acceptFloodRisk", e.target.checked)}
          />
          <span className="text-sm">Accept flood risk (still adds some risk)</span>
        </label>

        <label className="mt-3 flex items-center gap-2 rounded-2xl border p-3">
          <input
            type="checkbox"
            checked={s.defaultQuickMode}
            onChange={(e) => update("defaultQuickMode", e.target.checked)}
          />
          <span className="text-sm">Default to Quick Mode</span>
        </label>
      </div>
    </div>
  );
}