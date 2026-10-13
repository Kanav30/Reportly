/**
 * ForgotPasswordPage — sends a Firebase password-reset email.
 * Deliberately does not reveal whether the email is registered.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/firebase';
import { Activity, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const FIREBASE_ERROR_MESSAGES = {
  'auth/invalid-email': 'The email address format is invalid.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/too-many-requests': 'Too many requests. Please wait a moment before trying again.',
};

const friendlyError = (code) =>
  FIREBASE_ERROR_MESSAGES[code] || 'Could not send the reset email. Please try again.';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');

    if (!isFirebaseConfigured || !auth) {
      setError('Firebase is not configured. Please add your credentials to frontend/.env.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);

    } catch (err) {
      // For user-not-found we intentionally show the same success to avoid email enumeration
      if (err.code === 'auth/user-not-found') {
        setSent(true);
      } else {
        setError(friendlyError(err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-emerald-100 p-8 sm:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div className="bg-emerald-800 p-3 rounded-2xl shadow-md mb-4">
              <Activity className="h-7 w-7 text-emerald-50" />
            </div>
            <span className="font-extrabold text-2xl text-emerald-950 tracking-tight">Reportly</span>
          </div>

          {sent ? (
            /* Success state */
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-700" />
              </div>
              <h1 className="text-xl font-bold text-emerald-950 mb-3">Check your inbox</h1>
              <p className="text-sm text-emerald-800/70 leading-relaxed mb-6">
                If an account exists for <span className="font-semibold text-emerald-900">{email}</span>, you'll
                receive a password-reset email shortly. Check your spam folder if it doesn't arrive.
              </p>
              <Link
                to="/login"
                className="block w-full text-center py-2.5 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-sm transition-colors text-sm"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 className="text-2xl font-bold text-emerald-950 mb-1 text-center">Reset your password</h1>
              <p className="text-sm text-emerald-800/70 text-center mb-7">
                Enter your email and we'll send a reset link.
              </p>

              {error && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl p-3.5 mb-5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>

                <button
                  id="forgot-submit"
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3 px-6 bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending…</span>
                    </>
                  ) : (
                    <span>Send reset email</span>
                  )}
                </button>
              </form>
            </>
          )}

          {!sent && (
            <Link
              to="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm text-emerald-700 hover:text-emerald-900 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
