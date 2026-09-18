import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  score: number;
  showBar?: boolean;
  showCategoryText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ 
  score, 
  showBar = false, 
  showCategoryText = false,
  size = 'md' 
}) => {
  let categoryLabel = 'Low Confidence';
  let badgeClasses = 'bg-white text-zinc-600 border border-dashed border-zinc-400';
  let barColor = 'bg-zinc-400';
  let Icon = HelpCircle;

  if (score >= 90) {
    categoryLabel = 'High Confidence Match';
    badgeClasses = 'bg-black text-white border border-black shadow-xs';
    barColor = 'bg-black';
    Icon = CheckCircle2;
  } else if (score >= 70) {
    categoryLabel = 'Planner Review Recommended';
    badgeClasses = 'bg-zinc-100 text-black border border-zinc-400 font-bold';
    barColor = 'bg-zinc-700';
    Icon = AlertTriangle;
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.2',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-black'
  };

  return (
    <div className="inline-flex flex-col gap-1 items-start">
      <div className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold ${sizeClasses[size]} ${badgeClasses}`}>
        <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <span>{score}%</span>
        {showCategoryText && (
          <span className="font-sans font-medium text-[11px] opacity-90">
            • {categoryLabel}
          </span>
        )}
      </div>

      {showBar && (
        <div className="w-24 h-1 bg-zinc-200 rounded-full overflow-hidden border border-zinc-200">
          <div 
            className={`h-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>
      )}
    </div>
  );
};
