import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  CalendarDays, 
  FileText, 
  ShieldCheck, 
  BrainCircuit, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { activities, reports, auditRecords, historicalRecords, setActiveTab } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) {
      return { activities: [], reports: [], audits: [], memories: [] };
    }

    const q = query.toLowerCase();

    const matchedActivities = activities.filter(a => 
      a.id.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.discipline.toLowerCase().includes(q) ||
      a.area.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedReports = reports.filter(r => 
      r.id.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.discipline.toLowerCase().includes(q) ||
      r.supervisor.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedAudits = auditRecords.filter(a => 
      a.id.toLowerCase().includes(q) ||
      a.activityId.toLowerCase().includes(q) ||
      a.details.originalInput?.toLowerCase().includes(q) ||
      a.details.aiMatch?.toLowerCase().includes(q) ||
      a.action.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedMemories = historicalRecords.filter(m => 
      m.activityName.toLowerCase().includes(q) ||
      m.activityType.toLowerCase().includes(q) ||
      m.delayCause.toLowerCase().includes(q) ||
      m.lessonsLearned?.toLowerCase().includes(q)
    ).slice(0, 5);

    return {
      activities: matchedActivities,
      reports: matchedReports,
      audits: matchedAudits,
      memories: matchedMemories
    };
  }, [query, activities, reports, auditRecords, historicalRecords]);

  const totalResults = 
    searchResults.activities.length + 
    searchResults.reports.length + 
    searchResults.audits.length + 
    searchResults.memories.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-300 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-200 flex items-center gap-3 bg-zinc-50">
          <Search className="w-5 h-5 text-black shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search across L5/L6 activities, DPRs, audit trail, memory (e.g. 'Line 24', 'CT102')..."
            className="flex-1 bg-transparent text-xs text-black placeholder-zinc-400 outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-zinc-400 hover:text-black rounded-full hover:bg-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-zinc-300 text-black font-bold">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {query.length < 2 ? (
            <div className="py-8 text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-zinc-100 text-black mb-1 border border-zinc-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-black uppercase font-mono">Universal Search</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Type an activity code like <span className="text-black font-mono font-bold">PIP-L6-024</span>, keyword like <span className="text-black font-bold">Line 24</span>, or report ID like <span className="text-black font-mono font-bold">DPR-001</span>.
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 font-mono">
              No results found for <span className="font-bold text-black">"{query}"</span>.
            </div>
          ) : (
            <>
              {/* Schedule Activities */}
              {searchResults.activities.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider px-2">
                    <CalendarDays className="w-3.5 h-3.5 text-black" />
                    <span>Schedule Activities ({searchResults.activities.length})</span>
                  </div>
                  <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 overflow-hidden">
                    {searchResults.activities.map(a => (
                      <div
                        key={a.id}
                        onClick={() => {
                          setActiveTab('Schedule');
                          onClose();
                        }}
                        className="p-3 hover:bg-zinc-100 cursor-pointer flex items-center justify-between group transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-black bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-300">
                              {a.id}
                            </span>
                            <span className="text-xs font-bold text-black">
                              {a.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 flex items-center gap-2 font-mono">
                            <span>{a.discipline}</span>
                            <span>•</span>
                            <span>{a.area}</span>
                            <span>•</span>
                            <span className="uppercase">{a.status}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reports */}
              {searchResults.reports.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider px-2">
                    <FileText className="w-3.5 h-3.5 text-black" />
                    <span>Daily Progress Reports ({searchResults.reports.length})</span>
                  </div>
                  <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 overflow-hidden">
                    {searchResults.reports.map(r => (
                      <div
                        key={r.id}
                        onClick={() => {
                          setActiveTab('Reports');
                          onClose();
                        }}
                        className="p-3 hover:bg-zinc-100 cursor-pointer flex items-center justify-between group transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white bg-black px-1.5 py-0.2 rounded">
                              {r.id}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono">{r.date}</span>
                            <span className="text-xs font-medium text-zinc-700">• {r.supervisor}</span>
                          </div>
                          <p className="text-xs text-black font-medium line-clamp-1 italic">
                            "{r.description}"
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Logs */}
              {searchResults.audits.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider px-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-black" />
                    <span>Audit Records ({searchResults.audits.length})</span>
                  </div>
                  <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 overflow-hidden">
                    {searchResults.audits.map(aud => (
                      <div
                        key={aud.id}
                        onClick={() => {
                          setActiveTab('Audit Trail');
                          onClose();
                        }}
                        className="p-3 hover:bg-zinc-100 cursor-pointer flex items-center justify-between group transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-black bg-zinc-200 px-1.5 py-0.2 rounded">
                              {aud.id}
                            </span>
                            <span className="text-xs font-bold text-black">{aud.action}</span>
                            <span className="text-xs text-zinc-400 font-mono">• {aud.activityId}</span>
                          </div>
                          <p className="text-xs text-zinc-600 line-clamp-1">
                            {aud.details.originalInput || aud.details.aiMatch || aud.details.reason}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Memory */}
              {searchResults.memories.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider px-2">
                    <BrainCircuit className="w-3.5 h-3.5 text-black" />
                    <span>Project Memory ({searchResults.memories.length})</span>
                  </div>
                  <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 overflow-hidden">
                    {searchResults.memories.map(m => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setActiveTab('Project Memory');
                          onClose();
                        }}
                        className="p-3 hover:bg-zinc-100 cursor-pointer flex items-center justify-between group transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-black bg-zinc-200 px-1.5 py-0.2 rounded">
                              {m.id}
                            </span>
                            <span className="text-xs font-bold text-black">{m.activityName}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 flex items-center gap-2 font-mono">
                            <span>{m.activityType}</span>
                            <span>•</span>
                            <span>Planned: {m.plannedDuration}d</span>
                            <span>•</span>
                            <span>Actual: {m.actualDuration}d</span>
                            {m.delay > 0 && <span className="text-black font-bold">(+{m.delay}d delay)</span>}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Click any item to jump directly to page</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-black text-white rounded-md text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
