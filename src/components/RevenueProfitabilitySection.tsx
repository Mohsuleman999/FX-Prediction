import React, { useMemo } from 'react';
import { BusinessRecord, ForecastRecord, ScenarioParameters } from '../types/data';
import { formatNgn, formatPct } from '../utils/csvParser';
import { DollarSign, Layers, PieChart, ShieldCheck } from 'lucide-react';

interface RevenueProfitabilitySectionProps {
  historicalRecords: BusinessRecord[];
  forecastRecords: ForecastRecord[];
  scenario: ScenarioParameters;
}

interface AnnualSummary {
  periodLabel: string;
  calendarRange: string;
  unitsSold: number;
  salesRevenueNgn: number;
  cogsNgn: number;
  grossProfitNgn: number;
  grossMarginPct: number;
  operatingCostsNgn: number;
  operatingProfitNgn: number;
  operatingMarginPct: number;
  avgFxRate: number;
}

export const RevenueProfitabilitySection: React.FC<RevenueProfitabilitySectionProps> = ({
  historicalRecords,
  forecastRecords,
  scenario,
}) => {
  // Compute 5-Year Annual Summaries (12 months per forecast year)
  const annualSummaries = useMemo<AnnualSummary[]>(() => {
    if (forecastRecords.length < 60) return [];

    const years = [
      { id: 'FY27', label: 'Year 1 (FY27)', range: 'Oct 2026 – Sep 2027', start: 0, end: 12 },
      { id: 'FY28', label: 'Year 2 (FY28)', range: 'Oct 2027 – Sep 2028', start: 12, end: 24 },
      { id: 'FY29', label: 'Year 3 (FY29)', range: 'Oct 2028 – Sep 2029', start: 24, end: 36 },
      { id: 'FY30', label: 'Year 4 (FY30)', range: 'Oct 2029 – Sep 2030', start: 36, end: 48 },
      { id: 'FY31', label: 'Year 5 (FY31)', range: 'Oct 2030 – Sep 2031', start: 48, end: 60 },
    ];

    return years.map(y => {
      const slice = forecastRecords.slice(y.start, y.end);
      const units = slice.reduce((a, b) => a + b.unitsSold, 0);
      const rev = slice.reduce((a, b) => a + b.salesRevenueNgn, 0);
      const cogs = slice.reduce((a, b) => a + b.cogsNgn, 0);
      const gross = rev - cogs;
      const opCosts = slice.reduce((a, b) => a + b.marketingSpendNgn + b.otherOperatingCostNgn, 0);
      const opProfit = gross - opCosts;
      const avgFx = slice.reduce((a, b) => a + b.usdNgnRate, 0) / slice.length;

      return {
        periodLabel: y.label,
        calendarRange: y.range,
        unitsSold: units,
        salesRevenueNgn: rev,
        cogsNgn: cogs,
        grossProfitNgn: gross,
        grossMarginPct: rev > 0 ? gross / rev : 0,
        operatingCostsNgn: opCosts,
        operatingProfitNgn: opProfit,
        operatingMarginPct: rev > 0 ? opProfit / rev : 0,
        avgFxRate: avgFx,
      };
    });
  }, [forecastRecords]);

  // Aggregate 5-Year Totals
  const fiveYearTotals = useMemo(() => {
    return annualSummaries.reduce(
      (acc, curr) => ({
        unitsSold: acc.unitsSold + curr.unitsSold,
        salesRevenueNgn: acc.salesRevenueNgn + curr.salesRevenueNgn,
        cogsNgn: acc.cogsNgn + curr.cogsNgn,
        grossProfitNgn: acc.grossProfitNgn + curr.grossProfitNgn,
        operatingCostsNgn: acc.operatingCostsNgn + curr.operatingCostsNgn,
        operatingProfitNgn: acc.operatingProfitNgn + curr.operatingProfitNgn,
      }),
      { unitsSold: 0, salesRevenueNgn: 0, cogsNgn: 0, grossProfitNgn: 0, operatingCostsNgn: 0, operatingProfitNgn: 0 }
    );
  }, [annualSummaries]);

  // Currency Impact Decomposition
  const latestHist = historicalRecords[historicalRecords.length - 1];
  const finalFcast = forecastRecords[forecastRecords.length - 1];
  const fxDriftNgn = finalFcast ? finalFcast.usdNgnRate - latestHist.usdNgnPlanningRate : 0;
  const unitNgnCostIncrease = finalFcast ? finalFcast.importCostNgnPerUnit - latestHist.importCostNgnPerUnit : 0;
  const fxCostPassThroughShare = unitNgnCostIncrease * (scenario.fxCostPassThroughPct / 100);
  const unabsorbedFxBurden = unitNgnCostIncrease - fxCostPassThroughShare;

  return (
    <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-400 mb-0.5">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Section D · Revenue & Profitability Breakdown</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            5-Year Financial Statement Horizon (FY2027 – FY2031)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Annualized P&L summaries and currency exposure impact across commercial operations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 bg-teal-400 rounded-sm inline-block" />
          <span>Accounting Identities Enforced: Revenue = Units × ASP; GP = Rev − COGS; OP = GP − OpEx</span>
        </div>
      </div>

      {/* Currency Pass-Through & Impact Decomposition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Import Cost Escalation */}
        <div className="bg-[#080e21] border border-slate-800/80 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Import Cost per Unit (NGN)</span>
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
            {formatNgn(latestHist?.importCostNgnPerUnit || 0)} → {formatNgn(finalFcast?.importCostNgnPerUnit || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Unit cost rises by <span className="text-amber-400 font-mono">+{formatNgn(unitNgnCostIncrease)}</span> (+{((unitNgnCostIncrease / (latestHist?.importCostNgnPerUnit || 1)) * 100).toFixed(0)}%) driven by ₦{fxDriftNgn.toFixed(0)} FX depreciation.
          </div>
        </div>

        {/* Card 2: Price Shielding via Pass-Through */}
        <div className="bg-[#080e21] border border-slate-800/80 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Price Shielding (Pass-Through)</span>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-300 tabular-nums">
            +{formatNgn(fxCostPassThroughShare)} <span className="text-xs text-slate-400">/ unit</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            At <span className="text-teal-300 font-mono">{scenario.fxCostPassThroughPct.toFixed(0)}% pass-through</span>, ₦{fxCostPassThroughShare.toFixed(0)} of FX cost escalation is successfully transferred into customer wholesale prices.
          </div>
        </div>

        {/* Card 3: Unabsorbed Cost Cushion Burden */}
        <div className="bg-[#080e21] border border-slate-800/80 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Unabsorbed Margin Burden</span>
            <PieChart className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 tabular-nums">
            -{formatNgn(unabsorbedFxBurden)} <span className="text-xs text-slate-400">/ unit</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {(100 - scenario.fxCostPassThroughPct).toFixed(0)}% of import cost escalation is absorbed internally by Meridian, squeezing gross margins.
          </div>
        </div>
      </div>

      {/* Annual Summary P&L Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-[#070e20] text-slate-400 font-semibold uppercase text-[11px]">
              <th className="py-2.5 px-3">Period</th>
              <th className="py-2.5 px-3">Calendar Span</th>
              <th className="py-2.5 px-3 text-right">Avg FX Rate</th>
              <th className="py-2.5 px-3 text-right">Units Sold</th>
              <th className="py-2.5 px-3 text-right">Sales Revenue</th>
              <th className="py-2.5 px-3 text-right">COGS (NGN)</th>
              <th className="py-2.5 px-3 text-right">Gross Profit</th>
              <th className="py-2.5 px-3 text-right">Gross Margin</th>
              <th className="py-2.5 px-3 text-right">Op Costs</th>
              <th className="py-2.5 px-3 text-right">Operating Profit</th>
              <th className="py-2.5 px-3 text-right">Op Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {annualSummaries.map((yr, idx) => (
              <tr key={yr.periodLabel} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-3 font-sans font-bold text-slate-200">
                  {yr.periodLabel}
                </td>
                <td className="py-2.5 px-3 font-sans text-slate-400">
                  {yr.calendarRange}
                </td>
                <td className="py-2.5 px-3 text-right text-cyan-300 tabular-nums">
                  ₦{yr.avgFxRate.toFixed(2)}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-200 tabular-nums">
                  {yr.unitsSold.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right text-white font-medium tabular-nums">
                  {formatNgn(yr.salesRevenueNgn)}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">
                  {formatNgn(yr.cogsNgn)}
                </td>
                <td className="py-2.5 px-3 text-right text-teal-300 tabular-nums">
                  {formatNgn(yr.grossProfitNgn)}
                </td>
                <td className="py-2.5 px-3 text-right text-cyan-300 tabular-nums">
                  {(yr.grossMarginPct * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">
                  {formatNgn(yr.operatingCostsNgn)}
                </td>
                <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${
                  yr.operatingProfitNgn < 0 ? 'text-rose-400' : 'text-emerald-300'
                }`}>
                  {formatNgn(yr.operatingProfitNgn)}
                </td>
                <td className={`py-2.5 px-3 text-right font-semibold tabular-nums ${
                  yr.operatingMarginPct < 0.15 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {(yr.operatingMarginPct * 100).toFixed(1)}%
                </td>
              </tr>
            ))}

            {/* 5-Year Cumulative Row */}
            <tr className="bg-[#070d1e] font-bold border-t-2 border-slate-700 text-slate-200">
              <td className="py-3 px-3 font-sans uppercase tracking-wider text-teal-400">
                5-Year Total
              </td>
              <td className="py-3 px-3 font-sans text-slate-400 text-[11px]">
                60 Months Total
              </td>
              <td className="py-3 px-3 text-right text-cyan-400 tabular-nums">
                —
              </td>
              <td className="py-3 px-3 text-right tabular-nums">
                {fiveYearTotals.unitsSold.toLocaleString()}
              </td>
              <td className="py-3 px-3 text-right text-cyan-200 tabular-nums">
                {formatNgn(fiveYearTotals.salesRevenueNgn)}
              </td>
              <td className="py-3 px-3 text-right text-slate-400 tabular-nums">
                {formatNgn(fiveYearTotals.cogsNgn)}
              </td>
              <td className="py-3 px-3 text-right text-teal-300 tabular-nums">
                {formatNgn(fiveYearTotals.grossProfitNgn)}
              </td>
              <td className="py-3 px-3 text-right text-cyan-300 tabular-nums">
                {(fiveYearTotals.salesRevenueNgn > 0 ? (fiveYearTotals.grossProfitNgn / fiveYearTotals.salesRevenueNgn) * 100 : 0).toFixed(1)}%
              </td>
              <td className="py-3 px-3 text-right text-slate-400 tabular-nums">
                {formatNgn(fiveYearTotals.operatingCostsNgn)}
              </td>
              <td className={`py-3 px-3 text-right tabular-nums ${
                fiveYearTotals.operatingProfitNgn < 0 ? 'text-rose-400' : 'text-emerald-300'
              }`}>
                {formatNgn(fiveYearTotals.operatingProfitNgn)}
              </td>
              <td className="py-3 px-3 text-right text-emerald-400 tabular-nums">
                {(fiveYearTotals.salesRevenueNgn > 0 ? (fiveYearTotals.operatingProfitNgn / fiveYearTotals.salesRevenueNgn) * 100 : 0).toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
