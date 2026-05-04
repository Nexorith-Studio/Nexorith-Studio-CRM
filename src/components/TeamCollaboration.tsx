import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, UserPlus, Shield, Settings2, CheckCircle2 } from 'lucide-react';
import { TeamMember, Permission, UserProfile } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

const PERMISSION_LABELS: Record<Permission, string> = {
  view_dashboard: 'Dashboard Access',
  manage_leads: 'Manage Leads',
  manage_clients: 'Manage Clients',
  manage_team: 'Team Management',
  view_finance: 'View Finances',
  manage_finance: 'Manage Finances',
  view_all_leads: 'View Team Leads',
  add_client: 'Add Clients',
  edit_client: 'Edit Clients',
  delete_client: 'Delete Clients',
  assign_tasks: 'Assign Tasks'
};

const DEFAULT_PERMISSIONS: Record<UserProfile['role'], Permission[]> = {
  Admin: ['view_dashboard', 'manage_leads', 'manage_clients', 'manage_team', 'view_finance', 'manage_finance', 'view_all_leads', 'add_client', 'edit_client', 'delete_client', 'assign_tasks'],
  'Co-founder': ['view_dashboard', 'manage_leads', 'manage_clients', 'manage_team', 'view_finance', 'manage_finance', 'view_all_leads', 'add_client', 'edit_client', 'delete_client', 'assign_tasks'],
  CEO: ['view_dashboard', 'manage_leads', 'manage_clients', 'manage_team', 'view_finance', 'manage_finance', 'view_all_leads', 'add_client', 'edit_client', 'delete_client', 'assign_tasks'],
  CTO: ['view_dashboard', 'manage_leads', 'manage_clients', 'manage_team', 'view_finance', 'manage_finance', 'view_all_leads', 'add_client', 'edit_client', 'delete_client', 'assign_tasks'],
  Manager: ['view_dashboard', 'manage_leads', 'manage_clients', 'view_all_leads', 'edit_client', 'assign_tasks'],
  Designer: ['view_dashboard'],
  Developer: ['view_dashboard'],
  Intern: ['view_dashboard', 'manage_leads'],
  'Sales Intern': ['view_dashboard', 'manage_leads']
};

