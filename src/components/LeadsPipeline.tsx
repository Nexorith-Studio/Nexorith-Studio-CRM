import React from 'react';
import { Plus, GripVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { LeadStatus, Lead } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsService, clientService, teamService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { PermissionGate } from './PermissionGate';

const statuses: LeadStatus[] = ['New Lead', 'Contacted', 'Proposal Sent', 'Closed Won', 'Closed Lost'];

const SortableLeadCard = ({ lead, onConvert, onEdit }: { lead: Lead; onConvert?: (lead: Lead) => void; onEdit?: (lead: Lead) => void; key?: React.Key }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onEdit?.(lead)}
      className="bg-white/[0.04] border border-white/10 p-3 rounded-lg shadow-sm hover:bg-white/[0.06] transition-opacity cursor-pointer group relative"
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">{lead.company}</p>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40 p-1">
          <GripVertical className="w-3 h-3" />
        </div>
      </div>
      <h5 className="text-xs font-semibold text-white/90">{lead.name}</h5>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] font-bold text-white/40">{lead.value || '$0'}</span>
        <div className="flex items-center gap-2">
          {lead.status === 'Closed Won' && (
            <PermissionGate permission="manage_clients">
              <button 
                onClick={() => onConvert?.(lead)}
                className="text-[9px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded border border-green-400/20 hover:bg-green-400/20"
              >
                Convert
              </button>
            </PermissionGate>
          )}
          <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.id}`} alt="lead" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const LeadsPipeline = ({ onAddLead, onEditLead, filterType = 'all' }: { onAddLead?: (status: LeadStatus) => void; onEditLead?: (lead: Lead) => void; filterType?: 'my' | 'all' }) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', user?.uid, profile?.role],
    queryFn: () => leadsService.getLeads(user?.uid, profile?.role),
    enabled: !!user
  });

  const filteredLeads = leads.filter(l => {
    if (filterType === 'my') return l.assignedTo === user?.uid;
    return true;
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: LeadStatus }) => {
      const res = await leadsService.updateLead(id, { status });
      const lead = leads.find(l => l.id === id);
      if (status === 'Closed Won') {
        await teamService.sendNotification({
          title: 'DEAL CLOSED! 🚀',
          message: `${lead?.company} deal has been CLOSED WON! Value: ${lead?.value || 'N/A'}`,
          type: 'success',
          target: 'global'
        });
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const convertMutation = useMutation({
    mutationFn: async (lead: Lead) => {
      const res = await clientService.convertLeadToClient(lead);
      await teamService.sendNotification({
        title: 'New Client Onboarded',
        message: `${lead.company} is now officially a client.`,
        type: 'success',
        target: 'global'
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeLead = leads.find(l => l.id === active.id);
    if (!activeLead) return;

    // Check if dropping over a column/status container
    const overId = over.id as string;
    if (statuses.includes(overId as LeadStatus) && activeLead.status !== overId) {
      updateStatusMutation.mutate({ id: activeLead.id, status: overId as LeadStatus });
    }
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);
  };

  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex-shrink-0 w-72 h-96 glass animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
        {statuses.map((status) => (
          <div key={status} id={status} className="flex-shrink-0 w-72 bg-black/[0.15] p-2.5 rounded-xl border border-white/5 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4 px-1">
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">
                {status} ({filteredLeads.filter(l => l.status === status).length})
              </h4>
            </div>

            <div className="space-y-2 flex-1">
              <SortableContext 
                id={status}
                items={filteredLeads.filter(l => l.status === status).map(l => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredLeads
                  .filter((lead) => lead.status === status)
                  .map((lead) => (
                    <SortableLeadCard 
                      key={lead.id} 
                      lead={lead} 
                      onConvert={(l) => convertMutation.mutate(l)}
                      onEdit={onEditLead}
                    />
                  ))}
              </SortableContext>
              
              <PermissionGate permission="manage_leads">
                <button 
                  onClick={() => onAddLead ? onAddLead(status) : null}
                  className="w-full py-2 border border-dashed border-white/10 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/5 transition-all text-[10px] font-bold uppercase tracking-wider"
                >
                  + Add Lead
                </button>
              </PermissionGate>
            </div>
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeId ? (
          <div className="bg-white/[0.08] border border-brand-purple/50 p-3 rounded-lg shadow-2xl scale-105 rotate-2">
            <h5 className="text-xs font-semibold text-white/90">
              {filteredLeads.find(l => l.id === activeId)?.name}
            </h5>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
