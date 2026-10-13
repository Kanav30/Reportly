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

  /** Fetches the user's Firestore profile (checks authenticated backend, with Firestore client fallback). */
  const fetchProfile = useCallback(async (user) => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    let backendProfile = null;
    let firestoreProfile = null;

    // 1. Primary: Fetch from authenticated backend endpoint (uses Admin SDK)
    try {
      const token = await user.getIdToken(false);
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        backendProfile = await res.json();
      }
    } catch (err) {
      console.warn('[Reportly] Backend profile fetch notice:', err);
    }

    // 2. Fallback: Direct Firestore read (permitted by security rules)
    if (!backendProfile) {
      try {
        firestoreProfile = await getUserProfileFromFirestore(user.uid);
      } catch (err) {
        console.warn('[Reportly] Direct Firestore profile read notice:', err);
      }
    }

    const merged = {
      uid: user.uid,
      email: user.email,
      displayName:
        backendProfile?.displayName ||
        firestoreProfile?.displayName ||
        user.displayName ||
        user.email?.split('@')[0] ||
        'User',
      phoneNumber:
        backendProfile?.phoneNumber ||
        firestoreProfile?.phoneNumber ||
        '',
      gender:
        backendProfile?.gender ||
        firestoreProfile?.gender ||
        'Male',
      age:
        backendProfile?.age !== undefined && backendProfile?.age !== null
          ? backendProfile.age
          : (firestoreProfile?.age !== undefined && firestoreProfile?.age !== null ? firestoreProfile.age : null),
      createdAt: backendProfile?.createdAt || firestoreProfile?.createdAt,
      updatedAt: backendProfile?.updatedAt || firestoreProfile?.updatedAt,
    };

    setUserProfile(merged);
  }, []);

  /** Updates user profile attributes (displayName, phoneNumber, gender, age) via authenticated backend */
  const updateProfile = useCallback(
    async (newData) => {
      if (!currentUser) return false;

      // 1. Optimistically update local state
      setUserProfile((prev) => ({
        ...(prev || {}),
        ...newData,
      }));

      // 2. Write through trusted authenticated FastAPI backend
      try {
        const token = await currentUser.getIdToken(false);
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newData),
        });

        if (res.ok) {
          const savedData = await res.json();
          setUserProfile((prev) => ({
            ...(prev || {}),
            ...savedData,
          }));
          return true;
        } else {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.detail || 'Failed to update profile on backend.');
        }
      } catch (err) {
        console.error('[Reportly] Profile update error:', err);
        throw err;
      }
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

