import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function SignIn() {
  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault();
    // Mock login, redirecting to HR Dashboard
    navigate('/hr');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-20">
      <div className="bg-surface border border-white/10 rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Sign In</h2>
          <Link to="/" className="text-sm text-slate-400 hover:text-white">Back to Home</Link>
        </div>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input type="email" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input type="password" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
          </div>
          <button type="submit" className="w-full py-2 bg-primary text-white rounded-lg">Sign In</button>
        </form>
        <p className="mt-4 text-sm text-slate-400 text-center">
          Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
