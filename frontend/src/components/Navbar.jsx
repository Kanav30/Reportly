import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, Key, History, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserMenu = ({ userProfile, currentUser, onLogout, onOpenProfile }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = userProfile?.displayName || currentUser?.email?.split('@')[0] || 'Account';
  const initial = displayName[0]?.toUpperCase() || 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all text-sm font-semibold text-emerald-900 cursor-pointer"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-5 h-5 bg-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
          {initial}
        </div>
        <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className={`w-3 h-3 text-emerald-700 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser?.email}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] text-emerald-800 font-medium">
              {userProfile?.age && (
                <span className="bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  {userProfile.age} yrs
                </span>
              )}
              {userProfile?.gender && (
                <span className="bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  {userProfile.gender}
                </span>
              )}
              {userProfile?.phoneNumber && (
                <span className="bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-mono">
                  +91 {userProfile.phoneNumber}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); if (onOpenProfile) onOpenProfile(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-emerald-700" />
            My Profile / Demographics
          </button>
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer border-t border-slate-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

const Navbar = ({
  language = 'en',
  onLanguageChange,
  onReset,
  onToggleHistory,
  historyCount,
  onOpenProfile,
}) => {
  const isHindi = language === 'hi';
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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

          {/* Desktop Subtitle */}
          <div className="hidden md:flex items-center text-sm text-emerald-900/70 font-medium">
            <span>{isHindi ? 'सीबीसी रिपोर्ट विश्लेषण व रोगी अंतर्दृष्टि' : 'CBC Report Decoded • Clinical Clarity'}</span>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* My Reports button (authenticated only) */}
            {currentUser && onToggleHistory && (
              <button
                onClick={onToggleHistory}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer"
                aria-label="View my reports"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Reports</span>
                {historyCount > 0 && (
                  <span className="bg-emerald-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {historyCount}
                  </span>
                )}
              </button>
            )}

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

            {/* User menu (authenticated) or non-diagnostic badge (public) */}
            {currentUser ? (
              <UserMenu
                userProfile={userProfile}
                currentUser={currentUser}
                onLogout={handleLogout}
                onOpenProfile={onOpenProfile}
              />
            ) : (
              <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50/80 px-3 py-1.5 rounded-full border border-emerald-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isHindi ? 'निदान नहीं करता' : 'We never diagnose'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
