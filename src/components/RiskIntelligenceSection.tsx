import React from 'react';
import { ForecastRecord, RiskIntelligenceSummary } from '../types/data';
import { analyzeRiskIntelligence } from '../engine/riskIntelligence';
import { formatNgn, formatMonthDisplay } from '../utils/csvParser';
import { ShieldAlert, AlertTriangle, AlertOctagon, CheckCircle2, Info } from 'lucide-react';

interface RiskIntelligenceSectionProps {
  forecastRecords: ForecastRecord[];
}

export const RiskIntelligenceSection: React.FC<RiskIntelligenceSectionProps> = ({
  forecastRecords,
}) => {
  const riskAnalysis: RiskIntelligenceSummary = analyzeRiskIntelligence(forecastRecords);

  return (
    <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-400 mb-0.5">
            <ShieldAlert className="w-4 h-4 text-teal-400" />
            <span>Section F · Risk Intelligence & Early Warning System</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Stress Threshold Vulnerability & Risk Diagnostics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitors FX shocks (&gt;5% MoM), operating cash burn, margin compression (&lt;20%), and replacement cost surges.
          </p>
        </div>

        {/* Severity Badge */}
        <div className="flex items-center gap-2">
          {riskAnalysis.negativeProfitMonthsCount > 0 ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/80 text-rose-300 border border-rose-800 rounded-lg text-xs font-bold">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              High Risk: {riskAnalysis.negativeProfitMonthsCount} Loss Period(s)
            </span>
          ) : riskAnalysis.highRiskMonthsCount > 0 ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/80 text-amber-300 border border-amber-800 rounded-lg text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Elevated Risk: {riskAnalysis.highRiskMonthsCount} Compression Months
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Risk Profile: Stable Operating Buffers
            </span>
          )}
        </div>
      </div>

      {/* 4 Risk KPI Diagnostics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-[#080e21] border border-slate-800 p-3.5 rounded-lg">
          <span className="text-[11px] text-slate-400 block uppercase">Projected Loss Months</span>
          <div className={`text-xl font-bold font-mono mt-1 ${
            riskAnalysis.negativeProfitMonthsCount > 0 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {riskAnalysis.negativeProfitMonthsCount} <span className="text-xs text-slate-400 font-sans">/ 60 mo</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Operating profit &lt; ₦0 (Breakeven violation)
          </span>
        </div>

        <div className="bg-[#080e21] border border-slate-800 p-3.5 rounded-lg">
          <span className="text-[11px] text-slate-400 block uppercase">Lowest Projected Margin</span>
          <div className={`text-xl font-bold font-mono mt-1 ${
            riskAnalysis.lowestOperatingMarginPct < 0.15 ? 'text-rose-400' : riskAnalysis.lowestOperatingMarginPct < 0.22 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {(riskAnalysis.lowestOperatingMarginPct * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {riskAnalysis.lowestMarginMonth ? `Trough at ${formatMonthDisplay(riskAnalysis.lowestMarginMonth)}` : 'Nominal'}
          </span>
        </div>

        <div className="bg-[#080e21] border border-slate-800 p-3.5 rounded-lg">
          <span className="text-[11px] text-slate-400 block uppercase">High Stress Periods</span>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {riskAnalysis.highRiskMonthsCount} <span className="text-xs text-slate-400 font-sans">months</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {riskAnalysis.firstSevereMonth ? `First alert: ${formatMonthDisplay(riskAnalysis.firstSevereMonth)}` : 'None detected'}
          </span>
        </div>

        <div className="bg-[#080e21] border border-slate-800 p-3.5 rounded-lg">
          <span className="text-[11px] text-slate-400 block uppercase">5-Yr FX Depreciation</span>
          <div className="text-xl font-bold font-mono text-teal-300 mt-1">
            +{riskAnalysis.totalFxDepreciationPct.toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Cumulative naira weakening vs US$
          </span>
        </div>
      </div>

      {/* Transparent Model Methodology Disclosure Box */}
      <div className="bg-[#070e22] border border-slate-800/90 rounded-lg p-3.5 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Statistical Model Validation & Risk Architecture: </span>
          The historical dataset comprises 120 monthly observations with only two extreme outlier loss periods (June 2023 FX regime shift). Fitting a statistical logistic classifier or machine-learning probability tree on a 1.6% minority class creates severe class imbalance artifacts and hallucinated probabilities. We deliberately implement transparent, audited deterministic rule-based indicators (&gt;5% MoM FX shock, &lt;20% operating margin, cash burn) that provide dependable risk governance for executive decisions.
        </div>
      </div>

      {/* Chronological Risk Timeline */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-slate-300 tracking-wider mb-2.5">
          Vulnerability Timeline (Detected Trigger Periods)
        </h4>

        {riskAnalysis.riskTimeline.length === 0 ? (
          <div className="bg-[#080e21] border border-slate-800/80 rounded-lg p-4 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
            Under the current scenario parameters, all 60 projected months maintain healthy operating margins (&gt;20%) and zero breakeven violations.
          </div>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {riskAnalysis.riskTimeline.slice(0, 8).map((t, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  t.level === 'high'
                    ? 'bg-rose-950/30 border-rose-900/60 text-rose-200'
                    : 'bg-amber-950/30 border-amber-900/60 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded text-[11px]">
                    {formatMonthDisplay(t.month)} ({t.quarter})
                  </span>
                  <span className="font-medium text-slate-300">
                    {t.triggers.join(' · ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
                  <span>FX: ₦{t.usdNgnRate.toFixed(1)}</span>
                  <span>Op Margin: <strong className={t.operatingMarginPct < 0 ? 'text-rose-400' : 'text-amber-400'}>{(t.operatingMarginPct * 100).toFixed(1)}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
