import os
import json
import asyncio
import smtplib
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from groq import Groq
from google.oauth2 import id_token
from google.auth.transport import requests
from email.mime.text import MIMEText
import uvicorn

from dotenv import load_dotenv
# from passlib.context import CryptContext
import bcrypt
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserSignup(BaseModel):
    user_id: str
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    login_identifier: str # 🔥 Can be email OR user_id
    password: str
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["ai_interview_db"]
chats_collection = db["chats"]

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

class Token(BaseModel):
    token: str

def send_welcome_email(user_email, user_name):
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        return

    msg = MIMEText(f"Hello {user_name},\n\nWelcome to your AI Interview session! We are excited to help you practice and improve your skills.")
    msg['Subject'] = 'Welcome to AI Interview System'
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = user_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        print(e)

# Update Signup
@app.post("/signup")
async def signup(user: UserSignup):
    # Check if email OR user_id exists
    if db["users"].find_one({"$or": [{"email": user.email}, {"user_id": user.user_id}]}):
        return {"status": "error", "message": "Email or User ID already taken"}
    
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), salt)
    
    db["users"].insert_one({
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "password": hashed_password.decode('utf-8')
    })
    send_welcome_email(user.email, user.name)
    return {"status": "success", "user": {"email": user.email, "name": user.name, "user_id": user.user_id}}

@app.post("/login")
async def login(user: UserLogin):
    # Find by email OR user_id
    db_user = db["users"].find_one({"$or": [{"email": user.login_identifier}, {"user_id": user.login_identifier}]})
    
    if not db_user or not db_user.get("password"):
        return {"status": "error", "message": "Invalid credentials"}
    
    is_valid = bcrypt.checkpw(user.password.encode('utf-8'), db_user["password"].encode('utf-8'))
    
    if not is_valid:
        return {"status": "error", "message": "Invalid credentials"}
    
    # 🔥 Send an alert email on login (Answering your last question!)
    send_login_alert(db_user["email"], db_user["name"]) 
    
    return {"status": "success", "user": {"email": db_user["email"], "name": db_user["name"], "user_id": db_user.get("user_id")}}

# Add the new email alert function
def send_login_alert(user_email, user_name):
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        return
    msg = MIMEText(f"Hello {user_name},\n\nA new login was detected on your AI Interview account.")
    msg['Subject'] = 'New Login Alert'
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = user_email
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        pass

@app.post("/auth/google")
async def google_auth(token_data: Token):
    try:
        # Verifies the token using your backend .env GOOGLE_CLIENT_ID
        idinfo = id_token.verify_oauth2_token(token_data.token, requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        name = idinfo.get('name', 'User')

        existing_user = db["users"].find_one({"email": email})
        
        # If it's a new Google user, create an account for them
        if not existing_user:
            # Auto-generate a user_id from their email prefix (e.g., "ravi57" from ravi57@gmail.com)
            generated_user_id = email.split("@")[0] 
            
            db["users"].insert_one({
                "user_id": generated_user_id,
                "email": email, 
                "name": name,
                "password": "" # Google users don't need a password
            })
            send_welcome_email(email, name)
            existing_user = {"email": email, "name": name, "user_id": generated_user_id}

        return {"status": "success", "user": {
            "email": email, 
            "name": name, 
            "user_id": existing_user.get("user_id", email)
        }}
        
    except ValueError as e:
        print(f"⚠️ Google Auth Error: {e}")
        return {"status": "error", "message": "Token rejected by Google. Check backend GOOGLE_CLIENT_ID."}
    except Exception as e:
        print(f"⚠️ Unexpected Error: {e}")
        return {"status": "error", "message": "Server error during Google Login."}

@app.get("/report")
def get_interview_report(email: str = None):
    query = {"email": email} if email else {}
    chats = list(chats_collection.find(query, {"_id": 0}))
    total_questions = len(chats)
    
    report = {
        "candidate_email": email or "Guest",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "total_questions": total_questions,
        "interview_history": chats,
        "overall_feedback": "Interview session completed."
    }
    return report

async def process_audio(websocket: WebSocket, audio_buffer, user_email: str = "guest"):
    try:
        with open("temp_audio.webm", "wb") as f:
            f.write(audio_buffer)
        
        with open("temp_audio.webm", "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=("temp_audio.webm", file.read()),
                model="whisper-large-v3"
            )
        user_text = transcription.text

        await websocket.send_json({"type": "transcription", "text": user_text})

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a professional AI interviewer. Ask relevant follow-up questions based on the user's response."},
                {"role": "user", "content": user_text}
            ],
            model="llama-3.1-8b-instant",
        )
        ai_reply = chat_completion.choices[0].message.content

        await websocket.send_json({"type": "ai_response", "text": ai_reply})

        chat_entry = {
            "email": user_email,
            "timestamp": datetime.now().isoformat(),
            "user_transcript": user_text,
            "ai_response": ai_reply
        }
        chats_collection.insert_one(chat_entry)

    except Exception as e:
        print(e)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    BUFFER_LIMIT = 2000000
    audio_buffer = bytearray()
    
    try:
        welcome_msg = "Hello! I am your AI interviewer. To get started, could you please introduce yourself and tell me about your experience?"
        await websocket.send_json({"type": "ai_response", "text": welcome_msg})
        
        while True:
            message = await websocket.receive()
            
            if "bytes" in message:
                chunk = message["bytes"]
                audio_buffer.extend(chunk)

                if len(audio_buffer) > BUFFER_LIMIT: 
                    await process_audio(websocket, audio_buffer)
                    audio_buffer = bytearray() 

            elif "text" in message:
                data = json.loads(message["text"])
                if data.get("type") == "stop":
                    user_email = data.get("email", "guest")
                    if len(audio_buffer) > 0:
                        await process_audio(websocket, audio_buffer, user_email)
                        audio_buffer = bytearray()
    
    except WebSocketDisconnect:
        pass
    except RuntimeError:
        pass
    except Exception as e:
        print(e)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)