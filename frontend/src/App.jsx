import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Landing from './pages/Landing'; 
import Interview from './pages/Interview';
import History from './pages/History'; // 🔥 NEW IMPORT

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [currentPage, setCurrentPage] = useState('landing');

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
  };

  if (!user) {
    return (
      <Login 
        onLoginSuccess={(userData) => {
          setUser(userData);
          setCurrentPage('landing');
        }} 
      />
    );
  }

  if (currentPage === 'landing') {
    return (
      <Landing 
        user={user} 
        onStartInterview={() => setCurrentPage('interview')} 
        onLogout={handleLogout} // Pass down logout
        onGoToHistory={() => setCurrentPage('history')} // 🔥 Pass down History navigation
      />
    );
  }

  if (currentPage === 'interview') {
    return (
      <Interview 
        user={user} 
        onGoHome={() => setCurrentPage('landing')} 
        onLogout={handleLogout} 
        onGoToHistory={() => setCurrentPage('history')}
      />
    );
  }

  // 🔥 NEW History Route
  if (currentPage === 'history') {
    return (
      <History 
        user={user} 
        onGoHome={() => setCurrentPage('landing')} 
      />
    );
  }

  return <div className="text-white text-center mt-20">Page not found</div>;
}

export default App;