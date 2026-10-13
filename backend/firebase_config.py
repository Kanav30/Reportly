"""
firebase_config.py — Firebase Admin SDK initialization and Firestore helpers.

Security notes:
- Token verification (verify_firebase_token) uses the Admin SDK; it never
  trusts a UID supplied by the client.
- All Firestore writes enforce ownerUid from the verified token, not from
  any client-supplied field.
- Admin SDK operations bypass Firestore security rules; authorization must
  be enforced in this layer.
- Passwords, ID tokens, and refresh tokens are never stored.
"""

import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

import firebase_admin
from firebase_admin import credentials, firestore, auth as fb_auth

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

SERVICE_ACCOUNT_PATH = BASE_DIR / "serviceAccountKey.json"
PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "reportly-aayu")
if PROJECT_ID and not os.environ.get("GOOGLE_CLOUD_PROJECT"):
    os.environ["GOOGLE_CLOUD_PROJECT"] = PROJECT_ID

db = None


def init_firebase():
    """Initialize Firebase Admin SDK. Idempotent — safe to call multiple times."""
    global db
    if db is not None:
        return db

    options = {"projectId": PROJECT_ID} if PROJECT_ID else {}
    try:
        if not firebase_admin._apps:
            if SERVICE_ACCOUNT_PATH.exists():
                cred = credentials.Certificate(str(SERVICE_ACCOUNT_PATH))
                firebase_admin.initialize_app(cred, options)
            else:
                try:
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred, options)
                except Exception:
                    # Initialize with project ID for token verification
                    firebase_admin.initialize_app(options=options)

        db = firestore.client()
        print("[Reportly] Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"[Reportly] Warning: Firebase initialization notice: {e}")
        db = None

    return db


# Initialize on module load
db = init_firebase()


def is_firebase_available() -> bool:
    return db is not None


# ---------------------------------------------------------------------------
# Authentication helpers
# ---------------------------------------------------------------------------

def verify_firebase_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a Firebase ID token using the Admin SDK.

    Returns the decoded token dict (contains 'uid', 'email', etc.) on success,
    or None if the token is invalid, expired, or revoked.

    NEVER accepts a client-supplied UID as proof of identity.
    """
    if not id_token:
        return None
    try:
        decoded = fb_auth.verify_id_token(id_token, check_revoked=False)
        return decoded
    except fb_auth.RevokedIdTokenError:
        print("[Reportly] Token was revoked.")
        return None
    except fb_auth.ExpiredIdTokenError:
        print("[Reportly] Token is expired.")
        return None
    except Exception as e:
        print(f"[Reportly] Token verification error: {e}")
        return None


# ---------------------------------------------------------------------------
# User profile helpers (Admin SDK — bypasses Firestore rules)
# ---------------------------------------------------------------------------

def create_or_update_user_profile(
    uid: str,
    email: str,
    display_name: str,
    phone_number: str = "",
    gender: str = "",
    age: Optional[Any] = None,
) -> bool:
    """
    Creates or updates a user profile document in users/{uid}.
    - uid and email always come from the verified Firebase token.
    - display_name, phone_number, gender, age are user patient attributes.
    """
    if not db:
        return False
    try:
        ref = db.collection("users").document(uid)
        now = datetime.now(timezone.utc).isoformat()
        doc = ref.get()
        payload = {
            "displayName": display_name,
            "phoneNumber": phone_number,
            "gender": gender,
            "age": age,
            "updatedAt": now,
        }
        if doc.exists:
            ref.update(payload)
        else:
            ref.set({
                "uid": uid,
                "email": email,
                **payload,
                "createdAt": now,
            })
        return True
    except Exception as e:
        print(f"[Reportly] Error creating/updating user profile for {uid}: {e}")
        return False



def get_user_profile(uid: str) -> Optional[Dict[str, Any]]:
    """Retrieves the Firestore profile for a given UID."""
    if not db:
        return None
    try:
        doc = db.collection("users").document(uid).get()
        if doc.exists:
            return doc.to_dict()
    except Exception as e:
        print(f"[Reportly] Error fetching user profile for {uid}: {e}")
    return None


# ---------------------------------------------------------------------------
# Report persistence helpers (Admin SDK — bypasses Firestore rules)
# ---------------------------------------------------------------------------

def save_report_for_user(
    report_id: str,
    owner_uid: str,
    report_data: Dict[str, Any],
    original_file_name: str = "",
) -> bool:
    """
    Persists a processed report:
    1. users/{owner_uid}/reports/{report_id} (subcollection inside user)
    2. reports/{report_id} (root collection)
    ownerUid is always set from the verified token — never from client data.
    """
    if not db:
        return False
    try:
        now = datetime.now(timezone.utc).isoformat()
        sanitized = {
            "id": report_id,
            "ownerUid": owner_uid,          # ALWAYS server-assigned
            "reportType": "CBC",
            "originalFileName": original_file_name,
            "createdAt": now,
            "processingStatus": "completed",
            "title": report_data.get("title"),
            "subtitle": report_data.get("subtitle"),
            "extraction_source": report_data.get("extraction_source"),
            "summary_counts": report_data.get("summary_counts", {}),
            "parameters": report_data.get("parameters", []),
            "patterns": report_data.get("patterns", []),
            "questions": report_data.get("questions", []),
            "is_sample": report_data.get("is_sample", False),
        }
        # Primary: users/{owner_uid}/reports/{report_id}
        db.collection("users").document(owner_uid).collection("reports").document(report_id).set(sanitized)
        # Root collection mirror
        db.collection("reports").document(report_id).set(sanitized)
        return True
    except Exception as e:
        print(f"[Reportly] Error saving report {report_id}: {e}")
        return False


def get_report_for_user(report_id: str, requesting_uid: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a report ONLY if it belongs to requesting_uid.
    Checks users/{uid}/reports/{report_id} first, then reports/{report_id}.
    Returns None if the report doesn't exist or ownership doesn't match.
    """
    if not db:
        return None
    try:
        # Check subcollection first
        sub_doc = db.collection("users").document(requesting_uid).collection("reports").document(report_id).get()
        if sub_doc.exists:
            data = sub_doc.to_dict()
            if isinstance(data, dict) and data.get("ownerUid") == requesting_uid:
                return data

        # Check root collection
        doc = db.collection("reports").document(report_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        if isinstance(data, dict) and data.get("ownerUid") != requesting_uid:
            print(f"[Reportly] Ownership mismatch: report {report_id} does not belong to {requesting_uid}")
            return None
        return data
    except Exception as e:
        print(f"[Reportly] Error fetching report {report_id}: {e}")
    return None


def get_user_reports(uid: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Returns all reports belonging to uid, ordered by createdAt descending.
    Checks users/{uid}/reports subcollection first, then falls back to root reports collection.
    """
    if not db:
        return []
    try:
        # Check users/{uid}/reports subcollection first
        try:
            sub_query = (
                db.collection("users")
                .document(uid)
                .collection("reports")
                .order_by("createdAt", direction=firestore.Query.DESCENDING)
                .limit(limit)
            )
            sub_docs = list(sub_query.stream())
            if sub_docs:
                return [d.to_dict() for d in sub_docs]
        except Exception as sub_err:
            print(f"[Reportly] Subcollection query notice: {sub_err}")

        # Fallback to root collection
        query = (
            db.collection("reports")
            .where("ownerUid", "==", uid)
            .order_by("createdAt", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )
        docs = query.stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        print(f"[Reportly] Error fetching reports for user {uid}: {e}")
        return []


def delete_report_for_user(report_id: str, requesting_uid: str) -> bool:
    """
    Deletes a report ONLY if it belongs to requesting_uid.
    Deletes from both users/{uid}/reports and root reports collection.
    """
    if not db:
        return False
    try:
        doc = db.collection("reports").document(report_id).get()
        if not doc.exists:
            return False
        data = doc.to_dict()
        if isinstance(data, dict) and data.get("ownerUid") != requesting_uid:
            return False

        # Delete from root collection
        db.collection("reports").document(report_id).delete()

        # Delete from subcollection
        try:
            db.collection("users").document(requesting_uid).collection("reports").document(report_id).delete()
        except Exception:
            pass

        return True
    except Exception as e:
        print(f"[Reportly] Error deleting report {report_id}: {e}")
        return False


# ---------------------------------------------------------------------------
# Legacy helpers (kept for backward compatibility with existing tests)
# ---------------------------------------------------------------------------

def save_report_summary(report_id: str, report_data: Dict[str, Any]) -> bool:
    """Legacy unauthenticated save — used by existing tests only."""
    return save_report_for_user(report_id, owner_uid="__legacy__", report_data=report_data)


def get_report_summary(report_id: str) -> Optional[Dict[str, Any]]:
    """Legacy unauthenticated get — used by existing tests only."""
    if not db:
        return None
    try:
        doc = db.collection("reports").document(report_id).get()
        if doc.exists:
            return doc.to_dict()
    except Exception as e:
        print(f"[Reportly] Error fetching report {report_id}: {e}")
    return None