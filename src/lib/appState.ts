"use client";

import { AppSettings, SavedEvaluation } from "./types";

const SETTINGS_KEY = "auctioniq_settings_v2";
const EVALS_KEY = "auctioniq_evaluations_v2";

export const DEFAULT_SETTINGS: AppSettings = {
  targetProfit: 2000,
  minProfitMarginPct: 15,

  feeModel: "SIMPLE",
  feeFlat: 450,
  feePct: 7.5,

  transportAverage: 650,

  riskBufferPct: 15,
  laborRate: 110,
  highMileageThreshold: 120000,
  veryHighMileageThreshold: 160000,
  acceptFloodRisk: false,

  defaultQuickMode: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as AppSettings) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadEvaluations(): SavedEvaluation[] {
  try {
    const raw = localStorage.getItem(EVALS_KEY);
    return raw ? (JSON.parse(raw) as SavedEvaluation[]) : [];
  } catch {
    return [];
  }
}

export function saveEvaluations(evals: SavedEvaluation[]) {
  localStorage.setItem(EVALS_KEY, JSON.stringify(evals));
}