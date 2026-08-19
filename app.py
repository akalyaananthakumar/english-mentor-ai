import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from chatbot_config import CHATBOT_SYSTEM_PROMPT

# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

app = Flask(__name__)

# ============================================================
# GEMINI CONFIGURATION
# ============================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not configured.")

try:
    client = (
        genai.Client(api_key=GEMINI_API_KEY)
        if GEMINI_API_KEY
        else None
    )

except Exception as e:
    print("Gemini initialization error:", e)
    client = None


# ============================================================
# OUT-OF-DOMAIN DETECTION
# ============================================================

OUT_OF_DOMAIN_KEYWORDS = [
    "python programming",
    "python code",
    "javascript code",
    "java programming",
    "c programming",
    "c++ programming",
    "html code",
    "css code",
    "react code",
    "flask code",
    "django",
    "programming",
    "programming language",
    "source code",
    "write code",
    "debug my code",
    "fix my code",
    "database",
    "sql query",
    "machine learning",
    "deep learning",
    "artificial intelligence",
    "neural network",
    "cybersecurity",
    "cyber security",
    "hacking",
    "network security",
    "mathematics",
    "math problem",
    "calculate",
    "calculation",
    "physics",
    "chemistry",
    "biology",
    "photosynthesis",
    "agriculture",
    "farming",
    "crop disease",
    "weather forecast",
    "politics",
    "politician",
    "stock market",
    "cryptocurrency",
    "cricket score",
    "football score",
    "movie recommendation",
    "gaming",
    "video game"
]


def is_clearly_out_of_domain(message):
    """
    Detect questions that are obviously unrelated to English learning.

    This is only a first-level safety/domain filter.
    The main English-only instruction is still enforced through
    CHATBOT_SYSTEM_PROMPT.
    """

    text = message.lower().strip()

    for keyword in OUT_OF_DOMAIN_KEYWORDS:
        if keyword in text:
            return True

    return False


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():
    return render_template("index.html")


# ============================================================
# LOGIN PAGE
# ============================================================

@app.route("/login")
def login_page():
    return render_template("login.html")


# ============================================================
# SIGNUP PAGE
# ============================================================

@app.route("/signup")
def signup_page():
    return render_template("signup.html")


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "application": "English Mentor AI"
    })


# ============================================================
# CHAT API
# ============================================================

