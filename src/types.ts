export type Permission = 
  | 'view_dashboard'
  | 'manage_leads'
  | 'view_all_leads'
  | 'manage_clients'
  | 'add_client'
  | 'edit_client'
  | 'delete_client'
  | 'manage_team'
  | 'view_finance'
  | 'manage_finance'
  | 'assign_tasks';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // userId
  relatedTo: 'lead' | 'client';
  relatedId: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'Admin' | 'Co-founder' | 'Manager' | 'Designer' | 'Developer' | 'Intern' | 'Sales Intern' | 'CEO' | 'CTO';
  permissions: Permission[];
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target: string; // 'global' or userId
  readBy: string[];
  createdAt: any;
}

export type LeadStatus = 'New Lead' | 'Contacted' | 'Proposal Sent' | 'Closed Won' | 'Closed Lost';

export interface Lead {
  id: string;
  name: string;
  company: string;
  value: string;
  status: LeadStatus;
  avatar?: string;
  assignedTo?: string; // Owner ID
  notes?: any[];
  followUpDate?: string;
  createdAt: any;
  email?: string;
  phone?: string;
  source?: string;
  documents?: { name: string; url: string; uploadedAt: string }[];
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  status: 'Active' | 'Onboarding' | 'Paused' | 'Completed';
  payment: 'Paid' | 'Pending';
  teamMember: string; // Account Manager / Owner
  avatar?: string;
  ownerId: string;
  createdAt: any;
  website?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: UserProfile['role'];
  permissions: Permission[];
  avatar: string;
  online: boolean;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  timestamp: any;
  details?: any;
  type?: 'call' | 'email' | 'meeting' | 'update';
}
