import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Plus, Briefcase, X } from 'lucide-react';

export default function JobRoles() {
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', department: '', description: '' });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/hr/job-roles');
      setRoles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/job-roles', formData);
      setIsModalOpen(false);
      setFormData({ title: '', department: '', description: '' });
      fetchRoles();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout role="HR">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Job Roles</h1>
            <p className="text-slate-400">Manage the positions you are hiring for.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-glow transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Role
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map(role => (
            <div key={role.id} className="bg-surface border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Briefcase className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{role.title}</h3>
              <p className="text-sm text-primary mb-4">{role.department}</p>
              <p className="text-slate-400 text-sm line-clamp-3">{role.description}</p>
            </div>
          ))}
          
          {roles.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
              <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No job roles created yet.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Add New Job Role</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                <input required type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none" />
              </div>
              <button type="submit" className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-glow transition-all">Save Role</button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
