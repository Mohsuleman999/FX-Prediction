/**
 * Types for Meridian AI Predictive Analytics & Financial Forecasting
 */

export interface BusinessRecord {
  month: string; // YYYY-MM-DD
  usdNgnPlanningRate: number;
  inflationYoYPct: number; // Stored as decimal fraction, e.g. 0.2067 = 20.67%
  unitsSold: number;
  importCostUsdPerUnit: number;
  avgSellingPriceNgn: number;
  marketingSpendNgn: number;
  otherOperatingCostNgn: number;
  fxChangeMoMPct: number | null; // null for first month
  importCostNgnPerUnit: number;
  cogsNgn: number;
  salesRevenueNgn: number;
  grossProfitNgn: number;
  grossMarginPct: number; // e.g. 0.3783
  operatingProfitNgn: number;
  operatingMarginPct: number; // e.g. 0.2744
  quarter: string; // e.g. 'Q4'
  marketNotes: string;
}

export interface ForecastRecord {
  month: string; // YYYY-MM-DD
  quarter: string;
  isForecast: true;
  forecastMonthIndex: number; // 1 to 60
  
  // FX Forecast & Uncertainty
  usdNgnRate: number;
  usdNgnRateLower80: number;
  usdNgnRateUpper80: number;
  usdNgnRateLower95: number;
  usdNgnRateUpper95: number;
  baselineUsdNgnRate: number; // Unadjusted baseline without scenario override

  // Inflation Assumption
  inflationYoYPct: number;

  // Commercials & Units
  unitsSold: number;
  avgSellingPriceNgn: number;

  // Costs
  importCostUsdPerUnit: number;
  importCostNgnPerUnit: number;
  cogsNgn: number;
  marketingSpendNgn: number;
  otherOperatingCostNgn: number;

  // Financial Outputs
  salesRevenueNgn: number;
  grossProfitNgn: number;
  grossMarginPct: number;
  operatingProfitNgn: number;
  operatingMarginPct: number;
  operatingProfitLower80: number;
  operatingProfitUpper80: number;

  // Risk Flag
  riskLevel: 'normal' | 'moderate' | 'high';
  riskNotes: string[];
}

export interface CombinedChartPoint {
  month: string;
  displayDate: string;
  isForecast: boolean;
  quarter: string;

  // FX
  usdNgnRate: number;
  historicalRate?: number;
  forecastRate?: number;
  fxLower80?: number;
  fxUpper80?: number;
  fxBaselineRate?: number;

  // Financials
  salesRevenueNgn: number;
  cogsNgn: number;
  grossProfitNgn: number;
  operatingProfitNgn: number;
  historicalOpProfit?: number;
  forecastOpProfit?: number;
  opProfitLower80?: number;
  opProfitUpper80?: number;
  grossMarginPct: number;
  operatingMarginPct: number;

  // Indicators
  isNegativeProfit?: boolean;
  marketNotes?: string;
}

export interface ScenarioParameters {
  annualInflationPct: number; // 0% - 50%
  annualSalesGrowthPct: number; // -20% - +40%
  priceInflationPassThroughPct: number; // 0% - 100%
  fxCostPassThroughPct: number; // 0% - 100%
  annualUsdCostGrowthPct: number; // -10% - +25%
  opCostInflationSensitivityPct: number; // 0% - 200%
  fxInflationSensitivityMultiplier: number; // 0.2x - 3.0x
}

export type PresetScenarioKey = 'base' | 'optimistic' | 'stress' | 'custom';

export interface PresetScenario {
  id: PresetScenarioKey;
  name: string;
  tagline: string;
  description: string;
  params: ScenarioParameters;
}

export interface ModelMetric {
  id: string;
  name: string;
  type: string;
  mae: number;
  rmse: number;
  mape: number;
  rSquared?: number;
  isDefensibleBaseline: boolean;
  notes: string;
  formula: string;
}

export interface DataQualityReport {
  totalRows: number;
  startDate: string;
  endDate: string;
  latestRate: number;
  latestInflationPct: number;
  firstMonthFxMissingExpected: boolean;
  anomaliesDetected: string[];
  isSyntheticEducationData: boolean;
}

export interface RiskIntelligenceSummary {
  highRiskMonthsCount: number;
  moderateRiskMonthsCount: number;
  firstSevereMonth: string | null;
  lowestOperatingMarginPct: number;
  lowestMarginMonth: string | null;
  negativeProfitMonthsCount: number;
  totalFxDepreciationPct: number;
  riskTimeline: Array<{
    month: string;
    quarter: string;
    level: 'high' | 'moderate';
    triggers: string[];
    operatingMarginPct: number;
    usdNgnRate: number;
  }>;
}

export interface GroundedInsight {
  id: string;
  category: 'inflation' | 'pricing' | 'scenario' | 'margin' | 'risk';
  title: string;
  summary: string;
  metricImpact: string;
  strategicAction: string;
  sentiment: 'positive' | 'warning' | 'critical' | 'neutral';
}
