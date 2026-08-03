import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FeatureCarousel from '../../components/auth/FeatureCarousel.jsx';
import api from '../../services/api.js';
import { Bot, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthPage({ defaultMode = 'signin' }) {
  const [isSignIn, setIsSignIn] = useState(defaultMode === 'signin');
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleToggle = () => { setIsSignIn(!isSignIn); setError(''); };
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignIn) {
        const res = await api.post('/auth/signin', { identifier: formData.email, password: formData.password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/hr');
      } else {
        await api.post('/auth/signup', formData);
        setIsSignIn(true);
        setError('Account created successfully. Please sign in.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) { setError('Please enter your email to reset your password.'); return; }
    try {
      await api.post('/auth/forgot-password', { email: formData.email });
      setError('If that email exists, a reset request has been logged.');
    } catch {
      setError('Failed to request password reset.');
    }
  };

  const isSuccess = error.includes('successfully') || error.includes('logged');

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel: Carousel */}
      <div className="hidden lg:block lg:w-1/2">
        <FeatureCarousel />
      </div>

      {/* Right Panel: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative bg-surface">
        <Link
          to="/"
          className="absolute top-6 right-8 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Back to Home
        </Link>

        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md mb-5">
              <Bot className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {isSignIn ? 'Welcome back' : 'Create HR account'}
            </h1>
            <p className="text-sm text-text-secondary mt-2 text-center">
              {isSignIn ? 'Sign in to access your dashboard' : 'Join AntiTalk to launch campaigns'}
            </p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className={`flex items-start gap-3 p-4 mb-5 rounded-xl border text-sm ${
              isSuccess
                ? 'bg-success-bg border-success/25 text-success'
                : 'bg-danger-bg border-danger/25 text-danger'
            }`}>
              {isSuccess
                ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              }
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignIn && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">Full Name</label>
                  <input type="text" name="name" required={!isSignIn} value={formData.name} onChange={handleChange} className="w-full" placeholder="John Smith" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">Username</label>
                  <input type="text" name="username" required={!isSignIn} value={formData.username} onChange={handleChange} className="w-full" placeholder="johnsmith" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                {isSignIn ? 'Email or Username' : 'Email Address'}
              </label>
              <input
                type={isSignIn && !formData.email.includes('@') ? 'text' : 'email'}
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full"
                placeholder={isSignIn ? 'name@company.com or username' : 'name@company.com'}
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-semibold text-text-primary">Password</label>
                {isSignIn && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:text-primary-hover transition-colors font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full" placeholder="••••••••" />
            </div>

            {!isSignIn && (
              <div className="flex items-start gap-2.5 pt-1">
                <input type="checkbox" id="tos" required className="mt-0.5 rounded border-border bg-surface text-primary focus:ring-primary" />
                <label htmlFor="tos" className="text-sm text-text-secondary leading-snug">
                  I agree to the Terms of Service and Privacy Policy
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                isSignIn ? 'Sign In' : 'Create HR Account'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-text-muted">
            {isSignIn ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={handleToggle}
              className="text-primary hover:text-primary-hover transition-colors font-semibold"
            >
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
