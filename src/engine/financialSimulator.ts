import { BusinessRecord, ForecastRecord, ScenarioParameters, CombinedChartPoint } from '../types/data';
import { generateFxForecast } from './forecastingModels';

/**
 * Seasonal multipliers derived from historical quarterly units patterns
 * Q1: ~0.95, Q2: ~0.98, Q3: ~1.00, Q4: ~1.08 (holiday electronics surge)
 */
const QUARTERLY_VOLUME_FACTORS: Record<string, number> = {
  Q1: 0.95,
  Q2: 0.98,
  Q3: 1.00,
  Q4: 1.08,
};

/**
 * Generates month strings for 60 forecast months (2026-10-01 to 2031-09-01)
 */
export function getForecastMonthStrings(startDateStr = '2026-09-01', count = 60): { month: string; quarter: string }[] {
  const [startYear, startMonth] = startDateStr.split('-').map(Number);
  const result: { month: string; quarter: string }[] = [];

  let y = startYear;
  let m = startMonth; // 1-indexed

  for (let i = 0; i < count; i++) {
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    const monthStr = `${y}-${String(m).padStart(2, '0')}-01`;
    const quarterNum = Math.floor((m - 1) / 3) + 1;
    result.push({
      month: monthStr,
      quarter: `Q${quarterNum}`,
    });
  }

  return result;
}

/**
 * Simulates complete 60-Month Financial Projection according to strict accounting identities
 */
