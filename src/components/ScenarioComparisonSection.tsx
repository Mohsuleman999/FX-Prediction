import React, { useState, useMemo } from 'react';
import { BusinessRecord, ScenarioParameters, PresetScenarioKey, ForecastRecord } from '../types/data';
import { PRESET_SCENARIOS, DEFAULT_BASE_SCENARIO } from './EqualizerSliders';
import { simulateFinancialForecast } from '../engine/financialSimulator';
import { formatNgn, formatMonthDisplay } from '../utils/csvParser';
import { GitCompare, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface ScenarioComparisonSectionProps {
  historicalRecords: BusinessRecord[];
  currentScenario: ScenarioParameters;
}

interface ScenarioMetrics {
  key: PresetScenarioKey;
  name: string;
  tagline: string;
  params: ScenarioParameters;
  forecast: ForecastRecord[];
  finalFxRate: number;
  totalRevenueNgn: number;
  totalGrossProfitNgn: number;
  totalOperatingProfitNgn: number;
  avgOpMarginPct: number;
  negativeProfitMonths: number;
  highRiskMonths: number;
}

export const ScenarioComparisonSection: React.FC<ScenarioComparisonSectionProps> = ({
  historicalRecords,
  currentScenario,
}) => {
  const [primaryScenarioKey, setPrimaryScenarioKey] = useState<PresetScenarioKey>('base');
  const [secondaryScenarioKey, setSecondaryScenarioKey] = useState<PresetScenarioKey>('stress');
  const [metricToCompare, setMetricToCompare] = useState<'fx' | 'operatingProfit'>('operatingProfit');

  // Compute metrics for all 4 scenarios: Base, Optimistic, Stress, Custom
  const allScenarioMetrics = useMemo<ScenarioMetrics[]>(() => {
    const list: { key: PresetScenarioKey; name: string; tagline: string; params: ScenarioParameters }[] = [
      {
        key: 'base',
        name: 'Base Case',
        tagline: 'Historical Run-Rate',
        params: PRESET_SCENARIOS.find(p => p.id === 'base')!.params,
      },
      {
        key: 'optimistic',
        name: 'Optimistic Case',
        tagline: 'Disinflation & Volume Surge',
        params: PRESET_SCENARIOS.find(p => p.id === 'optimistic')!.params,
      },
      {
        key: 'stress',
        name: 'Stress Case',
        tagline: 'Macro Stagflation Shock',
        params: PRESET_SCENARIOS.find(p => p.id === 'stress')!.params,
      },
      {
        key: 'custom',
        name: 'Custom Active',
        tagline: 'Current Slider Settings',
        params: currentScenario,
      },
    ];

    return list.map(item => {
      const fcast = simulateFinancialForecast(historicalRecords, item.params);
      const totalRev = fcast.reduce((a, b) => a + b.salesRevenueNgn, 0);
      const totalGross = fcast.reduce((a, b) => a + b.grossProfitNgn, 0);
      const totalOp = fcast.reduce((a, b) => a + b.operatingProfitNgn, 0);
      const finalFx = fcast.length > 0 ? fcast[fcast.length - 1].usdNgnRate : 0;
      const negMonths = fcast.filter(r => r.operatingProfitNgn < 0).length;
      const highRisk = fcast.filter(r => r.riskLevel === 'high').length;

      return {
        key: item.key,
        name: item.name,
        tagline: item.tagline,
        params: item.params,
        forecast: fcast,
        finalFxRate: finalFx,
        totalRevenueNgn: totalRev,
        totalGrossProfitNgn: totalGross,
        totalOperatingProfitNgn: totalOp,
        avgOpMarginPct: totalRev > 0 ? (totalOp / totalRev) * 100 : 0,
        negativeProfitMonths: negMonths,
        highRiskMonths: highRisk,
      };
    });
  }, [historicalRecords, currentScenario]);

  // Dual scenario overlay dataset
  const overlayData = useMemo(() => {
    const primary = allScenarioMetrics.find(s => s.key === primaryScenarioKey);
    const secondary = allScenarioMetrics.find(s => s.key === secondaryScenarioKey);

    if (!primary || !secondary) return [];

    return primary.forecast.map((pF, idx) => {
      const sF = secondary.forecast[idx];
      return {
        month: pF.month,
        displayDate: pF.month.slice(0, 7),
        quarter: pF.quarter,
        primaryFx: pF.usdNgnRate,
        secondaryFx: sF ? sF.usdNgnRate : undefined,
        primaryOpProfit: pF.operatingProfitNgn,
        secondaryOpProfit: sF ? sF.operatingProfitNgn : undefined,
      };
    });
  }, [allScenarioMetrics, primaryScenarioKey, secondaryScenarioKey]);

  const primaryObj = allScenarioMetrics.find(s => s.key === primaryScenarioKey);
  const secondaryObj = allScenarioMetrics.find(s => s.key === secondaryScenarioKey);

  return (
    <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-400 mb-0.5">
            <GitCompare className="w-4 h-4 text-teal-400" />
            <span>Section E · Macro Scenario Comparison Matrix</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Cross-Scenario Financial Outcomes & Dual-Line Overlay
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate sensitivity across Base, Optimistic, Stress, and your live Custom fader configurations.
          </p>
        </div>

        {/* Dual Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Compare:</span>
            <select
              value={primaryScenarioKey}
              onChange={(e) => setPrimaryScenarioKey(e.target.value as PresetScenarioKey)}
              aria-label="Primary scenario to compare"
              className="bg-[#070e22] text-teal-300 border border-teal-800/80 rounded px-2 py-1 font-medium text-xs focus:outline-none"
            >
              {allScenarioMetrics.map(s => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
            <span className="text-slate-400">vs</span>
            <select
              value={secondaryScenarioKey}
              onChange={(e) => setSecondaryScenarioKey(e.target.value as PresetScenarioKey)}
              aria-label="Secondary scenario to compare"
              className="bg-[#070e22] text-cyan-300 border border-cyan-800/80 rounded px-2 py-1 font-medium text-xs focus:outline-none"
            >
              {allScenarioMetrics.map(s => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Metric Toggle */}
          <div className="flex items-center bg-[#070d1e] p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setMetricToCompare('operatingProfit')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                metricToCompare === 'operatingProfit' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400'
              }`}
            >
              Operating Profit
            </button>
            <button
              onClick={() => setMetricToCompare('fx')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                metricToCompare === 'fx' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
              }`}
            >
              USD/NGN Rate
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {allScenarioMetrics.map((sc) => {
          const isPrimary = sc.key === primaryScenarioKey;
          const isSecondary = sc.key === secondaryScenarioKey;

          return (
            <div
              key={sc.key}
              className={`bg-[#080e21] rounded-xl p-4 border transition-all ${
                isPrimary
                  ? 'border-teal-500/80 ring-1 ring-teal-500/30'
                  : isSecondary
                  ? 'border-cyan-500/80 ring-1 ring-cyan-500/30'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">{sc.name}</h4>
                  <span className="text-[11px] text-slate-400 block">{sc.tagline}</span>
                </div>
                {isPrimary && (
                  <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-1.5 py-0.5 rounded font-mono">
                    Series A
                  </span>
                )}
                {isSecondary && !isPrimary && (
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono">
                    Series B
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sep 2031 FX Rate:</span>
                  <span className="font-bold text-cyan-300 tabular-nums">₦{sc.finalFxRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">5-Yr Revenue:</span>
                  <span className="font-semibold text-slate-200 tabular-nums">{formatNgn(sc.totalRevenueNgn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">5-Yr Gross Profit:</span>
                  <span className="font-semibold text-teal-300 tabular-nums">{formatNgn(sc.totalGrossProfitNgn)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800/60">
                  <span className="text-slate-300 font-sans font-medium">5-Yr Op Profit:</span>
                  <span className={`font-bold tabular-nums ${
                    sc.totalOperatingProfitNgn < 0 ? 'text-rose-400' : 'text-emerald-300'
                  }`}>
                    {formatNgn(sc.totalOperatingProfitNgn)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Op Margin:</span>
                  <span className={`font-bold tabular-nums ${
                    sc.avgOpMarginPct < 15 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {sc.avgOpMarginPct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                  <span className="text-slate-400">Risk Profile:</span>
                  <span className={sc.negativeProfitMonths > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                    {sc.negativeProfitMonths} loss mo · {sc.highRiskMonths} alert mo
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dual Overlay Comparison Line Chart */}
      <div className="bg-[#080e21] border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
          <div className="text-xs">
            <span className="font-bold text-slate-200">Comparative Projection: </span>
            <span className="text-teal-400 font-semibold">{primaryObj?.name}</span>
            <span className="text-slate-400"> vs </span>
            <span className="text-cyan-400 font-semibold">{secondaryObj?.name}</span>
            <span className="text-slate-400 text-[11px] ml-2 font-mono">
              ({metricToCompare === 'operatingProfit' ? 'Monthly Operating Profit' : 'USD/NGN Exchange Rate'})
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-teal-400 inline-block rounded" />
              <span className="text-teal-300">{primaryObj?.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-cyan-400 inline-block rounded" />
              <span className="text-cyan-300">{secondaryObj?.name}</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overlayData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} minTickGap={30} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => metricToCompare === 'operatingProfit' ? formatNgn(val) : `₦${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const item = payload[0]?.payload;
                  return (
                    <div className="bg-[#070d1e] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                      <div className="font-bold text-white pb-1 mb-1 border-b border-slate-800">
                        {formatMonthDisplay(item.month)}
                      </div>
                      <div className="text-teal-300 flex justify-between gap-4">
                        <span>{primaryObj?.name}:</span>
                        <span className="font-bold">
                          {metricToCompare === 'operatingProfit' ? formatNgn(item.primaryOpProfit) : `₦${item.primaryFx.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="text-cyan-300 flex justify-between gap-4">
                        <span>{secondaryObj?.name}:</span>
                        <span className="font-bold">
                          {metricToCompare === 'operatingProfit' ? formatNgn(item.secondaryOpProfit) : `₦${item.secondaryFx.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey={metricToCompare === 'operatingProfit' ? 'primaryOpProfit' : 'primaryFx'}
                stroke="#14b8a6"
                strokeWidth={2.2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey={metricToCompare === 'operatingProfit' ? 'secondaryOpProfit' : 'secondaryFx'}
                stroke="#06b6d4"
                strokeWidth={2.2}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
