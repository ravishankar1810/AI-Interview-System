# 🤖 Real-Time AI Interview & Proctoring System

![Project Status](https://img.shields.io/badge/Status-Prototype%20Complete-success)
![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20FastAPI-blue)
![AI Model](https://img.shields.io/badge/AI-Gemini%202.0%20Flash--Lite-orange)

A **full-duplex, multimodal AI interviewing platform** that conducts technical interviews in real-time while simultaneously monitoring candidate integrity using **Edge-AI computer vision**.

## 🚀 Key Achievements
* **Sub-1.5s Latency**: Achieved natural conversational speed using WebSocket streams and smart audio buffering.
* **Privacy-First Proctoring**: Implemented **Client-Side Gaze Tracking** (MediaPipe) that analyzes video frames locally in the browser—no video data is ever sent to the server.
* **Multimodal Intelligence**: Uses **Google Gemini 2.0 Flash-Lite** to process raw audio bytes directly into reasoning and text, bypassing the need for separate Speech-to-Text (STT) models.
* **Resilient Architecture**: Built-in handling for API rate limits (HTTP 429) via dynamic audio chunking (200KB buffer).

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite) | Interactive UI with real-time video rendering. |
| **Computer Vision** | MediaPipe Face Mesh | Runs in-browser to detect head pose & gaze direction. |
| **Backend** | FastAPI (Python) | High-performance async server handling WebSockets. |
| **AI Engine** | Google Gemini 2.0 Flash | Multimodal LLM for Audio-to-Text & Reasoning. |
| **Database** | MongoDB | NoSQL storage for chat logs and integrity scores. |
| **Communication** | WebSockets | Full-duplex bidirectional streaming. |

---

## ⚙️ System Architecture

1.  **Audio Stream**: The user's voice is captured via `MediaRecorder` and streamed in binary chunks to the backend over a WebSocket.
2.  **Smart Buffering**: The backend accumulates audio until a threshold (200KB) is met to optimize API usage and prevent rate-limiting.
3.  **AI Processing**: The buffered audio is uploaded to Gemini, which returns a transcript and a technical follow-up question.
4.  **Edge Proctoring**: The React frontend tracks facial landmarks (Nose Index 1). If the normalized X-coordinate drops below `0.4` or exceeds `0.6`, a "Distraction Event" is flagged locally.
5.  **Feedback Loop**: The AI's text reply is sent back to the frontend, where it is spoken aloud using the browser's `SpeechSynthesis` API.

---

## 📸 Screenshots & Features

### 1. The Interview Interface
*Real-time video feed with live transcript generation.*
> *<img width="1920" height="1077" alt="image" src="https://github.com/user-attachments/assets/4b630dad-e64b-4b4d-9cdb-39e4d0548134" />
*

### 2. Integrity Monitor (Anti-Cheat)
*Visual warning triggers when the candidate looks away from the screen.*
> *<img width="1920" height="1077" alt="image" src="https://github.com/user-attachments/assets/71cf86a0-5959-473e-8789-d6471292b573" />
*

### 3. Automated Report Card
*Final summary showing Technical Performance and Integrity Score.*
> *(Add your screenshot here)*

---

## 📥 Installation & Setup

### Prerequisites
* Node.js & npm
* Python 3.10+
* MongoDB (Local or Atlas)
* Google Gemini API Key

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/AI-Interview-System.git](https://github.com/YOUR_USERNAME/AI-Interview-System.git)
cd AI-Interview-System
```

### 2.Backend Setup
```
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
```
* Create a .env file in the backend folder:
  ```
  GEMINI_API_KEY=your_google_api_key_here
  MONGO_URI=mongodb://localhost:27017/
 
 ### 3. Frontend Setup
 ```
cd ../frontend
npm install
```
 ### ▶️ Usage Guide
Start the Backend:

```
# Inside /backend
python main.py
```
Server will start at http://127.0.0.1:8000

## Start the Frontend:

```
# Inside /frontend

npm run dev
```
Open the localhost link (usually http://localhost:5173)

## Start Interview:

*  Allow Camera/Microphone permissions.

* Click the Microphone button to speak.

* Click Stop to receive an AI reply.

* Try looking away to test the Cheat Detection.

* Click End Interview to see your Report Card.

### 🔮 Future Improvements
[ ] Resume Parsing: Upload PDF resumes to generate personalized questions.

[ ] Emotion Analysis: Detect candidate nervousness/confidence using facial micro-expressions.

[ ] Cloud Deployment: Dockerize the application for AWS/Render deployment.

### 👥 Contributors
Ravi Shankar Bhardwaj - Full Stack Developer & Researcher

