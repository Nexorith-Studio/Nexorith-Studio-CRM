import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <header className="h-16 border-b border-white/5 sticky top-0 z-40 lg:pl-[220px] pr-4 sm:pr-8 flex items-center justify-between bg-dark-bg/80 backdrop-blur-md">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 ml-4"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 max-w-xl ml-4 lg:ml-8 hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 group-focus-within:text-brand-purple transition-colors" />
            <input 
              type="text" 
              placeholder="Search leads, clients, or files..." 
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg py-1.5 pl-10 pr-4 text-xs font-medium text-white/60 focus:outline-none focus:ring-1 focus:ring-brand-purple/30 group-focus-within:bg-white/[0.07] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <NotificationCenter />

        <div className="h-8 w-px bg-white/10 mx-1 sm:mx-2" />

        <div 
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white group-hover:text-brand-purple transition-colors">
              {profile?.displayName || user?.email?.split('@')[0]}
            </p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{profile?.role || 'Member'}</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-brand-purple/40 to-brand-blue/40 border border-white/20 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
            <img 
              referrerPolicy="no-referrer"
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.displayName || user?.email}`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
