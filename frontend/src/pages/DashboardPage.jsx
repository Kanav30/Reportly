/**
 * DashboardPage — authenticated home screen.
 * Shows personalized greeting, upload action, and private user report history.
 * Each user can only see their own reports saved in the DB.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL, API_ENDPOINTS } from '../api/config';
import Navbar from '../components/Navbar';
import LandingDashboard from '../components/LandingDashboard';
import ResultsDashboard from '../components/ResultsDashboard';
import ProfileModal from '../components/ProfileModal';
import ReportHistoryPanel from '../components/ReportHistoryPanel';
import AskReportlyGuardrail from '../components/AskReportlyGuardrail';
import {
  saveReportToFirestore,
  getUserReportsFromFirestore,
} from '../firebase/firebase';
import {
  Clock,
  UploadCloud,
  ChevronRight,
  History,
  AlertTriangle,
  User,
  Phone,
  Calendar,
  Edit3,
  MessageSquare,
  X,
} from 'lucide-react';

const DashboardPage = () => {
  const { currentUser, userProfile, getIdToken, isFirebaseConfigured } = useAuth();

  const [results, setResults] = useState(null);
  const [language, setLanguage] = useState('en');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleSelectSample = (sample) => {
    setResults(sample);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Fetches this user's private report history from Firestore and backend.
   * Ensures that empty history gracefully shows "No saved reports yet" without
   * displaying technical "Failed to fetch" errors.
   */
  const fetchReports = useCallback(async () => {
    if (!currentUser) return;
    setReportsLoading(true);
    setReportsError('');

    let firestoreData = null;
    let firestoreError = null;

    // 1. Fetch directly from Firestore (client SDK with user auth token)
    try {
      firestoreData = await getUserReportsFromFirestore(currentUser.uid);
    } catch (err) {
      console.warn('[Reportly] Firestore fetch warning:', err);
      firestoreError = err;
    }

    if (Array.isArray(firestoreData)) {
      setReports(firestoreData);
      setReportsError('');
      setReportsLoading(false);
      return;
    }

    // 2. Fallback: fetch from FastAPI backend /api/reports
    try {
      const token = await getIdToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports || []);
          setReportsError('');
          setReportsLoading(false);
          return;
        }
      }
    } catch (apiErr) {
      console.warn('[Reportly] Backend fetch fallback warning:', apiErr);
    }

    // 3. Only if both queries encountered an actual connection failure
    if (firestoreError) {
      setReportsError('Unable to connect to database. Please check your internet connection.');
    } else {
      setReports([]);
      setReportsError('');
    }
    setReportsLoading(false);
  }, [currentUser, getIdToken]);

  useEffect(() => {
    if (currentUser) fetchReports();
  }, [currentUser, fetchReports]);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    const token = await getIdToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        let errMessage = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          errMessage = errData.detail || errData.message || errData.error || errMessage;
        } catch { /* not JSON */ }
        throw new Error(errMessage);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.message || data.error);

      // Persist the decoded report to Firestore under the current user's UID
      if (currentUser?.uid) {
        try {
          await saveReportToFirestore(currentUser.uid, data, file.name);
        } catch (dbErr) {
          console.warn('[Reportly] Firestore auto-save notice:', dbErr);
        }
      }

      setResults(data);
      // Refresh history so the new report immediately appears in user's history
      fetchReports();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleReset = () => {
    setResults(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToUpload = () => {
    window.scrollTo({ top: 250, behavior: 'smooth' });
  };

  const openHistoryReport = (report) => {
    setResults(report);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayName = userProfile?.displayName || currentUser?.email?.split('@')[0] || 'User';

  return (
    <div className="font-sans antialiased text-slate-900 bg-[#fafaf9] min-h-screen selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        onReset={handleReset}
        onToggleHistory={() => setShowHistory((v) => !v)}
        historyCount={reports.length}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Standalone mode banner when Firebase credentials are not in .env */}
      {!isFirebaseConfigured && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Running in Local Standalone Mode:</strong> Firebase authentication is unconfigured. Medical extraction &amp; mathematical analysis work fully. To enable user logins and cloud history, copy <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">frontend/.env.example</code> to <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">frontend/.env</code>.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Report History Slide-in Panel */}
      {showHistory && (
        <ReportHistoryPanel
          reports={reports}
          loading={reportsLoading}
          error={reportsError}
          onSelectReport={openHistoryReport}
          onRefresh={fetchReports}
          onClose={() => setShowHistory(false)}
          language={language}
        />
      )}

      {/* Authenticated Dashboard Hero Greeting & Recent Reports Section */}
      {currentUser && !results && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
            <div className="absolute inset-0 pointer-events-none opacity-10">
              <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    Patient Workspace
                  </span>
                  <span className="text-xs text-emerald-200/80">{currentUser.email}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome back, {displayName}
                </h1>
                <p className="text-sm text-emerald-100/80 mt-1 max-w-xl">
                  {reports.length > 0
                    ? `You have ${reports.length} saved CBC report${reports.length > 1 ? 's' : ''} in your history. Review past results or upload a new panel below.`
                    : 'Upload your latest CBC blood test to extract parameters, identify multi-marker patterns, and prepare discussion questions for your doctor.'}
                </p>

                {/* Patient Demographics Bar */}
                <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                  <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-100">
                    <User className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Gender: <strong>{userProfile?.gender || 'Not set'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-100">
                    <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Age: <strong>{userProfile?.age ? `${userProfile.age} yrs` : 'Not set'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-100">
                    <Phone className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Mobile: <strong>{userProfile?.phoneNumber ? `+91 ${userProfile.phoneNumber}` : 'Not set'}</strong></span>
                  </div>
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center gap-1 text-xs text-emerald-200 hover:text-white font-semibold underline underline-offset-2 ml-1 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit Details
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleScrollToUpload}
                  className="px-5 py-2.5 rounded-full bg-white text-emerald-950 font-bold text-sm shadow-md hover:bg-emerald-50 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-800" />
                  Upload New Report
                </button>
                {reports.length > 0 && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="px-4 py-2.5 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-emerald-100 font-semibold text-sm hover:bg-emerald-900 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                    All Reports ({reports.length})
                  </button>
                )}
              </div>
            </div>

            {/* Inline Recent Reports Quick-List */}
            {reports.length > 0 && (
              <div className="mt-6 pt-6 border-t border-emerald-700/50">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Recent Saved Reports
                  </h2>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="text-xs font-semibold text-emerald-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reports.slice(0, 3).map((r) => {
                    const counts = r.summary_counts || {};
                    return (
                      <div
                        key={r.id || r.reportId}
                        onClick={() => openHistoryReport(r)}
                        className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-3.5 transition-all cursor-pointer backdrop-blur-xs group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-sm font-bold text-white truncate group-hover:text-emerald-200 transition-colors">
                            {r.title || 'CBC Report'}
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                            Completed
                          </span>
                        </div>
                        <p className="text-xs text-emerald-200/70 truncate mb-2">
                          {r.originalFileName || 'Lab Report'}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-emerald-200/80">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                          {counts.total_parameters > 0 && (
                            <span className="font-semibold text-emerald-300">
                              {counts.within_range_count || 0}/{counts.total_parameters} in range
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

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

      {/* Patient Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Floating Chat Assistant Launcher */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsChatOpen((v) => !v)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-emerald-700/80 active:scale-95 group"
          aria-label="Open Ask Reportly AI Assistant"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-emerald-900 animate-pulse" />
          </div>
          <span className="hidden sm:inline">
            {language === 'hi' ? 'चैटबॉट से पूछें' : 'Ask Reportly'}
          </span>
        </button>
      </div>

      {/* Floating Chat Assistant Drawer / Modal */}
      {isChatOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-end sm:items-center justify-end sm:justify-end p-2 sm:p-6"
          onClick={() => setIsChatOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-2 sm:p-3">
              <button
                onClick={() => setIsChatOpen(false)}
                className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-700 bg-white/90 p-2 rounded-full shadow-xs cursor-pointer border border-slate-100"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
              <AskReportlyGuardrail language={language} reportContext={results} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
