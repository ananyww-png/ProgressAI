import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendUp,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 border border-zinc-200 shadow-sm transition-all duration-150 group relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-black hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
            {title}
          </p>
          <div className="text-2xl font-black text-black tracking-tight font-mono">
            {value}
          </div>
          {subtext && (
            <p className="text-[11px] text-zinc-500 flex items-center gap-1 font-medium">
              {trend && (
                <span className="font-bold text-black font-mono">
                  {trend}
                </span>
              )}
              <span>{subtext}</span>
            </p>
          )}
        </div>

        <div className="p-2.5 rounded-xl bg-black text-white shadow-xs group-hover:scale-105 transition-transform">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
};
