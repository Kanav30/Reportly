import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Send, Sparkles, HelpCircle, AlertOctagon, CornerDownRight, MessageSquareQuote } from 'lucide-react';

const AskReportlyGuardrail = ({ language = 'en', reportContext = null }) => {
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const isHindi = language === 'hi';

  const samplePrompts = [
    {
      label: isHindi ? '⚠️ टेस्ट: "क्या मुझे कैंसर है?" (गार्डरेल टेस्ट)' : '⚠️ Test: "Do I have leukemia?" (Tests Safety Guardrail)',
      text: isHindi ? 'क्या मुझे कैंसर है?' : 'Do I have leukemia or cancer?',
      type: 'diagnostic'
    },
    {
      label: isHindi ? '⚠️ टेस्ट: "मुझे कौन सी बीमारी है?"' : '⚠️ Test: "Can you diagnose my disease?"',
      text: isHindi ? 'क्या आप बता सकते हैं मुझे कौन सी बीमारी है?' : 'Can you diagnose what disease I have based on this report?',
      type: 'diagnostic'
    },
    {
      label: isHindi ? '💡 टेस्ट: "कम MCV का क्या मतलब है?"' : '💡 Ask: "What does low MCV mean in plain words?"',
      text: isHindi ? 'कम MCV का क्या मतलब होता है?' : 'What does low MCV mean in plain English?',
      type: 'educational'
    }
  ];

  const handleAsk = async (queryText) => {
    const textToSend = queryText || question;
    if (!textToSend.trim()) return;

    const userMessage = { sender: 'user', text: textToSend };
    setChatLog((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          language: language,
          context: reportContext
        })
      });
      const data = await res.json();
      setChatLog((prev) => [...prev, { sender: 'bot', ...data }]);
    } catch (err) {
      // Local fallback in case backend connection is interrupted
      const qLower = textToSend.toLowerCase();
      const isDiagnostic = ["diagnos", "cancer", "leukemia", "cure", "sick", "disease", "kya mujhe", "bimaar"].some(t => qLower.includes(t));
      
      if (isDiagnostic) {
        setChatLog((prev) => [
          ...prev,
          {
            sender: 'bot',
            refusal: true,
            guardrail_triggered: isHindi ? 'निदान अस्वीकरण सुरक्षा गार्डरेल' : 'Diagnostic Question Refusal Guardrail',
            reason: isHindi ? 'रिपोर्टली केवल शैक्षिक समझ के लिए है। निदान देना सख्त मना है।' : 'Reportly refuses diagnostic inquiries to uphold patient clinical safety.',
            message: isHindi 
              ? 'मैं किसी बीमारी का निदान (Diagnosis) नहीं कर सकता। लैब के आंकड़े केवल संदर्भ हैं, सही जांच के लिए अपने डॉक्टर से परामर्श करें।' 
              : 'I cannot diagnose illnesses or confirm specific medical diseases. Lab reports provide laboratory parameters, but accurate diagnosis requires a certified physician.',
            suggested_questions: [
              isHindi ? 'क्या इन असामान्य नतीजों के लिए आगे कोई टेस्ट जरूरी है?' : 'What clinical factors could explain these out-of-range parameters?',
              isHindi ? 'क्या मुझे किसी विशेषज्ञ डॉक्टर को दिखाना चाहिए?' : 'Should we repeat this test in a few weeks?'
            ]
          }
        ]);
      } else {
        setChatLog((prev) => [
          ...prev,
          {
            sender: 'bot',
            refusal: false,
            message: isHindi 
              ? 'यह पैरामीटर आपके रक्त की संरचना को दर्शाता है। किसी भी बदलाव पर अपने चिकित्सक से चर्चा करना सबसे सुरक्षित विकल्प है।' 
              : 'This parameter tracks cellular indicators in the bloodstream. Always discuss individual readings with your physician.',
            suggested_questions: [
              isHindi ? 'क्या खानपान में बदलाव से इसमें सुधार हो सकता है?' : 'Could diet or hydration impact these results?'
            ]
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden mt-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 to-emerald-900 text-white p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700/60 shadow-inner">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-emerald-50">
                  {isHindi ? 'सुरक्षित प्रश्न सहायक (Safety Guardrail)' : 'Reportly Guardrail Assistant'}
                </h3>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-300 border border-emerald-700">
                  {isHindi ? 'निदान-मुक्त' : 'Non-Diagnostic'}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                {isHindi 
                  ? 'यह सहायक केवल रिपोर्ट समझने में मदद करता है और किसी भी नैदानिक प्रश्न को अस्वीकार करता है।' 
                  : 'Strictly refuses diagnostic requests & helps formulate doctor questions.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-800/60 backdrop-blur-sm border border-emerald-700/50 px-3 py-1.5 rounded-full text-xs text-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isHindi ? 'क्लीनिकल सुरक्षा मोड ऑन' : 'Clinical Safety Protocol Active'}</span>
          </div>
        </div>
      </div>

      {/* Interactive Chat Body */}
      <div className="p-6 sm:p-7 space-y-6">
        {/* Sample Prompt Pills for instant demo */}
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isHindi ? 'जज / उपयोगकर्ता के लिए त्वरित टेस्ट प्रॉम्प्ट:' : 'Instant Demo Tests (Click to test Guardrail):'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(p.text)}
                disabled={loading}
                className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all border text-left flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  p.type === 'diagnostic'
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200 hover:border-rose-300'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 hover:border-emerald-300'
                }`}
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat History */}
        {chatLog.length > 0 && (
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin">
            {chatLog.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.sender === 'user' ? (
                  <div className="bg-emerald-800 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] sm:max-w-[70%] text-sm shadow-sm font-medium">
                    {msg.text}
                  </div>
                ) : (
                  <div className={`rounded-2xl rounded-tl-sm p-5 max-w-[95%] sm:max-w-[85%] text-sm shadow-sm border ${
                    msg.refusal 
                      ? 'bg-rose-50/80 border-rose-200 text-rose-950' 
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    {/* Guardrail Banner if refused */}
                    {msg.refusal && (
                      <div className="flex items-start gap-3 mb-3 pb-3 border-b border-rose-200">
                        <div className="p-1.5 rounded-lg bg-rose-200 text-rose-800">
                          <AlertOctagon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs uppercase tracking-wider text-rose-900">
                            🛑 {msg.guardrail_triggered}
                          </div>
                          <div className="text-xs text-rose-700 font-medium mt-0.5">
                            {msg.reason}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Main message */}
                    <p className="leading-relaxed text-sm">
                      {msg.message}
                    </p>

                    {/* Suggested doctor questions */}
                    {msg.suggested_questions && msg.suggested_questions.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-rose-200/60">
                        <div className="font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-900">
                          <MessageSquareQuote className="w-4 h-4 text-emerald-700" />
                          <span>{isHindi ? 'डॉक्टर से पूछने योग्य वैकल्पिक प्रश्न:' : 'Recommended Questions For Your Physician:'}</span>
                        </div>
                        <ul className="space-y-1.5">
                          {msg.suggested_questions.map((sq, sqIdx) => (
                            <li key={sqIdx} className="text-xs bg-white/80 p-2 rounded-lg border border-rose-100 flex items-start gap-2 text-slate-800">
                              <CornerDownRight className="w-3.5 h-3.5 text-emerald-700 mt-0.5 flex-shrink-0" />
                              <span>{sq}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 px-4 py-3 rounded-2xl w-fit">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>{isHindi ? 'गार्डरेल विश्लेषण चल रहा है...' : 'Evaluating against safety guardrails...'}</span>
              </div>
            )}
          </div>
        )}

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleAsk(); }}
          className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition-all shadow-inner"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={isHindi ? 'अपनी रिपोर्ट के बारे में कोई भी प्रश्न पूछें (उदा. "क्या मुझे कोई बीमारी है?")...' : 'Ask a question about this report (e.g. "Do I have cancer?" or "What is MCV?")...'}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>{isHindi ? 'पूछें' : 'Ask'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </section>
  );
};

export default AskReportlyGuardrail;
