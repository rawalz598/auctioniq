import {
  AppSettings,
  DamageType,
  EvaluationInput,
  EvaluationOutput,
  FeeBreakdown,
  RiskRating,
  Severity,
} from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function severityMultiplier(s: Severity) {
  if (s === "LOW") return 0.85;
  if (s === "MEDIUM") return 1.0;
  return 1.25;
}

function baseRepairRange(damage: DamageType): { low: number; high: number } {
  switch (damage) {
    case "NO_DAMAGE":
      return { low: 0, high: 200 };
    case "COSMETIC_MINOR":
      return { low: 400, high: 1800 };
    case "FRONT_END_COSMETIC":
      return { low: 1200, high: 4200 };
    case "SIDE_DAMAGE":
      return { low: 1000, high: 5000 };
    case "REAR_DAMAGE":
      return { low: 1000, high: 4800 };
    case "MECHANICAL":
      return { low: 1800, high: 6500 };
    case "FLOOD_WATER":
      return { low: 1500, high: 9000 };
    case "UNKNOWN_MIXED":
    default:
      return { low: 1200, high: 7000 };
  }
}

function mileageRiskBucket(mileage: number, settings: AppSettings) {
  if (mileage >= settings.veryHighMileageThreshold) return 2;
  if (mileage >= settings.highMileageThreshold) return 1;
  return 0;
}

/**
 * Fee models:
 * - SIMPLE: flat + % of bid (editable)
 * - TIERED: preset tiers (can be tuned later to match Copart/IAA more closely)
 */
function estimateFees(bid: number, settings: AppSettings): FeeBreakdown {
  const b = Math.max(0, bid);

  if (settings.feeModel === "SIMPLE") {
    const flat = Math.max(0, settings.feeFlat);
    const percent = Math.max(0, b * (settings.feePct / 100));
    const total = flat + percent;
    return { model: "SIMPLE", flat, percent, total };
  }

  // TIERED preset (MVP approximation):
  // Note: This is a “good-enough” model. We’ll tune it based on your real receipts.
  const tiers = [
    { max: 3000, flat: 350, pct: 9.5 },
    { max: 8000, flat: 450, pct: 8.0 },
    { max: 15000, flat: 550, pct: 7.0 },
    { max: 999999999, flat: 650, pct: 6.0 },
  ];

  const t = tiers.find((x) => b <= x.max)!;
  const flat = t.flat;
  const percent = b * (t.pct / 100);
  const total = flat + percent;

  return {
    model: "TIERED",
    flat,
    percent,
    total,
    tierNote: `Tier: <= $${t.max.toLocaleString()} (flat $${t.flat}, ${t.pct}%)`,
  };
}

function severityRisk(s: Severity) {
  if (s === "HIGH") return 2;
  if (s === "MEDIUM") return 1;
  return 0;
}

function computeWithBid(
  input: EvaluationInput,
  settings: AppSettings,
  bid: number,
  repairRecommended: number,
  transport: number
) {
  const fees = estimateFees(bid, settings);
  const allIn = bid + fees.total + transport + repairRecommended;
  return { fees, allIn };
}

// Solve max bid more accurately by iterating because fees depend on bid.
function solveMaxBid(params: {
  resale: number;
  targetProfit: number;
  transport: number;
  repairBuffered: number;
  settings: AppSettings;
  input: EvaluationInput;
}) {
  const { resale, targetProfit, transport, repairBuffered, settings, input } = params;

  // Start with a generous guess
  let bid = Math.max(0, resale - targetProfit - transport - repairBuffered - 500);

  for (let i = 0; i < 12; i++) {
    const fees = estimateFees(bid, settings);
    const next = resale - targetProfit - transport - repairBuffered - fees.total;
    const nextBid = Math.max(0, next);
    if (Math.abs(nextBid - bid) < 1) return nextBid;
    bid = nextBid;
  }
  return Math.max(0, bid);
}

