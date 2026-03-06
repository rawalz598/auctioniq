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
  vin?: string;

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
  repairOverride?: number;
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
  targetProfit: number;
  minProfitMarginPct: number;

  feeModel: FeeModel;

  // SIMPLE fees: flat + %
  feeFlat: number;
  feePct: number;

  transportAverage: number;

  riskBufferPct: number;
  laborRate: number;
  highMileageThreshold: number;
  veryHighMileageThreshold: number;
  acceptFloodRisk: boolean;

  defaultQuickMode: boolean;
};