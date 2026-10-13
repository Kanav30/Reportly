/**
 * AuthContext — global Firebase authentication state provider.
 *
 * Exposes:
 *   currentUser  — Firebase User object or null
 *   userProfile  — Firestore profile (displayName, email, createdAt) or null
 *   authLoading  — true while Firebase determines initial auth state
 *   getIdToken() — returns a fresh Firebase ID token for backend requests
 *   logout()     — signs the user out and clears state
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  auth,
  isFirebaseConfigured,
  getUserProfileFromFirestore,
  saveUserProfileToFirestore,
} from '../firebase/firebase';
import { API_BASE_URL } from '../api/config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  /** Returns a fresh Firebase ID token. Call before every protected API request. */
  const getIdToken = useCallback(async () => {
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken(/* forceRefresh */ false);
    } catch {
      return null;
    }
  }, [currentUser]);

  /** Fetches the user's Firestore profile via the backend, with direct Firestore fallback. */
  const fetchProfile = useCallback(async (user) => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    let profile = null;

    // Primary: try backend
    try {
      const token = await user.getIdToken(false);
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        profile = await res.json();
      }
    } catch (err) {
      // Backend offline or unreachable
    }

    // Secondary / Fallback: read directly from Firestore client
    if (!profile) {
      try {
        profile = await getUserProfileFromFirestore(user.uid);
      } catch (err) {
        console.warn('[Reportly] Direct Firestore profile read failed:', err);
      }
    }

    // Default fallback from user auth object
    if (!profile) {
      profile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
      };
    }

    setUserProfile(profile);
  }, []);

  /** Updates user profile attributes (displayName, phoneNumber, gender, age) */
  const updateProfile = useCallback(
    async (newData) => {
      if (!currentUser) return false;

      // 1. Direct write to Firestore
      try {
        await saveUserProfileToFirestore(currentUser.uid, newData);
      } catch (err) {
        console.warn('[Reportly] Firestore profile update warning:', err);
      }

      // 2. Sync to backend if accessible
      try {
        const token = await currentUser.getIdToken(false);
        await fetch(`${API_BASE_URL}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newData),
        });
      } catch (err) {
        // Backend sync optional
      }

      // 3. Immediately update in local state
      setUserProfile((prev) => ({
        ...(prev || {}),
        ...newData,
      }));

      return true;
    },
    [currentUser]
  );

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, [fetchProfile]);

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setUserProfile(null);
  };

  const refreshProfile = () => {
    if (currentUser) fetchProfile(currentUser);
  };

  const value = {
    currentUser,
    userProfile,
    authLoading,
    isFirebaseConfigured,
    getIdToken,
    logout,
    refreshProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

