import React from 'react';
import { BusinessRecord, ForecastRecord } from '../types/data';
import { formatNgn, formatFxRate, formatPct } from '../utils/csvParser';
import { DollarSign, TrendingUp, TrendingDown, Layers, Activity, Calendar } from 'lucide-react';

interface ExecutiveKpisProps {
  historicalRecords: BusinessRecord[];
  forecastRecords: ForecastRecord[];
}

export const ExecutiveKpis: React.FC<ExecutiveKpisProps> = ({
  historicalRecords,
  forecastRecords,
}) => {
  if (historicalRecords.length === 0 || forecastRecords.length === 0) return null;

  const latestHistorical = historicalRecords[historicalRecords.length - 1];
  const finalForecast = forecastRecords[forecastRecords.length - 1];

  // 5-Year Totals
  const total5YrRevenue = forecastRecords.reduce((acc, r) => acc + r.salesRevenueNgn, 0);
  const total5YrOpProfit = forecastRecords.reduce((acc, r) => acc + r.operatingProfitNgn, 0);
  const aggregate5YrOpMargin = total5YrRevenue > 0 ? (total5YrOpProfit / total5YrRevenue) : 0;

  // Delta calculations
  const fxChange5YrPct = ((finalForecast.usdNgnRate - latestHistorical.usdNgnPlanningRate) / latestHistorical.usdNgnPlanningRate) * 100;
  const opProfitMoMDeltaPct = latestHistorical.operatingProfitNgn !== 0
    ? ((finalForecast.operatingProfitNgn - latestHistorical.operatingProfitNgn) / Math.abs(latestHistorical.operatingProfitNgn)) * 100
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
      {/* 1. Latest Historical FX */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium tracking-wide uppercase">Historical FX Rate</span>
          <Activity className="w-4 h-4 text-teal-400" />
        </div>
        <div>
          <div className="text-xl font-bold font-mono text-white tabular-nums tracking-tight">
            ₦{latestHistorical.usdNgnPlanningRate.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Per US$1</span>
            <span className="text-teal-400/80 font-mono">Sep 2026 (Actual)</span>
          </div>
        </div>
      </div>

      {/* 2. Forecast USD/NGN Rate at Sep 2031 */}
      <div className="bg-[#0b1329] border border-cyan-900/40 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium tracking-wide uppercase text-cyan-300">Sep 2031 FX Rate</span>
          <DollarSign className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <div className="text-xl font-bold font-mono text-cyan-300 tabular-nums tracking-tight">
            ₦{finalForecast.usdNgnRate.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className="text-cyan-400 font-mono font-medium flex items-center gap-0.5">
              +{fxChange5YrPct.toFixed(1)}%
            </span>
            <span className="text-slate-400 font-mono">5-Yr Projected</span>
          </div>
        </div>
      </div>

      {/* 3. Latest Monthly Operating Profit */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium tracking-wide uppercase">Recent Mo. Profit</span>
          <Calendar className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-xl font-bold font-mono text-white tabular-nums tracking-tight">
            {formatNgn(latestHistorical.operatingProfitNgn)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Margin: {(latestHistorical.operatingMarginPct * 100).toFixed(1)}%</span>
            <span className="text-emerald-400/80 font-mono">Sep 2026</span>
          </div>
        </div>
      </div>

      {/* 4. Forecast Monthly Operating Profit at Sep 2031 */}
      <div className={`bg-[#0b1329] border rounded-xl p-4 flex flex-col justify-between shadow-lg ${
        finalForecast.operatingProfitNgn < 0 ? 'border-rose-900/60' : 'border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium tracking-wide uppercase">Sep 2031 Mo. Profit</span>
          {finalForecast.operatingProfitNgn >= 0 ? (
            <TrendingUp className="w-4 h-4 text-teal-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-400" />
          )}
        </div>
        <div>
          <div className={`text-xl font-bold font-mono tabular-nums tracking-tight ${
            finalForecast.operatingProfitNgn < 0 ? 'text-rose-400' : 'text-teal-300'
          }`}>
            {formatNgn(finalForecast.operatingProfitNgn)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Margin: {(finalForecast.operatingMarginPct * 100).toFixed(1)}%</span>
            <span className={`font-mono ${opProfitMoMDeltaPct >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              {opProfitMoMDeltaPct >= 0 ? '+' : ''}{opProfitMoMDeltaPct.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* 5. 5-Year Cumulative Revenue */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium tracking-wide uppercase">5-Yr Total Revenue</span>
          <Layers className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <div className="text-xl font-bold font-mono text-cyan-200 tabular-nums tracking-tight">
            {formatNgn(total5YrRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>60-Month Aggregate</span>
            <span className="text-slate-400 font-mono">Gross Top-Line</span>
          </div>
        </div>
      </div>

      {/* 6. 5-Year Cumulative Operating Profit */}
      <div className={`bg-[#0b1329] border rounded-xl p-4 flex flex-col justify-between shadow-lg ${
        total5YrOpProfit < 0 ? 'border-rose-900/60' : 'border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium tracking-wide uppercase">5-Yr Cumul. Op Profit</span>
          <Activity className="w-4 h-4 text-teal-400" />
        </div>
        <div>
          <div className={`text-xl font-bold font-mono tabular-nums tracking-tight ${
            total5YrOpProfit < 0 ? 'text-rose-400' : 'text-emerald-300'
          }`}>
            {formatNgn(total5YrOpProfit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Net Operating Cash</span>
            <span className="text-teal-400/80 font-mono">60 Months</span>
          </div>
        </div>
      </div>

      {/* 7. Forecast 5-Year Aggregate Operating Margin */}
      <div className={`bg-[#0b1329] border rounded-xl p-4 flex flex-col justify-between shadow-lg col-span-2 lg:col-span-1 ${
        aggregate5YrOpMargin < 0.15 ? 'border-amber-900/50' : 'border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium tracking-wide uppercase">Avg Operating Margin</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
            5-Yr Avg
          </span>
        </div>
        <div>
          <div className={`text-xl font-bold font-mono tabular-nums tracking-tight ${
            aggregate5YrOpMargin < 0.15 ? 'text-amber-400' : 'text-teal-300'
          }`}>
            {(aggregate5YrOpMargin * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Target: &gt;25%</span>
            <span className={`font-mono text-[11px] ${aggregate5YrOpMargin >= 0.20 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {aggregate5YrOpMargin >= 0.20 ? 'Nominal Health' : 'Margin At Risk'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
