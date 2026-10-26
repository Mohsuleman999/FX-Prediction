import React, { useState, useRef } from 'react';
import { parseBusinessCsv } from '../utils/csvParser';
import { BusinessRecord, DataQualityReport } from '../types/data';
import { Upload, X, CheckCircle, AlertTriangle, FileSpreadsheet, ShieldAlert } from 'lucide-react';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (records: BusinessRecord[], report: DataQualityReport) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewReport, setPreviewReport] = useState<DataQualityReport | null>(null);
  const [tempRecords, setTempRecords] = useState<BusinessRecord[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const result = parseBusinessCsv(text);
        if (result.errors.length > 0) {
          setErrorMsg(result.errors.join('; '));
          setPreviewReport(null);
          setTempRecords(null);
        } else {
          setPreviewReport(result.report);
          setTempRecords(result.records);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to parse CSV file.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Error reading uploaded file.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (tempRecords && previewReport) {
      onDataLoaded(tempRecords, previewReport);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0b1329] border border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl relative text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <Upload className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Upload Business CSV Dataset
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Select or drop <code className="text-cyan-300 font-mono">AI_Predictive_Analytics_Full_Business_Data.csv</code> to drive the predictive models.
        </p>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-teal-400 bg-teal-500/10'
              : 'border-slate-700 hover:border-teal-500/50 bg-[#070e20]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />
          <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2.5" />
          <p className="text-sm font-medium text-slate-200">
            {fileName ? fileName : 'Click to browse or drop CSV file here'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports comma-separated values with headers from Oct 2016 through Sep 2026.
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block">Validation Error:</strong>
              {errorMsg}
            </div>
          </div>
        )}

        {/* Validation & Ingestion Report */}
        {previewReport && tempRecords && (
          <div className="mt-4 p-3.5 bg-[#070e22] border border-teal-900/60 rounded-lg text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-teal-300 font-semibold text-sm">
              <CheckCircle className="w-4 h-4 text-teal-400" />
              <span>Dataset Validated Successfully</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1 border-t border-slate-800">
              <div>Total Records: <strong className="text-white">{previewReport.totalRows} observations</strong></div>
              <div>Date Span: <strong className="text-white">{previewReport.startDate} to {previewReport.endDate}</strong></div>
              <div>Latest FX: <strong className="text-cyan-300">₦{previewReport.latestRate.toFixed(2)}</strong></div>
              <div>Latest Inflation: <strong className="text-teal-300">{previewReport.latestInflationPct.toFixed(2)}%</strong></div>
            </div>

            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span className="text-emerald-400 font-medium">✓ Auto-checks passed: </span>
              Inflation stored as decimal fractions verified; expected null first-month MoM change confirmed; all financial accounting formulas intact.
            </div>

            {previewReport.anomaliesDetected.length > 0 && (
              <div className="text-[10px] text-amber-300/90 pt-1">
                Detected historical regime shifts: {previewReport.anomaliesDetected.slice(0, 2).join('; ')}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!tempRecords}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              tempRecords
                ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 hover:from-teal-300 hover:to-cyan-300 shadow-lg'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Load Dataset into Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
