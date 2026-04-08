import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const Login = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(''); // New state
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or UserID

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isSignUp ? '/signup' : '/login';
    const payload = isSignUp  
      ? { user_id: userId, name, email, password } 
      : { login_identifier: loginIdentifier, password }; // Match backend names

    try {
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.status === "success") {
        onLoginSuccess(data.user);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An error occurred connecting to the server");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      
      const data = await res.json();
      
      if (data.status === "success") {
        onLoginSuccess(data.user);
      } else {
        // 🔥 NEW: Show the error on the screen!
        setError("Google Login Failed: " + data.message);
      }
    } catch (err) {
      setError("Cannot reach the backend server.");
    }
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy-client-id"}>
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl text-center w-96 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">AI Interview System</h2>
          
          {error && <p className="text-red-400 mb-4 text-sm bg-red-900/20 p-2 rounded">{error}</p>}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
            {isSignUp ? (
              <>
                <input 
                  type="text" placeholder="Choose a User ID" value={userId} 
                  onChange={(e) => setUserId(e.target.value)} required autoComplete="username"
                  className="p-3 rounded-lg bg-slate-700 text-white outline-none border border-slate-600 focus:border-blue-500"
                />
                <input 
                  type="text" placeholder="Full Name" value={name} 
                  onChange={(e) => setName(e.target.value)} required autoComplete="name"
                  className="p-3 rounded-lg bg-slate-700 text-white outline-none border border-slate-600 focus:border-blue-500"
                />
                <input 
                  type="email" placeholder="Email" value={email} 
                  onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                  className="p-3 rounded-lg bg-slate-700 text-white outline-none border border-slate-600 focus:border-blue-500"
                />
              </>
            ) : (
              <input 
                type="text" placeholder="Email or User ID" value={loginIdentifier} 
                onChange={(e) => setLoginIdentifier(e.target.value)} required autoComplete="username"
                className="p-3 rounded-lg bg-slate-700 text-white outline-none border border-slate-600 focus:border-blue-500"
              />
            )}
            <input 
              type="password" placeholder="Password" value={password} 
              onChange={(e) => setPassword(e.target.value)} required 
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="p-3 rounded-lg bg-slate-700 text-white outline-none border border-slate-600 focus:border-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 mt-2">
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <p className="text-slate-400 text-sm mb-6 cursor-pointer hover:text-white transition-colors" onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}>
            {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
          </p>

          <div className="flex items-center gap-4 mb-6">
            <hr className="flex-1 border-slate-600" />
            <span className="text-slate-500 text-sm">OR</span>
            <hr className="flex-1 border-slate-600" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log('Login Failed')}
              theme="filled_black"
              shape="pill"
            />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;