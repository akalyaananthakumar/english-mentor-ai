from flask import Flask, render_template, request, jsonify
from google import genai
from google.genai import types
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore

import os
from datetime import datetime


# --------------------------------------------------
# LOAD ENVIRONMENT VARIABLES
# --------------------------------------------------

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# --------------------------------------------------
# CHECK GEMINI API KEY
# --------------------------------------------------

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing in .env file")


# --------------------------------------------------
# INITIALIZE GEMINI
# --------------------------------------------------

client = genai.Client(api_key=GEMINI_API_KEY)


# --------------------------------------------------
# INITIALIZE FLASK
# --------------------------------------------------

app = Flask(__name__)


# --------------------------------------------------
# INITIALIZE FIREBASE
# --------------------------------------------------

firebase_config = "firebase_config.json"

if not os.path.exists(firebase_config):
    raise FileNotFoundError(
        "firebase_config.json not found. "
        "Download your Firebase service account key "
        "and place it in the project folder."
    )


if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_config)
    firebase_admin.initialize_app(cred)


db = firestore.client()


# --------------------------------------------------
# SYSTEM INSTRUCTION
# --------------------------------------------------

SYSTEM_INSTRUCTION = """
You are English Mentor AI, a friendly English learning assistant.

Your main purpose is to help users improve their English.

You should:

1. Help users practice English conversation.
2. Correct grammar mistakes politely.
3. Explain grammar in simple language.
4. Improve incorrect sentences.
5. Teach useful vocabulary.
6. Give simple examples.
7. Help with interview English.
8. Help with professional English.
9. Encourage the learner.
10. Keep explanations clear and beginner-friendly.

When the user writes an incorrect English sentence:

First:
- Give the corrected sentence.

Then:
- Briefly explain the mistake.

Then:
- Give one or two natural alternatives when useful.

Do not make the response unnecessarily long.

Example:

User:
I am go to college yesterday.

Response:

Correct sentence:
I went to college yesterday.

Why:
Use "went" because "yesterday" refers to the past.

Natural alternative:
I went to college yesterday with my friends.

Always behave like a supportive English mentor.
"""


# --------------------------------------------------
# HOME PAGE
# --------------------------------------------------

@app.route("/")
def home():
    return render_template("index.html")


# --------------------------------------------------
# CHAT API
# --------------------------------------------------

@app.route("/chat", methods=["POST"])
def chat():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "No data received."
            }), 400


        user_message = data.get("message", "").strip()


        if not user_message:
            return jsonify({
                "success": False,
                "error": "Please enter a message."
            }), 400


        # --------------------------------------------------
        # GEMINI REQUEST
        # --------------------------------------------------

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.7,
                max_output_tokens=500
            )
        )


        ai_response = response.text


        # --------------------------------------------------
        # SAVE CHAT TO FIRESTORE
        # --------------------------------------------------

        chat_data = {
            "user_message": user_message,
            "ai_response": ai_response,
            "timestamp": datetime.utcnow()
        }


        db.collection("chat_history").add(chat_data)


        # --------------------------------------------------
        # RETURN RESPONSE
        # --------------------------------------------------

        return jsonify({
            "success": True,
            "response": ai_response
        })


    except Exception as e:

        print("ERROR:", str(e))

        return jsonify({
            "success": False,
            "error": "Something went wrong. Please try again."
        }), 500


# --------------------------------------------------
# RUN APPLICATION
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )