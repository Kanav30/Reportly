"""
Reportly Firebase Persistence Configuration
===========================================
Safe, credential-checked Firestore persistence for laboratory report summaries.
Operates gracefully in offline mode if serviceAccountKey.json is not configured.
Never logs private medical details or exposes public storage buckets.
"""

import os
from typing import Optional, Dict, Any

CREDENTIALS_PATH = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
STORAGE_BUCKET_NAME = os.environ.get("FIREBASE_STORAGE_BUCKET", "")

_db = None
_bucket = None
_firebase_initialized = False

def init_firebase():
    global _db, _bucket, _firebase_initialized
    if _firebase_initialized:
        return _db, _bucket

    if not os.path.exists(CREDENTIALS_PATH):
        # Service account file not provided; run in local privacy-first offline mode
        _firebase_initialized = True
        return None, None

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore, storage

        if not firebase_admin._apps:
            cred = credentials.Certificate(CREDENTIALS_PATH)
            options = {}
            if STORAGE_BUCKET_NAME:
                options['storageBucket'] = STORAGE_BUCKET_NAME
            firebase_admin.initialize_app(cred, options)

        _db = firestore.client()
        if STORAGE_BUCKET_NAME:
            _bucket = storage.bucket()
        _firebase_initialized = True
        return _db, _bucket
    except Exception as e:
        print(f"Notice: Firebase initialization skipped or failed: {e}")
        _firebase_initialized = True
        return None, None


def is_firebase_available() -> bool:
    db, _ = init_firebase()
    return db is not None


def save_report_summary(report_id: str, report_data: Dict[str, Any]) -> bool:
    """Saves structured report data securely if Firebase is configured."""
    db, _ = init_firebase()
    if not db:
        return False
    try:
        # Sanitize sensitive data before persistence
        sanitized = {
            "title": report_data.get("title"),
            "subtitle": report_data.get("subtitle"),
            "parameters": report_data.get("parameters", []),
            "patterns": report_data.get("patterns", []),
            "questions": report_data.get("questions", []),
            "created_at": firestore.SERVER_TIMESTAMP
        }
        db.collection("reports").document(report_id).set(sanitized)
        return True
    except Exception as e:
        print(f"Failed to persist report to Firebase: {e}")
        return False


def get_report_summary(report_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a previously stored report by ID."""
    db, _ = init_firebase()
    if not db:
        return None
    try:
        doc = db.collection("reports").document(report_id).get()
        if doc.exists:
            return doc.to_dict()
    except Exception as e:
        print(f"Failed to retrieve report from Firebase: {e}")
    return None
