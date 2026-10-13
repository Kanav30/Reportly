/**
 * Route guards for Reportly.
 *
 * ProtectedRoute — redirects to /login if not authenticated.
 * PublicRoute    — redirects to /dashboard if already authenticated.
 *
 * Both show nothing (null) while Firebase determines auth state,
 * preventing a flash of unauthenticated or authenticated content.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/** Spinner shown while Firebase resolves the initial auth state. */
const AuthLoadingScreen = () => (
  <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin" />
      <p className="text-sm text-emerald-800/70 font-medium">Loading Reportly…</p>
    </div>
  </div>
);

export const ProtectedRoute = ({ children }) => {
  const { currentUser, authLoading, isFirebaseConfigured } = useAuth();
  const location = useLocation();

  if (authLoading) return <AuthLoadingScreen />;

  // When Firebase is not configured, allow access in local standalone mode
  if (!isFirebaseConfigured) {
    return children;
  }

  if (!currentUser) {
    // Preserve intended destination for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

export const PublicRoute = ({ children }) => {
  const { currentUser, authLoading, isFirebaseConfigured } = useAuth();

  if (authLoading) return <AuthLoadingScreen />;
  if (isFirebaseConfigured && currentUser) return <Navigate to="/dashboard" replace />;
  return children;
};

