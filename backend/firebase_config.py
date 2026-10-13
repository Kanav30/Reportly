import firebase_admin
from firebase_admin import credentials, firestore, storage
import os

# To use Firebase, you will need to provide a serviceAccountKey.json file 
# in the backend directory and set your storage bucket name.

CREDENTIALS_PATH = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')

def init_firebase():
    if not os.path.exists(CREDENTIALS_PATH):
        print("Warning: serviceAccountKey.json not found. Firebase will not be initialized.")
        return None, None
        
    try:
        cred = credentials.Certificate(CREDENTIALS_PATH)
        # You would need to replace this with your actual bucket name
        firebase_admin.initialize_app(cred, {
            'storageBucket': 'your-app-id.appspot.com'
        })
        
        db = firestore.client()
        bucket = storage.bucket()
        return db, bucket
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None, None

db, bucket = init_firebase()
