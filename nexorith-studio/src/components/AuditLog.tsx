import React from 'react';
import { History, User, Calendar, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '../lib/services';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface AuditLogProps {
  entityId?: string;
  title?: string;
}

export const AuditLog = ({ entityId, title = 'System Audit Trail' }: AuditLogProps) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', entityId],
    queryFn: () => auditService.getAuditLogs({ entityId }),
    refetchInterval: 10000 // Refresh every 10s
  });

  if (isLoading) return <div className="p-8 text-center text-white/20 animate-pulse uppercase tracking-[0.2em] font-bold text-xs">Accessing historical records...</div>;

  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
        <History className="w-4 h-4 text-brand-purple" />
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h3>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5 custom-scrollbar">
        <AnimatePresence>
          {logs.length === 0 ? (
            <div className="p-12 text-center text-white/10 italic text-xs">No activity recorded for this entity.</div>
          ) : (
            logs.map((log: any) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={log.id} 
                className="p-4 hover:bg-white/[0.01] transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-brand-purple/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-brand-purple" />
                    </div>
                    <span className="text-[11px] font-bold text-white/60">{log.userName}</span>
                  </div>
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                    {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 ml-8">
                  <span className="px-2 py-0.5 rounded bg-brand-blue/10 border border-brand-blue/20 text-[8px] font-bold text-brand-blue uppercase tracking-tighter">
                    {log.action}
                  </span>
                  <p className="text-[11px] text-white/40">
                    {log.entity}: <span className="text-white/60 font-medium">{log.details?.title || log.entityId}</span>
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
