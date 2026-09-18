import React from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  FileText, 
  UploadCloud, 
  CalendarDays, 
  CheckSquare, 
  BarChart3, 
  BrainCircuit, 
  ShieldCheck, 
  Settings,
  HardHat,
  ChevronRight,
  FolderGit2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, reviewQueue, selectedProject } = useApp();

  const pendingReviewCount = reviewQueue.filter(r => r.status === 'Pending').length;

  const navItems: NavItem[] = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Time Agent', label: 'Time Agent', icon: Clock },
    { id: 'Reports', label: 'Reports', icon: FileText },
    { id: 'Input Ingestion', label: 'Input Ingestion', icon: UploadCloud },
    { id: 'Schedule', label: 'Schedule', icon: CalendarDays },
    { id: 'Review Queue', label: 'Review Queue', icon: CheckSquare, badge: pendingReviewCount },
    { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'Project Memory', label: 'Project Memory', icon: BrainCircuit },
    { id: 'Audit Trail', label: 'Audit Trail', icon: ShieldCheck },
    { id: 'Settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-black text-zinc-300 flex flex-col h-screen border-r border-zinc-800 select-none shrink-0 z-20">
      {/* Brand & Logo - Monochrome Brutalist */}
      <div className="p-5 border-b border-zinc-800 flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white text-black flex items-center justify-center font-black shadow-sm">
            <HardHat className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
              Progress<span className="text-zinc-400">AI</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">NOIR</span>
            </h1>
          </div>
        </div>
        <p className="text-[11px] text-zinc-400 font-medium pl-0.5 mt-1 tracking-tight">
          From Site Updates to Schedule Intelligence
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
          Core Platform
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group ${
                isActive
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-black' : 'text-zinc-400 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold transition-colors ${
                    isActive ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-black" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Project & System Status Footer */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-3">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold flex items-center gap-1">
            <FolderGit2 className="w-3 h-3 text-zinc-400" />
            Current Project
          </span>
          <div className="text-xs font-bold text-white truncate" title={selectedProject}>
            {selectedProject}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">EPC Package 03 • L5/L6 Linked</div>
        </div>

        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-zinc-500 text-[11px] font-mono">System Status</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-white font-mono font-bold text-[11px]">ONLINE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
