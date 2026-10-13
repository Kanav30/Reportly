import React, { useState, useEffect } from 'react';
import { X, User, Mail, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProfileModal = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sync profile when opened
  useEffect(() => {
    if (isOpen && (userProfile || currentUser)) {
      setDisplayName(userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || '');
      setPhoneNumber(userProfile?.phoneNumber || '');
      setGender(userProfile?.gender || 'Male');
      setAge(userProfile?.age !== undefined && userProfile?.age !== null ? String(userProfile.age) : '');
      setError('');
      setSuccess(false);
    }
  }, [isOpen, userProfile, currentUser]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!displayName.trim()) {
      setError('Full name cannot be empty.');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
      setError('Mobile number is mandatory and must be exactly 10 digits.');
      return;
    }

    const numAge = age ? parseInt(age, 10) : null;
    if (!age || isNaN(numAge) || numAge < 1 || numAge > 120) {
      setError('Age is mandatory and must be between 1 and 120.');
      return;
    }

    setLoading(true);
    try {
      const updated = await updateProfile({
        displayName: displayName.trim(),
        phoneNumber: cleanPhone,
        gender,
        age: numAge,
      });

      if (updated) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      } else {
        setError('Could not update profile. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
              <User className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Patient Profile</h2>
              <p className="text-xs text-emerald-200/80">Personal clinical details &amp; demographics</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">Profile updated successfully!</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Email (Readonly) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Email Address (Linked Account)
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="truncate">{currentUser?.email}</span>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Mobile Number (10 Digits) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
                className="w-full pl-12 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono transition-shadow"
              />
            </div>
          </div>

          {/* Gender & Age */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Gender *
              </label>
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Age (Years) *
              </label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 35"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Readonly UID badge for clinical transparency */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
              <span>Patient Identifier:</span>
              <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {currentUser?.uid?.substring(0, 12)}...
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-bold bg-emerald-800 text-white rounded-full hover:bg-emerald-900 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
