import React, { useState } from 'react';
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
import { formatNgn, formatMonthDisplay } from '../utils/csvParser';
import { Activity, AlertTriangle } from 'lucide-react';

interface OperatingProfitChartProps {
  dataPoints: CombinedChartPoint[];
  forecastStartDate?: string;
}

export const OperatingProfitChart: React.FC<OperatingProfitChartProps> = ({
  dataPoints,
  forecastStartDate = '2026-09-01',
}) => {
  const [showUncertainty, setShowUncertainty] = useState(true);

  // Identify any negative profit points in forecast
  const negativeProfitPoints = dataPoints.filter(p => p.isForecast && (p.forecastOpProfit ?? 0) < 0);
  const hasNegativeProfit = negativeProfitPoints.length > 0;

  return (
    <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-400 mb-0.5">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>Section C · Financial Performance & Cash Flow Engine</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Monthly Operating Profit Forecast & Breakeven Analysis (2016–2031)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Strictly derived from Units Sold × ASP − COGS − OpEx accounting identities. Responds to all scenario faders.
          </p>
        </div>

        {/* Status indicator and toggle */}
        <div className="flex items-center gap-2">
          {hasNegativeProfit ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/70 border border-rose-800/80 rounded-lg text-rose-300 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{negativeProfitPoints.length} Loss Month(s) Detected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs font-medium">
              <span>All Projected Months Profitable</span>
            </div>
          )}

          <button
            onClick={() => setShowUncertainty(!showUncertainty)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
              showUncertainty 
                ? 'bg-teal-950/60 text-teal-300 border-teal-800/60' 
                : 'bg-slate-800/60 text-slate-400 border-slate-700'
            }`}
          >
            {showUncertainty ? 'Uncertainty Band: ON' : 'Uncertainty Band: OFF'}
          </button>
        </div>
      </div>

      {/* Legend Ribbon */}
      <div className="flex items-center justify-between flex-wrap gap-3 py-3 text-xs border-b border-slate-800/60">
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 bg-teal-400 inline-block rounded" />
            <span className="text-slate-300">Historical Operating Profit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-cyan-400 inline-block" />
            <span className="text-cyan-300 font-medium">Forecast Operating Profit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 bg-rose-500 inline-block" />
            <span className="text-rose-400 font-medium">Zero-Profit Threshold (y = 0)</span>
          </div>
          {showUncertainty && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-2 bg-emerald-500/15 border border-emerald-500/30 rounded-sm inline-block" />
              <span className="text-slate-400">Profit Sensitivity Band (80% CI)</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Currency: <span className="text-white font-medium">Nigerian Naira (NGN)</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[380px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dataPoints} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="profitUncertaintyBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="displayDate"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              minTickGap={45}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatNgn(val)}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const point = payload[0]?.payload as CombinedChartPoint;
                const isLoss = (point.forecastOpProfit ?? point.historicalOpProfit ?? 0) < 0;

                return (
                  <div className="bg-[#070d1e] border border-slate-700 p-3 rounded-lg shadow-2xl text-xs font-sans min-w-[220px]">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
                      <span className="font-bold text-white">{formatMonthDisplay(point.month)}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isLoss ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-teal-950 text-teal-300 border border-teal-800'
                      }`}>
                        {point.isForecast ? 'Forecast' : 'Historical'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Monthly Revenue:</span>
                        <span className="font-mono font-medium text-slate-200">
                          {formatNgn(point.salesRevenueNgn)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">COGS (NGN):</span>
                        <span className="font-mono font-medium text-slate-300">
                          {formatNgn(point.cogsNgn)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Gross Margin:</span>
                        <span className="font-mono text-cyan-300">
                          {(point.grossMarginPct * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="font-semibold text-slate-300">Operating Profit:</span>
                        <span className={`font-mono font-bold ${
                          isLoss ? 'text-rose-400' : 'text-teal-300'
                        }`}>
                          {formatNgn(point.forecastOpProfit ?? point.historicalOpProfit ?? 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Operating Margin:</span>
                        <span className={`font-mono font-semibold ${
                          (point.operatingMarginPct * 100) < 15 ? 'text-amber-400' : 'text-emerald-300'
                        }`}>
                          {(point.operatingMarginPct * 100).toFixed(1)}%
                        </span>
                      </div>
                      {point.isForecast && showUncertainty && point.opProfitLower80 !== undefined && (
                        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80 text-[11px]">
                          <span>80% Range:</span>
                          <span className="font-mono text-emerald-400">
                            {formatNgn(point.opProfitLower80)} to {formatNgn(point.opProfitUpper80 ?? 0)}
                          </span>
                        </div>
                      )}
                      {point.marketNotes && (
                        <div className="text-[11px] text-amber-300/90 italic pt-1 border-t border-slate-800/60">
                          {point.marketNotes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            {/* Zero-Profit Reference Line */}
            <ReferenceLine
              y={0}
              stroke="#ef4444"
              strokeWidth={1.5}
              label={{
                value: 'Zero Profit Breakeven Line',
                position: 'right',
                fill: '#f87171',
                fontSize: 10,
              }}
            />

            {/* Forecast Start Vertical Separator */}
            <ReferenceLine
              x={forecastStartDate.slice(0, 7)}
              stroke="#06b6d4"
              strokeDasharray="4 4"
            />

            {/* Profit Uncertainty Band */}
            {showUncertainty && (
              <Area
                type="monotone"
                dataKey="opProfitUpper80"
                stroke="transparent"
                fill="url(#profitUncertaintyBand)"
                isAnimationActive={false}
              />
            )}

            {/* Historical Solid Line */}
            <Line
              type="monotone"
              dataKey="historicalOpProfit"
              stroke="#14b8a6"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />

            {/* Forecast Dotted Cyan Line */}
            <Line
              type="monotone"
              dataKey="forecastOpProfit"
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
