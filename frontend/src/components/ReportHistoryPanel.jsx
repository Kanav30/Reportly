/**
 * ReportHistoryPanel — slide-in panel showing a user's previous reports.
 * Displays report cards with type, date, status summary, and click-to-open.
 */
import React from 'react';
import {
  X, RefreshCw, FileText, Clock, AlertTriangle,
  Loader2, Inbox,
} from 'lucide-react';

const STATUS_BADGE = {
  completed: { label: 'Completed', cls: 'bg-emerald-100 text-emerald-800' },
  processing: { label: 'Processing', cls: 'bg-amber-100 text-amber-800' },
  error: { label: 'Error', cls: 'bg-rose-100 text-rose-800' },
};

const formatDate = (isoString) => {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return isoString;
  }
};

const ReportCard = ({ report, onSelect }) => {
  const status = STATUS_BADGE[report.processingStatus] || STATUS_BADGE.completed;
  const counts = report.summary_counts || {};

  return (
    <button
      onClick={() => onSelect(report)}
      className="w-full text-left bg-white rounded-xl border border-slate-100 hover:border-emerald-300 hover:shadow-sm p-4 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-950 truncate leading-tight">
              {report.title || 'CBC Report'}
            </p>
            <p className="text-xs text-slate-500 truncate">{report.originalFileName || 'Lab Report'}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${status.cls}`}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(report.createdAt || report.saved_at)}
        </span>
        {counts.total_parameters > 0 && (
          <>
            <span className="text-emerald-600 font-semibold">
              {counts.within_range_count}/{counts.total_parameters} normal
            </span>
            {counts.high_count > 0 && (
              <span className="text-rose-600 font-semibold">{counts.high_count} ↑</span>
            )}
            {counts.low_count > 0 && (
              <span className="text-amber-600 font-semibold">{counts.low_count} ↓</span>
            )}
          </>
        )}
      </div>
    </button>
  );
};

const ReportHistoryPanel = ({
  reports,
  loading,
  error,
  onSelectReport,
  onRefresh,
  onClose,
  language,
}) => {
  const isHindi = language === 'hi';

  return (
    /* Overlay backdrop */
    <div
      className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Report history"
    >
      {/* Panel — click inside doesn't close */}
      <div
        className="absolute top-16 right-0 h-[calc(100vh-4rem)] w-full max-w-sm bg-white shadow-2xl border-l border-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-emerald-950 text-base">
              {isHindi ? 'मेरी रिपोर्ट' : 'My Reports'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {reports.length > 0
                ? `${reports.length} report${reports.length !== 1 ? 's' : ''} saved`
                : 'No saved reports yet'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              aria-label="Refresh history"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close history"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
              <span className="text-sm font-medium">Loading reports…</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-xl p-3.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{isHindi ? 'कनेक्शन सूचना' : 'Connection Notice'}</p>
                <p className="text-xs mt-0.5 text-amber-800">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && reports.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400 text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                <Inbox className="w-6 h-6 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">
                  {isHindi ? 'अभी कोई सहेजी गई रिपोर्ट नहीं है' : 'No saved reports yet'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {isHindi ? 'सीबीसी रिपोर्ट अपलोड करें और वह यहां दिखाई देगी।' : 'Upload a CBC report and it will appear here.'}
                </p>
              </div>
            </div>
          )}

          {!loading && !error && reports.map((report) => (
            <ReportCard
              key={report.id || report.reportId}
              report={report}
              onSelect={onSelectReport}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportHistoryPanel;