export function simulateFinancialForecast(
  historicalRecords: BusinessRecord[],
  scenario: ScenarioParameters
): ForecastRecord[] {
  if (historicalRecords.length === 0) return [];

  const latest = historicalRecords[historicalRecords.length - 1];
  const fxResult = generateFxForecast(
    historicalRecords,
    scenario.annualInflationPct,
    scenario.fxInflationSensitivityMultiplier
  );

  const forecastDates = getForecastMonthStrings(latest.month, 60);

  // Growth rates compounded monthly: r_m = (1 + r_a)^(1/12) - 1
  const annualSalesGrowth = scenario.annualSalesGrowthPct / 100;
  const monthlySalesGrowth = Math.pow(1 + annualSalesGrowth, 1 / 12) - 1;

  const annualUsdCostGrowth = scenario.annualUsdCostGrowthPct / 100;
  const monthlyUsdCostGrowth = Math.pow(1 + annualUsdCostGrowth, 1 / 12) - 1;

  const annualInflation = scenario.annualInflationPct / 100;
  const monthlyInflation = Math.pow(1 + annualInflation, 1 / 12) - 1;

  const effectiveOpCostInflation = annualInflation * (scenario.opCostInflationSensitivityPct / 100);
  const monthlyOpCostInflation = Math.pow(1 + Math.max(-0.5, effectiveOpCostInflation), 1 / 12) - 1;

  const priceInfPassThrough = scenario.priceInflationPassThroughPct / 100;
  const fxCostPassThrough = scenario.fxCostPassThroughPct / 100;

  const baseUnits = latest.unitsSold;
  const baseUsdCost = latest.importCostUsdPerUnit;
  const baseSellingPrice = latest.avgSellingPriceNgn;
  const baseMarketingSpend = latest.marketingSpendNgn;
  const baseOtherOpCost = latest.otherOperatingCostNgn;
  const baseImportCostNgn = latest.importCostNgnPerUnit;

  const forecast: ForecastRecord[] = [];

  let prevFxRate = latest.usdNgnPlanningRate;

  for (let i = 0; i < 60; i++) {
    const { month, quarter } = forecastDates[i];
    const forecastMonthIndex = i + 1;
    const fxRate = fxResult.rates[i];
    const fxBaselineRate = fxResult.baselineRates[i];
    const fxLower80 = fxResult.lower80[i];
    const fxUpper80 = fxResult.upper80[i];
    const fxLower95 = fxResult.lower95[i];
    const fxUpper95 = fxResult.upper95[i];

    // 1. Units Sold (Compounded monthly with seasonal quarter adjustments)
    const trendUnits = baseUnits * Math.pow(1 + monthlySalesGrowth, forecastMonthIndex);
    const seasonMultiplier = QUARTERLY_VOLUME_FACTORS[quarter] || 1.0;
    const unitsSold = Math.round(trendUnits * seasonMultiplier);

    // 2. Import Cost USD per Unit
    const importCostUsdPerUnit = parseFloat((baseUsdCost * Math.pow(1 + monthlyUsdCostGrowth, forecastMonthIndex)).toFixed(2));

    // 3. Import Cost in NGN per Unit = USD Import Cost × Forecast FX Rate
    const importCostNgnPerUnit = parseFloat((importCostUsdPerUnit * fxRate).toFixed(2));

    // 4. Cost of Goods Sold = Forecast Units Sold × Import Cost in NGN per Unit
    const cogsNgn = Math.round(unitsSold * importCostNgnPerUnit);

    // 5. Average Selling Price in NGN
    // Adjusts for FX cost escalation (pass-through) and general price inflation pass-through
    const deltaNgnImportCost = importCostNgnPerUnit - baseImportCostNgn;
    const fxPriceEscalation = deltaNgnImportCost * fxCostPassThrough;
    const inflationPriceEscalation = baseSellingPrice * (Math.pow(1 + monthlyInflation * priceInfPassThrough, forecastMonthIndex) - 1);
    
    const avgSellingPriceNgn = Math.round(baseSellingPrice + fxPriceEscalation + inflationPriceEscalation);

    // 6. Sales Revenue = Units Sold × Average Selling Price
    const salesRevenueNgn = Math.round(unitsSold * avgSellingPriceNgn);

    // 7. Gross Profit = Sales Revenue - COGS
    const grossProfitNgn = salesRevenueNgn - cogsNgn;
    const grossMarginPct = salesRevenueNgn > 0 ? grossProfitNgn / salesRevenueNgn : 0;

    // 8. Operating Costs (inflated by inflation × sensitivity, plus Q4 marketing surge)
    const qMarketingBoost = quarter === 'Q4' ? 1.25 : (quarter === 'Q1' ? 0.90 : 1.0);
    const marketingSpendNgn = Math.round(baseMarketingSpend * Math.pow(1 + monthlyOpCostInflation, forecastMonthIndex) * qMarketingBoost);
    const otherOperatingCostNgn = Math.round(baseOtherOpCost * Math.pow(1 + monthlyOpCostInflation, forecastMonthIndex));

    // 9. Operating Profit = Gross Profit - Marketing Spend - Other Operating Costs
    const operatingProfitNgn = grossProfitNgn - marketingSpendNgn - otherOperatingCostNgn;
    const operatingMarginPct = salesRevenueNgn > 0 ? operatingProfitNgn / salesRevenueNgn : 0;

    // Uncertainty intervals for operating profit (based on FX 80% confidence interval)
    // When FX is at upper80 (higher dollar cost in naira), COGS increases by (fxUpper80 - fxRate) * importCostUsdPerUnit * units * (1 - fxCostPassThrough)
    const fxDisparityUpper = (fxUpper80 - fxRate) * importCostUsdPerUnit * unitsSold * (1 - fxCostPassThrough * 0.7);
    const fxDisparityLower = (fxRate - fxLower80) * importCostUsdPerUnit * unitsSold * (1 - fxCostPassThrough * 0.7);

    const operatingProfitLower80 = Math.round(operatingProfitNgn - fxDisparityUpper);
    const operatingProfitUpper80 = Math.round(operatingProfitNgn + fxDisparityLower);

    // 10. Risk Identification
    const riskNotes: string[] = [];
    let riskLevel: 'normal' | 'moderate' | 'high' = 'normal';

    const fxMoMChange = (fxRate - prevFxRate) / prevFxRate;
    if (fxMoMChange >= 0.05) {
      riskNotes.push(`FX Shock: +${(fxMoMChange * 100).toFixed(1)}% MoM depreciation`);
      riskLevel = 'high';
    }
    if (operatingProfitNgn < 0) {
      riskNotes.push(`Negative Profitability: -₦${Math.abs(Math.round(operatingProfitNgn)).toLocaleString()}`);
      riskLevel = 'high';
    } else if (operatingMarginPct < 0.15) {
      riskNotes.push(`Compressed Margin: ${(operatingMarginPct * 100).toFixed(1)}% (<15%)`);
      if (riskLevel !== 'high') riskLevel = 'high';
    } else if (operatingMarginPct < 0.22) {
      riskNotes.push(`Thin Margin: ${(operatingMarginPct * 100).toFixed(1)}% (<22%)`);
      if (riskLevel === 'normal') riskLevel = 'moderate';
    }

    const unitCostInflationPct = (importCostNgnPerUnit - baseImportCostNgn) / baseImportCostNgn;
    if (unitCostInflationPct > 0.80) {
      riskNotes.push(`Severe Cumulative Import Cost Inflation: +${(unitCostInflationPct * 100).toFixed(0)}%`);
      if (riskLevel === 'normal') riskLevel = 'moderate';
    }

    prevFxRate = fxRate;

    forecast.push({
      month,
      quarter,
      isForecast: true,
      forecastMonthIndex,
      usdNgnRate: fxRate,
      usdNgnRateLower80: fxLower80,
      usdNgnRateUpper80: fxUpper80,
      usdNgnRateLower95: fxLower95,
      usdNgnRateUpper95: fxUpper95,
      baselineUsdNgnRate: fxBaselineRate,
      inflationYoYPct: annualInflation,
      unitsSold,
      avgSellingPriceNgn,
      importCostUsdPerUnit,
      importCostNgnPerUnit,
      cogsNgn,
      marketingSpendNgn,
      otherOperatingCostNgn,
      salesRevenueNgn,
      grossProfitNgn,
      grossMarginPct,
      operatingProfitNgn,
      operatingMarginPct,
      operatingProfitLower80,
      operatingProfitUpper80,
      riskLevel,
      riskNotes,
    });
  }

  return forecast;
}

