# AI Interview System (AIInterview.Pro) 🚀

An advanced, full-stack AI Interview platform designed to help candidates practice and master their interview skills. The system features real-time conversational AI, live audio transcription, computer vision-based proctoring, and secure user authentication.

## ✨ Key Features

* **🎙️ Real-Time Conversational AI:** Uses WebSockets to stream audio directly to the backend.
* **⚡ Lightning-Fast Processing:** Powered by **Groq** (Whisper-large-v3 for audio transcription and Llama-3.1-8b for dynamic interview responses).
* **👁️ Live AI Proctoring:** Utilizes Google's **MediaPipe Face Mesh** to track candidate gaze, detect suspicious movements, and calculate a live Integrity Score.
* **🔐 Secure Authentication:** Supports both custom Email/Password login (hashed via `bcrypt`) and **Google OAuth** integration.
* **📊 User Dashboard & History:** Automatically saves interview transcripts and scores to MongoDB, allowing users to review their past performance.
* **📧 Automated Email Alerts:** Sends automated welcome emails upon registration and security alerts upon new logins using `smtplib`.
* **🎨 Modern UI/UX:** Built with React, Tailwind CSS, and Framer Motion for a sleek, responsive, and animated user experience.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React (Vite)
* **Styling:** Tailwind CSS
* **Animations:** Framer Motion
* **Computer Vision:** `@mediapipe/face_mesh`, `@mediapipe/camera_utils`
* **Webcam/Audio:** `react-webcam`, native MediaRecorder API
* **Routing & State:** React Hooks, LocalStorage

### **Backend**
* **Framework:** FastAPI (Python)
* **Real-Time Comm:** WebSockets (`fastapi.WebSocket`)
* **AI/LLM Engine:** Groq API (Whisper & Llama 3)
* **Database:** MongoDB (`pymongo`)
* **Security:** `bcrypt`, `google-auth`

### **Deployment**
* **Frontend:** Vercel
* **Backend:** Render.com

---

## ⚙️ Local Installation & Setup

### **Prerequisites**
* Node.js (v18+)
* Python (3.10+)
* MongoDB Cluster URI
* Groq API Key
* Google Cloud Console OAuth Client ID

### **1. Clone the Repository**
```bash
git clone [https://github.com/ravishankar1810/AI-Interview-System.git](https://github.com/ravishankar1810/AI-Interview-System.git)
cd AI-Interview-System
```
### 2. Backend Setup
Navigate to the backend directory, install dependencies, and configure your environment.
```bash
cd backend
pip install -r requirements.txt
```
Create a .env file in the backend folder:

```bash
GROQ_API_KEY=your_groq_api_key
MONGO_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
EMAIL_ADDRESS=your_gmail_address@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
PORT=8000
```
# Start the FastAPI server:

```bash
python main.py
```
The backend will run on http://127.0.0.1:8000

### 3. Frontend Setup
Navigate to the frontend directory, install dependencies, and configure your environment.

```bash
cd ../frontend
npm install
```
Create a .env file in the frontend folder:

```bash
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```
Start the Vite development server:

```bash
npm run dev
```
The frontend will run on http://localhost:5173

## 🏗️ System Architecture & Data Flow
Authentication: Users log in via Google OAuth or Email/Password. The backend verifies credentials and manages database entries.

Interview Initialization: The frontend establishes a WebSocket connection (ws://) to the FastAPI backend.

Audio Streaming: As the user speaks, the browser chunks audio into WebM format and sends it over the WebSocket.

AI Processing: * FastAPI saves the audio chunk temporarily.

Sends the file to Groq's Whisper model for text transcription.

Feeds the text to Groq's Llama 3 model, instructed by a system prompt to act as an interviewer.

Feedback Loop: The backend sends the AI's text response back over the WebSocket. The frontend updates the transcript UI and utilizes native browser Text-to-Speech to read the response aloud.

Proctoring: Runs entirely client-side using MediaPipe, analyzing webcam frames to ensure the candidate maintains eye contact with the screen.

🚀 Deployment Notes
Environment Variables: Ensure all local .env variables are explicitly added to the environment settings in both Vercel and Render.

WebSocket URLs: When deploying, update the WebSocket connection string in Interview.jsx from ws://127.0.0.1:8000/ws to your live backend URL (e.g., wss://your-backend-url.onrender.com/ws). Note the use of wss:// for secure connections.

# 👨‍💻 Author
Ravi Shankar

B.E. Computer Science Engineering

GitHub Profile
