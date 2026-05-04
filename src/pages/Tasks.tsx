import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  User as UserIcon,
  MoreVertical,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, teamService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import { Task, TaskPriority, TaskStatus } from '../types';
import { format } from 'date-fns';
import { TaskModal } from '../components/TaskModal';

export const TasksPage = () => {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<{ priority?: string; status?: string; assignedTo?: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', filter],
    queryFn: () => taskService.getTasks(filter)
  });

  const { data: team = [] } = useQuery({
    queryKey: ['team'],
    queryFn: teamService.getTeam
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: TaskStatus }) => 
      taskService.updateTask(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityColor = (p: TaskPriority) => {
    switch(p) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'low': return 'text-brand-blue bg-brand-blue/10 border-brand-blue/20';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  const getStatusIcon = (s: TaskStatus) => {
    switch(s) {
      case 'done': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-brand-purple" />;
      default: return <AlertCircle className="w-4 h-4 text-white/20" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Mission Control</h2>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">Task Management System</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-purple transition-colors" />
            <input 
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all w-64"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 bg-brand-purple rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: tasks.length, icon: CheckSquare, color: 'text-white' },
          { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, icon: Clock, color: 'text-brand-purple' },
          { label: 'Pending', value: tasks.filter(t => t.status === 'todo').length, icon: AlertCircle, color: 'text-amber-400' },
          { label: 'Completed', value: tasks.filter(t => t.status === 'done').length, icon: CheckCircle2, color: 'text-green-400' },
        ].map((stat, i) => (
          <div key={i} className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <Filter className="w-3 h-3" />
              Filter By:
            </div>
            <select 
              value={filter.status || ''}
              onChange={(e) => setFilter({...filter, status: e.target.value || undefined})}
              className="bg-transparent text-[10px] font-bold text-white/60 uppercase outline-none cursor-pointer hover:text-white"
            >
              <option value="">All Statuses</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Completed</option>
            </select>
            <select 
              value={filter.assignedTo || ''}
              onChange={(e) => setFilter({...filter, assignedTo: e.target.value || undefined})}
              className="bg-transparent text-[10px] font-bold text-white/60 uppercase outline-none cursor-pointer hover:text-white"
            >
              <option value="">All Assignees</option>
              <option value={user?.uid}>My Tasks</option>
              {team.map((m: any) => (
                <option key={m.uid} value={m.uid}>{m.displayName}</option>
              ))}
            </select>
          </div>
          <div className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">
            Showing {filteredTasks.length} results
          </div>
        </div>

        <div className="divide-y divide-white/5">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <div className="p-20 text-center">
                <CheckSquare className="w-12 h-12 text-white/5 mx-auto mb-4" />
                <p className="text-white/20 font-bold uppercase tracking-[0.2em] text-sm">No tasks found</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <motion.div 
                  key={task.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5 hover:bg-white/[0.02] transition-all flex items-start justify-between group"
                >
                  <div className="flex gap-4">
                    <button 
                      onClick={() => updateStatusMutation.mutate({ 
                        id: task.id, 
                        status: task.status === 'done' ? 'todo' : 'done' 
                      })}
                      className="mt-1 transition-colors"
                    >
                      {getStatusIcon(task.status)}
                    </button>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className={`text-sm font-bold ${task.status === 'done' ? 'text-white/20 line-through' : 'text-white'}`}>
                          {task.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border tracking-widest ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 line-clamp-1 mb-3 max-w-lg">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                          <Calendar className="w-3 h-3" />
                          {task.dueDate ? format(new Date(task.dueDate), 'MMM d, p') : 'No date'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                          <UserIcon className="w-3 h-3" />
                          {team.find((m: any) => m.uid === task.assignedTo)?.displayName || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-purple uppercase tracking-widest bg-brand-purple/5 px-2 rounded">
                          <ArrowRight className="w-3 h-3" />
                          {task.relatedTo}: {task.relatedId}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-white/20 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};
