import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, ChevronRight, ShieldCheck } from 'lucide-react';
import SmokeBackground from '../components/SmokeBackground'; // <--- IMPORT THIS

const Landing = () => {
  const navigate = useNavigate();

  return (
    // Change background to solid dark color so smoke shows up clearly
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      
      {/* --- ADD SMOKE COMPONENT HERE --- */}
      <SmokeBackground />
      
      {/* Overlay Gradient for Vignette effect (keeps text readable) */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/80 pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon to-primary flex items-center gap-2">
          <Bot className="text-neon" /> AIInterview.Pro
        </div>
        <button className="px-5 py-2 rounded-full border border-slate-700 hover:bg-slate-800 transition text-sm bg-slate-900/50 backdrop-blur-md">Sign In</button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 mt-16 flex flex-col md:flex-row items-center gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-800/60 backdrop-blur-md border border-slate-700 text-neon text-xs font-semibold tracking-wide mb-6">
            NEW: REAL-TIME FEEDBACK ENGINE
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 drop-shadow-2xl">
            Master Your Interview <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon via-primary to-accent">With AI Precision</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-lg leading-relaxed drop-shadow-lg">
            Experience the future of interview prep. Get real-time feedback on your speech, confidence, and technical accuracy as you speak.
          </p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/setup')}
              className="px-8 py-4 bg-primary hover:bg-blue-600 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/25 transition-all transform hover:scale-105"
            >
              Start Interview <ChevronRight size={20} />
            </button>
            <button className="px-8 py-4 bg-slate-800/80 backdrop-blur-md hover:bg-slate-700 border border-slate-700 rounded-xl font-semibold transition-all">
              View Demo
            </button>
          </div>
        </motion.div>

        {/* Hero Visual - Updated for better contrast */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 relative"
        >
          <div className="relative z-10 bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-4 mb-6 border-b border-slate-700/50 pb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-neon to-primary flex items-center justify-center">
                <Bot className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Interviewer</h3>
                <p className="text-xs text-neon animate-pulse">● Listening...</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-950/50 p-4 rounded-lg border-l-2 border-neon">
                <p className="text-sm text-slate-300">"Can you explain the difference between TCP and UDP?"</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg border-l-2 border-primary ml-8">
                <p className="text-sm text-white">"Sure! TCP is connection-oriented and reliable, whereas UDP is..."</p>
              </div>
              <div className="absolute -right-4 top-1/2 bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl flex items-center gap-3">
                <ShieldCheck className="text-green-400" size={18} />
                <div>
                  <p className="text-xs font-bold text-white">Great Technical Accuracy</p>
                  <p className="text-[10px] text-slate-400">+5 Points</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Landing;