import { ForecastRecord, BusinessRecord } from '../types/data';

/**
 * Downloads arbitrary text/csv as a file in the browser
 */
export function downloadFile(filename: string, content: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts 60-Month Forecast records into clean CSV string
 */
export function exportForecastToCsv(forecast: ForecastRecord[]): string {
  const headers = [
    'Month',
    'Quarter',
    'Forecast_Month_Index',
    'USD_NGN_Projected_Rate',
    'USD_NGN_Lower_80CI',
    'USD_NGN_Upper_80CI',
    'Inflation_YoY_Pct',
    'Units_Sold',
    'Import_Cost_USD_Per_Unit',
    'Import_Cost_NGN_Per_Unit',
    'Avg_Selling_Price_NGN',
    'Sales_Revenue_NGN',
    'COGS_NGN',
    'Gross_Profit_NGN',
    'Gross_Margin_Pct',
    'Marketing_Spend_NGN',
    'Other_Operating_Cost_NGN',
    'Operating_Profit_NGN',
    'Operating_Margin_Pct',
    'Risk_Level',
    'Risk_Triggers',
  ];

  const rows = forecast.map((r) => [
    r.month,
    r.quarter,
    r.forecastMonthIndex,
    r.usdNgnRate.toFixed(2),
    r.usdNgnRateLower80.toFixed(2),
    r.usdNgnRateUpper80.toFixed(2),
    r.inflationYoYPct.toFixed(4),
    r.unitsSold,
    r.importCostUsdPerUnit.toFixed(2),
    r.importCostNgnPerUnit.toFixed(2),
    r.avgSellingPriceNgn,
    r.salesRevenueNgn,
    r.cogsNgn,
    r.grossProfitNgn,
    r.grossMarginPct.toFixed(4),
    r.marketingSpendNgn,
    r.otherOperatingCostNgn,
    r.operatingProfitNgn,
    r.operatingMarginPct.toFixed(4),
    r.riskLevel,
    `"${r.riskNotes.join('; ')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Converts Historical records into clean CSV string
 */
export function exportHistoricalToCsv(records: BusinessRecord[]): string {
  const headers = [
    'Month',
    'USD_NGN_Planning_Rate',
    'Inflation_YoY_Pct',
    'Units_Sold',
    'Import_Cost_USD_Per_Unit',
    'Avg_Selling_Price_NGN',
    'Marketing_Spend_NGN',
    'Other_Operating_Cost_NGN',
    'FX_Change_MoM_Pct',
    'Import_Cost_NGN_Per_Unit',
    'COGS_NGN',
    'Sales_Revenue_NGN',
    'Gross_Profit_NGN',
    'Gross_Margin_Pct',
    'Operating_Profit_NGN',
    'Operating_Margin_Pct',
    'Quarter',
    'Market_Notes',
  ];

  const rows = records.map((r) => [
    r.month,
    r.usdNgnPlanningRate,
    r.inflationYoYPct.toFixed(6),
    r.unitsSold,
    r.importCostUsdPerUnit,
    r.avgSellingPriceNgn,
    r.marketingSpendNgn,
    r.otherOperatingCostNgn,
    r.fxChangeMoMPct !== null ? r.fxChangeMoMPct.toFixed(6) : '',
    r.importCostNgnPerUnit,
    r.cogsNgn,
    r.salesRevenueNgn,
    r.grossProfitNgn,
    r.grossMarginPct.toFixed(6),
    r.operatingProfitNgn,
    r.operatingMarginPct.toFixed(6),
    r.quarter,
    `"${r.marketNotes || ''}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
