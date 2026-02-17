import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Code, User } from 'lucide-react';

const Setup = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('Frontend Developer');

  const roles = [
    { id: 'Frontend Developer', icon: <Code />, desc: 'React, Vue, CSS' },
    { id: 'Backend Developer', icon: <Briefcase />, desc: 'Node, Python, SQL' },
    { id: 'HR Round', icon: <User />, desc: 'Behavioral Questions' },
  ];

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-surface/50 backdrop-blur-lg border border-slate-700 rounded-3xl p-8 shadow-2xl"
      >
        <h2 className="text-3xl font-bold mb-2">Configure Your Interview</h2>
        <p className="text-slate-400 mb-8">Select a track to customize your AI experience.</p>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {roles.map((role) => (
            <div 
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`cursor-pointer p-6 rounded-2xl border transition-all ${
                selectedRole === role.id 
                  ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className={`mb-4 ${selectedRole === role.id ? 'text-primary' : 'text-slate-400'}`}>
                {role.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1">{role.id}</h3>
              <p className="text-xs text-slate-500">{role.desc}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={() => navigate('/interview')}
          className="w-full py-4 bg-gradient-to-r from-primary to-accent rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
        >
          Launch Simulation
        </button>
      </motion.div>
    </div>
  );
};

export default Setup;