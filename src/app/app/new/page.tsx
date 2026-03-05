"use client";

import { useEffect, useMemo, useState } from "react";
import { computeEvaluation } from "../../../lib/logic";
import {
  DEFAULT_SETTINGS,
  loadEvaluations,
  loadSettings,
  saveEvaluations,
} from "../../../lib/appState";
import type {
  DamageType,
  EvaluationInput,
  SavedEvaluation,
  Severity,
} from "../../../lib/types";

const damageTypes: { value: DamageType; label: string }[] = [
  { value: "NO_DAMAGE", label: "No damage (clean / detail / misc)" },
  { value: "COSMETIC_MINOR", label: "Cosmetic / minor dents & scratches" },
  { value: "FRONT_END_COSMETIC", label: "Front fender / front end cosmetic" },
  { value: "SIDE_DAMAGE", label: "Side damage" },
  { value: "REAR_DAMAGE", label: "Rear damage" },
  { value: "MECHANICAL", label: "Mechanical (engine/transmission/unknown)" },
  { value: "FLOOD_WATER", label: "Flood / water" },
  { value: "UNKNOWN_MIXED", label: "Unknown / mixed" },
];

const severities: Severity[] = ["LOW", "MEDIUM", "HIGH"];

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function money(n: number) {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n);
  return `${sign}$${v.toFixed(0)}`;
}
function pct(n: number) {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-slate-800">{children}</div>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "mt-1 w-full rounded-xl border px-3 py-2 outline-none",
        "focus:ring-2 focus:ring-slate-200",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "mt-1 w-full rounded-xl border px-3 py-2 bg-white outline-none",
        "focus:ring-2 focus:ring-slate-200",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border shadow-sm p-4">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-3">
      <div className="text-xs text-slate-600">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

export default function NewEvaluationPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [evals, setEvals] = useState<SavedEvaluation[]>([]);
  const [quickMode, setQuickMode] = useState(DEFAULT_SETTINGS.defaultQuickMode);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setQuickMode(s.defaultQuickMode);
    setEvals(loadEvaluations());
  }, []);

  const [input, setInput] = useState<EvaluationInput>({
    year: new Date().getFullYear(),
    make: "",
    model: "",
    trim: "",
    mileage: 90000,

    damageType: "COSMETIC_MINOR",
    cosmeticSeverity: "MEDIUM",

    bidPrice: 5000,
    transportEstimate: DEFAULT_SETTINGS.transportAverage,
    resaleEstimate: 10000,

    notes: "",

    mechanicalIssue: false,
    mechanicalSeverity: "MEDIUM",

    flood: false,
    floodSeverity: "MEDIUM",

    repairOverride: undefined,
    partsOverride: undefined,
    laborHoursOverride: undefined,
  });

  useEffect(() => {
    setInput((p) => ({ ...p, transportEstimate: settings.transportAverage }));
  }, [settings.transportAverage]);

  const result = useMemo(() => computeEvaluation(input, settings), [input, settings]);

  // Make/Model optional in MVP (for speed)
  const requiredOk =
    input.year > 1900 &&
    input.mileage >= 0 &&
    input.bidPrice >= 0 &&
    input.transportEstimate >= 0 &&
    input.resaleEstimate > 0;

  function save() {
    if (!requiredOk) {
      alert("Fill required fields: Year, Mileage, Bid, Transport, Resale.");
      return;
    }
    const e: SavedEvaluation = {
      id: uid(),
      createdAt: new Date().toISOString(),
      input,
      output: result,
    };
    const next = [e, ...evals];
    setEvals(next);
    saveEvaluations(next);
    alert("Saved!");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">AuctionIQ</div>
          <div className="text-sm text-slate-600">
            Pre-bid decision tool — all-in cost, profit, max bid, risk.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={[
              "rounded-xl border px-3 py-2 text-sm",
              quickMode ? "bg-slate-900 text-white border-slate-900" : "hover:bg-slate-50",
            ].join(" ")}
            onClick={() => setQuickMode(true)}
          >
            Quick Mode
          </button>
          <button
            className={[
              "rounded-xl border px-3 py-2 text-sm",
              !quickMode ? "bg-slate-900 text-white border-slate-900" : "hover:bg-slate-50",
            ].join(" ")}
            onClick={() => setQuickMode(false)}
          >
            Full Mode
          </button>

          <button
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-40"
            disabled={!requiredOk}
            onClick={save}
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          title="New Evaluation"
          subtitle={quickMode ? "Fast entry: only the essentials." : "Full entry: more detail = better risk scoring."}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Year*</Label>
              <Input
                type="number"
                value={input.year}
                onChange={(e) => setInput((p) => ({ ...p, year: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Mileage*</Label>
              <Input
                type="number"
                value={input.mileage}
                onChange={(e) => setInput((p) => ({ ...p, mileage: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Make (optional)</Label>
              <Input
                value={input.make}
                placeholder="Toyota / BMW"
                onChange={(e) => setInput((p) => ({ ...p, make: e.target.value }))}
              />
            </div>

            <div>
              <Label>Model (optional)</Label>
              <Input
                value={input.model}
                placeholder="Corolla / 550i"
                onChange={(e) => setInput((p) => ({ ...p, model: e.target.value }))}
              />
            </div>

            {!quickMode ? (
              <div className="sm:col-span-2">
                <Label>Trim (optional)</Label>
                <Input
                  value={input.trim}
                  placeholder="LE / XSE / xDrive / etc."
                  onChange={(e) => setInput((p) => ({ ...p, trim: e.target.value }))}
                />
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <Label>Damage type</Label>
              <Select
                value={input.damageType}
                onChange={(e) => setInput((p) => ({ ...p, damageType: e.target.value as DamageType }))}
              >
                {damageTypes.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </div>

            {!quickMode ? (
              <div className="sm:col-span-2">
                <Label>Cosmetic severity</Label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {severities.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={[
                        "rounded-xl border py-2 text-sm",
                        input.cosmeticSeverity === s
                          ? "bg-slate-900 text-white border-slate-900"
                          : "hover:bg-slate-50",
                      ].join(" ")}
                      onClick={() => setInput((p) => ({ ...p, cosmeticSeverity: s }))}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="sm:col-span-2">
                <Label>Severity (quick)</Label>
                <Select
                  value={input.cosmeticSeverity}
                  onChange={(e) => setInput((p) => ({ ...p, cosmeticSeverity: e.target.value as Severity }))}
                >
                  {severities.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <Label>Bid price*</Label>
              <Input
                type="number"
                value={input.bidPrice}
                onChange={(e) => setInput((p) => ({ ...p, bidPrice: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Transport*</Label>
              <Input
                type="number"
                value={input.transportEstimate}
                onChange={(e) => setInput((p) => ({ ...p, transportEstimate: Number(e.target.value) }))}
              />
              <div className="text-xs text-slate-500 mt-1">
                Default from Settings: ${settings.transportAverage}
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label>Expected resale value*</Label>
              <Input
                type="number"
                value={input.resaleEstimate}
                onChange={(e) => setInput((p) => ({ ...p, resaleEstimate: Number(e.target.value) }))}
              />
            </div>

            <div className="sm:col-span-2 rounded-2xl border p-3 bg-slate-50">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Repair</div>
                <div className="text-xs text-slate-600">
                  Buffer: +{settings.riskBufferPct}% (used for Max Bid)
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <Label>Repair override (optional)</Label>
                  <Input
                    type="number"
                    placeholder="If you already know your number, enter it here"
                    value={input.repairOverride ?? ""}
                    onChange={(e) =>
                      setInput((p) => ({
                        ...p,
                        repairOverride: e.target.value === "" ? undefined : Number(e.target.value),
                      }))
                    }
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    This overrides the automatic repair estimate.
                  </div>
                </div>

                <div>
                  <Label>Labor rate (info)</Label>
                  <div className="mt-1 rounded-xl border bg-white px-3 py-2 text-sm">
                    ${settings.laborRate}/hr
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Used if you ever enable parts/labor overrides later.
                  </div>
                </div>
              </div>

              {!quickMode ? (
                <div className="mt-3">
                  <div className="text-sm font-medium">Flags</div>
                  <div className="mt-2 flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={input.mechanicalIssue}
                        onChange={(e) => setInput((p) => ({ ...p, mechanicalIssue: e.target.checked }))}
                      />
                      Mechanical issue?
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={input.flood}
                        onChange={(e) => setInput((p) => ({ ...p, flood: e.target.checked }))}
                      />
                      Flood?
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label>Mechanical severity</Label>
                      <Select
                        value={input.mechanicalSeverity}
                        disabled={!input.mechanicalIssue}
                        onChange={(e) => setInput((p) => ({ ...p, mechanicalSeverity: e.target.value as Severity }))}
                      >
                        {severities.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </div>
                    <div>
                      <Label>Flood severity</Label>
                      <Select
                        value={input.floodSeverity}
                        disabled={!input.flood}
                        onChange={(e) => setInput((p) => ({ ...p, floodSeverity: e.target.value as Severity }))}
                      >
                        {severities.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {!quickMode ? (
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <textarea
                  className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[90px] outline-none focus:ring-2 focus:ring-slate-200"
                  value={input.notes}
                  onChange={(e) => setInput((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Anything you noticed from the listing…"
                />
              </div>
            ) : null}
          </div>
        </Card>

        <Card title="Results" subtitle="Updates instantly. Max Bid solves for fee model + repair buffer.">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm text-slate-600">
              Fee model: <span className="font-medium">{settings.feeModel}</span>
              {result.fees.tierNote ? <div className="text-xs mt-1">{result.fees.tierNote}</div> : null}
            </div>

            <div
              className={[
                "px-3 py-1.5 rounded-xl text-sm font-medium border",
                result.recommendation === "BUY"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : result.recommendation === "CAUTION"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-rose-50 border-rose-200 text-rose-800",
              ].join(" ")}
            >
              {result.recommendation === "BUY"
                ? "✅ BUY"
                : result.recommendation === "CAUTION"
                ? "⚠️ CAUTION"
                : "🚫 SKIP"}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Stat label="Repair (recommended)" value={money(result.repair.recommended)} />
            <Stat label="Repair (buffered for max bid)" value={money(result.repair.bufferedRecommended)} />
            <Stat label="Fees (total)" value={money(result.fees.total)} />
            <Stat label="Transport" value={money(result.transport)} />
            <Stat label="All-in cost" value={money(result.allInCost)} />
            <Stat label="Resale (input)" value={money(input.resaleEstimate)} />
            <Stat label="Profit ($)" value={money(result.profit)} />
            <Stat label="Profit margin" value={pct(result.profitMargin)} />
            <Stat label="ROI" value={pct(result.roi)} />
            <Stat label="Max Bid (recommended)" value={money(result.maxBid)} />
          </div>

          <div className="mt-4 rounded-2xl border p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Risk</div>
              <div
                className={[
                  "text-sm font-medium px-2.5 py-1 rounded-xl border",
                  result.risk.rating === "LOW"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : result.risk.rating === "MEDIUM"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-rose-50 border-rose-200 text-rose-800",
                ].join(" ")}
              >
                {result.risk.rating}
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-600">
              Risk score: {result.risk.score} (higher = riskier)
            </div>

            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
              {result.risk.reasons.length ? (
                result.risk.reasons.map((r, idx) => <li key={idx}>{r}</li>)
              ) : (
                <li>No major risk flags detected.</li>
              )}
            </ul>
          </div>

          <div className="mt-4 rounded-2xl border p-3 bg-slate-50">
            <div className="text-sm font-semibold">Repair transparency</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
              {result.repair.explanation.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>

          <div className="mt-4 rounded-2xl border p-3">
            <div className="text-sm font-semibold">Fees breakdown</div>
            <div className="mt-2 text-sm text-slate-700 grid grid-cols-2 gap-2">
              <div>Flat</div><div className="text-right">{money(result.fees.flat)}</div>
              <div>Percent</div><div className="text-right">{money(result.fees.percent)}</div>
              <div className="font-medium">Total</div><div className="text-right font-medium">{money(result.fees.total)}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}