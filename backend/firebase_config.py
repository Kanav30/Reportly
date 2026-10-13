from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any

import firebase_admin
from firebase_admin import credentials, firestore

BASE_DIR = Path(__file__).resolve().parent
SERVICE_ACCOUNT_PATH = BASE_DIR / "serviceAccountKey.json"

db = None

def init_firebase():
    global db
    if db is not None:
        return db
    try:
        if SERVICE_ACCOUNT_PATH.exists():
            if not firebase_admin._apps:
                credentials_obj = credentials.Certificate(str(SERVICE_ACCOUNT_PATH))
                firebase_admin.initialize_app(credentials_obj)
            db = firestore.client()
    except Exception as e:
        print(f"Warning: Firebase initialization error: {e}")
        db = None
    return db

# Initialize on module load
db = init_firebase()


def is_firebase_available() -> bool:
    return db is not None


def save_report_summary(report_id: str, report_data: Dict[str, Any]) -> bool:
    """Saves structured report data securely to Firestore."""
    if not db:
        return False
    try:
        sanitized = {
            "id": report_id,
            "title": report_data.get("title"),
            "subtitle": report_data.get("subtitle"),
            "extraction_source": report_data.get("extraction_source"),
            "summary_counts": report_data.get("summary_counts", {}),
            "parameters": report_data.get("parameters", []),
            "patterns": report_data.get("patterns", []),
            "questions": report_data.get("questions", []),
            "saved_at": datetime.now(timezone.utc).isoformat()
        }
        db.collection("reports").document(report_id).set(sanitized)
        return True
    except Exception as e:
        print(f"Error saving report to Firestore: {e}")
        return False


def get_report_summary(report_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a previously stored report by ID from Firestore."""
    if not db:
        return None
    try:
        doc = db.collection("reports").document(report_id).get()
        if doc.exists:
            return doc.to_dict()
    except Exception as e:
        print(f"Error fetching report from Firestore: {e}")
    return None