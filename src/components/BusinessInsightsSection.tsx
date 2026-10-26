import React, { useMemo } from 'react';
import { BusinessRecord, ForecastRecord, ScenarioParameters, GroundedInsight } from '../types/data';
import { generateGroundedInsights } from '../engine/insightsEngine';
import { Brain, TrendingUp, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface BusinessInsightsSectionProps {
  historicalRecords: BusinessRecord[];
  forecastRecords: ForecastRecord[];
  scenario: ScenarioParameters;
}

export const BusinessInsightsSection: React.FC<BusinessInsightsSectionProps> = ({
  historicalRecords,
  forecastRecords,
  scenario,
}) => {
  const insights = useMemo<GroundedInsight[]>(() => {
    return generateGroundedInsights(historicalRecords, forecastRecords, scenario);
  }, [historicalRecords, forecastRecords, scenario]);

  return (
    <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-400 mb-0.5">
            <Brain className="w-4 h-4 text-teal-400" />
            <span>Section G · Grounded Executive AI Intelligence</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Data-Driven Strategic Insights & Elasticity Calculations
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time sensitivity analytics computed dynamically from your active scenario calculations.
          </p>
        </div>

        <span className="text-[11px] text-teal-400/90 font-mono bg-teal-950/60 border border-teal-800/60 px-2.5 py-1 rounded-md">
          100% Mathematically Grounded in CSV & Accounting Engine
        </span>
      </div>

      {/* Grid of 4 Grounded Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => {
          let borderColor = 'border-slate-800';
          let icon = <Zap className="w-4 h-4 text-teal-400" />;
          let badgeColor = 'bg-teal-950/80 text-teal-300 border-teal-800/80';

          if (insight.sentiment === 'warning') {
            borderColor = 'border-amber-900/60';
            icon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
            badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
          } else if (insight.sentiment === 'critical') {
            borderColor = 'border-rose-900/70';
            icon = <AlertTriangle className="w-4 h-4 text-rose-400" />;
            badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-800/80';
          } else if (insight.category === 'pricing') {
            icon = <ShieldCheck className="w-4 h-4 text-cyan-400" />;
            badgeColor = 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80';
          }

          return (
            <div
              key={insight.id}
              className={`bg-[#080e21] border ${borderColor} rounded-lg p-4 flex flex-col justify-between shadow-sm`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {icon}
                    <h4 className="text-sm font-bold text-slate-100">{insight.title}</h4>
                  </div>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${badgeColor}`}>
                    {insight.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {insight.summary}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-800/70 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-400">Quantitative Impact:</span>
                  <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {insight.metricImpact}
                  </span>
                </div>
                <div className="text-[11px] text-teal-300/90 font-sans leading-snug">
                  <strong className="text-slate-400 font-medium">Strategic Action: </strong>
                  {insight.strategicAction}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
