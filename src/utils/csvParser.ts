import { BusinessRecord, DataQualityReport } from '../types/data';

/**
 * Robust CSV Line Parser that handles quoted strings with commas and trims
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses and validates CSV content into BusinessRecord array
 */
export function parseBusinessCsv(csvText: string): {
  records: BusinessRecord[];
  report: DataQualityReport;
  errors: string[];
} {
  const errors: string[] = [];
  const anomalies: string[] = [];
  
  if (!csvText || !csvText.trim()) {
    return {
      records: [],
      report: {
        totalRows: 0,
        startDate: '',
        endDate: '',
        latestRate: 0,
        latestInflationPct: 0,
        firstMonthFxMissingExpected: true,
        anomaliesDetected: ['Empty CSV provided'],
        isSyntheticEducationData: true,
      },
      errors: ['The uploaded CSV file is empty.'],
    };
  }

  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    return {
      records: [],
      report: {
        totalRows: 0,
        startDate: '',
        endDate: '',
        latestRate: 0,
        latestInflationPct: 0,
        firstMonthFxMissingExpected: true,
        anomaliesDetected: ['Insufficient rows'],
        isSyntheticEducationData: true,
      },
      errors: ['CSV file must have a header row and at least one data row.'],
    };
  }

  const header = parseCsvLine(lines[0]).map(h => h.trim());
  const expectedColumns = [
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
  ];

  // Validate column headers
  for (const col of expectedColumns) {
    if (!header.includes(col)) {
      errors.push(`Missing expected column: "${col}"`);
    }
  }

  if (errors.length > 0) {
    return {
      records: [],
      report: {
        totalRows: 0,
        startDate: '',
        endDate: '',
        latestRate: 0,
        latestInflationPct: 0,
        firstMonthFxMissingExpected: true,
        anomaliesDetected: errors,
        isSyntheticEducationData: true,
      },
      errors,
    };
  }

  const colIdx = (name: string) => header.indexOf(name);
  const records: BusinessRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = parseCsvLine(lines[i]);
    if (rawCols.length < expectedColumns.length) {
      continue; // Skip malformed trailing empty row
    }

    const month = rawCols[colIdx('Month')];
    const usdNgnPlanningRate = parseFloat(rawCols[colIdx('USD_NGN_Planning_Rate')]) || 0;
    
    // Crucial rule: Inflation_YoY_Pct is stored as decimal fraction (0.2067 = 20.67%)
    let inflationYoYPct = parseFloat(rawCols[colIdx('Inflation_YoY_Pct')]);
    if (isNaN(inflationYoYPct)) {
      inflationYoYPct = 0;
    } else if (inflationYoYPct > 1.5) {
      // If someone inputted 20.67 instead of 0.2067, normalize it to decimal
      inflationYoYPct = inflationYoYPct / 100;
    }

    const unitsSold = parseInt(rawCols[colIdx('Units_Sold')], 10) || 0;
    const importCostUsdPerUnit = parseFloat(rawCols[colIdx('Import_Cost_USD_Per_Unit')]) || 0;
    const avgSellingPriceNgn = parseFloat(rawCols[colIdx('Avg_Selling_Price_NGN')]) || 0;
    const marketingSpendNgn = parseFloat(rawCols[colIdx('Marketing_Spend_NGN')]) || 0;
    const otherOperatingCostNgn = parseFloat(rawCols[colIdx('Other_Operating_Cost_NGN')]) || 0;
    
    // First month MoM FX change is expected null
    const rawFxMoM = rawCols[colIdx('FX_Change_MoM_Pct')];
    const fxChangeMoMPct = rawFxMoM === '' || rawFxMoM === undefined || isNaN(parseFloat(rawFxMoM)) 
      ? null 
      : parseFloat(rawFxMoM);

    const importCostNgnPerUnit = parseFloat(rawCols[colIdx('Import_Cost_NGN_Per_Unit')]) || (importCostUsdPerUnit * usdNgnPlanningRate);
    const cogsNgn = parseFloat(rawCols[colIdx('COGS_NGN')]) || (unitsSold * importCostNgnPerUnit);
    const salesRevenueNgn = parseFloat(rawCols[colIdx('Sales_Revenue_NGN')]) || (unitsSold * avgSellingPriceNgn);
    const grossProfitNgn = parseFloat(rawCols[colIdx('Gross_Profit_NGN')]) || (salesRevenueNgn - cogsNgn);
    const grossMarginPct = parseFloat(rawCols[colIdx('Gross_Margin_Pct')]) || (salesRevenueNgn > 0 ? grossProfitNgn / salesRevenueNgn : 0);
    const operatingProfitNgn = parseFloat(rawCols[colIdx('Operating_Profit_NGN')]) || (grossProfitNgn - marketingSpendNgn - otherOperatingCostNgn);
    const operatingMarginPct = parseFloat(rawCols[colIdx('Operating_Margin_Pct')]) || (salesRevenueNgn > 0 ? operatingProfitNgn / salesRevenueNgn : 0);

    const quarter = colIdx('Quarter') >= 0 ? rawCols[colIdx('Quarter')] : `Q${Math.floor(new Date(month).getMonth() / 3) + 1}`;
    const marketNotes = colIdx('Market_Notes') >= 0 ? (rawCols[colIdx('Market_Notes')] || '') : '';

    // Check for known regime shift anomalies in historical records
    if (fxChangeMoMPct !== null && fxChangeMoMPct > 0.20) {
      anomalies.push(`${month}: Major FX depreciation spike of ${(fxChangeMoMPct * 100).toFixed(1)}% MoM detected`);
    }
    if (operatingProfitNgn < 0) {
      anomalies.push(`${month}: Historical operating loss detected (-₦${Math.abs(Math.round(operatingProfitNgn)).toLocaleString()})`);
    }

    records.push({
      month,
      usdNgnPlanningRate,
      inflationYoYPct,
      unitsSold,
      importCostUsdPerUnit,
      avgSellingPriceNgn,
      marketingSpendNgn,
      otherOperatingCostNgn,
      fxChangeMoMPct,
      importCostNgnPerUnit,
      cogsNgn,
      salesRevenueNgn,
      grossProfitNgn,
      grossMarginPct,
      operatingProfitNgn,
      operatingMarginPct,
      quarter,
      marketNotes,
    });
  }

  // Sort chronologically
  records.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  const latestRecord = records[records.length - 1] || {} as BusinessRecord;

  const report: DataQualityReport = {
    totalRows: records.length,
    startDate: records.length > 0 ? records[0].month : '',
    endDate: records.length > 0 ? latestRecord.month : '',
    latestRate: latestRecord.usdNgnPlanningRate || 0,
    latestInflationPct: (latestRecord.inflationYoYPct || 0) * 100,
    firstMonthFxMissingExpected: records.length > 0 && records[0].fxChangeMoMPct === null,
    anomaliesDetected: anomalies,
    isSyntheticEducationData: true,
  };

  return { records, report, errors };
}

/**
 * Format currency numbers with K, M, B abbreviations in NGN
 */
export function formatNgn(val: number): string {
  const isNeg = val < 0;
  const abs = Math.abs(val);

  if (abs >= 1_000_000_000) {
    return `${isNeg ? '-' : ''}₦${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${isNeg ? '-' : ''}₦${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${isNeg ? '-' : ''}₦${(abs / 1_000).toFixed(1)}K`;
  }
  return `${isNeg ? '-' : ''}₦${abs.toFixed(0)}`;
}

/**
 * Format exchange rate with ₦ per US$1
 */
export function formatFxRate(rate: number): string {
  return `₦${rate.toFixed(2)} / US$`;
}

/**
 * Format percentage
 */
export function formatPct(val: number, decimals = 1): string {
  return `${(val * 100).toFixed(decimals)}%`;
}

/**
 * Format date display (e.g. Oct 2026)
 */
export function formatMonthDisplay(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(month, 10) - 1;
  return `${months[monthIdx]} ${year}`;
}
