import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Setup from './pages/Setup';
import Interview from './pages/Interview';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/interview" element={<Interview />} />
      </Routes>
    </Router>
  );
}

export default App;