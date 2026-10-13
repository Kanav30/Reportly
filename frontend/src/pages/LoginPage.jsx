/**
 * LoginPage — Reportly authentication entry point.
 * Email + password sign-in with show/hide toggle, inline errors,
 * and a redirect to the originally intended destination after login.
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Eye, EyeOff, AlertCircle, LogIn, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';

const FIREBASE_ERROR_MESSAGES = {
  'auth/invalid-email': 'The email address format is invalid.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password. Please check your details.',
  'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/operation-not-allowed':
    'Email/password sign-in is not enabled. In Firebase Console → Build → Authentication → Sign-in method, click Email/Password and switch it to Enabled.',
  'auth/configuration-not-found':
    'Firebase Authentication is not activated for this project yet. Go to Firebase Console → Build → Authentication, click "Get started", and enable Email/Password.',
};

const friendlyError = (err) => {
  const code = err?.code || '';
  if (FIREBASE_ERROR_MESSAGES[code]) {
    return FIREBASE_ERROR_MESSAGES[code];
  }
  const msg = err?.message || '';
  if (msg.includes('CONFIGURATION_NOT_FOUND')) {
    return 'Firebase Authentication is not activated for this project yet. Go to Firebase Console → Build → Authentication, click "Get started", and enable Email/Password.';
  }
  if (msg.includes('OPERATION_NOT_ALLOWED')) {
    return 'Email/Password sign-in is not enabled. Go to Firebase Console → Build → Authentication → Sign-in method and enable Email/Password.';
  }
  return msg || 'An unexpected error occurred. Please try again.';
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const { currentUser, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError('');

    if (!isFirebaseConfigured || !auth) {
      setError('Firebase is not configured. Please add your credentials to frontend/.env.');
      return;
    }

    setLoading(true);
    try {
      if (currentUser) {
        await logout();
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('[Reportly Login Error]', err);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-emerald-100 p-8 sm:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-emerald-800 p-3 rounded-2xl shadow-md mb-4">
              <Activity className="h-7 w-7 text-emerald-50" />
            </div>
            <span className="font-extrabold text-2xl text-emerald-950 tracking-tight">Reportly</span>
            <span className="text-xs text-emerald-700 font-medium mt-0.5">
              We simplify the report. We connect the dots.
            </span>
          </div>

          <h1 className="text-2xl font-bold text-emerald-950 mb-1 text-center">Welcome back</h1>
          <p className="text-sm text-emerald-800/70 text-center mb-7">
            Sign in to access your lab report history.
          </p>

          {/* Unconfigured Firebase banner */}
          {!isFirebaseConfigured && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-2.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Firebase Not Configured</p>
                  <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                    Add your keys to <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono">frontend/.env</code> to enable cloud user accounts.
                  </p>
                </div>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-950 text-xs mt-1"
              >
                <span>Continue to Dashboard in Standalone Mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Active session banner (if user was already logged in) */}
          {currentUser && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold mb-0.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Currently Signed In</span>
                  </div>
                  <p className="text-sm font-bold text-emerald-950 truncate">{currentUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setEmail('');
                    setPassword('');
                  }}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex-shrink-0"
                >
                  Sign Out
                </button>
              </div>
              <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800">
                <span>Want to continue as this user?</span>
                <Link to="/dashboard" className="font-bold text-emerald-900 hover:underline inline-flex items-center gap-1">
                  Go to Dashboard <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl p-3.5 mb-5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 pr-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full py-3 px-6 bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">New to Reportly?</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Link
            to="/register"
            className="block w-full text-center py-2.5 px-6 border-2 border-emerald-800 text-emerald-800 font-bold rounded-xl hover:bg-emerald-50 transition-colors text-sm"
          >
            Create an account
          </Link>
        </div>

        <p className="text-center text-xs text-emerald-200/60 mt-5">
          For educational use only · Not a medical device
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
