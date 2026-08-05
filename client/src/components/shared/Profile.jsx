import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setFormData(prev => ({ ...prev, name: parsed.name, email: parsed.email }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await api.put('/auth/profile', formData);
      setMessage({ text: res.data.message, type: 'success' });
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      
      // Clear password fields
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout role={user.role}>
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">My Profile</h1>
        <p className="text-text-secondary mb-8">Update your account details and password.</p>

        {message.text && (
          <div className={`p-4 mb-6 rounded-lg text-sm border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary" />
            </div>

            <hr className="border-border my-6" />
            
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-4">Change Password</h3>
              <p className="text-sm text-text-secondary mb-4">Leave blank if you do not want to change your password.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Current Password</label>
                  <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
                  <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
