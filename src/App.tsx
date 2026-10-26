/**
 * Meridian AI: Business Forecasting & Predictive Intelligence Dashboard
 * Live Predictive Analytics Masterclass Web Application
 * For Meridian Tech Distribution (Nigeria)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { RAW_DEFAULT_CSV } from './data/defaultDataset';
import { parseBusinessCsv, formatNgn, formatMonthDisplay } from './utils/csvParser';
import { BusinessRecord, DataQualityReport, ScenarioParameters, PresetScenarioKey, ModelMetric } from './types/data';
import { DEFAULT_BASE_SCENARIO, EqualizerSliders, PRESET_SCENARIOS } from './components/EqualizerSliders';
import { simulateFinancialForecast, buildCombinedChartSeries } from './engine/financialSimulator';
import { runExpandingWindowBacktest } from './engine/forecastingModels';
import { Header, AppPage } from './components/Header';
import { DataSummaryBanner } from './components/DataSummaryBanner';
import { ExecutiveKpis } from './components/ExecutiveKpis';
import { FxForecastChart } from './components/FxForecastChart';
import { OperatingProfitChart } from './components/OperatingProfitChart';
import { RevenueProfitabilitySection } from './components/RevenueProfitabilitySection';
import { ScenarioComparisonSection } from './components/ScenarioComparisonSection';
import { RiskIntelligenceSection } from './components/RiskIntelligenceSection';
import { BusinessInsightsSection } from './components/BusinessInsightsSection';
import { ModelTransparencySection } from './components/ModelTransparencySection';
import { CsvUploadModal } from './components/CsvUploadModal';
import { downloadFile, exportForecastToCsv, exportHistoricalToCsv } from './utils/csvExporter';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

export default function App() {
  // Navigation state (Defaulting to dedicated USD/NGN forecast page)
  const [activePage, setActivePage] = useState<AppPage>('usd');

  // Historical data state
  const [historicalRecords, setHistoricalRecords] = useState<BusinessRecord[]>([]);
  const [dataReport, setDataReport] = useState<DataQualityReport | null>(null);
  const [isCustomDataLoaded, setIsCustomDataLoaded] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Active scenario state (initialized to default Base Case)
  const [scenario, setScenario] = useState<ScenarioParameters>(DEFAULT_BASE_SCENARIO);
  const [activePreset, setActivePreset] = useState<PresetScenarioKey>('base');

  // Load default dataset on mount
  useEffect(() => {
    const parsed = parseBusinessCsv(RAW_DEFAULT_CSV);
    setHistoricalRecords(parsed.records);
    setDataReport(parsed.report);
  }, []);

  // Run expanding-window backtesting on dataset
  const backtestMetrics = useMemo<ModelMetric[]>(() => {
    if (historicalRecords.length === 0) return [];
    return runExpandingWindowBacktest(historicalRecords);
  }, [historicalRecords]);

  // Main 60-Month Financial Forecast (recomputed live when scenario or records change)
  const forecastRecords = useMemo(() => {
    if (historicalRecords.length === 0) return [];
    return simulateFinancialForecast(historicalRecords, scenario);
  }, [historicalRecords, scenario]);

  // Combined chart series for continuous historical + forecast plotting
  const combinedChartPoints = useMemo(() => {
    if (historicalRecords.length === 0 || forecastRecords.length === 0) return [];
    return buildCombinedChartSeries(historicalRecords, forecastRecords);
  }, [historicalRecords, forecastRecords]);

  // Handlers for scenario adjustments
  const handleScenarioChange = (updated: ScenarioParameters) => {
    setScenario(updated);
    setActivePreset('custom');
  };

  const handleSelectPreset = (key: PresetScenarioKey) => {
    setActivePreset(key);
    const target = PRESET_SCENARIOS.find((p) => p.id === key);
    if (target) {
      setScenario({ ...target.params });
    }
  };

  // Upload handler
  const handleDataLoaded = (records: BusinessRecord[], report: DataQualityReport) => {
    setHistoricalRecords(records);
    setDataReport(report);
    setIsCustomDataLoaded(true);
    setActivePreset('base');
    setScenario({ ...DEFAULT_BASE_SCENARIO });
  };

  const handleResetData = () => {
    const parsed = parseBusinessCsv(RAW_DEFAULT_CSV);
    setHistoricalRecords(parsed.records);
    setDataReport(parsed.report);
    setIsCustomDataLoaded(false);
    setActivePreset('base');
    setScenario({ ...DEFAULT_BASE_SCENARIO });
  };

  // Export handlers
  const handleDownloadForecastCsv = () => {
    if (forecastRecords.length === 0) return;
    const csvStr = exportForecastToCsv(forecastRecords);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadFile(`Meridian_AI_5Year_Forecast_${activePreset}_${timestamp}.csv`, csvStr);
  };

  const handleDownloadHistoricalCsv = () => {
    if (historicalRecords.length === 0) return;
    const csvStr = exportHistoricalToCsv(historicalRecords);
    downloadFile(`AI_Predictive_Analytics_Full_Business_Data.csv`, csvStr);
  };

  // Computed summary variables for page contextual bars
  const latestHist = historicalRecords[historicalRecords.length - 1];
  const finalFcast = forecastRecords[forecastRecords.length - 1];
  const total5YrRev = forecastRecords.reduce((a, b) => a + b.salesRevenueNgn, 0);
  const total5YrOp = forecastRecords.reduce((a, b) => a + b.operatingProfitNgn, 0);
  const avg5YrMargin = total5YrRev > 0 ? (total5YrOp / total5YrRev) * 100 : 0;
  const negativeProfitMonths = forecastRecords.filter(r => r.operatingProfitNgn < 0);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Bar Navigation with Dedicated Page Tabs */}
      <Header
        activePage={activePage}
        onSelectPage={setActivePage}
        onOpenUpload={() => setIsUploadOpen(true)}
        onDownloadForecastCsv={handleDownloadForecastCsv}
        onDownloadHistoricalCsv={handleDownloadHistoricalCsv}
        onResetData={handleResetData}
        isCustomDataLoaded={isCustomDataLoaded}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* ========================================================= */}
        {/* PAGE 1: DEDICATED USD/NGN CURRENCY FORECAST PAGE */}
        {/* ========================================================= */}
        {activePage === 'usd' && (
          <div className="space-y-4">
            {/* Quick Context & Page Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-400">
                  <DollarSign className="w-4 h-4 text-teal-400" />
                  <span>Dedicated Page · USD/NGN Currency Forecasting Engine</span>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Exchange Rate Projection & Macroeconomic Drift (2016–2031)
                </h1>
              </div>

              {/* Fast switch to Operating Profit */}
              <button
                onClick={() => setActivePage('profit')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 rounded-lg border border-slate-700 transition-colors self-start sm:self-auto"
              >
                <span>Switch to Operating Profit Page</span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
              </button>
            </div>

            {/* Subtle, Low-Profile Equalizer Sliders Bank (Visible directly with the chart!) */}
            <EqualizerSliders
              scenario={scenario}
              onChange={handleScenarioChange}
              activePreset={activePreset}
              onSelectPreset={handleSelectPreset}
              titleSuffix="FX Macro Controls"
            />

            {/* Expansive USD/NGN Forecast Chart */}
            <FxForecastChart
              dataPoints={combinedChartPoints}
              forecastStartDate="2026-09-01"
            />

            {/* Currency Diagnostic Strip */}
            {latestHist && finalFcast && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#0b1329] border border-slate-800 rounded-lg p-3">
                  <span className="text-slate-400 block text-[11px] uppercase">Base vs Terminal Rate</span>
                  <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
                    ₦{latestHist.usdNgnPlanningRate.toFixed(2)} → ₦{finalFcast.usdNgnRate.toFixed(2)}
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    +{(((finalFcast.usdNgnRate - latestHist.usdNgnPlanningRate) / latestHist.usdNgnPlanningRate) * 100).toFixed(1)}% 5-year projected drift
                  </span>
                </div>

                <div className="bg-[#0b1329] border border-slate-800 rounded-lg p-3">
                  <span className="text-slate-400 block text-[11px] uppercase">80% Confidence Range</span>
                  <div className="text-lg font-bold font-mono text-teal-300 mt-0.5">
                    ₦{finalFcast.usdNgnRateLower80.toFixed(0)} – ₦{finalFcast.usdNgnRateUpper80.toFixed(0)}
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    Widening error band at Month 60 (Sep 2031)
                  </span>
                </div>

                <div className="bg-[#0b1329] border border-slate-800 rounded-lg p-3">
                  <span className="text-slate-400 block text-[11px] uppercase">Macro Inflation Assumption</span>
                  <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
                    {scenario.annualInflationPct.toFixed(1)}% YoY
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    Elasticity Multiplier: {scenario.fxInflationSensitivityMultiplier.toFixed(2)}×
                  </span>
                </div>

                <div className="bg-[#0b1329] border border-slate-800 rounded-lg p-3">
                  <span className="text-slate-400 block text-[11px] uppercase">Unit Cost Impact (NGN)</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">
                    {formatNgn(finalFcast.importCostNgnPerUnit)}
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    From {formatNgn(latestHist.importCostNgnPerUnit)} per accessory unit
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PAGE 2: DEDICATED OPERATING PROFIT & BREAKEVEN PAGE */}
        {/* ========================================================= */}
        {activePage === 'profit' && (
          <div className="space-y-4">
            {/* Quick Context & Page Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-400">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  <span>Dedicated Page · Business Operating Profit & Breakeven Engine</span>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Monthly Operating Profit Forecast & Breakeven Analysis (2016–2031)
                </h1>
              </div>

              {/* Fast switch to USD Forecast */}
              <button
                onClick={() => setActivePage('usd')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 rounded-lg border border-slate-700 transition-colors self-start sm:self-auto"
              >
                <span>Switch to USD/NGN Chart</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>

            {/* Subtle, Low-Profile Equalizer Sliders Bank (Visible directly with the chart!) */}
            <EqualizerSliders
              scenario={scenario}
              onChange={handleScenarioChange}
              activePreset={activePreset}
              onSelectPreset={handleSelectPreset}
              titleSuffix="Commercial & Pricing Controls"
            />

            {/* Expansive Operating Profit Chart */}
            <OperatingProfitChart
              dataPoints={combinedChartPoints}
              forecastStartDate="2026-09-01"
            />

            {/* Operating Profit & Breakeven Diagnostics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#0b1329] border border-slate-800 rounded-lg p-3">
                <span className="text-slate-400 block text-[11px] uppercase">5-Yr Total Operating Profit</span>
                <div className={`text-lg font-bold font-mono mt-0.5 ${total5YrOp < 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {formatNgn(total5YrOp)}
                </div>
                <span className="text-slate-400 text-[11px]">
                  Across all 60 projected future months
                </span>
              </div>

              <div className="bg-[#0b1329] border border-slate-800 rounded-lg p-3">
                <span className="text-slate-400 block text-[11px] uppercase">Average Operating Margin</span>
                <div className={`text-lg font-bold font-mono mt-0.5 ${avg5YrMargin < 15 ? 'text-amber-400' : 'text-teal-300'}`}>
                  {avg5YrMargin.toFixed(1)}%
                </div>
                <span className="text-slate-400 text-[11px]">
                  5-Yr aggregate operating profit / revenue
                </span>
              </div>

              <div className="bg-[#0b1329] border border-slate-800 rounded-lg p-3">
                <span className="text-slate-400 block text-[11px] uppercase">Cash Burn Risk Months</span>
                <div className={`text-lg font-bold font-mono mt-0.5 ${negativeProfitMonths.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {negativeProfitMonths.length} Months
                </div>
                <span className="text-slate-400 text-[11px]">
                  {negativeProfitMonths.length > 0 ? 'Breakeven threshold violated' : 'Zero loss months projected'}
                </span>
              </div>

              <div className="bg-[#0b1329] border border-slate-800 rounded-lg p-3">
                <span className="text-slate-400 block text-[11px] uppercase">Price Pass-Through Shield</span>
                <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
                  {scenario.fxCostPassThroughPct.toFixed(0)}% FX / {scenario.priceInflationPassThroughPct.toFixed(0)}% Inf
                </div>
                <span className="text-slate-400 text-[11px]">
                  Active pricing pass-through settings
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PAGE 3: EXECUTIVE OVERVIEW */}
        {/* ========================================================= */}
        {activePage === 'overview' && (
          <div className="space-y-6">
            {dataReport && <DataSummaryBanner report={dataReport} />}

            <ExecutiveKpis
              historicalRecords={historicalRecords}
              forecastRecords={forecastRecords}
            />

            <EqualizerSliders
              scenario={scenario}
              onChange={handleScenarioChange}
              activePreset={activePreset}
              onSelectPreset={handleSelectPreset}
              titleSuffix="Executive Simulator"
            />

            <RevenueProfitabilitySection
              historicalRecords={historicalRecords}
              forecastRecords={forecastRecords}
              scenario={scenario}
            />

            <BusinessInsightsSection
              historicalRecords={historicalRecords}
              forecastRecords={forecastRecords}
              scenario={scenario}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* PAGE 4: SCENARIO MATRIX & RISK INTELLIGENCE */}
        {/* ========================================================= */}
        {activePage === 'scenarios' && (
          <div className="space-y-6">
            <EqualizerSliders
              scenario={scenario}
              onChange={handleScenarioChange}
              activePreset={activePreset}
              onSelectPreset={handleSelectPreset}
              titleSuffix="Stress & Sensitivity Matrix"
            />

            <ScenarioComparisonSection
              historicalRecords={historicalRecords}
              currentScenario={scenario}
            />

            <RiskIntelligenceSection
              forecastRecords={forecastRecords}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* PAGE 5: MODEL GOVERNANCE & TRANSPARENCY */}
        {/* ========================================================= */}
        {activePage === 'transparency' && (
          <div className="space-y-6">
            <ModelTransparencySection
              metrics={backtestMetrics}
            />
          </div>
        )}
      </main>

      {/* CSV Upload & Validation Modal */}
      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataLoaded={handleDataLoaded}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070d1e] py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-[1520px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Meridian Tech Distribution</span>
            <span>·</span>
            <span>Predictive Analytics Masterclass Demonstration</span>
          </div>
          <div>
            Synthetic educational data engine · All accounting identities (Revenue, COGS, GP, OpEx, OP) verified mathematically.
          </div>
        </div>
      </footer>
    </div>
  );
}
