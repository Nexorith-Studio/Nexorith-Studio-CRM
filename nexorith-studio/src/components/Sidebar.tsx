import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCircle, Users2, CircleDollarSign, Settings, LogOut, X, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Permission } from '../types';

const navItems: { icon: any; label: string; path: string; permission?: Permission }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: 'view_dashboard' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks', permission: 'view_dashboard' },
  { icon: Users, label: 'Leads', path: '/leads', permission: 'manage_leads' },
  { icon: UserCircle, label: 'Clients', path: '/clients', permission: 'manage_clients' },
  { icon: Users2, label: 'Team', path: '/team', permission: 'manage_team' },
  { icon: CircleDollarSign, label: 'Finance', path: '/finance', permission: 'view_finance' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { signOut, hasPermission } = useAuth();
  
  const filteredNavItems = navItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={`w-[220px] h-screen border-r border-white/5 flex flex-col fixed left-0 top-0 z-[60] bg-[#050508] transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 pb-10 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center shadow-lg shadow-brand-purple/20">
              <span className="text-white font-bold text-lg leading-none">N</span>
            </div>
            <span className="text-white font-bold text-sm tracking-tight">Nexorith</span>
          </NavLink>
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink 
              key={item.label}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center justify-between p-3 rounded-xl transition-all group
                ${isActive 
                  ? 'bg-white/[0.05] text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]' 
                  : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-4">
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-purple' : 'group-hover:text-brand-purple'} transition-colors`} />
                    <span className="text-[13px] font-medium">{item.label}</span>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand-purple shadow-[0_0_8px_#A855F7]" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/5">
          <div className="flex items-center justify-between mb-2">
             <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">Plan</p>
             <div className="px-1.5 py-0.5 rounded bg-brand-purple/10 border border-brand-purple/20 text-[8px] font-bold text-brand-purple uppercase">Pro</div>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              className="h-full bg-brand-purple"
            />
          </div>
          <p className="text-[10px] font-bold text-white/70 mt-2">75% Usage</p>
          
          <button 
            onClick={signOut}
            className="w-full mt-4 flex items-center gap-3 p-2 text-white/40 hover:text-red-400 transition-colors text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
