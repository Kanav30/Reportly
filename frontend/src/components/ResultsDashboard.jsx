import React from 'react';
import { ArrowLeft, Stethoscope, MessageSquare, AlertCircle, CheckCircle2, ChevronRight, BookOpen, Printer, Activity, ShieldCheck, Languages } from 'lucide-react';
import AskReportlyGuardrail from './AskReportlyGuardrail';

const RangeBar = ({ status }) => {
  const isHigh = status?.toLowerCase() === 'high';
  const isLow = status?.toLowerCase() === 'low';
  
  return (
    <div className="flex items-center w-40 sm:w-48 mx-auto md:mx-0">
      <div className="w-full bg-slate-200 h-2.5 rounded-full flex relative overflow-visible">
        {/* Normal range zone */}
        <div className="absolute left-1/4 right-1/4 h-full bg-emerald-200 border-x border-emerald-400 z-0"></div>
        {/* Status indicator pin */}
        {isLow && (
          <div className="absolute left-2 w-3.5 h-3.5 rounded-full bg-amber-500 top-1/2 -translate-y-1/2 z-10 shadow-sm border-2 border-white animate-pulse"></div>
        )}
        {!isLow && !isHigh && (
          <div className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-emerald-600 top-1/2 -translate-y-1/2 z-10 shadow-sm border-2 border-white"></div>
        )}
        {isHigh && (
          <div className="absolute right-2 w-3.5 h-3.5 rounded-full bg-rose-500 top-1/2 -translate-y-1/2 z-10 shadow-sm border-2 border-white animate-pulse"></div>
        )}
      </div>
    </div>
  );
};

const ParameterRow = ({ param, language = 'en' }) => {
  const isHindi = language === 'hi';
  const isAbnormal = param.status?.toLowerCase() !== 'normal' && param.status?.toLowerCase() !== 'unknown';

  const name = (isHindi && param.name_hi) ? param.name_hi : param.name;
  const explanation = typeof param.explanation === 'object' 
    ? (param.explanation[language] || param.explanation.en)
    : param.explanation;

  const statusLabel = () => {
    if (param.status?.toLowerCase() === 'high') return isHindi ? 'उच्च (High)' : 'High';
    if (param.status?.toLowerCase() === 'low') return isHindi ? 'कम (Low)' : 'Low';
    if (param.status?.toLowerCase() === 'normal') return isHindi ? 'सामान्य (Normal)' : 'Normal';
    return param.status;
  };
  
  return (
    <div className="border-b border-slate-100 py-4.5 last:border-0 hover:bg-slate-50/70 transition-colors px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-xl">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Name and Explanation */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">{name}</h4>
            {isAbnormal ? (
              <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                param.status?.toLowerCase() === 'high' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {statusLabel()}
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {statusLabel()}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
            {explanation}
          </p>
        </div>
        
        {/* Values and Range */}
        <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-8 bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl border border-slate-200/60 md:border-0">
          <div className="text-center min-w-[70px]">
            <div className={`text-xl sm:text-2xl font-black ${
              isAbnormal 
                ? (param.status?.toLowerCase() === 'high' ? 'text-rose-600' : 'text-amber-600') 
                : 'text-emerald-700'
            }`}>
              {param.value}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">{param.unit}</div>
          </div>
          
          <div>
            <RangeBar status={param.status} />
            <div className="text-[10px] text-slate-500 font-medium text-center mt-1">
              {isHindi ? 'संदर्भ सीमा: ' : 'Ref Range: '} {param.range}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultsDashboard = ({ data, onReset, language = 'en', onLanguageChange }) => {
  const isHindi = language === 'hi';

  const title = data.title 
    ? (typeof data.title === 'object' ? (data.title[language] || data.title.en) : data.title)
    : (isHindi ? 'आपकी लैब रिपोर्ट, डिकोड की गई' : 'Your Report, Decoded');

  const subtitle = data.subtitle
    ? (typeof data.subtitle === 'object' ? (data.subtitle[language] || data.subtitle.en) : data.subtitle)
    : `${new Date().toLocaleDateString()} • ${data.parameters?.length || 0} ${isHindi ? 'पैरामीटर निकाले गए' : 'parameters extracted'}`;

  return (
    <div className="min-h-screen bg-[#fafaf9] pb-20">
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
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-all ${
                  language === 'en' ? 'bg-emerald-800 text-white shadow-xs' : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-all ${
                  language === 'hi' ? 'bg-emerald-800 text-white shadow-xs' : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Print action */}
            <button 
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isHindi ? 'प्रिंट / सेव' : 'Print / Save'}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Report Overview Banner */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                CBC Panel
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {isHindi ? 'सत्यापित नियम इंजन' : 'Rule-Based Deterministic Ranges'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-emerald-950">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-800/70 mt-0.5 font-medium">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200/80 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span className="text-emerald-900 font-medium">
              {isHindi ? 'स्थिति नियमों द्वारा तय, एआई द्वारा नहीं' : 'Out-of-range status decided by rules, not AI'}
            </span>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Left Column: Patterns & Doctor Discussion Guide */}
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
                      {isHindi ? 'संबंधित टेस्टों के बीच संबंध' : 'Multi-parameter pattern recognition'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {data.patterns.map((pattern, idx) => {
                    const pTitle = typeof pattern.title === 'object' ? (pattern.title[language] || pattern.title.en) : pattern.title;
                    const pDesc = typeof pattern.description === 'object' ? (pattern.description[language] || pattern.description.en) : pattern.description;

                    return (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs">
                        <h4 className="font-bold text-xs sm:text-sm text-emerald-950 mb-1">{pTitle}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{pDesc}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Questions for Doctor */}
            {data.questions && data.questions.length > 0 && (
              <section className="bg-white rounded-2xl p-5 sm:p-6 border border-amber-200/80 shadow-xs">
                <div className="flex items-center gap-2.5 mb-3.5">
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

                <ul className="space-y-2.5">
                  {data.questions.map((q, idx) => {
                    const qText = typeof q === 'object' ? (q[language] || q.en) : q;
                    return (
                      <li key={idx} className="flex gap-2.5 text-xs text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100 leading-relaxed">
                        <ChevronRight className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                        <span>{qText}</span>
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
                  <strong>{isHindi ? 'यह निदान नहीं है:' : 'We Never Diagnose:'}</strong> {isHindi ? 'यह केवल शैक्षिक व्याख्या है। किसी भी निष्कर्ष के लिए अपने डॉक्टर से मिलें।' : 'These summaries are educational aids. Only a licensed doctor can evaluate what these mean for your individual care.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Parameter Breakdown */}
          <div className="md:col-span-2 order-1 md:order-2">
            <section className="bg-white rounded-2xl p-5 sm:p-7 border border-emerald-100 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-700" />
                  <h2 className="text-base sm:text-lg font-bold text-emerald-950">
                    {isHindi ? 'प्रत्येक पैरामीटर का विवरण' : 'Plain-Language Parameter Breakdown'}
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {data.parameters?.length || 0} {isHindi ? 'जांचे गए' : 'measured'}
                </span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {data.parameters?.map((param, idx) => (
                  <ParameterRow key={idx} param={param} language={language} />
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* INTERACTIVE GUARDRAIL CHATBOT ASSISTANT */}
        <AskReportlyGuardrail language={language} reportContext={data} />

      </main>
    </div>
  );
};

export default ResultsDashboard;
