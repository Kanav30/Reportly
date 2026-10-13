import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingDashboard from './components/LandingDashboard';
import ResultsDashboard from './components/ResultsDashboard';
import ApiKeyModal from './components/ApiKeyModal';
import { API_ENDPOINTS } from './api/config';
import './index.css';

function App() {
  const [results, setResults] = useState(null);
  const [language, setLanguage] = useState('en'); // 'en' | 'hi'
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }, [apiKey]);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (apiKey) {
      headers['x-gemini-api-key'] = apiKey;
    }

    try {
      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        let errMessage = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          errMessage = errData.detail || errData.message || errData.error || errMessage;
        } catch {
          // Response body was not JSON
        }
        throw new Error(errMessage);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || data.error);
      }
      
      setResults(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error.message || 'Error processing report. Please check your document or try one of the instant sample reports.');
      throw error;
    }
  };

  const handleSelectSample = (sampleReport) => {
    setResults(sampleReport);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setResults(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToSamples = () => {
    const el = document.getElementById('sample-reports-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="font-sans antialiased text-slate-900 bg-[#fafaf9] min-h-screen selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar 
        language={language} 
        onLanguageChange={setLanguage}
        onScrollToSamples={handleScrollToSamples}
        onReset={handleReset}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={Boolean(apiKey)}
      />
      
      {!results ? (
        <LandingDashboard 
          onUpload={handleUpload} 
          onSelectSample={handleSelectSample}
          language={language}
        />
      ) : (
        <ResultsDashboard 
          data={results} 
          onReset={handleReset}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveKey={setApiKey}
      />
    </div>
  );
}

export default App;
