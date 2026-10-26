import React, { useState } from 'react';
import { ModelMetric } from '../types/data';
import { ChevronDown, ChevronUp, BookOpen, Layers, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';

interface ModelTransparencySectionProps {
  metrics: ModelMetric[];
}

export const ModelTransparencySection: React.FC<ModelTransparencySectionProps> = ({
  metrics,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header with Accordion Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left focus:outline-none"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-400 mb-0.5">
            <BookOpen className="w-4 h-4 text-teal-400" />
            <span>Section H · Predictive Architecture & Transparency</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            How the AI Prediction Works · Methodological Governance
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Full mathematical disclosure of data preparation, time-series algorithms, accounting identities, and backtest metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-teal-400 font-medium bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <span>{isOpen ? 'Collapse Panel' : 'Expand Transparency'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="pt-4 border-t border-slate-800 space-y-6 text-xs text-slate-300">
          {/* 4 Architectural Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1 */}
            <div className="bg-[#080e21] border border-slate-800 p-4 rounded-lg">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block mb-1">
                01. Learned Patterns
              </span>
              <h4 className="text-sm font-semibold text-white mb-1.5">Historical Observations</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Trained across 120 monthly observations (Oct 2016 – Sep 2026). Captures baseline run-rates, quarterly seasonality (Q4 holiday surge), and long-run empirical elasticity between domestic inflation and exchange rate movements.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#080e21] border border-slate-800 p-4 rounded-lg">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                02. User Assumptions
              </span>
              <h4 className="text-sm font-semibold text-white mb-1.5">Scenario Inputs</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Future inflation, volume growth, and pass-through rates are user-defined assumptions. The fader controls simulate plausible future trajectories without claiming unproven causal economic dogma.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#080e21] border border-slate-800 p-4 rounded-lg">
              <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider block mb-1">
                03. Calculated Financials
              </span>
              <h4 className="text-sm font-semibold text-white mb-1.5">Accounting Invariants</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Operating profit is never hallucinated independently. It strictly follows deterministic accounting: Revenue = Units × ASP, Gross Profit = Rev − COGS, and Operating Profit = GP − OpEx.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-[#080e21] border border-slate-800 p-4 rounded-lg">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                04. Forecast Uncertainty
              </span>
              <h4 className="text-sm font-semibold text-white mb-1.5">Widening Error Bounds</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Uncertainty bands expand over the 60-month horizon as variance compounds: <code className="text-cyan-300 font-mono">SE(h) = σ √(1 + ∑ φ²ⁱ)</code>. Long-term 5-year forecasts inherently carry higher dispersion.
              </p>
            </div>
          </div>

          {/* Model Backtesting Leaderboard Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-400" />
                <h4 className="text-sm font-bold text-white">
                  Chronological Expanding-Window Backtesting Leaderboard
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Evaluated on Historical Observations 48 to 120 (Out-of-sample multi-step tests)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-800 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-[#070e20] text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-800">
                    <th className="py-2.5 px-3">Model Candidate</th>
                    <th className="py-2.5 px-3">Methodology</th>
                    <th className="py-2.5 px-3 text-right">MAE (₦)</th>
                    <th className="py-2.5 px-3 text-right">RMSE (₦)</th>
                    <th className="py-2.5 px-3 text-right">MAPE (%)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {metrics.map((m) => (
                    <tr
                      key={m.id}
                      className={m.isDefensibleBaseline ? 'bg-teal-950/20 text-white' : 'hover:bg-slate-800/30 text-slate-300'}
                    >
                      <td className="py-2.5 px-3 font-sans font-bold">
                        <div className="flex items-center gap-2">
                          {m.isDefensibleBaseline && <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />}
                          <span>{m.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal font-sans mt-0.5">{m.notes}</div>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400">
                        {m.type}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-cyan-300">
                        ₦{m.mae.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">
                        ₦{m.rmse.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-teal-300">
                        {m.mape.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {m.isDefensibleBaseline ? (
                          <span className="text-[10px] bg-teal-900/60 text-teal-300 border border-teal-700/80 px-2 py-0.5 rounded font-sans font-bold">
                            Selected Baseline
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-sans">
                            Benchmark
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep Explanation Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#080e21] p-3.5 rounded-lg border border-slate-800">
              <h5 className="font-bold text-slate-100 text-xs mb-1">
                Data Validation & Automatic Cleaning Protocol
              </h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The ingestion pipeline converts the <code className="text-cyan-300 font-mono">Inflation_YoY_Pct</code> column strictly from decimal fractions (e.g. 0.2067 represents 20.67%). Missing first-month percentage changes are handled gracefully as expected base periods. All currency amounts are parsed into native 64-bit IEEE floating-point numbers without precision loss.
              </p>
            </div>

            <div className="bg-[#080e21] p-3.5 rounded-lg border border-slate-800">
              <h5 className="font-bold text-slate-100 text-xs mb-1">
                Damped Trend Mechanics (Avoiding Linear Runaway)
              </h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Standard linear trend models quickly generate ungrounded runaway forecasts over 60 months. We employ an autoregressive damping parameter (<code className="text-teal-300 font-mono">φ = 0.94</code>), ensuring future drift levels smoothly asymptote toward sustainable macroeconomic bounds while responding immediately to active fader shocks.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