@app.route("/chat", methods=["POST"])
def chat():

    try:

        # ----------------------------------------------------
        # CHECK GEMINI CLIENT
        # ----------------------------------------------------

        if client is None:

            return jsonify({
                "success": False,
                "error": "Gemini API is not configured. Check your .env file."
            }), 500


        # ----------------------------------------------------
        # GET REQUEST DATA
        # ----------------------------------------------------

        data = request.get_json(silent=True)

        if not isinstance(data, dict):

            return jsonify({
                "success": False,
                "error": "Invalid request data."
            }), 400


        message = str(
            data.get("message", "")
        ).strip()


        level = str(
            data.get("level", "Beginner")
        ).strip()


        # ----------------------------------------------------
        # VALIDATE MESSAGE
        # ----------------------------------------------------

        if not message:

            return jsonify({
                "success": False,
                "error": "Please enter a message."
            }), 400


        # ----------------------------------------------------
        # LIMIT MESSAGE SIZE
        # ----------------------------------------------------

        if len(message) > 5000:

            return jsonify({
                "success": False,
                "error": (
                    "Message is too long. "
                    "Please keep it under 5000 characters."
                )
            }), 400


        # ----------------------------------------------------
        # VALIDATE LEVEL
        # ----------------------------------------------------

        allowed_levels = [
            "Beginner",
            "Intermediate",
            "Advanced"
        ]

        if level not in allowed_levels:
            level = "Beginner"


        # ----------------------------------------------------
        # FIRST-LEVEL DOMAIN FILTER
        # ----------------------------------------------------

        if is_clearly_out_of_domain(message):

            rejection_message = (
                "Sorry! I'm English Mentor AI. "
                "I can only help with English learning, grammar, "
                "vocabulary, pronunciation, speaking, writing, "
                "and communication skills."
            )

            print("=" * 60)
            print("OUT-OF-DOMAIN QUESTION BLOCKED")
            print("Question:", message)
            print("=" * 60)

            return jsonify({
                "success": True,
                "reply": rejection_message,
                "level": level,
                "domain_rejected": True
            })


        # ----------------------------------------------------
        # LEVEL INSTRUCTION
        # ----------------------------------------------------

        level_instruction = f"""
The learner's current English level is: {level}

Adapt your response to this level.

BEGINNER:
- Use simple English.
- Use short explanations.
- Give easy examples.
- Avoid unnecessarily difficult vocabulary.

INTERMEDIATE:
- Use natural conversational English.
- Explain grammar and vocabulary clearly.
- Give useful examples.

ADVANCED:
- Use sophisticated vocabulary when appropriate.
- Explain grammar nuances.
- Give natural and professional examples.
"""


        # ----------------------------------------------------
        # FINAL GEMINI PROMPT
        # ----------------------------------------------------

        prompt = f"""
{CHATBOT_SYSTEM_PROMPT}

{level_instruction}

============================================================
FINAL DOMAIN INSTRUCTION
============================================================

You are NOT a general-purpose chatbot.

You MUST ONLY answer questions related to:

- English grammar
- English vocabulary
- English speaking
- English writing
- English pronunciation
- English sentence correction
- English conversation
- English communication
- English learning
- English interview preparation
- English practice

If the user's question is unrelated to English learning,
DO NOT answer the question.

Instead respond politely:

"Sorry! I'm English Mentor AI. I can only help with English
learning, grammar, vocabulary, speaking, writing, pronunciation,
and communication skills."

Do not provide information about the unrelated topic.

============================================================
LEARNER MESSAGE
============================================================

{message}
"""


        # ----------------------------------------------------
        # GEMINI REQUEST
        # ----------------------------------------------------

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt
        )


        # ----------------------------------------------------
        # EXTRACT COMPLETE RESPONSE
        # ----------------------------------------------------

        reply = ""

        try:

            if response is not None:
                reply = response.text or ""

        except Exception as text_error:

            print(
                "Response text extraction error:",
                text_error
            )


        reply = str(reply).strip()


        # ----------------------------------------------------
        # CHECK EMPTY RESPONSE
        # ----------------------------------------------------

        if not reply:

            print("=" * 60)
            print("EMPTY GEMINI RESPONSE")
            print("Raw response:", response)
            print("=" * 60)

            return jsonify({
                "success": False,
                "error": (
                    "The AI returned an empty response. "
                    "Please try again."
                )
            }), 500


        # ----------------------------------------------------
        # DEBUG RESPONSE
        # ----------------------------------------------------

        print("=" * 60)
        print("GEMINI RESPONSE RECEIVED")
        print("Response length:", len(reply))
        print("Response preview:", reply[:300])
        print("=" * 60)


        # ----------------------------------------------------
        # RETURN COMPLETE RESPONSE
        # ----------------------------------------------------

        return jsonify({
            "success": True,
            "reply": reply,
            "level": level,
            "domain_rejected": False
        })


    except Exception as e:

        print("=" * 60)
        print("CHAT ERROR")
        print("Error type:", type(e).__name__)
        print("Error:", str(e))
        print("=" * 60)

        return jsonify({
            "success": False,
            "error": (
                "Sorry, I couldn't process your message "
                "right now. Please try again."
            )
        }), 500


# ============================================================
# 404 ERROR
# ============================================================

@app.errorhandler(404)
def page_not_found(error):

    return jsonify({
        "success": False,
        "error": "Page not found."
    }), 404


# ============================================================
# 500 ERROR
# ============================================================

@app.errorhandler(500)
def internal_server_error(error):

    return jsonify({
        "success": False,
        "error": "Internal server error."
    }), 500


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("English Mentor AI")
    print("=" * 60)
    print("Server: http://127.0.0.1:5000")
    print("Login:  http://127.0.0.1:5000/login")
    print("Signup: http://127.0.0.1:5000/signup")
    print("=" * 60)

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=True
    )
