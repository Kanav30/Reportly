import React from 'react';
import { Activity, ShieldCheck, Key } from 'lucide-react';

const Navbar = ({ language = 'en', onLanguageChange, onScrollToSamples, onReset, onOpenApiKeyModal, hasApiKey }) => {
  const isHindi = language === 'hi';

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            onClick={onReset}
            className="flex-shrink-0 flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="bg-emerald-800 p-1.5 rounded-xl group-hover:bg-emerald-900 transition-colors shadow-xs">
              <Activity className="h-5 w-5 text-emerald-50" />
            </div>
            <div>
              <span className="font-bold text-xl text-emerald-950 tracking-tight">Reportly</span>
              <span className="text-[10px] ml-1.5 font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Aayu 2026
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 items-center text-sm">
            <button 
              onClick={onScrollToSamples}
              className="text-emerald-900/80 font-medium hover:text-emerald-700 transition-colors cursor-pointer"
            >
              {isHindi ? 'नमूना रिपोर्ट (Samples)' : 'Sample Reports'}
            </button>
            <span className="text-emerald-200">•</span>
            <span className="text-emerald-800/60 font-normal">
              {isHindi ? 'सीबीसी-फर्स्ट प्रोटोटाइप' : 'CBC-First Prototype'}
            </span>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2.5">
            {/* API Key Config Button */}
            <button
              onClick={onOpenApiKeyModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                hasApiKey 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {hasApiKey ? 'AI Vision Active' : 'Set Gemini Key'}
              </span>
              <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            </button>

            {/* Language Toggle Pill */}
            <div className="flex items-center bg-emerald-50 p-1 rounded-full border border-emerald-200 shadow-2xs">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  language === 'hi'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Non-diagnostic badge */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50/80 px-3 py-1.5 rounded-full border border-emerald-200/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isHindi ? 'निदान नहीं करता' : 'We never diagnose'}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
