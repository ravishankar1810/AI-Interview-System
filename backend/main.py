import os
import json
import uvicorn
import asyncio
import time
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# --- LIBRARIES ---
import google.generativeai as genai
from pymongo import MongoClient
from datetime import datetime

# --- CONFIGURATION ---
# 🚨 SET THIS TO TRUE while waiting for Google Billing 🚨
USE_MOCK_AI = True 

current_dir = Path(__file__).resolve().parent
env_path = current_dir / ".env"
load_dotenv(dotenv_path=env_path)

# Setup Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ ERROR: GEMINI_API_KEY missing!")
else:
    genai.configure(api_key=api_key)
    # Using Lite model for speed/cost
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-lite')
        print("✅ Gemini AI Loaded")
    except:
        model = None
        print("⚠️ Gemini not loaded (Mock Mode active)")

# Setup MongoDB
mongo_uri = os.getenv("MONGO_URI")
try:
    mongo_client = MongoClient(mongo_uri)
    db = mongo_client["ai_interview_db"]
    chats_collection = db["chats"]
    print("✅ Connected to MongoDB (Local)")
except Exception as e:
    print(f"❌ Database Error: {e}")

# --- SERVER ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- THE REPORT API ---
@app.get("/report")
def get_interview_report():
    chats = list(chats_collection.find({}, {"_id": 0})) 
    
    total_questions = len(chats)
    if total_questions == 0:
        return {"message": "No interview data found yet."}

    report = {
        "candidate_name": "Candidate",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "total_questions": total_questions,
        "interview_history": chats,
        "overall_feedback": "Good effort! Your technical definitions are improving."
    }
    return report

# --- WEBSOCKET ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✅ Client Connected!")
    
    BUFFER_LIMIT = 200000 
    audio_buffer = bytearray()
    
    try:
        while True:
            message = await websocket.receive()
            
            if "bytes" in message:
                chunk = message["bytes"]
                audio_buffer.extend(chunk)
                
                if len(audio_buffer) % 40000 < len(chunk):
                    print(f"📥 Buffer: {len(audio_buffer)}/{BUFFER_LIMIT}")

                if len(audio_buffer) > BUFFER_LIMIT: 
                    print("\n🚀 Buffer Full! Auto-sending...") 
                    await process_audio(websocket, audio_buffer)
                    audio_buffer = bytearray() 

            elif "text" in message:
                data = json.loads(message["text"])
                if data.get("type") == "stop":
                    print("\n🛑 Stop Command.")
                    if len(audio_buffer) > 0:
                        await process_audio(websocket, audio_buffer)
                        audio_buffer = bytearray()

    except WebSocketDisconnect:
        print("\n❌ Client Disconnected")

async def process_audio(websocket: WebSocket, audio_data):
    print(f"Processing {len(audio_data)} bytes...")
    
    # --- MOCK MODE LOGIC (Bypasses Google) ---
    if USE_MOCK_AI:
        print("⚠️ MOCK MODE: Generating fake response to save Quota...")
        await asyncio.sleep(1) # Fake thinking time
        
        # Fake Data
        data = {
            "transcript": "This is a test answer about Python and React.",
            "reply": "That is a correct explanation. Python is great for backend logic."
        }
        
        # Skip the Google Upload/Generate steps
    else:
        # REAL MODE (Your original code)
        if not model: return
        filename = "temp_audio.webm"
        with open(filename, "wb") as f:
            f.write(audio_data)

        try:
            audio_file = await asyncio.to_thread(genai.upload_file, filename, mime_type="audio/webm")
            prompt = """
            You are a technical interviewer. Listen to the candidate's answer.
            1. Transcribe exactly what they said.
            2. Give a short, helpful feedback.
            Return JSON: {"transcript": "...", "reply": "..."}
            """
            response = await asyncio.to_thread(model.generate_content, [prompt, audio_file])
            text = response.text.replace("```json", "").replace("```", "").strip()
            data = json.loads(text)
        except Exception as e:
            print(f"⚠️ Google API Error: {e}")
            return

    # --- SAVE TO DB & REPLY ---
    print(f"🗣️ User: {data['transcript']}")
    print(f"🤖 Gemini: {data['reply']}")

    chat_entry = {
        "timestamp": datetime.now().isoformat(),
        "user_transcript": data['transcript'],
        "ai_response": data['reply']
    }
    await asyncio.to_thread(chats_collection.insert_one, chat_entry)
    print("💾 Saved to MongoDB!")

    await websocket.send_json({"type": "transcription", "text": data['transcript']})
    await websocket.send_json({"type": "ai_response", "text": data['reply']})

if __name__ == "__main__":
    print("🚀 Starting Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)