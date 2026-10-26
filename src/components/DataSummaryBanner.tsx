import React from 'react';
import { DataQualityReport } from '../types/data';
import { formatMonthDisplay } from '../utils/csvParser';
import { AlertCircle, CheckCircle, Database, HelpCircle } from 'lucide-react';

interface DataSummaryBannerProps {
  report: DataQualityReport;
}

export const DataSummaryBanner: React.FC<DataSummaryBannerProps> = ({ report }) => {
  return (
    <div className="bg-[#091024] border border-slate-800 rounded-xl p-3.5 shadow-sm text-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Metadata Details */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-slate-300">
          <div className="flex items-center gap-1.5 text-teal-400 font-semibold">
            <Database className="w-4 h-4 text-teal-400" />
            <span>Dataset Active:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white font-medium">
              {report.startDate ? formatMonthDisplay(report.startDate) : '—'} to {report.endDate ? formatMonthDisplay(report.endDate) : '—'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono text-cyan-300">{report.totalRows} Monthly Observations</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>10 Historical Years</span>
          </div>

          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Latest Inflation: <strong className="text-teal-300 font-mono">{report.latestInflationPct.toFixed(2)}%</strong> (Stored as decimal fraction)</span>
          </div>

          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>First-Month MoM FX Null: <span className="text-emerald-400 font-medium">Valid (Expected base)</span></span>
          </div>
        </div>

        {/* Right: Synthetic Education Disclaimer */}
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/40 border border-amber-800/50 rounded-md text-amber-300/90 text-[11px] shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Synthetic Educational Data for Meridian Tech Distribution · Not Official Central Bank Statistics
          </span>
        </div>
      </div>
    </div>
  );
};
