import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  CheckCheck, 
  ExternalLink, 
  ChevronDown, 
  Building2, 
  CheckCircle2, 
  Trash2,
  AlertCircle,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface TopbarProps {
  onOpenSearch: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSearch }) => {
  const { 
    activeTab, 
    notifications, 
    markNotificationRead, 
    clearAllNotifications, 
    setActiveTab,
    selectedProject,
    setSelectedProject 
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const projectList = [
    'Demo EPC Project – Jaipur',
    'Vadodara Petrochem Expansion',
    'Paradip Crude Terminal Ph-2'
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  return (
    <header className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between z-10 shrink-0">
      {/* Active Tab & Breadcrumb */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-extrabold text-black tracking-tight flex items-center gap-2 uppercase">
          {activeTab}
        </h2>
        <span className="text-zinc-300">/</span>
        <span className="text-xs font-mono font-medium text-zinc-500 uppercase tracking-wide">
          {selectedProject}
        </span>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-4">
        {/* Project Selector */}
        <div className="relative" ref={projectRef}>
          <button
            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-black transition"
          >
            <Building2 className="w-3.5 h-3.5 text-black" />
            <span className="max-w-[150px] truncate">{selectedProject}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {isProjectMenuOpen && (
            <div className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-zinc-200 py-1.5 z-30 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1 text-[10px] uppercase font-mono font-bold text-zinc-400 tracking-wider">
                Select Active EPC Project
              </div>
              {projectList.map(proj => (
                <button
                  key={proj}
                  onClick={() => {
                    setSelectedProject(proj);
                    setIsProjectMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-100 ${
                    selectedProject === proj ? 'text-black font-extrabold bg-zinc-100' : 'text-zinc-700'
                  }`}
                >
                  <span className="truncate">{proj}</span>
                  {selectedProject === proj && <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 text-zinc-600 text-xs font-medium transition border border-zinc-200 w-56 justify-between group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-black" />
            <span className="text-zinc-600 text-[11px]">Search activities, DPRs...</span>
          </div>
          <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-zinc-300 text-black font-semibold">
            Ctrl+K
          </kbd>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-lg text-zinc-700 hover:text-black hover:bg-zinc-100 relative transition border border-transparent hover:border-zinc-200"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-zinc-200 z-30 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-black uppercase font-mono">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-black text-white font-mono font-bold px-1.5 py-0.2 rounded">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => notifications.forEach(n => markNotificationRead(n.id))}
                    className="text-[11px] text-zinc-600 hover:text-black p-1 rounded hover:bg-zinc-200"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-zinc-400 hover:text-black p-1 rounded hover:bg-zinc-200"
                    title="Clear all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-400 font-mono">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.linkTab) {
                          setActiveTab(n.linkTab);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`p-3 text-xs hover:bg-zinc-50 cursor-pointer transition flex items-start gap-2.5 ${
                        !n.read ? 'bg-zinc-50/80 font-bold' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        <Info className="w-3.5 h-3.5 text-black" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${!n.read ? 'text-black' : 'text-zinc-700'}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">{n.timestamp}</span>
                        </div>
                        <p className="text-zinc-600 text-[11px] line-clamp-2 leading-relaxed font-normal">
                          {n.message}
                        </p>
                        {n.linkTab && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-black uppercase font-mono mt-1">
                            <span>Open in {n.linkTab}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-200">
          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs font-mono">
            P2
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-black text-black leading-tight">
              Planner-02
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Lead EPC Planner
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
