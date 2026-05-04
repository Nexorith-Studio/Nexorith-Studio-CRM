import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MessageSquare, Phone, Mail, Calendar, Edit3, Circle, ArrowRight } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Activity } from '../types';
import { formatDistanceToNow } from 'date-fns';

const getIcon = (type: string) => {
  switch (type) {
    case 'call': return <Phone className="w-3 h-3" />;
    case 'email': return <Mail className="w-3 h-3" />;
    case 'meeting': return <Calendar className="w-3 h-3" />;
    case 'update': return <Edit3 className="w-3 h-3" />;
    default: return <MessageSquare className="w-3 h-3" />;
  }
};

export const ActivityTimeline = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "activityLogs"),
      orderBy("timestamp", "desc"),
      limit(15)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        time: doc.data().timestamp
      } as any));
      setActivities(docs);
      setLoading(false);
    }, (error) => {
      console.error("Activity stream error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="glass rounded-2xl h-64 animate-pulse border border-white/5" />;
  }

  return (
    <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group min-h-[300px]">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-4 h-4 text-white/20" />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-4 h-4 text-brand-purple" />
        <div className="flex flex-col">
          <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Activity Log</h3>
          <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Real-time Pulse</p>
        </div>
      </div>

      <div className="space-y-6 relative">
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-white/[0.05]" />
        
        <AnimatePresence mode="popLayout">
          {activities.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">No recent activity</p>
            </motion.div>
          ) : (
            activities.map((activity, idx) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative pl-7"
              >
                <div className={`absolute left-0 top-1 w-5 h-5 rounded-lg bg-[#0A0A0F] border border-white/10 flex items-center justify-center shadow-sm z-10 ${
                  activity.type === 'call' || activity.entity === 'lead' ? 'text-brand-blue' : 'text-brand-purple'
                }`}>
                  {activity.entity === 'transaction' ? <Clock className="w-3 h-3 text-green-400" /> : getIcon(activity.type || 'update')}
                </div>
                
                <div className="flex flex-col">
                  <p className="text-[11px] text-white/70 leading-relaxed font-medium">
                    <span className="text-white font-bold">{activity.userName}</span>{' '}
                    <span className="text-white/40">{activity.action?.toLowerCase().replace(/_/g, ' ')}</span>{' '}
                    <span className="text-brand-purple font-bold">
                      {activity.details?.title || activity.details?.company || activity.entity || ''}
                    </span>
                  </p>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter mt-1">
                    {activity.time?.toDate 
                      ? formatDistanceToNow(activity.time.toDate(), { addSuffix: true }) 
                      : (activity.time?.seconds 
                          ? formatDistanceToNow(new Date(activity.time.seconds * 1000), { addSuffix: true })
                          : 'Just now')}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
