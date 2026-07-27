import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FeatureCarousel from '../../components/auth/FeatureCarousel.jsx';
import api from '../../services/api.js';

export default function AuthPage({ defaultMode = 'signin' }) {
  const [isSignIn, setIsSignIn] = useState(defaultMode === 'signin');
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleToggle = () => {
    setIsSignIn(!isSignIn);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignIn) {
        const res = await api.post('/auth/signin', { 
          identifier: formData.email, 
          password: formData.password 
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/hr');
      } else {
        await api.post('/auth/signup', formData);
        setIsSignIn(true); // Switch to sign in after successful signup
        setError('Account created successfully. Please sign in.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email to reset your password.');
      return;
    }
    try {
      await api.post('/auth/forgot-password', { email: formData.email });
      setError('If that email exists, a reset request has been logged.');
    } catch (err) {
      setError('Failed to request password reset.');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel: Carousel */}
      <div className="hidden lg:block lg:w-1/2">
        <FeatureCarousel />
      </div>

      {/* Right Panel: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <Link to="/" className="absolute top-8 right-8 text-sm font-medium text-slate-400 hover:text-white transition-colors">
          Back to Home
        </Link>
        
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">{isSignIn ? 'Welcome Back' : 'Create HR Account'}</h1>
            <p className="text-slate-400">{isSignIn ? 'Sign in to access your dashboard' : 'Join AntiTalk to launch campaigns'}</p>
          </div>

          {error && (
            <div className={`p-4 mb-6 rounded-lg text-sm border ${error.includes('successfully') || error.includes('logged') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignIn && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input type="text" name="name" required={!isSignIn} value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                  <input type="text" name="username" required={!isSignIn} value={formData.username} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{isSignIn ? 'Email or Username' : 'Email ID'}</label>
              <input type={isSignIn && !formData.email.includes('@') ? 'text' : 'email'} name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>

            {isSignIn && (
              <div className="flex justify-end">
                <button type="button" onClick={handleForgotPassword} className="text-sm text-primary hover:text-primary-glow transition-colors">
                  Forgot Password?
                </button>
              </div>
            )}

            {!isSignIn && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="tos" required className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary" />
                <label htmlFor="tos" className="text-sm text-slate-400">I agree to the Terms of Service and Privacy Policy</label>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 bg-primary hover:bg-primary-glow text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isSignIn ? 'Sign In' : 'Create HR Account'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-400 text-sm">
            {isSignIn ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={handleToggle} className="text-primary hover:text-primary-glow transition-colors font-medium">
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
