import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Bell, KeyRound, CheckCircle, X } from 'lucide-react';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/admin/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/notifications/${selectedRequest.id}/resolve`, { tempPassword });
      setSelectedRequest(null);
      setTempPassword('');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Notifications</h1>
            <p className="text-text-secondary">Manage password reset requests and system alerts.</p>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.map((notif) => (
            <div key={notif.id} className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between hover:border-primary/30 transition-colors shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary">Password Reset Request</h3>
                  <p className="text-sm text-text-secondary">
                    <span className="text-primary font-medium">{notif.user.name}</span> ({notif.user.email}) requested a password reset.
                  </p>
                  <p className="text-xs text-text-muted mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRequest(notif)}
                className="btn-secondary"
              >
                Resolve
              </button>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-surface-raised">
              <Bell className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No pending notifications.</p>
            </div>
          )}
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/40 backdrop-blur-sm">
          <div className="bg-surface border border-border shadow-xl rounded-2xl p-6 w-full max-w-md relative">
            <button onClick={() => setSelectedRequest(null)} className="absolute top-6 right-6 text-text-muted hover:text-text-primary">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-2">Resolve Reset Request</h2>
            <p className="text-sm text-text-secondary mb-6">Set a temporary password for {selectedRequest.user.email}. You must securely communicate this to the user.</p>
            
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Temporary Password</label>
                <input required type="password" value={tempPassword} onChange={e => setTempPassword(e.target.value)} className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary font-mono" />
              </div>
              <button type="submit" className="btn-primary w-full">
                <CheckCircle className="w-4 h-4" /> Resolve & Update
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
