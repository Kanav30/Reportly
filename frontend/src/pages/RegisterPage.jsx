/**
 * RegisterPage — new Reportly account creation.
 * Creates Firebase Auth user, then POST /api/users/profile to persist
 * the Firestore profile via the trusted backend.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured, saveUserProfileToFirestore } from '../firebase/firebase';
import { API_BASE_URL } from '../api/config';
import { Activity, Eye, EyeOff, AlertCircle, UserPlus, CheckCircle2, AlertTriangle, ArrowRight, Phone, User, Calendar } from 'lucide-react';



const FIREBASE_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': 'The email address format is invalid.',
  'auth/weak-password': 'Password must be at least 6 characters long.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/operation-not-allowed':
    'Email/password sign-in is not enabled. In Firebase Console → Build → Authentication → Sign-in method, click Email/Password and switch it to Enabled.',
  'auth/configuration-not-found':
    'Firebase Authentication is not activated for this project yet. Go to Firebase Console → Build → Authentication, click "Get started", and enable Email/Password.',
  'auth/admin-restricted-operation': 'User registration is restricted in this Firebase project.',
  'auth/project-not-found': 'Firebase project not found. Verify your VITE_FIREBASE_PROJECT_ID in frontend/.env.',
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
  return msg || 'Registration failed. Please try again.';
};


const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains a letter', test: (p) => /[a-zA-Z]/.test(p) },
];

const RegisterPage = () => {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === confirmPassword && confirmPassword !== '';
  const passwordRequirements = PASSWORD_REQUIREMENTS.map((r) => ({
    ...r,
    met: r.test(password),
  }));
  const allRequirementsMet = passwordRequirements.every((r) => r.met);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    const numAge = parseInt(age, 10);
    if (!age || isNaN(numAge) || numAge < 1 || numAge > 120) {
      setError('Please enter a valid age between 1 and 120.');
      return;
    }

    if (!gender) {
      setError('Please select your gender.');
      return;
    }

    if (!isFirebaseConfigured || !auth) {
      setError('Firebase is not configured. Please add your credentials to frontend/.env.');
      return;
    }

    if (!allRequirementsMet) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    let firebaseUser = null;

    try {
      // Step 1: Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      firebaseUser = credential.user;

      const profilePayload = {
        uid: firebaseUser.uid,
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        phoneNumber: cleanPhone,
        gender,
        age: numAge,
        role: 'patient',
      };

      // Step 2: Create profile via trusted authenticated backend (Admin SDK)
      try {
        const token = await firebaseUser.getIdToken(true);
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profilePayload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn('[Reportly] Backend profile creation notice:', errData);
        }
      } catch (profileErr) {
        console.warn('[Reportly] Backend profile setup notice:', profileErr);
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('[Reportly Registration Error]', err);
      // If Firebase Auth succeeded but profile call failed network-wise, still navigate
      if (firebaseUser) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(friendlyError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative blobs */}
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

          <h1 className="text-2xl font-bold text-emerald-950 mb-1 text-center">Create your account</h1>
          <p className="text-sm text-emerald-800/70 text-center mb-6">
            Start understanding your lab reports today.
          </p>

          {/* Unconfigured Firebase banner */}
          {!isFirebaseConfigured && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-2.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Firebase Not Configured</p>
                  <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                    Set up your keys in <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono">frontend/.env</code> to create cloud accounts.
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

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl p-3.5 mb-5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full name */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Phone Number (10 digits mandatory) */}
            <div>
              <label htmlFor="reg-phone" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Mobile Number (10 Digits) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  +91
                </span>
                <input
                  id="reg-phone"
                  type="tel"
                  maxLength={10}
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Required for patient identification and report matching.</p>
            </div>

            {/* Gender and Age Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-gender" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Gender *
                </label>
                <select
                  id="reg-gender"
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-shadow"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="reg-age" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Age (Years) *
                </label>
                <input
                  id="reg-age"
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
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

              {/* Password requirements */}
              {password && (
                <ul className="mt-2 space-y-1">
                  {passwordRequirements.map((r) => (
                    <li key={r.label} className={`flex items-center gap-1.5 text-xs font-medium ${r.met ? 'text-emerald-700' : 'text-slate-400'}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${r.met ? 'text-emerald-600' : 'text-slate-300'}`} />
                      {r.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full px-4 py-2.5 pr-10 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow ${
                    confirmPassword && !passwordsMatch ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-rose-600 mt-1 font-medium">Passwords do not match.</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={
                loading ||
                !email.trim() ||
                !password ||
                !passwordsMatch ||
                !allRequirementsMet ||
                !displayName.trim() ||
                phoneNumber.replace(/\D/g, '').length !== 10 ||
                !age ||
                !gender
              }
              className="w-full py-3 px-6 bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create account</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">Already have an account?</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Link
            to="/login"
            className="block w-full text-center py-2.5 px-6 border-2 border-emerald-800 text-emerald-800 font-bold rounded-xl hover:bg-emerald-50 transition-colors text-sm"
          >
            Sign in instead
          </Link>
        </div>

        <p className="text-center text-xs text-emerald-200/60 mt-5">
          For educational use only · Not a medical device
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
