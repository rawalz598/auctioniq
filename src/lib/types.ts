export type Severity = "LOW" | "MEDIUM" | "HIGH";

export type DamageType =
  | "NO_DAMAGE"
  | "COSMETIC_MINOR"
  | "FRONT_END_COSMETIC"
  | "SIDE_DAMAGE"
  | "REAR_DAMAGE"
  | "MECHANICAL"
  | "FLOOD_WATER"
  | "UNKNOWN_MIXED";

export type RiskRating = "LOW" | "MEDIUM" | "HIGH";
export type Recommendation = "BUY" | "CAUTION" | "SKIP";

export type FeeModel = "SIMPLE" | "TIERED";

export type EvaluationInput = {
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;

  damageType: DamageType;
  cosmeticSeverity: Severity;

  bidPrice: number;
  transportEstimate: number;
  resaleEstimate: number;

  notes?: string;

  mechanicalIssue: boolean;
  mechanicalSeverity: Severity;

  flood: boolean;
  floodSeverity: Severity;

  // Overrides (optional)
  repairOverride?: number; // single number override for repair
  partsOverride?: number;
  laborHoursOverride?: number;
};

export type FeeBreakdown = {
  model: FeeModel;
  flat: number;
  percent: number;
  tierNote?: string;
  total: number;
};

export type RepairBreakdown = {
  baseLow: number;
  baseHigh: number;
  severityMult: number;
  mileageAdjPct: number;
  flagsAdjPct: number;
  recommended: number;
  bufferedRecommended: number;
  explanation: string[];
};

export type EvaluationOutput = {
  fees: FeeBreakdown;
  transport: number;
  repair: RepairBreakdown;

  allInCost: number;
  profit: number;
  profitMargin: number;
  roi: number;

  maxBid: number;

  risk: {
    rating: RiskRating;
    reasons: string[];
    score: number;
  };

  recommendation: Recommendation;
};

export type SavedEvaluation = {
  id: string;
  createdAt: string;
  input: EvaluationInput;
  output: EvaluationOutput;
};

export type AppSettings = {
  targetProfit: number; // $
  minProfitMarginPct: number; // percent

  feeModel: FeeModel;

  // SIMPLE fees: flat + %
  feeFlat: number; // $
  feePct: number; // percent

  // Transport default
  transportAverage: number; // $

  // Buffers / rules
  riskBufferPct: number; // percent
  laborRate: number; // $/hr
  highMileageThreshold: number; // miles
  veryHighMileageThreshold: number; // miles
  acceptFloodRisk: boolean;

  // Quick mode default
  defaultQuickMode: boolean;
};