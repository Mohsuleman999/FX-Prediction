import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { CombinedChartPoint } from '../types/data';
import { formatMonthDisplay } from '../utils/csvParser';
import { TrendingUp, Calendar, Maximize2, Minimize2 } from 'lucide-react';

interface FxForecastChartProps {
  dataPoints: CombinedChartPoint[];
  forecastStartDate?: string; // Default '2026-09-01'
}

export const FxForecastChart: React.FC<FxForecastChartProps> = ({
  dataPoints,
  forecastStartDate = '2026-09-01',
}) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');
  const [showConfidenceBands, setShowConfidenceBands] = useState(true);
  const [showBaselineComparison, setShowBaselineComparison] = useState(true);

  // Filter or aggregate data for Annual vs Monthly view
  const chartData = useMemo(() => {
    if (viewMode === 'monthly') {
      return dataPoints;
    }

    // Annual view: group by year (e.g. 2017, 2018, ... 2031)
    const yearMap = new Map<string, {
      year: string;
      isForecast: boolean;
      historicalRates: number[];
      forecastRates: number[];
      lower80s: number[];
      upper80s: number[];
      baselines: number[];
    }>();

    for (const pt of dataPoints) {
      const year = pt.month.slice(0, 4);
      if (!yearMap.has(year)) {
        yearMap.set(year, {
          year,
          isForecast: pt.isForecast,
          historicalRates: [],
          forecastRates: [],
          lower80s: [],
          upper80s: [],
          baselines: [],
        });
      }
      const entry = yearMap.get(year)!;
      if (!pt.isForecast && pt.historicalRate !== undefined) {
        entry.historicalRates.push(pt.historicalRate);
      }
      if (pt.forecastRate !== undefined) {
        entry.forecastRates.push(pt.forecastRate);
      }
      if (pt.fxLower80 !== undefined) entry.lower80s.push(pt.fxLower80);
      if (pt.fxUpper80 !== undefined) entry.upper80s.push(pt.fxUpper80);
      if (pt.fxBaselineRate !== undefined) entry.baselines.push(pt.fxBaselineRate);
    }

    const aggregated: any[] = [];
    yearMap.forEach((entry, year) => {
      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined;
      aggregated.push({
        month: `${year}-01-01`,
        displayDate: year,
        isForecast: entry.isForecast,
        historicalRate: avg(entry.historicalRates),
        forecastRate: avg(entry.forecastRates),
        fxLower80: avg(entry.lower80s),
        fxUpper80: avg(entry.upper80s),
        fxBaselineRate: avg(entry.baselines),
      });
    });

    return aggregated;
  }, [dataPoints, viewMode]);

  // Compute nice Y-domain
  const yDomain = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const pt of chartData) {
      if (pt.historicalRate) {
        min = Math.min(min, pt.historicalRate);
        max = Math.max(max, pt.historicalRate);
      }
      if (pt.forecastRate) {
        min = Math.min(min, pt.forecastRate);
        max = Math.max(max, pt.forecastRate);
      }
      if (pt.fxLower80 && showConfidenceBands) min = Math.min(min, pt.fxLower80);
      if (pt.fxUpper80 && showConfidenceBands) max = Math.max(max, pt.fxUpper80);
    }
    return [Math.floor(Math.max(0, min * 0.9)), Math.ceil(max * 1.08)];
  }, [chartData, showConfidenceBands]);

  const latestVal = dataPoints[dataPoints.length - 1]?.forecastRate || 0;
  const historicalEndRate = dataPoints.find(d => d.month === forecastStartDate)?.historicalRate || 0;

  return (
    <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-400 mb-0.5">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <span>Section B · Econometric Exchange Rate Path</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            USD/NGN Exchange Rate: 10-Year Historical & 5-Year Forecast (2016–2031)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Solid teal shows actual historical rates; dashed cyan shows scenario forecast with uncertainty bands.
          </p>
        </div>

        {/* View Controls & Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Monthly / Annual Toggle */}
          <div className="flex items-center bg-[#070d1e] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'monthly' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('annual')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'annual' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Annual Avg
            </button>
          </div>

          {/* Toggle Confidence Bands */}
          <button
            onClick={() => setShowConfidenceBands(!showConfidenceBands)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showConfidenceBands 
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60' 
                : 'bg-slate-800/60 text-slate-400 border-slate-700'
            }`}
          >
            {showConfidenceBands ? '80% CI Active' : 'Show Uncertainty'}
          </button>

          {/* Toggle Baseline Comparison */}
          <button
            onClick={() => setShowBaselineComparison(!showBaselineComparison)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showBaselineComparison 
                ? 'bg-slate-800 text-slate-200 border-slate-700' 
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {showBaselineComparison ? 'Baseline: ON' : 'Baseline: OFF'}
          </button>
        </div>
      </div>

      {/* Legend & Summary Ribbon */}
      <div className="flex items-center justify-between flex-wrap gap-3 py-3 text-xs border-b border-slate-800/60">
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 bg-teal-400 inline-block rounded" />
            <span className="text-slate-300">Historical (2016–2026)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-cyan-400 inline-block" />
            <span className="text-cyan-300 font-medium">Scenario Forecast (2026–2031)</span>
          </div>
          {showBaselineComparison && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-0.5 border-t-2 border-dotted border-slate-400 inline-block" />
              <span className="text-slate-400">Model Baseline (No Scenario Shift)</span>
            </div>
          )}
          {showConfidenceBands && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-2 bg-cyan-500/15 border border-cyan-500/30 rounded-sm inline-block" />
              <span className="text-slate-400">80% Uncertainty Range</span>
            </div>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Sep 2026: <span className="text-teal-300 font-bold">₦{historicalEndRate.toFixed(2)}</span>
          <span className="mx-2 text-slate-600">|</span>
          Sep 2031: <span className="text-cyan-300 font-bold">₦{latestVal.toFixed(2)}</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[380px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="fxUncertaintyBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="displayDate"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              minTickGap={viewMode === 'monthly' ? 40 : 10}
            />

            <YAxis
              domain={yDomain}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `₦${val}`}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const point = payload[0]?.payload as CombinedChartPoint;
                return (
                  <div className="bg-[#070d1e] border border-slate-700 p-3 rounded-lg shadow-2xl text-xs font-sans min-w-[200px]">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
                      <span className="font-bold text-white">{formatMonthDisplay(point.month)}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        point.isForecast ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-teal-950 text-teal-300 border border-teal-800'
                      }`}>
                        {point.isForecast ? 'Forecast' : 'Historical'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {point.historicalRate !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Actual Rate:</span>
                          <span className="font-mono font-bold text-teal-300">
                            ₦{point.historicalRate.toFixed(2)} / US$
                          </span>
                        </div>
                      )}
                      {point.forecastRate !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Projected Rate:</span>
                          <span className="font-mono font-bold text-cyan-300">
                            ₦{point.forecastRate.toFixed(2)} / US$
                          </span>
                        </div>
                      )}
                      {point.fxBaselineRate !== undefined && showBaselineComparison && (
                        <div className="flex justify-between text-slate-400">
                          <span>Model Baseline:</span>
                          <span className="font-mono text-slate-300">
                            ₦{point.fxBaselineRate.toFixed(2)} / US$
                          </span>
                        </div>
                      )}
                      {point.fxLower80 !== undefined && point.fxUpper80 !== undefined && showConfidenceBands && (
                        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                          <span>80% Range:</span>
                          <span className="font-mono text-cyan-400/90 text-[11px]">
                            ₦{point.fxLower80.toFixed(0)} – ₦{point.fxUpper80.toFixed(0)}
                          </span>
                        </div>
                      )}
                      {point.marketNotes && (
                        <div className="text-[11px] text-amber-300/90 italic pt-1 border-t border-slate-800/60">
                          Note: {point.marketNotes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            {/* Vertical Separator marking the beginning of the forecast */}
            <ReferenceLine
              x={viewMode === 'monthly' ? forecastStartDate.slice(0, 7) : '2026'}
              stroke="#06b6d4"
              strokeDasharray="4 4"
              label={{
                value: 'Forecast Begins (Oct 2026)',
                position: 'top',
                fill: '#22d3ee',
                fontSize: 10,
                offset: 5,
              }}
            />

            {/* Uncertainty Interval Shaded Area */}
            {showConfidenceBands && (
              <Area
                type="monotone"
                dataKey="fxUpper80"
                stroke="transparent"
                fill="url(#fxUncertaintyBand)"
                isAnimationActive={false}
              />
            )}

            {/* Baseline Model Path */}
            {showBaselineComparison && (
              <Line
                type="monotone"
                dataKey="fxBaselineRate"
                stroke="#64748b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Historical Solid Teal Line */}
            <Line
              type="monotone"
              dataKey="historicalRate"
              stroke="#14b8a6"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />

            {/* Forecast Dotted Cyan Line */}
            <Line
              type="monotone"
              dataKey="forecastRate"
              stroke="#06b6d4"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