export const TeamCollaboration = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [formData, setFormData] = useState({ 
    displayName: '', 
    email: '', 
    password: '',
    role: 'Intern' as UserProfile['role'],
    permissions: DEFAULT_PERMISSIONS['Intern']
  });

  const { data: team = [], isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: teamService.getTeam
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!data.email || !data.password || !data.displayName) {
        throw new Error('Please fill in all required fields (Name, Email, Password)');
      }
      if (data.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      const res = await teamService.adminCreateUser(data);
      try {
        await teamService.sendNotification({
          title: 'New Team Member',
          message: `${data.displayName} has joined the team as ${data.role}.`,
          type: 'info',
          target: 'global'
        });
      } catch (notifyErr) {
        console.warn('Failed to send notification:', notifyErr);
        // Don't fail the whole creation if only notification fails
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      alert('Member created successfully!');
      closeModal();
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to create user');
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ uid, updates }: { uid: string, updates: any }) => {
      const res = await teamService.updateUser(uid, updates);
      await teamService.sendNotification({
        title: 'Profile Updated',
        message: `Team member ${updates.displayName}'s permissions or role have been updated.`,
        type: 'info',
        target: 'global'
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      closeModal();
    }
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({ displayName: '', email: '', password: '', role: 'Intern', permissions: DEFAULT_PERMISSIONS['Intern'] });
  };

  const handleRoleChange = (role: UserProfile['role']) => {
    setFormData({ ...formData, role, permissions: DEFAULT_PERMISSIONS[role] || [] });
  };

  const togglePermission = (perm: Permission) => {
    const current = formData.permissions || [];
    if (current.includes(perm)) {
      setFormData({ ...formData, permissions: current.filter(p => p !== perm) });
    } else {
      setFormData({ ...formData, permissions: [...current, perm] });
    }
  };

  const startEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      displayName: member.displayName || '',
      email: member.email || '',
      role: member.role || 'Intern',
      permissions: member.permissions || DEFAULT_PERMISSIONS[member.role as UserProfile['role']] || []
    });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="glass rounded-xl h-64 animate-pulse" />;
  }

  return (
    <div className="glass rounded-xl p-5 border border-white/10 bg-white/[0.02] h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Active Team ({team.length})</h3>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-purple/10 border border-brand-purple/20 rounded-lg text-[10px] font-bold text-brand-purple hover:bg-brand-purple/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Member
          </button>
        )}
      </div>

      <div className="space-y-4 flex-1">
        {team.map((member: any) => (
          <div key={member.uid || member.id || member.email} className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.02] transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/5 overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.displayName || member.email}`} alt={member.displayName} />
              </div>
              <div>
                <p className="text-[12px] font-medium text-white">{member.displayName || member.email?.split('@')[0]}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-white/40 font-bold uppercase">{member.role}</span>
                  {(member.permissions?.length || 0) > 0 && (
                    <span className="text-[9px] text-brand-purple font-medium flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" />
                      {member.permissions.length} Privileges
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button 
                  onClick={() => startEdit(member)}
                  className="p-1.5 text-white/20 hover:text-white hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              )}
              <div className={`w-1.5 h-1.5 rounded-full ${member.online !== false ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-white/10'}`} />
            </div>
          </div>
        ))}
      </div>

      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="glass max-w-md w-full p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh]"
              >
                <div className="absolute top-0 right-0 p-4 z-10">
                  <button onClick={closeModal} className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-brand-purple" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{editingMember ? 'Edit Permissions' : 'New Team Member'}</h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Role-based Access Control</p>
                  </div>
                </div>

                <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Full Name</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                        value={formData.displayName}
                        onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                        placeholder="Jane Cooper"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Email</label>
                      <input 
                        disabled={!!editingMember}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all disabled:opacity-50"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="jane@nexorith.com"
                      />
                    </div>
                  </div>

                  {!editingMember && (
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Temporary Password</label>
                      <input 
                        type="password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Base Role</label>
                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 overflow-y-auto max-h-[120px] pr-1 custom-scrollbar">
                      {['Admin', 'Co-founder', 'CEO', 'CTO', 'Manager', 'Designer', 'Developer', 'Intern', 'Sales Intern'].map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(role as UserProfile['role'])}
                          className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${
                            formData.role === role 
                              ? 'bg-brand-purple text-white border-brand-purple' 
                              : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Custom Permissions</label>
                      <span className="text-[9px] text-brand-purple font-bold uppercase">{formData.permissions.length} Enabled</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-[200px] pr-1 custom-scrollbar">
                      {(Object.keys(PERMISSION_LABELS) as Permission[]).map((perm) => (
                        <button
                          key={perm}
                          onClick={() => togglePermission(perm)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-[10px] font-medium transition-all ${
                            formData.permissions.includes(perm)
                              ? 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple'
                              : 'bg-white/[0.02] border-white/5 text-white/30 hover:bg-white/5'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                            formData.permissions.includes(perm) ? 'bg-brand-purple border-brand-purple text-white' : 'border-white/10'
                          }`}>
                            {formData.permissions.includes(perm) && <CheckCircle2 className="w-2.5 h-2.5" />}
                          </div>
                          {PERMISSION_LABELS[perm]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => {
                        if (editingMember) {
                          updateMemberMutation.mutate({ uid: editingMember.uid || editingMember.id, updates: formData });
                        } else {
                          addMemberMutation.mutate(formData);
                        }
                      }}
                      disabled={addMemberMutation.isPending || updateMemberMutation.isPending}
                      className="w-full h-12 bg-brand-purple rounded-xl text-sm font-bold text-white hover:scale-[1.02] shadow-xl shadow-brand-purple/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {(addMemberMutation.isPending || updateMemberMutation.isPending) ? 'Processing...' : (editingMember ? 'Update Member' : 'Create Member')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
