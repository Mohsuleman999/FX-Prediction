import React, { useState } from 'react';
import { ScenarioParameters, PresetScenarioKey, PresetScenario } from '../types/data';
import { RotateCcw, Sliders, Sparkles, TrendingUp, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export const DEFAULT_BASE_SCENARIO: ScenarioParameters = {
  annualInflationPct: 20.67,
  annualSalesGrowthPct: 10.0,
  priceInflationPassThroughPct: 60.0,
  fxCostPassThroughPct: 60.0,
  annualUsdCostGrowthPct: 3.0,
  opCostInflationSensitivityPct: 100.0,
  fxInflationSensitivityMultiplier: 1.0,
};

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'base',
    name: 'Base Case',
    tagline: 'Empirical Baseline',
    description: 'Historical trend continuation (20.67% inflation, 10% unit volume expansion, 60% dual pass-through).',
    params: { ...DEFAULT_BASE_SCENARIO },
  },
  {
    id: 'optimistic',
    name: 'Optimistic Case',
    tagline: 'Disinflation & Expansion',
    description: 'Inflation cools to 12.0%, sales volume surges +22%, high pricing power with 80% pass-through.',
    params: {
      annualInflationPct: 12.0,
      annualSalesGrowthPct: 22.0,
      priceInflationPassThroughPct: 80.0,
      fxCostPassThroughPct: 85.0,
      annualUsdCostGrowthPct: 0.0,
      opCostInflationSensitivityPct: 80.0,
      fxInflationSensitivityMultiplier: 0.7,
    },
  },
  {
    id: 'stress',
    name: 'Stress Case',
    tagline: 'High Inflation Shock',
    description: '36.0% inflation spike, -10% volume contraction, supplier price hikes, and compressed 35% pass-through.',
    params: {
      annualInflationPct: 36.0,
      annualSalesGrowthPct: -10.0,
      priceInflationPassThroughPct: 35.0,
      fxCostPassThroughPct: 40.0,
      annualUsdCostGrowthPct: 8.0,
      opCostInflationSensitivityPct: 150.0,
      fxInflationSensitivityMultiplier: 1.6,
    },
  },
];

interface EqualizerSlidersProps {
  scenario: ScenarioParameters;
  onChange: (updated: ScenarioParameters) => void;
  activePreset: PresetScenarioKey;
  onSelectPreset: (key: PresetScenarioKey) => void;
  titleSuffix?: string;
  isCompact?: boolean;
}

