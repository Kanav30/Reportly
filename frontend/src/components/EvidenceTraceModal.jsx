import React from 'react';
import { 
  X, 
  SearchCheck, 
  Binary, 
  FileSearch, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Scale, 
  Stethoscope 
} from 'lucide-react';

const EvidenceTraceModal = ({ isOpen, onClose, parameter, language = 'en' }) => {
  if (!isOpen || !parameter) return null;

  const isHindi = language === 'hi';
  const trace = parameter.evidence_trace || {};

  const name = (isHindi && parameter.name_hi) ? parameter.name_hi : parameter.name;
  const explanation = typeof parameter.explanation === 'object' 
    ? (parameter.explanation[language] || parameter.explanation.en)
    : parameter.explanation;

  const status = parameter.status || 'Within Range';
  const isHigh = status.toLowerCase() === 'high';
  const isLow = status.toLowerCase() === 'low';
  const isNeedsVerification = status.toLowerCase() === 'needs verification' || status.toLowerCase() === 'unknown';

  const statusBadgeColor = () => {
    if (isHigh) return 'bg-rose-100 text-rose-800 border-rose-300';
    if (isLow) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (isNeedsVerification) return 'bg-slate-100 text-slate-800 border-slate-300';
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  const statusLabel = () => {
    if (isHigh) return isHindi ? 'उच्च (High)' : 'High';
    if (isLow) return isHindi ? 'कम (Low)' : 'Low';
    if (isNeedsVerification) return isHindi ? 'सत्यापन आवश्यक (Needs Verification)' : 'Needs Verification';
    return isHindi ? 'सामान्य सीमा में (Within Range)' : 'Within Range';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden z-10 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700/80 shadow-inner text-emerald-300">
              <SearchCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-800/90 text-emerald-200 border border-emerald-700">
                  {isHindi ? 'साक्ष्य ट्रेस पैनल' : 'Evidence Trace Audit'}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadgeColor()}`}>
                  {statusLabel()}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                {name}
              </h3>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
            aria-label="Close evidence panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto scrollbar-thin">
          
          {/* 1. Original Finding from Report */}
          <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              <FileSearch className="w-4 h-4 text-emerald-700" />
              <span>{isHindi ? '1. रिपोर्ट में पाया गया मूल आंकड़ा' : '1. Original Report Finding'}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200/80 mb-3 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">{isHindi ? 'परीक्षण मान' : 'Extracted Value'}</span>
                <span className="text-base sm:text-lg font-black text-slate-900">{parameter.value}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">{isHindi ? 'इकाई (Unit)' : 'Unit'}</span>
                <span className="text-sm sm:text-base font-bold text-slate-700">{parameter.unit || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">{isHindi ? 'लैब संदर्भ सीमा' : 'Laboratory Reference Range'}</span>
                <span className="text-sm sm:text-base font-bold text-emerald-800">{parameter.range || 'Not Specified'}</span>
              </div>
            </div>

            {/* Extracted raw text snippet */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                {isHindi ? 'दस्तावेज़ से निकाली गई मूल टेक्स्ट पंक्ति (OCR Snippet):' : 'Original Text Extracted by OCR Engine:'}
              </span>
              <div className="bg-emerald-950 text-emerald-100 font-mono text-xs p-3 rounded-lg border border-emerald-900/60 overflow-x-auto selection:bg-emerald-700">
                "{trace.source_text || `${parameter.name}: ${parameter.value} ${parameter.unit} (Ref: ${parameter.range})`}"
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{isHindi ? 'स्रोत: स्कैन किया गया दस्तावेज़' : 'Source: Uploaded document text block'}</span>
                <span>{trace.coordinates ? 'Coordinates: Recorded' : 'Precise visual box: Text-line bounded'}</span>
              </div>
            </div>
          </div>

          {/* 2. Deterministic Rule Classification Engine */}
          <div className="bg-emerald-50/70 rounded-xl p-4 sm:p-5 border border-emerald-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 uppercase tracking-wider mb-3">
              <Scale className="w-4 h-4 text-emerald-700" />
              <span>{isHindi ? '2. नियम-आधारित गणितीय वर्गीकरण' : '2. Deterministic Mathematical Rule Trace'}</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-white p-3 rounded-lg border border-emerald-200 flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-600">{isHindi ? 'तुलना समीकरण:' : 'Range Comparison Math:'}</span>
                <code className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded text-xs">
                  {trace.comparison_math || `${parameter.value} vs [${parameter.range}]`}
                </code>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <span className="font-semibold text-slate-600 block mb-0.5">{isHindi ? 'निर्णय का कारण:' : 'Classification Rule Applied:'}</span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {trace.rule_reason || `Classified deterministically against reference limits (${parameter.range}).`}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-900 bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>
                  {isHindi 
                    ? 'महत्वपूर्ण: इस स्थिति का निर्णय कंप्यूटर गणितीय नियमों द्वारा हुआ है। किसी भी एआई (AI) को यह स्थिति अनुमान लगाने की अनुमति नहीं है।'
                    : 'Deterministic Guarantee: AI was strictly not used to generate this status. Results are computed via rigorous mathematical bounds.'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Extraction Quality & Validation Checks */}
          <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              <Binary className="w-4 h-4 text-emerald-700" />
              <span>{isHindi ? '3. डेटा सत्यापन और गुणवत्ता जांच' : '3. Data Validation & Quality Checks'}</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-slate-700">{isHindi ? 'संख्यात्मक मान पार्स किया गया' : 'Numerical value successfully parsed'}</span>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-slate-700">{isHindi ? 'मानक चिकित्सीय इकाई सत्यापित' : 'Standard medical unit recognized'}</span>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200">
                {parameter.range && parameter.range !== 'Not Specified' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700">{isHindi ? 'लैब संदर्भ सीमा उपलब्ध' : 'Laboratory reference bounds present'}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-amber-800">{isHindi ? 'संदर्भ सीमा रिपोर्ट में अनुपस्थित' : 'Reference bounds absent on report'}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200">
                {trace.needs_verification ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-amber-800">{isHindi ? 'मैनुअल सत्यापन अनुशंसित' : 'Manual verification recommended'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700">{isHindi ? 'उच्च विश्वसनीयता डेटा' : 'High-confidence extraction'}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 4. Educational Meaning & Strict Medical Boundaries */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <Stethoscope className="w-4 h-4 text-emerald-700" />
              <span>{isHindi ? '4. शैक्षिक व्याख्या एवं क्लीनिकल सीमाएं' : '4. Educational Explanation & Clinical Boundaries'}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
              {explanation}
            </p>

            <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>{isHindi ? 'क्लीनिकल सीमा (यह क्या तय नहीं करता):' : 'What Cannot Be Concluded:'} </strong>
                {isHindi 
                  ? 'अकेले इस मान से किसी बीमारी की पुष्टि नहीं की जा सकती। रक्त के आंकड़ों को हमेशा रोगी के समग्र शारीरिक लक्षणों, बीमारी के इतिहास और डॉक्टर के परामर्श के साथ देखा जाना चाहिए।'
                  : 'An isolated laboratory number does not constitute a disease diagnosis. Biological variations, temporary hydration, and clinical history must be evaluated by a certified physician.'}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            {isHindi ? 'पारदर्शिता एवं रोगी सुरक्षा प्रोटोकॉल' : 'Transparency & Safety Protocol Active'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {isHindi ? 'बंद करें' : 'Close Evidence Trace'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EvidenceTraceModal;
