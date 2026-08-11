import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Plus, Briefcase, X, Edit2, Trash2, AlertCircle } from 'lucide-react';

export default function JobRoles() {
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    scoring_rubric: { technical: 60, communication: 40 }
  });

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

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingRoleId) {
        await api.put(`/hr/job-roles/${editingRoleId}`, formData);
      } else {
        await api.post('/hr/job-roles', formData);
      }
      setIsModalOpen(false);
      setEditingRoleId(null);
      setFormData({ title: '', department: '', description: '', scoring_rubric: { technical: 60, communication: 40 } });
      fetchRoles();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to save job role.');
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete the job role "${title}"?`)) {
      try {
        await api.delete(`/hr/job-roles/${id}`);
        fetchRoles();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete job role');
      }
    }
  };

  const openCreateModal = () => {
    setFormData({ title: '', department: '', description: '', scoring_rubric: { technical: 60, communication: 40 } });
    setEditingRoleId(null);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    let rubric = { technical: 60, communication: 40 };
    if (role.scoring_rubric) {
      try { rubric = typeof role.scoring_rubric === 'string' ? JSON.parse(role.scoring_rubric) : role.scoring_rubric; } catch (e) { }
    }
    setFormData({ title: role.title, department: role.department, description: role.description, scoring_rubric: rubric });
    setEditingRoleId(role.id);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const updateRubric = (key, val) => {
    setFormData(prev => ({
      ...prev,
      scoring_rubric: { ...prev.scoring_rubric, [key]: parseInt(val) || 0 }
    }));
  };

  const totalSum = formData.scoring_rubric.technical + formData.scoring_rubric.communication;

  return (
    <DashboardLayout role="HR">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-1">Job Roles</h1>
            <p className="text-sm text-text-secondary">Manage the positions you are hiring for.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            Add Role
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map(role => {
            let tech = 60, comm = 40;
            if (role.scoring_rubric) {
              try {
                const r = typeof role.scoring_rubric === 'string' ? JSON.parse(role.scoring_rubric) : role.scoring_rubric;
                tech = r.technical || 0; comm = r.communication || 0;
              } catch (e) { }
            }
            return (
              <div key={role.id} className="card-hover relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-primary group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                  <Briefcase className="w-24 h-24 -mt-4 -mr-4" />
                </div>
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button onClick={() => openEditModal(role)} className="p-1.5 bg-surface text-text-muted hover:text-primary hover:bg-surface-raised rounded-lg shadow-sm border border-border" title="Edit Role">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(role.id, role.title)} className="p-1.5 bg-surface text-text-muted hover:text-danger hover:bg-danger-bg rounded-lg shadow-sm border border-border" title="Delete Role">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-1 relative z-10 pr-16">{role.title}</h3>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-4 relative z-10">{role.department}</p>
                <p className="text-sm text-text-secondary line-clamp-2 relative z-10 leading-relaxed mb-4">{role.description}</p>
                <div className="flex gap-3 relative z-10">
                  <div className="flex-1 bg-surface-raised rounded p-2 text-center border border-border">
                    <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Tech</div>
                    <div className="text-sm font-semibold text-primary">{tech}%</div>
                  </div>
                  <div className="flex-1 bg-surface-raised rounded p-2 text-center border border-border">
                    <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Comm</div>
                    <div className="text-sm font-semibold text-success">{comm}%</div>
                  </div>
                </div>
              </div>
            );
          })}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface border border-border shadow-2xl rounded-2xl p-8 w-full max-w-md relative my-8 max-h-[90vh] flex flex-col">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors z-10">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-text-primary flex-shrink-0 mb-6">
              {editingRoleId ? 'Edit Job Role' : 'Add New Job Role'}
            </h2>

            <div className="overflow-y-auto flex-1 pr-2 pb-2 custom-scrollbar">

              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Title</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 text-sm bg-surface-raised border border-border rounded-lg text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. Senior Frontend Engineer" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Department</label>
                  <input required type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full px-4 py-2 text-sm bg-surface-raised border border-border rounded-lg text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. Engineering" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Description</label>
                  <textarea required rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 text-sm resize-none bg-surface-raised border border-border rounded-lg text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Brief description of the role..." />
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-text-primary">Scoring Rubric</label>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${totalSum === 100 ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-400'}`}>
                      Total: {totalSum}%
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary font-medium">Technical Accuracy</span>
                        <span className="text-primary font-bold">{formData.scoring_rubric.technical}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={formData.scoring_rubric.technical} onChange={e => updateRubric('technical', e.target.value)} className="w-full accent-primary" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary font-medium">Communication</span>
                        <span className="text-success font-bold">{formData.scoring_rubric.communication}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={formData.scoring_rubric.communication} onChange={e => updateRubric('communication', e.target.value)} className="w-full accent-success" />
                    </div>
                  </div>
                  {totalSum !== 100 && (
                    <p className="text-red-400 text-[11px] mt-2 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Please adjust weights to equal exactly 100%.
                    </p>
                  )}
                </div>

                <button type="submit" disabled={totalSum !== 100} className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed">Save Role</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
