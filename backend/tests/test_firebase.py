import pytest
from datetime import datetime, timezone
from firebase_config import db, is_firebase_available


def test_live_firebase_connectivity():
    """Live connectivity check against Firestore. Skips if live credentials are not set."""
    if not is_firebase_available() or db is None:
        pytest.skip("Firebase credentials not configured locally — skipping live database test.")

    doc_ref = db.collection("_connection_tests").document("reportly-test")
    doc_ref.set({
        "status": "connected",
        "checkedAt": datetime.now(timezone.utc).isoformat(),
    })

    saved_doc = doc_ref.get()
    assert saved_doc.exists, "Document should exist in Firestore"
    assert saved_doc.to_dict().get("status") == "connected"