import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let badgeStyle = 'bg-zinc-100 text-zinc-700 border-zinc-300';
  let dotColor = 'bg-zinc-400';

  const s = status.toLowerCase();

  if (s === 'completed' || s === 'approved' || s === 'processed') {
    badgeStyle = 'bg-black text-white border-black font-bold';
    dotColor = 'bg-white';
  } else if (s === 'in progress' || s === 'processing') {
    badgeStyle = 'bg-white text-black border-2 border-black font-bold';
    dotColor = 'bg-black animate-ping';
  } else if (s === 'needs review' || s === 'pending') {
    badgeStyle = 'bg-zinc-100 text-black border border-zinc-500 font-bold';
    dotColor = 'bg-zinc-800';
  } else if (s === 'delayed' || s === 'rejected') {
    badgeStyle = 'bg-zinc-900 text-zinc-200 border border-zinc-700 font-bold';
    dotColor = 'bg-zinc-400';
  } else if (s === 'draft' || s === 'not started') {
    badgeStyle = 'bg-zinc-50 text-zinc-500 border border-zinc-200 font-medium';
    dotColor = 'bg-zinc-300';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-mono border ${padding} ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
};
