import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { Mic, MicOff, PhoneOff, BarChart3, Eye, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

const Interview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Connecting...");
  const [gazeStatus, setGazeStatus] = useState("Focused");
  const [transcript, setTranscript] = useState(""); 
  
  // --- NEW: CHEAT DETECTION STATE ---
  const [violationCount, setViolationCount] = useState(0);
  const [integrityScore, setIntegrityScore] = useState(100);

  // Report State
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);

  const socketRef = useRef(null);
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const faceMeshRef = useRef(null); 
  const cameraRef = useRef(null);   

  // --- 1. WEBSOCKET LOGIC ---
  useEffect(() => {
    socketRef.current = new WebSocket("ws://127.0.0.1:8000/ws");

    socketRef.current.onopen = () => setStatus("Online");
    socketRef.current.onclose = () => setStatus("Disconnected");
    
    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "transcription") {
          setTranscript(prev => prev + " " + data.text);
        }
        if (data.type === "ai_response") {
          setTranscript(prev => prev + "\n[AI]: " + data.text + "\n");
          speak(data.text);
        }
      } catch (e) {
        console.log("Server Message:", event.data);
      }
    };

    return () => {
      if(socketRef.current) socketRef.current.close();
    }
  }, []);

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0 && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(event.data);
          }
        };

        mediaRecorderRef.current.start(1000); 
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    } else {
      if(mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "stop" }));
      }
    }
  };

  // --- 2. END INTERVIEW & FETCH REPORT ---
  const finishInterview = async () => {
    if (isRecording) toggleRecording();
    if (cameraRef.current) await cameraRef.current.stop();
    
    try {
        // Fetch the Chat History from Backend
        const response = await fetch("http://127.0.0.1:8000/report");
        const data = await response.json();
        
        // Merge Backend Data with Frontend Cheat Data
        const finalReport = {
            ...data,
            integrity_score: integrityScore, // Add Score
            violations: violationCount       // Add Count
        };

        setReportData(finalReport);
        setShowReport(true); 
    } catch (error) {
        console.error("Failed to fetch report:", error);
        alert("Could not generate report. Is backend running?");
    }
  };
  // --- NEW: TEXT TO SPEECH FUNCTION ---
  const speak = (text) => {
    // Stop any previous speech so they don't overlap
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Optional: Change voice/speed
    // utterance.rate = 1.0; 
    // utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };
  // --- 3. VISION LOGIC (UPDATED FOR CHEATING) ---
  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);
    faceMeshRef.current = faceMesh; 
  }, []);

  const onCamLoaded = (stream) => {
    if (webcamRef.current && webcamRef.current.video && faceMeshRef.current) {
        cameraRef.current = new Camera(webcamRef.current.video, {
            onFrame: async () => {
                if (webcamRef.current && webcamRef.current.video) {
                    await faceMeshRef.current.send({ image: webcamRef.current.video });
                }
            },
            width: 640,
            height: 480,
        });
        cameraRef.current.start();
    }
  };

  const onResults = (results) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      const nose = landmarks[1];
      
      // CHEAT DETECTION LOGIC
      // If nose moves too far left (x > 0.6) or right (x < 0.4)
      if (nose.x < 0.4 || nose.x > 0.6) {
          setGazeStatus("⚠️ DISTRACTED");
          // Increase violation count occasionally (rate limiter could be added here)
          setViolationCount(prev => prev + 1);
          setIntegrityScore(prev => Math.max(0, prev - 0.5)); // Lose 0.5 points per frame
      } else {
          setGazeStatus("Focused");
      }
    }
  };

  // --- 4. REPORT CARD VIEW ---
  if (showReport && reportData) {
      return (
        <div className="min-h-screen bg-slate-900 text-white p-10 flex flex-col items-center">
            <div className="max-w-4xl w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700">
                <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <CheckCircle className="text-green-400" size={32} /> 
                        Interview Result
                    </h1>
                    <div className="text-right">
                         <p className="text-slate-400 text-sm">Integrity Score</p>
                         <p className={`text-2xl font-bold ${reportData.integrity_score > 80 ? 'text-green-400' : 'text-red-400'}`}>
                            {Math.round(reportData.integrity_score)}%
                         </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-700/50 p-6 rounded-2xl">
                        <h3 className="text-slate-400 text-sm mb-2">Total Questions</h3>
                        <p className="text-4xl font-bold text-blue-400">{reportData.total_questions || 0}</p>
                    </div>
                    <div className="bg-slate-700/50 p-6 rounded-2xl">
                        <h3 className="text-slate-400 text-sm mb-2">Suspicious Movements</h3>
                        <p className="text-4xl font-bold text-yellow-400">{reportData.violations}</p>
                    </div>
                    <div className="bg-slate-700/50 p-6 rounded-2xl">
                        <h3 className="text-slate-400 text-sm mb-2">Overall Feedback</h3>
                        <p className="text-sm text-slate-200">{reportData.overall_feedback}</p>
                    </div>
                </div>

                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FileText className="text-blue-400" /> Interview Transcript
                </h3>
                
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {reportData.interview_history && reportData.interview_history.map((chat, index) => (
                        <div key={index} className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                            <p className="text-green-400 font-mono text-sm mb-1">You:</p>
                            <p className="text-slate-300 mb-3">{chat.user_transcript}</p>
                            <p className="text-blue-400 font-mono text-sm mb-1">AI Interviewer:</p>
                            <p className="text-slate-400 italic">"{chat.ai_response}"</p>
                        </div>
                    ))}
                    {(!reportData.interview_history || reportData.interview_history.length === 0) && (
                        <p className="text-slate-500 text-center py-10">No questions recorded.</p>
                    )}
                </div>

                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all"
                >
                    Start New Interview
                </button>
            </div>
        </div>
      );
  }

  // --- 5. MAIN INTERVIEW VIEW ---
  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="font-bold text-xl tracking-tight">AI<span className="text-primary">Interview</span></div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${gazeStatus === 'Focused' ? 'border-green-900 bg-green-900/20 text-green-400' : 'border-red-900 bg-red-900/20 text-red-400'}`}>
            {gazeStatus === 'Focused' ? <Eye size={12} /> : <AlertTriangle size={12} />}
            {gazeStatus}
          </div>
          <button 
            onClick={finishInterview}
            className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm font-semibold flex items-center gap-2"
          >
            <PhoneOff size={16} /> End Interview
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex-1 bg-slate-800 rounded-3xl overflow-hidden relative shadow-2xl border border-slate-700 group">
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored={true} 
              onUserMedia={onCamLoaded}
              className="w-full h-full object-cover" 
            />
            {transcript && (
              <div className="absolute bottom-8 left-8 right-8 z-20">
                <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 max-h-40 overflow-y-auto">
                  <p className="text-sm font-medium text-slate-100 whitespace-pre-wrap">{transcript}</p>
                </div>
              </div>
            )}
            
            {/* CHEAT WARNING OVERLAY */}
            {gazeStatus !== 'Focused' && (
                <div className="absolute inset-0 border-4 border-red-500/50 z-10 pointer-events-none animate-pulse"></div>
            )}
          </div>
          
          <div className="bg-surface border border-slate-700 p-4 rounded-2xl flex items-center justify-center gap-6 shadow-lg">
            <button 
              onClick={toggleRecording}
              className={`p-6 rounded-full transition-all transform hover:scale-105 shadow-xl ${
                isRecording ? 'bg-red-500 shadow-red-500/30' : 'bg-primary shadow-primary/30'
              }`}
            >
              {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
            </button>
            <p className="text-sm font-medium text-slate-400 absolute mt-20">
              {isRecording ? "Listening..." : "Tap to Speak"}
            </p>
          </div>
        </div>

        <div className="bg-surface border border-slate-700 rounded-3xl p-6 flex flex-col shadow-xl">
           <h3 className="font-semibold text-slate-300 flex items-center gap-2 mb-6">
             <BarChart3 size={18} className="text-neon" /> Live Proctoring
           </h3>
           <div className="space-y-6 flex-1 overflow-y-auto">
             <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Gaze Status</p>
                <p className={`text-xl font-mono ${gazeStatus === 'Focused' ? 'text-green-400' : 'text-red-400'}`}>
                    {gazeStatus}
                </p>
             </div>
             
             <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Integrity Score</p>
                <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-white">{Math.round(integrityScore)}%</p>
                </div>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${integrityScore > 80 ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${integrityScore}%` }} 
                  />
                </div>
             </div>

             <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Violations Detected</p>
                <p className="text-xl font-mono text-yellow-400">{violationCount}</p>
             </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default Interview;