export const EqualizerSliders: React.FC<EqualizerSlidersProps> = ({
  scenario,
  onChange,
  activePreset,
  onSelectPreset,
  titleSuffix,
  isCompact = true,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const updateField = (field: keyof ScenarioParameters, value: number) => {
    onChange({
      ...scenario,
      [field]: value,
    });
  };

  const handleReset = () => {
    onSelectPreset('base');
    onChange({ ...DEFAULT_BASE_SCENARIO });
  };

  const faders = [
    {
      key: 'annualInflationPct' as const,
      label: 'Annual Inflation',
      code: 'A',
      min: 0,
      max: 50,
      step: 0.5,
      value: scenario.annualInflationPct,
      unit: '%',
      defaultVal: '20.67%',
      description: 'Controls cost pressure, price inflation adjustments, and macro FX drift (Default: ~20.67%).',
      color: 'teal',
    },
    {
      key: 'annualSalesGrowthPct' as const,
      label: 'Unit Sales Growth',
      code: 'B',
      min: -20,
      max: 40,
      step: 1,
      value: scenario.annualSalesGrowthPct,
      unit: '%',
      prefix: scenario.annualSalesGrowthPct >= 0 ? '+' : '',
      defaultVal: '10.0%',
      description: 'Volume trajectory of imported accessory units sold across Nigerian distributors (Default: 10%).',
      color: scenario.annualSalesGrowthPct >= 0 ? 'teal' : 'rose',
    },
    {
      key: 'priceInflationPassThroughPct' as const,
      label: 'Price Pass-Through',
      code: 'C',
      min: 0,
      max: 100,
      step: 5,
      value: scenario.priceInflationPassThroughPct,
      unit: '%',
      defaultVal: '60%',
      description: 'Proportion of domestic inflation passed into customer wholesale selling prices (Default: 60%).',
      color: 'cyan',
    },
    {
      key: 'fxCostPassThroughPct' as const,
      label: 'FX Cost Pass-Through',
      code: 'D',
      min: 0,
      max: 100,
      step: 5,
      value: scenario.fxCostPassThroughPct,
      unit: '%',
      defaultVal: '60%',
      description: 'How much USD/NGN exchange-rate import cost escalation is passed to selling prices (Default: 60%).',
      color: 'cyan',
    },
    {
      key: 'annualUsdCostGrowthPct' as const,
      label: 'USD Cost Growth',
      code: 'E',
      min: -10,
      max: 25,
      step: 1,
      value: scenario.annualUsdCostGrowthPct,
      unit: '%',
      prefix: scenario.annualUsdCostGrowthPct >= 0 ? '+' : '',
      defaultVal: '3.0%',
      description: 'International supplier factory USD invoice cost inflation (Default: 3%).',
      color: scenario.annualUsdCostGrowthPct > 0 ? 'amber' : 'emerald',
    },
    {
      key: 'opCostInflationSensitivityPct' as const,
      label: 'OpCost Sensitivity',
      code: 'F',
      min: 0,
      max: 200,
      step: 10,
      value: scenario.opCostInflationSensitivityPct,
      unit: '%',
      defaultVal: '100%',
      description: 'Sensitivity of local marketing and administrative expenses to headline inflation (Default: 100%).',
      color: 'teal',
    },
    {
      key: 'fxInflationSensitivityMultiplier' as const,
      label: 'FX Sensitivity',
      code: 'G',
      min: 0.2,
      max: 3.0,
      step: 0.1,
      value: scenario.fxInflationSensitivityMultiplier,
      unit: '×',
      defaultVal: '1.00×',
      description: 'Scenario multiplier around estimated model elasticity (~0.45). Explicit sensitivity assumption, not economic law (Default: 1.0x).',
      color: 'teal',
    },
  ];

  return (
    <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-3.5 shadow-lg relative">
      {/* Top Bar: Title, Active Presets, and Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="text-xs font-bold text-white tracking-tight uppercase">
            Equalizer Fader Bank {titleSuffix ? `· ${titleSuffix}` : ''}
          </span>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            · Adjust faders to see charts react in real time
          </span>
        </div>

        {/* Presets and Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center bg-[#070d1e] p-0.5 rounded-lg border border-slate-800">
            {PRESET_SCENARIOS.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              );
            })}
            {activePreset === 'custom' && (
              <span className="px-2.5 py-1 text-[11px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded whitespace-nowrap">
                Custom
              </span>
            )}
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded border border-slate-700 transition-colors whitespace-nowrap"
            title="Reset to Baseline"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            title="Toggle fader descriptions and economic disclosures"
          >
            <Info className="w-3 h-3 text-cyan-400" />
            <span className="hidden xl:inline">{showDetails ? 'Hide Notes' : 'Notes'}</span>
          </button>
        </div>
      </div>

      {/* Subtle, Low-Profile Faders Grid (7 Channels) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-3.5 gap-y-2 pt-2.5">
        {faders.map((f) => {
          let badgeColor = 'text-teal-300 bg-teal-950/60 border-teal-800/60';
          if (f.color === 'cyan') badgeColor = 'text-cyan-300 bg-cyan-950/60 border-cyan-800/60';
          if (f.color === 'rose') badgeColor = 'text-rose-300 bg-rose-950/60 border-rose-800/60';
          if (f.color === 'amber') badgeColor = 'text-amber-300 bg-amber-950/60 border-amber-800/60';
          if (f.color === 'emerald') badgeColor = 'text-emerald-300 bg-emerald-950/60 border-emerald-800/60';

          const formattedValue = `${f.prefix || ''}${f.step < 1 ? f.value.toFixed(1) : f.value.toFixed(0)}${f.unit}`;

          return (
            <div
              key={f.key}
              className="bg-[#080e21] border border-slate-800/80 rounded-lg p-2.5 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1 truncate">
                  <span className="text-[10px] font-bold text-teal-400 bg-slate-900 px-1 py-0.2 rounded font-mono">
                    {f.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200 truncate" title={f.label}>
                    {f.label}
                  </span>
                </div>
                <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded border tabular-nums shrink-0 ${badgeColor}`}>
                  {formattedValue}
                </span>
              </div>

              {/* Compact Audio Slider Track */}
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={f.value}
                onChange={(e) => updateField(f.key, parseFloat(e.target.value))}
                className="w-full equalizer-slider"
                title={`${f.label}: ${formattedValue} (${f.description})`}
              />

              <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                <span>{f.min}{f.unit}</span>
                <span className="text-slate-400">Def: {f.defaultVal}</span>
                <span>{f.max}{f.unit}</span>
              </div>

              {/* Optional Expanded Description */}
              {showDetails && (
                <p className="text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/60 leading-tight">
                  {f.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
