import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Stethoscope, 
  MessageSquare, 
  ChevronRight, 
  BookOpen, 
  Printer, 
  Activity, 
  ShieldCheck, 
  Copy, 
  Check, 
  SearchCheck, 
  Sparkles, 
  AlertTriangle
} from 'lucide-react';
import AskReportlyGuardrail from './AskReportlyGuardrail';
import EvidenceTraceModal from './EvidenceTraceModal';

/**
 * Mathematically bounded, honest reference range gauge.
 * Strictly respects numeric boundaries; hides gauge for qualitative tests.
 */
const RangeBar = ({ value, rangeMin, rangeMax, status }) => {
  const numVal = parseFloat(String(value).replace(/,/g, ''));
  const numMin = rangeMin !== null && rangeMin !== undefined ? parseFloat(rangeMin) : null;
  const numMax = rangeMax !== null && rangeMax !== undefined ? parseFloat(rangeMax) : null;

  // If numerical comparison is impossible or qualitative
  if (isNaN(numVal) || numMin === null || numMax === null || numMin >= numMax) {
    const isQualitativeReactive = status?.toLowerCase() === 'high' || String(value).toUpperCase() === 'POSITIVE';
    return (
      <div className="flex items-center justify-end">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          isQualitativeReactive ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'
        }`}>
          {isQualitativeReactive ? 'Reactive Screen' : 'Qualitative / Discrete'}
        </span>
      </div>
    );
  }

  // Calculate proportional indicator position:
  // 0% - 25%: Below range zone
  // 25% - 75%: Healthy reference interval (50% wide)
  // 75% - 100%: Above range zone
  let markerPercent = 50;
  const isLow = numVal < numMin;
  const isHigh = numVal > numMax;
  const isWithin = !isLow && !isHigh;

  if (isWithin) {
    const rangeSpan = numMax - numMin;
    const progress = rangeSpan > 0 ? (numVal - numMin) / rangeSpan : 0.5;
    markerPercent = 25 + Math.max(0, Math.min(1, progress)) * 50;
  } else if (isLow) {
    const belowRatio = numMin > 0 ? (numMin - numVal) / numMin : 0.5;
    markerPercent = Math.max(5, 25 - Math.min(1, belowRatio) * 20);
  } else if (isHigh) {
    const aboveRatio = numMax > 0 ? (numVal - numMax) / numMax : 0.5;
    markerPercent = Math.min(95, 75 + Math.min(1, aboveRatio) * 20);
  }

  return (
    <div className="w-40 sm:w-48 mx-auto md:mx-0">
      <div className="relative w-full h-2.5 bg-slate-200 rounded-full flex items-center">
        {/* Normal range interval highlight (25% to 75%) */}
        <div 
          className="absolute left-1/4 right-1/4 h-full bg-emerald-200 border-x border-emerald-400 z-0" 
          title={`Normal Range: ${numMin} - ${numMax}`}
        />
        
        {/* Needle Marker */}
        <div 
          className={`absolute w-3.5 h-3.5 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 shadow-sm border-2 border-white transition-all ${
            isLow 
              ? 'bg-amber-500 ring-2 ring-amber-200' 
              : isHigh 
                ? 'bg-rose-500 ring-2 ring-rose-200' 
                : 'bg-emerald-600 ring-2 ring-emerald-200'
          }`}
          style={{ left: `${markerPercent}%` }}
          title={`Value: ${numVal} (Ref: ${numMin} - ${numMax})`}
        />
      </div>

      {/* Axis markers */}
      <div className="flex justify-between text-[9px] text-slate-400 mt-1 px-0.5 font-mono">
        <span>Low</span>
        <span className="text-emerald-700 font-semibold">{numMin}</span>
        <span className="text-emerald-700 font-semibold">{numMax}</span>
        <span>High</span>
      </div>
    </div>
  );
};

const ParameterRow = ({ param, language = 'en', onViewEvidence }) => {
  const isHindi = language === 'hi';
  const status = param.status || 'Within Range';
  const stLower = status.toLowerCase();

  const isLow = stLower === 'low';
  const isHigh = stLower === 'high';
  const isNeedsVerification = stLower === 'needs verification' || stLower === 'unknown';
  const isAbnormal = isLow || isHigh;

  const name = (isHindi && param.name_hi) ? param.name_hi : param.name;
  const explanation = typeof param.explanation === 'object' 
    ? (param.explanation[language] || param.explanation.en)
    : param.explanation;

  const statusLabel = () => {
    if (isHigh) return isHindi ? 'उच्च (High)' : 'High';
    if (isLow) return isHindi ? 'कम (Low)' : 'Low';
    if (isNeedsVerification) return isHindi ? 'सत्यापन आवश्यक' : 'Needs Verification';
    return isHindi ? 'सामान्य (Within Range)' : 'Within Range';
  };

  return (
    <div className="border-b border-slate-100 py-4.5 last:border-0 hover:bg-slate-50/80 transition-colors px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-xl group">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Name, Status Badge, Plain Explanation & Evidence Action */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-emerald-950 transition-colors">
              {name}
            </h4>
            
            {isAbnormal ? (
              <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${
                isHigh ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {statusLabel()}
              </span>
            ) : isNeedsVerification ? (
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                {statusLabel()}
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {statusLabel()}
              </span>
            )}

            {/* WOW Feature Button: View Evidence Trace */}
            <button
              onClick={() => onViewEvidence(param)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer ml-auto sm:ml-0"
              title="Inspect raw source text, mathematical boundary comparison, and validation evidence"
            >
              <SearchCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isHindi ? 'साक्ष्य देखें' : 'View Evidence'}</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
            {explanation}
          </p>
        </div>
        
        {/* Values, Range Bar and Laboratory Limits */}
        <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-8 bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl border border-slate-200/60 md:border-0">
          <div className="text-center min-w-[70px]">
            <div className={`text-xl sm:text-2xl font-black tracking-tight ${
              isHigh ? 'text-rose-600' : isLow ? 'text-amber-600' : isNeedsVerification ? 'text-slate-600' : 'text-emerald-700'
            }`}>
              {param.value}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">{param.unit}</div>
          </div>
          
          <div>
            <RangeBar 
              value={param.value} 
              rangeMin={param.range_min} 
              rangeMax={param.range_max} 
              status={param.status} 
            />
            <div className="text-[10px] text-slate-500 font-medium text-center mt-1">
              {isHindi ? 'संदर्भ सीमा: ' : 'Ref Range: '} 
              <span className="font-semibold text-slate-700">{param.range || 'Not Specified'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultsDashboard = ({ data, onReset, language = 'en', onLanguageChange }) => {
  const [selectedParamForEvidence, setSelectedParamForEvidence] = useState(null);
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const isHindi = language === 'hi';

  const title = data.title 
    ? (typeof data.title === 'object' ? (data.title[language] || data.title.en) : data.title)
    : (isHindi ? 'आपकी लैब रिपोर्ट, डिकोड की गई' : 'Your Report, Decoded');

  const subtitle = data.subtitle
    ? (typeof data.subtitle === 'object' ? (data.subtitle[language] || data.subtitle.en) : data.subtitle)
    : (isHindi ? 'सत्यापित नियम-आधारित सीबीसी विश्लेषण' : 'Verified Rule-Based CBC Analysis');

  // Calculate dynamic validated summary counts
  const parameters = data.parameters || [];
  const totalCount = parameters.length;
  const withinRangeCount = parameters.filter(p => p.status?.toLowerCase() === 'within range' || p.status?.toLowerCase() === 'normal').length;
  const lowCount = parameters.filter(p => p.status?.toLowerCase() === 'low').length;
  const highCount = parameters.filter(p => p.status?.toLowerCase() === 'high').length;
  const needsVerificationCount = parameters.filter(p => p.status?.toLowerCase() === 'needs verification' || p.status?.toLowerCase() === 'unknown').length;

  const isSampleReport = Boolean(data.is_sample);

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(idx);
    setTimeout(() => setCopiedQuestionIndex(null), 2000);
  };

  const copyAllQuestions = () => {
    const questionsText = (data.questions || []).map((q, i) => {
      const qText = typeof q === 'object' ? (q[language] || q.en) : q;
      return `${i + 1}. ${qText}`;
    }).join('\n\n');

    navigator.clipboard.writeText(questionsText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] pb-24">
      {/* Sticky Action Bar */}
      <div className="bg-white/95 backdrop-blur-md border-b border-emerald-100 sticky top-16 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button 
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-800 font-semibold hover:text-emerald-600 transition-colors py-1 px-2.5 rounded-lg hover:bg-emerald-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isHindi ? 'नई रिपोर्ट अपलोड करें' : 'Upload Another Report'}</span>
          </button>

          <div className="flex items-center gap-2">
            {/* In-page Language Toggle */}
            <div className="flex items-center bg-emerald-50 p-0.5 rounded-full border border-emerald-200">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                  language === 'en' ? 'bg-emerald-800 text-white shadow-xs' : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                  language === 'hi' ? 'bg-emerald-800 text-white shadow-xs' : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Print action */}
            <button 
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isHindi ? 'प्रिंट / सेव' : 'Print / Save'}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Sample vs Uploaded Notice Banner */}
        {isSampleReport && (
          <div className="bg-amber-50/90 border border-amber-200 text-amber-900 rounded-xl p-3 px-4 text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>{isHindi ? 'सिंथेटिक डेमो रिपोर्ट:' : 'Synthetic Demonstration Report:'} </strong>
                {isHindi 
                  ? 'यह डेटा केवल परीक्षण एवं मूल्यांकन के लिए है। वास्तविक रोगी अपलोड के लिए "नई रिपोर्ट अपलोड करें" पर क्लिक करें।' 
                  : 'This is synthetic test data for offline evaluation. To test live OCR on your document, click "Upload Another Report".'}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full flex-shrink-0">
              Demo Mode
            </span>
          </div>
        )}

        {/* Report Overview Banner */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                CBC Panel
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {isHindi ? 'सत्यापित नियम इंजन' : 'Deterministic Rules Engine'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-emerald-950">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-800/70 mt-0.5 font-medium">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200/80 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span className="text-emerald-900 font-semibold">
              {isHindi ? 'स्थिति नियमों द्वारा तय, एआई द्वारा नहीं' : 'Rules determine status, not AI'}
            </span>
          </div>
        </div>

        {/* Dynamic Parameter Summary Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/80 text-center shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isHindi ? 'कुल पैरामीटर' : 'Total Extracted'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
              {totalCount}
            </span>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 border border-emerald-200 text-center shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              {isHindi ? 'सामान्य सीमा में' : 'Within Range'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">
              {withinRangeCount}
            </span>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 border border-amber-200 text-center shadow-2xs">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              {isHindi ? 'कम परिणाम' : 'Low Results'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 mt-1 block">
              {lowCount}
            </span>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 border border-rose-200 text-center shadow-2xs">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
              {isHindi ? 'उच्च परिणाम' : 'High Results'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 mt-1 block">
              {highCount}
            </span>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 text-center shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              {isHindi ? 'सत्यापन आवश्यक' : 'Verification'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-700 mt-1 block">
              {needsVerificationCount}
            </span>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Left Column: Connected Findings & Doctor Discussion Guide */}
          <div className="md:col-span-1 space-y-6 order-2 md:order-1">
            
            {/* Connected Findings / Multi-Parameter Pattern Analysis */}
            {data.patterns && data.patterns.length > 0 && (
              <section className="bg-emerald-50/80 rounded-2xl p-5 sm:p-6 border border-emerald-200/80 shadow-xs">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="bg-emerald-100 p-2 rounded-xl text-emerald-800">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-emerald-950">
                      {isHindi ? 'बड़ी तस्वीर (पैटर्न विश्लेषण)' : 'Connected Findings'}
                    </h2>
                    <p className="text-[11px] text-emerald-700/80">
                      {isHindi ? 'संबंधित टेस्टों के बीच क्लीनिकल संबंध' : 'Multi-parameter pattern recognition'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {data.patterns.map((pattern, idx) => {
                    const pTitle = typeof pattern.title === 'object' ? (pattern.title[language] || pattern.title.en) : pattern.title;
                    const pObservation = typeof pattern.observation === 'object' 
                      ? (pattern.observation[language] || pattern.observation.en) 
                      : (pattern.observation || (typeof pattern.description === 'object' ? (pattern.description[language] || pattern.description.en) : pattern.description));
                    const pContext = typeof pattern.clinical_context === 'object' ? (pattern.clinical_context[language] || pattern.clinical_context.en) : pattern.clinical_context;
                    const pLimitations = typeof pattern.uncertainty_and_limitations === 'object' ? (pattern.uncertainty_and_limitations[language] || pattern.uncertainty_and_limitations.en) : pattern.uncertainty_and_limitations;

                    return (
                      <div key={idx} className="bg-white p-4.5 rounded-xl border border-emerald-100 shadow-2xs space-y-2.5">
                        <h4 className="font-bold text-xs sm:text-sm text-emerald-950">
                          {pTitle}
                        </h4>
                        
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {pObservation}
                        </p>

                        {/* Supporting parameters pill list */}
                        {pattern.supporting_evidence && pattern.supporting_evidence.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              {isHindi ? 'समर्थक साक्ष्य:' : 'Supporting Evidence:'}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {pattern.supporting_evidence.map((se, seIdx) => (
                                <span key={seIdx} className="text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  {se.name}: {se.value} {se.unit} ({se.status})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Biological connection */}
                        {pContext && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                            <strong>{isHindi ? 'जैविक संबंध:' : 'Why Connected:'} </strong>
                            {pContext}
                          </div>
                        )}

                        {/* Limitations / What cannot be concluded */}
                        {pLimitations && (
                          <div className="text-[10px] text-amber-900 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80 leading-relaxed flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                            <span>
                              <strong>{isHindi ? 'सीमाएं:' : 'Limitations:'} </strong>
                              {pLimitations}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Questions for Doctor */}
            {data.questions && data.questions.length > 0 && (
              <section className="bg-white rounded-2xl p-5 sm:p-6 border border-amber-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-amber-100 p-2 rounded-xl text-amber-800">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {isHindi ? 'डॉक्टर से क्या पूछें?' : 'Questions to Ask Your Doctor'}
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        {isHindi ? 'परामर्श के लिए तैयार प्रश्न' : 'Clear discussion prompts'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={copyAllQuestions}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                    title="Copy all questions to clipboard"
                  >
                    {copiedAll ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-amber-700" />}
                    <span>{copiedAll ? (isHindi ? 'कॉपी हो गया!' : 'Copied!') : (isHindi ? 'सभी कॉपी करें' : 'Copy All')}</span>
                  </button>
                </div>

                <ul className="space-y-2.5">
                  {data.questions.map((q, idx) => {
                    const qText = typeof q === 'object' ? (q[language] || q.en) : q;
                    const isCopied = copiedQuestionIndex === idx;

                    return (
                      <li key={idx} className="group relative text-xs text-slate-700 bg-amber-50/50 hover:bg-amber-50 p-3 rounded-xl border border-amber-100 leading-relaxed flex items-start justify-between gap-2 transition-colors">
                        <div className="flex gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                          <span>{qText}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(qText, idx)}
                          className="opacity-70 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-800 transition-opacity cursor-pointer"
                          title="Copy this question"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Non-Diagnostic Guardrail Reminder */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
              <div className="flex gap-2.5">
                <Stethoscope className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-600 leading-relaxed">
                  <strong>{isHindi ? 'यह कोई निदान नहीं है:' : 'We Never Diagnose:'} </strong> 
                  {isHindi 
                    ? 'यह रिपोर्टली ऐप केवल शैक्षिक समझ के लिए है। किसी भी निष्कर्ष या उपचार के लिए प्रमाणित डॉक्टर से मिलना अनिवार्य है।' 
                    : 'Reportly is strictly an educational tool. Only a certified physician can interpret blood tests in the context of your physical health.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Parameter Breakdown with Evidence Buttons */}
          <div className="md:col-span-2 order-1 md:order-2">
            <section className="bg-white rounded-2xl p-5 sm:p-7 border border-emerald-100 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-700" />
                  <h2 className="text-base sm:text-lg font-bold text-emerald-950">
                    {isHindi ? 'प्रत्येक पैरामीटर का विस्तृत विवरण' : 'Plain-Language Parameter Breakdown'}
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {parameters.length} {isHindi ? 'मापे गए' : 'tested'}
                </span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {parameters.map((param, idx) => (
                  <ParameterRow 
                    key={idx} 
                    param={param} 
                    language={language}
                    onViewEvidence={setSelectedParamForEvidence}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* INTERACTIVE GUARDRAIL CHATBOT ASSISTANT */}
        <AskReportlyGuardrail language={language} reportContext={data} />

      </main>

      {/* STANDOUT HACKATHON WOW FEATURE: EVIDENCE TRACE PANEL */}
      <EvidenceTraceModal 
        isOpen={Boolean(selectedParamForEvidence)}
        onClose={() => setSelectedParamForEvidence(null)}
        parameter={selectedParamForEvidence}
        language={language}
      />
    </div>
  );
};

export default ResultsDashboard;