/**
 * Builds continuous chart data connecting final historical point cleanly to forecast
 */
export function buildCombinedChartSeries(
  historical: BusinessRecord[],
  forecast: ForecastRecord[]
): CombinedChartPoint[] {
  const points: CombinedChartPoint[] = [];

  // Historical records
  for (let i = 0; i < historical.length; i++) {
    const h = historical[i];
    const isLast = i === historical.length - 1;

    points.push({
      month: h.month,
      displayDate: h.month.slice(0, 7),
      isForecast: false,
      quarter: h.quarter,
      usdNgnRate: h.usdNgnPlanningRate,
      historicalRate: h.usdNgnPlanningRate,
      // For the last historical point, also provide forecastRate so the line connects seamlessly!
      forecastRate: isLast ? h.usdNgnPlanningRate : undefined,
      fxBaselineRate: isLast ? h.usdNgnPlanningRate : undefined,
      fxLower80: isLast ? h.usdNgnPlanningRate : undefined,
      fxUpper80: isLast ? h.usdNgnPlanningRate : undefined,
      salesRevenueNgn: h.salesRevenueNgn,
      cogsNgn: h.cogsNgn,
      grossProfitNgn: h.grossProfitNgn,
      operatingProfitNgn: h.operatingProfitNgn,
      historicalOpProfit: h.operatingProfitNgn,
      forecastOpProfit: isLast ? h.operatingProfitNgn : undefined,
      opProfitLower80: isLast ? h.operatingProfitNgn : undefined,
      opProfitUpper80: isLast ? h.operatingProfitNgn : undefined,
      grossMarginPct: h.grossMarginPct,
      operatingMarginPct: h.operatingMarginPct,
      isNegativeProfit: h.operatingProfitNgn < 0,
      marketNotes: h.marketNotes,
    });
  }

  // Forecast records
  for (const f of forecast) {
    points.push({
      month: f.month,
      displayDate: f.month.slice(0, 7),
      isForecast: true,
      quarter: f.quarter,
      usdNgnRate: f.usdNgnRate,
      forecastRate: f.usdNgnRate,
      fxBaselineRate: f.baselineUsdNgnRate,
      fxLower80: f.usdNgnRateLower80,
      fxUpper80: f.usdNgnRateUpper80,
      salesRevenueNgn: f.salesRevenueNgn,
      cogsNgn: f.cogsNgn,
      grossProfitNgn: f.grossProfitNgn,
      operatingProfitNgn: f.operatingProfitNgn,
      forecastOpProfit: f.operatingProfitNgn,
      opProfitLower80: f.operatingProfitLower80,
      opProfitUpper80: f.operatingProfitUpper80,
      grossMarginPct: f.grossMarginPct,
      operatingMarginPct: f.operatingMarginPct,
      isNegativeProfit: f.operatingProfitNgn < 0,
      marketNotes: f.riskNotes.join('; '),
    });
  }

  return points;
}
