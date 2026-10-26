import { BusinessRecord, ForecastRecord, ScenarioParameters, GroundedInsight } from '../types/data';
import { simulateFinancialForecast } from './financialSimulator';
import { formatNgn } from '../utils/csvParser';

export function generateGroundedInsights(
  historicalRecords: BusinessRecord[],
  currentForecast: ForecastRecord[],
  currentScenario: ScenarioParameters
): GroundedInsight[] {
  if (historicalRecords.length === 0 || currentForecast.length === 0) return [];

  const insights: GroundedInsight[] = [];

  // Current 5-Year Totals
  const currentTotalRevenue = currentForecast.reduce((acc, r) => acc + r.salesRevenueNgn, 0);
  const currentTotalOpProfit = currentForecast.reduce((acc, r) => acc + r.operatingProfitNgn, 0);
  const currentAvgOpMargin = currentTotalRevenue > 0 ? (currentTotalOpProfit / currentTotalRevenue) * 100 : 0;

  // 1. Live +5% Inflation Shock Simulation
  const inflationShockScenario: ScenarioParameters = {
    ...currentScenario,
    annualInflationPct: currentScenario.annualInflationPct + 5,
  };
  const shockForecast = simulateFinancialForecast(historicalRecords, inflationShockScenario);
  const shockTotalOpProfit = shockForecast.reduce((acc, r) => acc + r.operatingProfitNgn, 0);
  const shockTotalRevenue = shockForecast.reduce((acc, r) => acc + r.salesRevenueNgn, 0);
  const shockAvgMargin = shockTotalRevenue > 0 ? (shockTotalOpProfit / shockTotalRevenue) * 100 : 0;
  const profitDeltaFromInflation = shockTotalOpProfit - currentTotalOpProfit;
  const marginDeltaFromInflation = shockAvgMargin - currentAvgOpMargin;

  insights.push({
    id: 'inflation-shock-test',
    category: 'inflation',
    title: '+5% Inflation Shock Sensitivity',
    summary: `An incremental +5.0% rise in annual inflation from ${currentScenario.annualInflationPct.toFixed(1)}% to ${(currentScenario.annualInflationPct + 5).toFixed(1)}% alters 5-year cumulative operating profit by ${formatNgn(profitDeltaFromInflation)}.`,
    metricImpact: `${profitDeltaFromInflation >= 0 ? '+' : ''}${formatNgn(profitDeltaFromInflation)} (${marginDeltaFromInflation >= 0 ? '+' : ''}${marginDeltaFromInflation.toFixed(2)} pts margin)`,
    strategicAction: profitDeltaFromInflation < 0 
      ? 'Negotiate longer USD credit terms or raise pass-through parameters above 70% to prevent local cost erosion.' 
      : 'Maintain volume velocity as nominal revenue scales ahead of fixed operational overhead.',
    sentiment: profitDeltaFromInflation < 0 ? 'warning' : 'positive',
  });

  // 2. Pricing Pass-Through Elasticity Defense
  const defensiveScenario: ScenarioParameters = {
    ...currentScenario,
    priceInflationPassThroughPct: Math.min(100, currentScenario.priceInflationPassThroughPct + 15),
    fxCostPassThroughPct: Math.min(100, currentScenario.fxCostPassThroughPct + 15),
  };
  const defensiveForecast = simulateFinancialForecast(historicalRecords, defensiveScenario);
  const defensiveTotalOpProfit = defensiveForecast.reduce((acc, r) => acc + r.operatingProfitNgn, 0);
  const defensiveTotalRevenue = defensiveForecast.reduce((acc, r) => acc + r.salesRevenueNgn, 0);
  const defensiveMargin = defensiveTotalRevenue > 0 ? (defensiveTotalOpProfit / defensiveTotalRevenue) * 100 : 0;
  const marginShield = defensiveMargin - currentAvgOpMargin;
  const profitShieldNgn = defensiveTotalOpProfit - currentTotalOpProfit;

  insights.push({
    id: 'pricing-pass-through-defense',
    category: 'pricing',
    title: 'Margin Shielding Through Pricing Agility',
    summary: `Enhancing pricing pass-through by +15% (to ${(currentScenario.priceInflationPassThroughPct + 15).toFixed(0)}% inflation & ${(currentScenario.fxCostPassThroughPct + 15).toFixed(0)}% FX) recaptures ${formatNgn(profitShieldNgn)} in cumulative operating profit.`,
    metricImpact: `+${formatNgn(profitShieldNgn)} (+${marginShield.toFixed(2)} pts operating margin)`,
    strategicAction: 'Institute bi-weekly FX indexation in distributor wholesale price lists to minimize margin lag during currency volatility.',
    sentiment: 'positive',
  });

  // 3. Margin Compression Detection (Periods where revenue grows but margins compress)
  let compressionYear: number | null = null;
  let revenueGrowthRate = 0;
  let marginDeclinePts = 0;

  // Group forecast by Year 1 through Year 5 (12 months each)
  const yearlyMetrics = [1, 2, 3, 4, 5].map(yr => {
    const yrSlice = currentForecast.slice((yr - 1) * 12, yr * 12);
    const yrRev = yrSlice.reduce((a, b) => a + b.salesRevenueNgn, 0);
    const yrOp = yrSlice.reduce((a, b) => a + b.operatingProfitNgn, 0);
    const yrMargin = yrRev > 0 ? (yrOp / yrRev) * 100 : 0;
    return { yr, yrRev, yrOp, yrMargin };
  });

  for (let i = 1; i < yearlyMetrics.length; i++) {
    const prev = yearlyMetrics[i - 1];
    const curr = yearlyMetrics[i];
    if (curr.yrRev > prev.yrRev && curr.yrMargin < prev.yrMargin) {
      compressionYear = curr.yr;
      revenueGrowthRate = ((curr.yrRev - prev.yrRev) / prev.yrRev) * 100;
      marginDeclinePts = prev.yrMargin - curr.yrMargin;
      break;
    }
  }

  if (compressionYear) {
    insights.push({
      id: 'margin-compression-alert',
      category: 'margin',
      title: `Margin Compression in Year ${compressionYear}`,
      summary: `In Year ${compressionYear} (months ${(compressionYear - 1) * 12 + 1}–${compressionYear * 12}), sales revenue rises by ${revenueGrowthRate.toFixed(1)}% YoY, but operating margin contracts by ${marginDeclinePts.toFixed(2)} percentage points due to compounding import replacement costs.`,
      metricImpact: `-${marginDeclinePts.toFixed(1)}% margin compression despite top-line growth`,
      strategicAction: 'Rationalize lower-margin SKU lines in Year ' + compressionYear + ' and prioritize high-margin accessories with lower dollar import burdens.',
      sentiment: 'warning',
    });
  } else {
    insights.push({
      id: 'margin-stability-observation',
      category: 'margin',
      title: 'Gross & Operating Margin Alignment',
      summary: `Across all 5 forecast years, margin trajectory remains synchronized with top-line growth at an average operating margin of ${currentAvgOpMargin.toFixed(1)}%.`,
      metricImpact: `${currentAvgOpMargin.toFixed(1)}% stable 5-year operating margin`,
      strategicAction: 'Continue disciplined inventory turns to protect working capital against sudden inventory revaluation.',
      sentiment: 'neutral',
    });
  }

  // 4. Stress Case Vulnerability Benchmark
  const stressScenario: ScenarioParameters = {
    annualInflationPct: 36.0,
    annualSalesGrowthPct: -10.0,
    priceInflationPassThroughPct: 35.0,
    fxCostPassThroughPct: 40.0,
    annualUsdCostGrowthPct: 8.0,
    opCostInflationSensitivityPct: 150.0,
    fxInflationSensitivityMultiplier: 1.6,
  };
  const stressForecast = simulateFinancialForecast(historicalRecords, stressScenario);
  const stressTotalOpProfit = stressForecast.reduce((acc, r) => acc + r.operatingProfitNgn, 0);
  const stressVarianceNgn = currentTotalOpProfit - stressTotalOpProfit;

  insights.push({
    id: 'stress-cushion-benchmark',
    category: 'risk',
    title: 'Downside Stress Cushion',
    summary: `Current assumptions provide a ${formatNgn(stressVarianceNgn)} profit buffer above the Macroeconomic Stress Case (36% inflation, -10% unit volume, 40% FX pass-through).`,
    metricImpact: `${formatNgn(stressVarianceNgn)} cushion vs Stress Case`,
    strategicAction: stressTotalOpProfit < 0 
      ? 'Build a naira liquidity reserve to withstand potential months of negative cash generation during macroeconomic shocks.' 
      : 'Maintain hedging and forward supplier contracts for top 20 revenue-driving accessories.',
    sentiment: currentTotalOpProfit > 0 ? 'positive' : 'critical',
  });

  return insights;
}
