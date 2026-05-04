import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Info, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Notification } from '../types';
import { teamService } from '../lib/services';
import { formatDistanceToNow } from 'date-fns';

export const NotificationCenter = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("target", "in", ["global", user.uid]),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(docs);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.readBy?.includes(user?.uid || '')).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!user) return;
    await teamService.markNotificationRead(id, user.uid);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 sm:p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-white/40 hover:text-white hover:bg-white/5 transition-all relative"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-purple rounded-full shadow-[0_0_8px_#A855F7]" />
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-[900]" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="fixed top-20 right-6 w-80 sm:w-96 glass border border-white/10 rounded-2xl shadow-2xl z-[1000] overflow-hidden"
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Notifications</h3>
                  <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-12 text-center">
                      <Bell className="w-8 h-8 text-white/5 mx-auto mb-3" />
                      <p className="text-xs text-white/20 font-medium">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isRead = n.readBy?.includes(user?.uid || '');
                      return (
                        <div 
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`p-4 border-b border-white/5 flex gap-4 hover:bg-white/[0.03] transition-all cursor-pointer ${!isRead ? 'bg-brand-purple/[0.02]' : ''}`}
                        >
                          <div className="mt-1">{getIcon(n.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className={`text-xs font-bold truncate ${!isRead ? 'text-white' : 'text-white/60'}`}>{n.title}</h4>
                              <span className="text-[9px] text-white/30 whitespace-nowrap">
                                {n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{n.message}</p>
                          </div>
                          {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-brand-purple shrink-0 mt-2" />}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-3 border-t border-white/5 bg-white/[0.01]">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2 text-[10px] font-bold text-white/20 hover:text-white/40 uppercase tracking-widest transition-colors"
                  >
                    Close Panel
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
