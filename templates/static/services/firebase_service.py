import os
import json
import firebase_admin
from firebase_admin import credentials, firestore


# Initialize Firebase only once
if not firebase_admin._apps:

    # Render: use Firebase credentials from environment variable
    firebase_config = os.getenv("FIREBASE_CONFIG")

    if firebase_config:
        firebase_config_dict = json.loads(firebase_config)
        cred = credentials.Certificate(firebase_config_dict)

    # Local VS Code: use firebase_config.json
    else:
        cred = credentials.Certificate("firebase_config.json")

    firebase_admin.initialize_app(cred)


# Connect to Firestore
db = firestore.client()


def save_chat(user_message, ai_response):
    db.collection("chat_history").add({
        "user_message": user_message,
        "ai_response": ai_response,
        "timestamp": firestore.SERVER_TIMESTAMP
    })
