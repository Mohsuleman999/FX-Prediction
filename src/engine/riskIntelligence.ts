import { ForecastRecord, RiskIntelligenceSummary } from '../types/data';

/**
 * Evaluates comprehensive financial and operational risks across the 60 forecast months
 */
export function analyzeRiskIntelligence(forecast: ForecastRecord[]): RiskIntelligenceSummary {
  if (forecast.length === 0) {
    return {
      highRiskMonthsCount: 0,
      moderateRiskMonthsCount: 0,
      firstSevereMonth: null,
      lowestOperatingMarginPct: 0,
      lowestMarginMonth: null,
      negativeProfitMonthsCount: 0,
      totalFxDepreciationPct: 0,
      riskTimeline: [],
    };
  }

  let highRiskCount = 0;
  let moderateRiskCount = 0;
  let negativeProfitCount = 0;
  let firstSevereMonth: string | null = null;
  let lowestMargin = Infinity;
  let lowestMarginMonth: string | null = null;

  const riskTimeline: RiskIntelligenceSummary['riskTimeline'] = [];

  for (const record of forecast) {
    if (record.operatingMarginPct < lowestMargin) {
      lowestMargin = record.operatingMarginPct;
      lowestMarginMonth = record.month;
    }

    if (record.operatingProfitNgn < 0) {
      negativeProfitCount++;
    }

    if (record.riskLevel === 'high') {
      highRiskCount++;
      if (!firstSevereMonth) {
        firstSevereMonth = record.month;
      }
      riskTimeline.push({
        month: record.month,
        quarter: record.quarter,
        level: 'high',
        triggers: record.riskNotes,
        operatingMarginPct: record.operatingMarginPct,
        usdNgnRate: record.usdNgnRate,
      });
    } else if (record.riskLevel === 'moderate') {
      moderateRiskCount++;
      riskTimeline.push({
        month: record.month,
        quarter: record.quarter,
        level: 'moderate',
        triggers: record.riskNotes,
        operatingMarginPct: record.operatingMarginPct,
        usdNgnRate: record.usdNgnRate,
      });
    }
  }

  const firstRate = forecast[0].usdNgnRate;
  const lastRate = forecast[forecast.length - 1].usdNgnRate;
  const totalFxDepreciationPct = ((lastRate - firstRate) / firstRate) * 100;

  return {
    highRiskMonthsCount: highRiskCount,
    moderateRiskMonthsCount: moderateRiskCount,
    firstSevereMonth,
    lowestOperatingMarginPct: lowestMargin === Infinity ? 0 : lowestMargin,
    lowestMarginMonth,
    negativeProfitMonthsCount: negativeProfitCount,
    totalFxDepreciationPct,
    riskTimeline,
  };
}
