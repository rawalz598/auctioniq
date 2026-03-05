"use client";

import { useEffect, useMemo, useState } from "react";
import type { SavedEvaluation } from "../../../lib/types";
import { loadEvaluations, saveEvaluations } from "../../../lib/appState";

function money(n: number) {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n);
  return `${sign}$${v.toFixed(0)}`;
}

export default function EvaluationsPage() {
  const [evals, setEvals] = useState<SavedEvaluation[]>([]);
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");
  const [minProfit, setMinProfit] = useState<string>("");
  const [maxProfit, setMaxProfit] = useState<string>("");
  const [sort, setSort] = useState<"NEWEST" | "PROFIT_DESC" | "PROFIT_ASC">("NEWEST");

  useEffect(() => setEvals(loadEvaluations()), []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const minP = minProfit === "" ? null : Number(minProfit);
    const maxP = maxProfit === "" ? null : Number(maxProfit);

    let list = evals.filter((e) => {
      const text = `${e.input.year} ${e.input.make} ${e.input.model} ${e.input.trim ?? ""}`.toLowerCase();
      const matchesText = !query || text.includes(query);
      const matchesRisk = risk === "ALL" || e.output.risk.rating === risk;
      const matchesMin = minP === null || e.output.profit >= minP;
      const matchesMax = maxP === null || e.output.profit <= maxP;
      return matchesText && matchesRisk && matchesMin && matchesMax;
    });

    if (sort === "NEWEST") {
      list = list.slice().sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    } else if (sort === "PROFIT_DESC") {
      list = list.slice().sort((a, b) => b.output.profit - a.output.profit);
    } else {
      list = list.slice().sort((a, b) => a.output.profit - b.output.profit);
    }
    return list;
  }, [evals, q, risk, minProfit, maxProfit, sort]);

  function remove(id: string) {
    const next = evals.filter((e) => e.id !== id);
    setEvals(next);
    saveEvaluations(next);
  }

  function clearAll() {
    if (!confirm("Delete ALL saved evaluations?")) return;
    setEvals([]);
    saveEvaluations([]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Evaluations</h1>
          <p className="text-sm text-slate-600 mt-1">
            Saved: <span className="font-semibold">{evals.length}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50" onClick={() => setEvals(loadEvaluations())}>
            Refresh
          </button>
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50" onClick={clearAll}>
            Clear all
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="Search year/make/model…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="rounded-xl border px-3 py-2 bg-white"
            value={risk}
            onChange={(e) => setRisk(e.target.value as any)}
          >
            <option value="ALL">All risk</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <input
            className="rounded-xl border px-3 py-2"
            placeholder="Min profit"
            value={minProfit}
            onChange={(e) => setMinProfit(e.target.value)}
          />

          <input
            className="rounded-xl border px-3 py-2"
            placeholder="Max profit"
            value={maxProfit}
            onChange={(e) => setMaxProfit(e.target.value)}
          />

          <select
            className="rounded-xl border px-3 py-2 bg-white"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="NEWEST">Sort: Newest</option>
            <option value="PROFIT_DESC">Sort: Profit high→low</option>
            <option value="PROFIT_ASC">Sort: Profit low→high</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-700">
            No matches. Save a car from <span className="font-medium">New Evaluation</span>.
          </div>
        ) : (
          filtered.slice(0, 100).map((e) => (
            <div key={e.id} className="rounded-2xl bg-white border shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {e.input.year} {e.input.make || "Unknown"} {e.input.model || ""}
                    {e.input.trim ? ` ${e.input.trim}` : ""}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {new Date(e.createdAt).toLocaleString()} • Risk: {e.output.risk.rating}
                  </div>
                </div>

                <button
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
                  onClick={() => remove(e.id)}
                >
                  Delete
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-slate-600">Profit</div>
                  <div className="font-semibold">{money(e.output.profit)}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-slate-600">All-in</div>
                  <div className="font-semibold">{money(e.output.allInCost)}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-slate-600">Bid</div>
                  <div className="font-semibold">{money(e.input.bidPrice)}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-slate-600">Max Bid</div>
                  <div className="font-semibold">{money(e.output.maxBid)}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-slate-600">Recommendation</div>
                  <div className="font-semibold">{e.output.recommendation}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}