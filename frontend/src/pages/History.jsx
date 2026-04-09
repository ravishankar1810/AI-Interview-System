import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MessageSquare, AlertCircle } from 'lucide-react';

const History = ({ user, onGoHome }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userEmail = user?.email || "guest";
        const response = await fetch(`https://ai-interview-system-sw5c.onrender.com/report?email=${userEmail}`);
        const data = await response.json();
        
        // The backend returns an array of chats in "interview_history"
        setHistoryData(data.interview_history || []);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10 border-b border-slate-800 pb-6">
          <button 
            onClick={onGoHome}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Clock className="text-blue-500" /> Interview History
            </h1>
            <p className="text-slate-400 text-sm mt-1">Past questions and AI feedback for {user.name}</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && <p className="text-slate-400 text-center animate-pulse">Loading your history...</p>}

        {/* Empty State */}
        {!loading && historyData.length === 0 && (
          <div className="text-center bg-slate-900 border border-slate-800 rounded-2xl p-10">
            <AlertCircle className="mx-auto text-slate-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">No history yet</h3>
            <p className="text-slate-400">Complete an interview to see your records here.</p>
          </div>
        )}

        {/* History List */}
        {!loading && historyData.length > 0 && (
          <div className="space-y-6">
            {historyData.slice().reverse().map((chat, index) => ( // .reverse() shows newest first
              <div key={index} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-4 border-b border-slate-800/50 pb-4">
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
                    <Clock size={12} /> {new Date(chat.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-950/50 p-4 rounded-xl border-l-2 border-blue-500">
                    <p className="text-xs text-blue-400 font-bold mb-1">Your Response:</p>
                    <p className="text-slate-300 text-sm">{chat.user_transcript}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border-l-2 border-purple-500 ml-4 md:ml-8">
                    <p className="text-xs text-purple-400 font-bold mb-1 flex items-center gap-1"><MessageSquare size={12}/> AI Interviewer:</p>
                    <p className="text-slate-300 text-sm italic">"{chat.ai_response}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default History;