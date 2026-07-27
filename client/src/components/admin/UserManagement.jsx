import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { UserPlus, Shield, Ban, Trash2, X } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '' });

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
    try {
      await api.post('/admin/users', formData);
      setIsModalOpen(false);
      setFormData({ name: '', username: '', email: '', password: '' });
      fetchUsers();
    } catch (err) {
      console.error(err);
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
            <h1 className="text-3xl font-bold text-white mb-2">HR Account Management</h1>
            <p className="text-slate-400">View, create, block, and manage HR users.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-glow transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Add HR User
          </button>
        </div>

        <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-sm font-medium text-slate-300">Name</th>
                <th className="p-4 text-sm font-medium text-slate-300">Email</th>
                <th className="p-4 text-sm font-medium text-slate-300">Campaigns</th>
                <th className="p-4 text-sm font-medium text-slate-300">Status</th>
                <th className="p-4 text-sm font-medium text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-white">{u.name}</td>
                  <td className="p-4 text-sm text-slate-300">{u.email}</td>
                  <td className="p-4 text-sm text-slate-300">{u._count?.campaigns || 0}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={() => toggleStatus(u.id)}
                      className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                      title={u.status === 'ACTIVE' ? 'Block User' : 'Unblock User'}
                    >
                      {u.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400">No HR users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Create HR User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Temporary Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <button type="submit" className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-glow transition-all">Create Account</button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
