import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { UserPlus, Shield, Ban, Trash2, X, ShieldAlert, Users as UsersIcon, AlertCircle } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/admin/users', formData);
      setIsModalOpen(false);
      setFormData({ name: '', username: '', email: '', password: '' });
      fetchUsers();
    } catch (err) {
      console.error('API Error:', err);
      let message = 'Failed to create user. Please try again.';
      if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }
      setErrorMsg(message);
    }
  };



  const toggleStatus = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/status`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this HR account?')) return;
    try {
      await api.delete(`/admin/users/${id}`, { data: { hardDelete: false } });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">User Management</h1>
            <p className="text-text-secondary">View, create, block, and manage platform users (Admin & HR).</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-glow transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Add User
          </button>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Campaigns</th>
                  <th>Usage</th>
                  <th>API Cost</th>
                  <th>Status</th>
                  <th className="text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-raised/60 transition-colors">
                    <td>
                      <div className="font-medium text-text-primary flex items-center gap-3 whitespace-nowrap">
                        <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xs uppercase border border-primary/10">
                          {u.name.substring(0, 2)}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td className="text-sm text-text-secondary whitespace-nowrap">{u.email}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${u.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                          {u.role === 'ADMIN' ? <ShieldAlert className="w-3 h-3" /> : <UsersIcon className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </div>
                    </td>
                    <td className="text-sm text-text-secondary">{u._count?.campaigns || 0}</td>
                    <td className="text-sm font-semibold text-text-primary whitespace-nowrap">
                      {u.total_voice_minutes || 0} min
                    </td>
                    <td className="text-sm text-amber-400">
                      ${(u.api_cost || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border whitespace-nowrap ${u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="pr-5">
                      <div className="flex items-center justify-end gap-2">
                        {u.role !== 'ADMIN' && (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-surface-raised border border-border text-text-secondary text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-primary hover:border-text-muted transition-colors cursor-pointer mr-1"
                          >
                            <option value="HR">HR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        )}



                        <button
                          onClick={() => toggleStatus(u.id)}
                          className={`btn btn-sm ${u.status === 'ACTIVE' ? 'bg-warning-bg text-warning border border-warning/30 hover:bg-warning hover:text-white' : 'bg-success-bg text-success border border-success/30 hover:bg-success hover:text-white'}`}
                          title={u.status === 'ACTIVE' ? 'Block User' : 'Unblock User'}
                        >
                          {u.status === 'ACTIVE' ? <Ban className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="btn btn-sm bg-danger-bg text-danger border border-danger/25 hover:bg-danger hover:text-white"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-text-muted">
                        <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border flex items-center justify-center">
                          <UsersIcon className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium">No HR users found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/40 backdrop-blur-sm">
          <div className="bg-surface border border-border shadow-xl rounded-2xl p-6 w-full max-w-md relative">
            <button onClick={() => { setIsModalOpen(false); setErrorMsg(''); }} className="absolute top-6 right-6 text-text-muted hover:text-text-primary">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-6">Create HR User</h2>
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Temporary Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary" />
              </div>
              <button type="submit" className="btn-primary w-full mt-2">Create Account</button>
            </form>
          </div>
        </div>
      )}


    </DashboardLayout>
  );
}