export function computeEvaluation(
  input: EvaluationInput,
  settings: AppSettings
): EvaluationOutput {
  const bid = Math.max(0, input.bidPrice);
  const transport = Math.max(0, input.transportEstimate);
  const resale = Math.max(0, input.resaleEstimate);

  // --- Repair calculation (transparent) ---
  const base = baseRepairRange(input.damageType);
  const sevMult = severityMultiplier(input.cosmeticSeverity);

  let low = base.low * sevMult;
  let high = base.high * sevMult;

  // Mileage adjustment
  const mBucket = mileageRiskBucket(input.mileage, settings);
  let mileageAdjPct = 0;
  if (mBucket === 1) mileageAdjPct = 6;
  if (mBucket === 2) mileageAdjPct = 12;

  low *= 1 + mileageAdjPct / 100;
  high *= 1 + mileageAdjPct / 100;

  // Flags adjustment (mechanical / flood)
  let flagsAdjPct = 0;

  if (input.mechanicalIssue) {
    const s = severityRisk(input.mechanicalSeverity);
    flagsAdjPct += 10 + s * 5; // 10/15/20
  }
  if (input.flood) {
    const s = severityRisk(input.floodSeverity);
    flagsAdjPct += 12 + s * 6; // 12/18/24
  }

  low *= 1 + flagsAdjPct / 100;
  high *= 1 + flagsAdjPct / 100;

  let recommended = ((low + high) / 2) * 1.03;

  const explanation: string[] = [
    `Base range: $${base.low.toFixed(0)}–$${base.high.toFixed(0)} (damage type)`,
    `Severity multiplier: x${sevMult.toFixed(2)} (${input.cosmeticSeverity})`,
    mileageAdjPct ? `Mileage adjustment: +${mileageAdjPct}% (${input.mileage.toLocaleString()} mi)` : "Mileage adjustment: none",
    flagsAdjPct ? `Flags adjustment: +${flagsAdjPct}% (mechanical/flood)` : "Flags adjustment: none",
  ];

  // Single repair override (fast dealer workflow)
  if (typeof input.repairOverride === "number" && isFinite(input.repairOverride)) {
    recommended = Math.max(0, input.repairOverride);
    low = recommended * 0.85;
    high = recommended * 1.25;
    explanation.push(`Repair override used: $${recommended.toFixed(0)} (you set it)`);
  } else {
    // Optional legacy overrides (parts + labor)
    if (typeof input.partsOverride === "number" && isFinite(input.partsOverride)) {
      const labor = Math.max(0, (input.laborHoursOverride ?? 0)) * settings.laborRate;
      recommended = Math.max(0, input.partsOverride + labor);
      low = recommended * 0.8;
      high = recommended * 1.3;
      explanation.push(`Parts override + labor used (labor rate $${settings.laborRate}/hr).`);
    } else if (
      typeof input.laborHoursOverride === "number" &&
      isFinite(input.laborHoursOverride)
    ) {
      const labor = Math.max(0, input.laborHoursOverride) * settings.laborRate;
      recommended = Math.max(0, recommended + labor);
      low = Math.min(low, recommended * 0.85);
      high = Math.max(high, recommended * 1.25);
      explanation.push(`Labor hours override used (${input.laborHoursOverride} hrs @ $${settings.laborRate}/hr).`);
    }
  }

  low = Math.max(0, low);
  high = Math.max(low, high);
  recommended = clamp(recommended, low, high);

  const bufferedRecommended =
    recommended * (1 + Math.max(0, settings.riskBufferPct) / 100);

  // Fees (based on current bid)
  const fees = estimateFees(bid, settings);

  const allInCost = bid + fees.total + transport + recommended;
  const profit = resale - allInCost;

  const profitMargin = resale > 0 ? profit / resale : 0;
  const roi = allInCost > 0 ? profit / allInCost : 0;

  const targetProfit = Math.max(0, settings.targetProfit);

  // Max bid: solve with fee dependence + buffered repair
  const maxBid = solveMaxBid({
    resale,
    targetProfit,
    transport,
    repairBuffered: bufferedRecommended,
    settings,
    input,
  });

  // --- Risk rules ---
  const reasons: string[] = [];
  let score = 0;

  if (input.flood) {
    if (!settings.acceptFloodRisk) {
      score += 3;
      reasons.push("Flood flagged (your settings: NOT accepting flood risk).");
    } else {
      score += 1;
      reasons.push("Flood flagged (you accept flood risk, still adds uncertainty).");
    }
  }

  if (input.mechanicalIssue) {
    const s = severityRisk(input.mechanicalSeverity);
    score += 2 + s;
    reasons.push(`Mechanical issue flagged (${input.mechanicalSeverity}).`);
  }

  const dsev = severityRisk(input.cosmeticSeverity);
  score += dsev;
  if (input.cosmeticSeverity === "HIGH") reasons.push("High cosmetic severity.");

  if (mBucket === 1) {
    score += 1;
    reasons.push(`High mileage (${input.mileage.toLocaleString()} mi).`);
  } else if (mBucket === 2) {
    score += 2;
    reasons.push(`Very high mileage (${input.mileage.toLocaleString()} mi).`);
  }

  const minMargin = Math.max(0, settings.minProfitMarginPct) / 100;
  if (profitMargin < minMargin) {
    score += 2;
    reasons.push(
      `Profit margin below minimum (${(profitMargin * 100).toFixed(1)}% < ${(minMargin * 100).toFixed(0)}%).`
    );
  }
  if (profit < 0) {
    score += 3;
    reasons.push("Negative profit based on current inputs.");
  }

  let rating: RiskRating = "LOW";
  if (score >= 6) rating = "HIGH";
  else if (score >= 3) rating = "MEDIUM";

  // Recommendation rules
  let recommendation: "BUY" | "CAUTION" | "SKIP" = "CAUTION";
  const closeToTarget = profit >= targetProfit * 0.75 && profit < targetProfit;

  if (profit >= targetProfit && rating !== "HIGH") recommendation = "BUY";
  else if (rating === "HIGH" || profit < 0) recommendation = "SKIP";
  else if (closeToTarget || rating === "MEDIUM") recommendation = "CAUTION";
  else recommendation = "SKIP";

  return {
    fees,
    transport,
    repair: {
      baseLow: base.low,
      baseHigh: base.high,
      severityMult: sevMult,
      mileageAdjPct,
      flagsAdjPct,
      recommended,
      bufferedRecommended,
      explanation,
    },
    allInCost,
    profit,
    profitMargin,
    roi,
    maxBid,
    risk: { rating, reasons, score },
    recommendation,
  };
}