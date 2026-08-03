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
      <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-1">Job Roles</h1>
            <p className="text-sm text-text-secondary">Manage the positions you are hiring for.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            Add Role
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map(role => (
            <div key={role.id} className="card-hover relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-primary group-hover:scale-110 transition-transform duration-300">
                <Briefcase className="w-24 h-24 -mt-4 -mr-4" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1 relative z-10">{role.title}</h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-4 relative z-10">{role.department}</p>
              <p className="text-sm text-text-secondary line-clamp-3 relative z-10 leading-relaxed">{role.description}</p>
            </div>
          ))}
          
          {roles.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-border rounded-2xl bg-surface-raised">
              <Briefcase className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-sm font-semibold text-text-secondary">No job roles created yet.</p>
              <p className="text-xs text-text-muted mt-1">Click 'Add Role' to start defining your positions.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/40 backdrop-blur-sm">
          <div className="bg-surface border border-border shadow-2xl rounded-2xl p-8 w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-6">Add New Job Role</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 text-sm" placeholder="e.g. Senior Frontend Engineer" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Department</label>
                <input required type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2 text-sm" placeholder="e.g. Engineering" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Description</label>
                <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 text-sm resize-none" placeholder="Brief description of the role..." />
              </div>
              <button type="submit" className="btn-primary w-full mt-2">Save Role</button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
