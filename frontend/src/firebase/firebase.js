import { initializeApp, getApps } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit as firestoreLimit,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Validate required config at startup
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter((k) => !firebaseConfig[k]);

const isFirebaseConfigured = missingKeys.length === 0;

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Persist auth session across browser refreshes via IndexedDB
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('[Reportly] Could not set auth persistence:', err.message);
    });
  } catch (err) {
    console.warn('[Reportly] Firebase initialization error:', err.message);
    app = null;
    auth = null;
    db = null;
  }
} else {
  console.warn(
    `[Reportly] Firebase config is missing keys (${missingKeys.join(', ')}). ` +
      'Authentication is disabled. Create frontend/.env from .env.example to enable accounts.'
  );
}

/** Saves or updates user profile in Firestore users/{uid} */
export const saveUserProfileToFirestore = async (uid, data) => {
  if (!db || !uid) return false;
  try {
    const ref = doc(db, 'users', uid);
    const existing = await getDoc(ref);
    const now = new Date().toISOString();
    if (existing.exists()) {
      await updateDoc(ref, {
        ...data,
        updatedAt: now,
      });
    } else {
      await setDoc(ref, {
        uid,
        ...data,
        createdAt: now,
        updatedAt: now,
      });
    }
    return true;
  } catch (err) {
    console.error('[Reportly] Error saving profile to Firestore:', err);
    return false;
  }
};

/** Retrieves user profile from Firestore users/{uid} */
export const getUserProfileFromFirestore = async (uid) => {
  if (!db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error('[Reportly] Error fetching profile from Firestore:', err);
    return null;
  }
};

/** Saves a processed report to Firestore:
 * 1. Inside user document: users/{ownerUid}/reports/{reportId}
 * 2. Root collection: reports/{reportId} (with ownerUid)
 */
export const saveReportToFirestore = async (ownerUid, reportData, originalFileName = '') => {
  if (!db || !ownerUid || !reportData) return false;
  try {
    const reportId = reportData.id || `rpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const payload = {
      id: reportId,
      ownerUid,
      reportType: 'CBC',
      originalFileName: originalFileName || reportData.originalFileName || 'Lab Report',
      createdAt: now,
      processingStatus: 'completed',
      title: reportData.title || 'CBC Laboratory Panel',
      subtitle: reportData.subtitle || '',
      extraction_source: reportData.extraction_source || '',
      summary_counts: reportData.summary_counts || {},
      parameters: reportData.parameters || [],
      patterns: reportData.patterns || [],
      questions: reportData.questions || [],
      is_sample: false,
    };

    // 1. Primary storage: inside user document subcollection users/{ownerUid}/reports/{reportId}
    const userReportRef = doc(db, 'users', ownerUid, 'reports', reportId);
    await setDoc(userReportRef, payload);

    // 2. Secondary storage: root reports collection for cross-collection queries
    try {
      const rootReportRef = doc(db, 'reports', reportId);
      await setDoc(rootReportRef, payload);
    } catch (rootErr) {
      console.warn('[Reportly] Root report mirror warning:', rootErr.message);
    }

    return true;
  } catch (err) {
    console.error('[Reportly] Error saving report to Firestore:', err);
    return false;
  }
};

/** Fetches reports for the authenticated user from Firestore:
 * Checks users/{ownerUid}/reports first, falls back to reports collection
 */
export const getUserReportsFromFirestore = async (ownerUid, maxLimit = 50) => {
  if (!db || !ownerUid) return [];
  try {
    // 1. Query user's subcollection: users/{ownerUid}/reports
    const userReportsCol = collection(db, 'users', ownerUid, 'reports');
    let snap = null;
    try {
      const q = query(userReportsCol, orderBy('createdAt', 'desc'), firestoreLimit(maxLimit));
      snap = await getDocs(q);
    } catch {
      // Fallback without orderBy in case index is not built
      snap = await getDocs(query(userReportsCol, firestoreLimit(maxLimit)));
    }

    if (snap && !snap.empty) {
      const reports = snap.docs.map((d) => d.data());
      reports.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return reports;
    }

    // 2. Fallback: check root reports collection where ownerUid == ownerUid
    try {
      const rootCol = collection(db, 'reports');
      const rootQ = query(rootCol, where('ownerUid', '==', ownerUid), firestoreLimit(maxLimit));
      const rootSnap = await getDocs(rootQ);
      if (rootSnap && !rootSnap.empty) {
        const rootReports = rootSnap.docs.map((d) => d.data());
        rootReports.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return rootReports;
      }
    } catch (rootErr) {
      console.warn('[Reportly] Root reports query notice:', rootErr.message);
    }

    return [];
  } catch (err) {
    console.warn('[Reportly] Error fetching reports from Firestore:', err);
    throw err;
  }
};

export { app, auth, db, isFirebaseConfigured };


