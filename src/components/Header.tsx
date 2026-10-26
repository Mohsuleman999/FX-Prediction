import React from 'react';
import { Upload, Download, FileSpreadsheet, RefreshCw, DollarSign, TrendingUp, LayoutDashboard, GitCompare, BookOpen } from 'lucide-react';

export type AppPage = 'usd' | 'profit' | 'overview' | 'scenarios' | 'transparency';

interface HeaderProps {
  activePage: AppPage;
  onSelectPage: (page: AppPage) => void;
  onOpenUpload: () => void;
  onDownloadForecastCsv: () => void;
  onDownloadHistoricalCsv: () => void;
  onResetData: () => void;
  isCustomDataLoaded: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onSelectPage,
  onOpenUpload,
  onDownloadForecastCsv,
  onDownloadHistoricalCsv,
  onResetData,
  isCustomDataLoaded,
}) => {
  const pages: { id: AppPage; label: string; icon: React.ReactNode }[] = [
    { id: 'usd', label: 'USD/NGN Forecast', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'profit', label: 'Operating Profit Forecast', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'overview', label: 'Executive Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'scenarios', label: 'Scenario Matrix', icon: <GitCompare className="w-3.5 h-3.5" /> },
    { id: 'transparency', label: 'Model Governance', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#070d1e]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shadow-teal-500/20">
            M
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
              Meridian AI
            </div>
            <div className="text-[10px] text-teal-400 font-medium whitespace-nowrap">
              Predictive Analytics Masterclass
            </div>
          </div>
        </div>

        {/* Zone 2: Dedicated Page Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#091126] p-1 rounded-lg border border-slate-800/80 overflow-x-auto">
          {pages.map((p) => {
            const isActive = activePage === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPage(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {p.icon}
                <span>{p.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isCustomDataLoaded && (
            <button
              onClick={onResetData}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-md border border-slate-700 transition-colors whitespace-nowrap"
              title="Restore default 120-month educational dataset"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Data</span>
            </button>
          )}

          <button
            onClick={onDownloadHistoricalCsv}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-md border border-slate-700 transition-colors whitespace-nowrap"
            title="Download the 10-year historical dataset as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
            <span>Historical CSV</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-teal-200 bg-teal-950/60 hover:bg-teal-900/60 rounded-md border border-teal-800/80 transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span>Upload CSV</span>
          </button>

          <button
            onClick={onDownloadForecastCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-md shadow-xs transition-all whitespace-nowrap font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden sm:inline">Export 5-Yr Forecast</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
