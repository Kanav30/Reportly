from datetime import datetime, timezone

from firebase_config import db

doc_ref = db.collection("_connection_tests").document(
    "reportly-test"
)

doc_ref.set({
    "status": "connected",
    "checkedAt": datetime.now(timezone.utc).isoformat(),
})

saved_doc = doc_ref.get()

if saved_doc.exists:
    print("Firebase connection successful!")
    print(saved_doc.to_dict())
else:
    print("Document was not found.")