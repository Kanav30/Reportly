import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Activity,
  Sparkles,
  ChevronRight,
  X,
  FileCheck2
} from 'lucide-react';
import { SAMPLE_REPORTS } from '../data/sampleReports';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const SUPPORTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const PROCESSING_STAGES = [
  { en: "Uploading report document...", hi: "रिपोर्ट दस्तावेज़ अपलोड हो रहा है..." },
  { en: "Extracting CBC parameters & printed ranges...", hi: "सीबीसी पैरामीटर और संदर्भ सीमाएं निकाली जा रही हैं..." },
  { en: "Applying deterministic mathematical rules...", hi: "नियम-आधारित गणितीय वर्गीकरण लागू किया जा रहा है..." },
  { en: "Evaluating connected multi-parameter findings...", hi: "संबंधित बहु-पैरामीटर पैटर्न का विश्लेषण हो रहा है..." },
  { en: "Formulating doctor discussion prompts...", hi: "डॉक्टर चर्चा मार्गदर्शिका तैयार हो रही है..." }
];

const LandingDashboard = ({ onUpload, onSelectSample, language = 'en' }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const isHindi = language === 'hi';

  // Cycle through progress stages during upload
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setCurrentStageIndex((prev) => (prev < PROCESSING_STAGES.length - 1 ? prev + 1 : prev));
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setErrorMessage('');

    // Check MIME type or extension
    const isSupportedMime = SUPPORTED_TYPES.includes(selectedFile.type) ||
      selectedFile.type.startsWith('image/') ||
      selectedFile.name.toLowerCase().endsWith('.pdf');

    if (!isSupportedMime) {
      setErrorMessage(
        isHindi
          ? "कृपया केवल PDF, JPG, PNG या WebP प्रारूप में सीबीसी रिपोर्ट अपलोड करें।"
          : "Unsupported format. Please upload a PDF, JPG, PNG, or WebP laboratory report."
      );
      return;
    }

    // Check size limit
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      const mbSize = (selectedFile.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(
        isHindi
          ? `फ़ाइल का आकार 15MB की अधिकतम सीमा से अधिक है (${mbSize}MB)। कृपया छोटी फ़ाइल चुनें।`
          : `File size exceeds the 15MB limit (${mbSize}MB). Please select a compressed file.`
      );
      return;
    }

    if (selectedFile.size === 0) {
      setErrorMessage(
        isHindi ? "चयनित फ़ाइल खाली है। कृपया एक मान्य रिपोर्ट चुनें।" : "The selected file is empty. Please choose a valid report."
      );
      return;
    }

    setFile(selectedFile);
  };

  const submitFile = async () => {
    if (!file) return;
    setCurrentStageIndex(0);
    setLoading(true);
    setErrorMessage('');
    try {
      await onUpload(file);
    } catch (err) {
      setErrorMessage(err.message || (isHindi ? 'रिपोर्ट प्रोसेस करने में त्रुटि।' : 'Error processing report.'));
    } finally {
      setLoading(false);
    }
  };

  const removeSelectedFile = () => {
    setFile(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero Section */}
      <section className="pt-12 pb-8 px-4 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-semibold mb-6 border border-emerald-200 shadow-xs">
          <Activity className="w-4 h-4 text-emerald-700" />
          <span>{isHindi ? 'प्रॉब्लम स्टेटमेंट T02: रिपोर्ट, डिकोडेड' : 'Problem Statement T02: Report, Decoded'}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-emerald-950 mb-6 tracking-tight leading-tight">
          {isHindi ? (
            <>मेडिकल रिपोर्ट किसी विदेशी <br className="hidden md:block" /> भाषा जैसी नहीं लगनी चाहिए।</>
          ) : (
            <>Medical reports shouldn't feel like <br className="hidden md:block" /> a foreign language.</>
          )}
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-emerald-900/80 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          {isHindi ? (
            'अपनी सीबीसी (CBC) रिपोर्ट अपलोड करें और सरल भाषा में समझें कि क्या मापा गया है, आपका मान किस रेंज में है, और डॉक्टर से क्या सवाल पूछने हैं।'
          ) : (
            'Upload any CBC report to understand exactly what was measured in plain language, see where each value sits against the lab range, and get clear questions for your doctor.'
          )}
        </p>

        {/* Main Upload Box */}
        <div className="max-w-2xl mx-auto">
          {errorMessage && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-2 text-left animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage('')}
                className="text-rose-500 hover:text-rose-800 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div
            className={`relative bg-white rounded-2xl p-8 sm:p-10 border-2 border-dashed transition-all duration-200 ${dragActive ? 'border-emerald-500 bg-emerald-50 scale-[1.01]' : 'border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!file ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-1 text-emerald-600 border border-emerald-100 shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-emerald-950">
                    {isHindi ? 'अपनी लैब रिपोर्ट यहां ड्रैग व ड्रॉप करें' : 'Drag & drop your lab report here'}
                  </h3>
                  <p className="text-emerald-800/70 text-sm mt-1">
                    {isHindi ? 'या अपने कंप्यूटर/फ़ोन से फ़ाइल चुनें' : 'or browse from your device as photo or PDF'}
                  </p>
                </div>
                <div className="text-[11px] text-emerald-700/60 font-semibold uppercase tracking-wider mt-1">
                  PDF, JPG, PNG, WEBP (Max 15MB • Any Lab Layout)
                </div>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="mt-4 px-7 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full font-semibold transition-all shadow-sm flex items-center gap-2 active:scale-95 text-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isHindi ? 'फ़ाइल चुनें' : 'Select Report File'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700">
                  <FileCheck2 className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-base sm:text-lg font-bold text-emerald-950 truncate max-w-xs">{file.name}</h3>
                  <p className="text-xs text-emerald-700/70 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB • {isHindi ? 'विश्लेषण के लिए तैयार' : 'Ready to analyze'}</p>
                </div>

                {/* Multi-Stage Loading Visualizer */}
                {loading && (
                  <div className="w-full max-w-md bg-emerald-50 p-4 rounded-xl border border-emerald-200 mt-2 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                      <span>{PROCESSING_STAGES[currentStageIndex][language] || PROCESSING_STAGES[currentStageIndex].en}</span>
                      <span className="font-mono text-emerald-700">{currentStageIndex + 1}/{PROCESSING_STAGES.length}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-emerald-200/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-700 transition-all duration-500 rounded-full"
                        style={{ width: `${((currentStageIndex + 1) / PROCESSING_STAGES.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 w-full max-w-sm mt-2">
                  <button
                    onClick={removeSelectedFile}
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 border border-emerald-200 text-emerald-800 font-semibold rounded-full hover:bg-emerald-50 transition-colors disabled:opacity-50 text-sm cursor-pointer"
                  >
                    {isHindi ? 'बदलें / रद्द करें' : 'Change / Remove'}
                  </button>
                  <button
                    onClick={submitFile}
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-full transition-all shadow-sm disabled:opacity-70 flex justify-center items-center gap-2 active:scale-95 text-sm cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{isHindi ? 'प्रोसेसिंग...' : 'Processing...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isHindi ? 'रिपोर्ट डिकोड करें' : 'Decode Report'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
              className="hidden"
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 text-xs font-medium text-emerald-800/70">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isHindi ? 'सुरक्षित प्रोसेसिंग: अपलोड को कभी भी स्थायी रूप से सार्वजनिक नहीं किया जाता।' : 'Client-first privacy: report files are processed securely in memory without persistent public URLs.'}</span>
          </div>
        </div>

        {/* ONE-CLICK SAMPLE REPORTS SECTION */}
        <div id="sample-reports-section" className="mt-14 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2 text-left">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm sm:text-base text-emerald-950">
                {isHindi ? 'त्वरित डेमो: 1-क्लिक सिंथेटिक नमूना रिपोर्ट' : 'Instant Demo: Test with Synthetic Sample Reports'}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {isHindi ? 'ऑफ़लाइन डेमो तैयार' : 'Offline Ready'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            {SAMPLE_REPORTS.map((sample) => (
              <div
                key={sample.id}
                onClick={() => onSelectSample(sample)}
                className="bg-white rounded-xl p-4 border border-emerald-100 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${sample.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                      {sample.tag[language] || sample.tag.en}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">CBC</span>
                  </div>
                  <h4 className="font-bold text-sm text-emerald-950 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {sample.title[language] || sample.title.en}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {sample.summary[language] || sample.summary.en}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800 group-hover:text-emerald-600">
                  <span>{isHindi ? 'यह रिपोर्ट देखें' : 'Load report'}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section className="py-16 bg-white border-y border-emerald-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-emerald-950">
              {isHindi ? 'लैब रिपोर्ट से क्लीनिकल स्पष्टता तक तीन चरण' : 'Three Intentional Steps to Clinical Clarity'}
            </h2>
            <p className="text-sm sm:text-base text-emerald-800/80 mt-2 max-w-2xl mx-auto">
              {isHindi ? 'हम पैथोलॉजी लैब और मरीज के बीच भाषा की खाई को पाटते हैं।' : 'We bridge the communication gap between pathology labs and patients, equipping you with plain-language insights.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-[#fafaf9] rounded-2xl p-6 sm:p-7 border border-emerald-100/60 hover:shadow-xs transition-all">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-800 font-bold text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-emerald-950 mb-2">
                {isHindi ? 'रिपोर्ट अपलोड' : 'Upload Any Format'}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800/80 leading-relaxed">
                {isHindi ? 'किसी भी लैब की फोटो या पीडीएफ अपलोड करें। स्मार्ट एक्सट्रैक्शन पैरामीटर और रेंज को पढ़ लेता है।' : 'Accepts photos or PDFs in any laboratory layout. Automatically extracts test names, numbers, and reference ranges.'}
              </p>
            </div>

            <div className="bg-[#fafaf9] rounded-2xl p-6 sm:p-7 border border-emerald-100/60 hover:shadow-xs transition-all">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-800 font-bold text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-emerald-950 mb-2">
                {isHindi ? 'नियम-आधारित वर्गीकरण' : 'Deterministic Rules'}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800/80 leading-relaxed">
                {isHindi ? 'हाई या लो स्थिति का निर्णय कंप्यूटर नियमों द्वारा होता है, किसी एआई अनुमान से नहीं।' : 'High or Low status is calculated strictly by mathematical rules against laboratory ranges, preventing AI hallucinations.'}
              </p>
            </div>

            <div className="bg-[#fafaf9] rounded-2xl p-6 sm:p-7 border border-emerald-100/60 hover:shadow-xs transition-all">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-800 font-bold text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-emerald-950 mb-2">
                {isHindi ? 'डॉक्टर चर्चा गाइड' : 'Doctor Discussion Guide'}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800/80 leading-relaxed">
                {isHindi ? 'यह कभी बीमारी का निदान नहीं करता, बल्कि आपको डॉक्टर से पूछने के लिए सटीक सवाल देता है।' : 'Refuses diagnostic conclusions and equips patients with targeted questions to bring to their next appointment.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Guardrail Highlight */}
      <section className="py-14 bg-emerald-950 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AlertTriangle className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            {isHindi ? 'हम रिपोर्ट को आसान बनाते हैं। हम सभी जानकारियों को आपस में जोड़ते हैं।' : 'We simplify the report. We connect the dots.'}
          </h2>
          <p className="text-sm sm:text-base text-emerald-100/80 leading-relaxed max-w-2xl mx-auto font-normal">
            {isHindi
              ? 'रिपोर्टली केवल शैक्षिक समझ के लिए है। यह उपचार की सिफारिश नहीं करता। अपने स्वास्थ्य के संबंध में हमेशा अपने डॉक्टर से परामर्श लें।'
              : 'Reportly is an educational tool designed to help you understand medical terminology and ask better questions. It refuses requests for diagnosis and will never recommend treatments.'}
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingDashboard;
