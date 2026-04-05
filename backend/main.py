import os
import json
import uvicorn
import asyncio
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# --- LIBRARIES ---
from groq import AsyncGroq
from pymongo import MongoClient
from datetime import datetime

# --- CONFIGURATION ---
USE_MOCK_AI = False

current_dir = Path(__file__).resolve().parent
env_path = current_dir / ".env"
load_dotenv(dotenv_path=env_path)

# Setup Groq
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("❌ ERROR: GROQ_API_KEY missing in .env!")
    groq_client = None
else:
    groq_client = AsyncGroq(api_key=groq_api_key)
    print("✅ Groq AI Loaded (Whisper + Llama 3.1)")

# Setup MongoDB
mongo_uri = os.getenv("MONGO_URI")
try:
    mongo_client = MongoClient(mongo_uri)
    db = mongo_client["ai_interview_db"]
    chats_collection = db["chats"]
    print("✅ Connected to MongoDB")
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

# --- REPORT API ---
@app.get("/report")
def get_interview_report():
    chats = list(chats_collection.find({}, {"_id": 0}))
    total_questions = len(chats)
    
    report = {
        "candidate_name": "Candidate",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "total_questions": total_questions,
        "interview_history": chats,
        "overall_feedback": "Interview session completed."
    }
    return report

# --- WEBSOCKET ---
# --- WEBSOCKET ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✅ Client Connected!")
    
    BUFFER_LIMIT = 2000000  # 2MB buffer
    audio_buffer = bytearray()
    
    try:
        # 🔥 FIX: Safely try to send the welcome message here!
        welcome_msg = "Hello! I am your AI interviewer. To get started, could you please introduce yourself and tell me about your experience?"
        await websocket.send_json({"type": "ai_response", "text": welcome_msg})
        
        while True:
            message = await websocket.receive()
            
            if "bytes" in message:
                chunk = message["bytes"]
                audio_buffer.extend(chunk)
                
                if len(audio_buffer) % 100000 < len(chunk):
                    print(f"📥 Buffer: {len(audio_buffer)}/{BUFFER_LIMIT}")

                if len(audio_buffer) > BUFFER_LIMIT: 
                    print("🚀 Buffer Full! Auto-processing...") 
                    await process_audio(websocket, audio_buffer)
                    audio_buffer = bytearray() 

            elif "text" in message:
                data = json.loads(message["text"])
                if data.get("type") == "stop":
                    print("🛑 Stop Command Received.")
                    if len(audio_buffer) > 0:
                        await process_audio(websocket, audio_buffer)
                        audio_buffer = bytearray()
    
    except WebSocketDisconnect:
        print("❌ Client Disconnected (Clean)")
    except RuntimeError as e:
        if "disconnect" in str(e).lower():
            print("❌ Client Disconnected (Ghost Connection Ignored)")
        else:
            print(f"⚠️ Unexpected Error: {e}")
    except Exception as e:
        # If the socket dies while sending the welcome message, it fails gracefully here
        print(f"⚠️ Socket Error (Usually React Strict Mode): {e}")

async def process_audio(websocket: WebSocket, audio_data):
    # Require at least a small amount of audio to prevent "invalid media" errors
    if len(audio_data) < 5000:
        print("⚠️ Audio chunk too short, skipping.")
        return

    print(f"Processing {len(audio_data)} bytes with Groq...")
    
    if USE_MOCK_AI:
        await asyncio.sleep(1)
        data = {"transcript": "Mock transcript.", "reply": "Mock AI reply."}
    
    else:
        if not groq_client:
            print("❌ Groq client not loaded.")
            return

        filename = "temp_audio.webm"
        with open(filename, "wb") as f:
            f.write(audio_data)

        try:
            # --- STEP 1: WHISPER (Speech-to-Text) ---
            with open(filename, "rb") as file:
                transcription = await groq_client.audio.transcriptions.create(
                  file=(filename, file.read()),
                  model="whisper-large-v3",
                  response_format="json",
                  language="en" 
                )
            
            user_transcript = transcription.text.strip()
            if not user_transcript:
                print("⚠️ Whisper heard nothing.")
                return

            # --- STEP 2: LLAMA 3.1 (AI Interviewer Brain) ---
            prompt = f"""
            You are a technical interviewer. The candidate just answered: "{user_transcript}"
            Give a short, helpful feedback or ask a logical follow-up question.
            Keep it under 3 sentences.
            """
            
            chat_completion = await groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a technical interviewer. You must reply strictly in JSON format containing a single key called 'reply'."
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                # 🔥 FIX 1: Updated to the new, supported model
                model="llama-3.1-8b-instant", 
                response_format={"type": "json_object"}, 
            )
            
            response_text = chat_completion.choices[0].message.content
            reply_data = json.loads(response_text)
            
            data = {
                "transcript": user_transcript,
                "reply": reply_data.get("reply", "Good answer. Let's move on.")
            }
            
        except Exception as e:
            print(f"⚠️ Groq API Error: {e}")
            await websocket.send_json({"type": "error", "text": "AI processing failed."})
            return

    # --- 3. SEND BACK TO FRONTEND ---
    print(f"🗣️ User: {data.get('transcript', '')}")
    print(f"🤖 AI: {data.get('reply', '')}")

    await websocket.send_json({"type": "transcription", "text": data.get("transcript", "")})
    await websocket.send_json({"type": "ai_response", "text": data.get("reply", "")})

    # Save to Database
    chat_entry = {
        "timestamp": datetime.now().isoformat(),
        "user_transcript": data.get("transcript", ""),
        "ai_response": data.get("reply", "")
    }
    try:
        await asyncio.to_thread(chats_collection.insert_one, chat_entry)
        print("💾 Saved to MongoDB!")
    except Exception as e:
        print(f"⚠️ DB Save Error: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)