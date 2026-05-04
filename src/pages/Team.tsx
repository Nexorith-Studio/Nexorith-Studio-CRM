import React from 'react';
import { TeamCollaboration } from '../components/TeamCollaboration';

export const TeamPage = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Team</h1>
          <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1">Collaborate with your agency members</p>
        </div>
      </header>
      <div className="max-w-2xl">
        <TeamCollaboration />
      </div>
    </div>
  );
};
