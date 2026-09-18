import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  FileText, 
  Clock, 
  ChevronRight,
  Eye,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuditRecord } from '../types';
import { ConfidenceBadge } from '../components/ConfidenceBadge';

export const AuditTrailView: React.FC = () => {
  const { auditRecords, setActiveTab } = useApp();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);

  const filteredAudits = useMemo(() => {
    return auditRecords.filter(aud => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        aud.id.toLowerCase().includes(q) ||
        aud.activityId.toLowerCase().includes(q) ||
        aud.user.toLowerCase().includes(q) ||
        aud.source.toLowerCase().includes(q) ||
        (aud.details.originalInput && aud.details.originalInput.toLowerCase().includes(q)) ||
        (aud.details.aiMatch && aud.details.aiMatch.toLowerCase().includes(q));

      const matchesAction = actionFilter === 'All' || aud.action === actionFilter;
      const matchesDate = !dateFilter || aud.timestamp.includes(dateFilter);

      return matchesSearch && matchesAction && matchesDate;
    });
  }, [auditRecords, searchQuery, actionFilter, dateFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Planner Approved':
      case 'Schedule Updated':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-black text-white">{action}</span>;
      case 'Planner Rejected':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white text-black border border-black">{action}</span>;
      case 'AI Extracted Activity':
      case 'Activity Matched':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-zinc-100 text-black border border-zinc-300">{action}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">{action}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Banner */}
      <div className="bg-white rounded-lg p-6 border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-black text-white shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-black text-black tracking-tight font-mono">
              Regulatory Audit Trail & Compliance Ledger
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-black font-bold border border-zinc-300 uppercase">
              {filteredAudits.length} Records
            </span>
          </div>
          <p className="text-xs text-zinc-500 max-w-xl">
            Immutable log of every field report extraction, NLP schedule match, planner approval, and schedule alteration. Guarantees contractual transparency and eliminates silent milestone tampering.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search activity ID (e.g. 'PIP-L6-024'), planner, original input text..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-300 rounded text-xs text-black placeholder-zinc-400 outline-none focus:border-black focus:bg-white transition font-mono"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full py-2 px-3 bg-zinc-50 border border-zinc-300 rounded text-xs font-mono font-medium text-black outline-none focus:border-black focus:bg-white transition"
          >
            <option value="All">All Actions</option>
            <option value="Schedule Updated">Schedule Updated</option>
            <option value="Planner Approved">Planner Approved</option>
            <option value="Planner Rejected">Planner Rejected</option>
            <option value="AI Extracted Activity">AI Extracted Activity</option>
            <option value="Activity Edited">Activity Edited</option>
            <option value="Report Uploaded">Report Uploaded</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 border-b border-zinc-300 text-black font-mono font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Activity ID</th>
                <th className="py-3 px-4 max-w-xs">Details / Original Input</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3 text-center">Confidence</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-mono text-zinc-800">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400 font-mono">
                    No audit records matched your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAudits.map(aud => (
                  <tr
                    key={aud.id}
                    onClick={() => setSelectedAudit(aud)}
                    className="hover:bg-zinc-50 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-black">
                      {aud.id}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 whitespace-nowrap text-[11px] font-mono">
                      {aud.timestamp}
                    </td>
                    <td className="py-3 px-4 font-semibold text-black whitespace-nowrap">
                      {aud.user}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getActionBadge(aud.action)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-black whitespace-nowrap">
                      {aud.activityId}
                    </td>
                    <td className="py-3 px-4 max-w-xs font-sans">
                      <p className="line-clamp-1 text-zinc-900">
                        {aud.details.originalInput 
                          ? `"${aud.details.originalInput}"` 
                          : aud.details.aiMatch 
                          ? aud.details.aiMatch 
                          : aud.details.reason}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-zinc-500 whitespace-nowrap text-[11px] font-mono">
                      {aud.source}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <ConfidenceBadge score={aud.confidence} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedAudit(aud);
                        }}
                        className="p-1.5 rounded text-zinc-400 group-hover:text-black hover:bg-zinc-100 transition"
                        title="View Full Audit Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Audit Detail Modal: Spec Section 15 */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-lg shadow-2xl border border-zinc-300 overflow-hidden flex flex-col p-6 text-xs space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="space-y-0.5">
                <span className="font-mono text-xs font-bold text-white bg-black px-2 py-0.5 rounded">
                  {selectedAudit.id}
                </span>
                <h3 className="font-mono font-bold text-sm text-black pt-1">
                  Audit Record Verification
                </h3>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="p-1 text-zinc-400 hover:text-black rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-4 rounded border border-zinc-200">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Activity ID</span>
                <div className="font-mono font-bold text-black text-sm">{selectedAudit.activityId}</div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Action Performed</span>
                <div className="mt-0.5">{getActionBadge(selectedAudit.action)}</div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Authorized User</span>
                <div className="font-bold text-black">{selectedAudit.user}</div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Timestamp</span>
                <div className="font-mono text-zinc-600">{selectedAudit.timestamp}</div>
              </div>
            </div>

            {/* Spec example exact details: Original Input & AI Match */}
            <div className="space-y-3 font-mono">
              {selectedAudit.details.originalInput && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Original Site Input / Speech</span>
                  <div className="p-3 bg-zinc-50 rounded border border-zinc-200 text-zinc-900 font-medium italic font-sans text-xs">
                    "{selectedAudit.details.originalInput}"
                  </div>
                </div>
              )}

              {selectedAudit.details.aiMatch && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">AI Schedule Match</span>
                  <div className="p-3 bg-zinc-50 rounded border border-zinc-200 text-black font-bold flex items-center justify-between">
                    <span>{selectedAudit.details.aiMatch}</span>
                    <ConfidenceBadge score={selectedAudit.confidence} size="sm" />
                  </div>
                </div>
              )}

              {selectedAudit.details.changes && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Schedule State Delta (Diff)</span>
                  <div className="p-3 bg-zinc-50 rounded border border-zinc-200 space-y-1 font-mono">
                    {Object.entries(selectedAudit.details.changes).map(([field, delta]: [string, any]) => (
                      <div key={field} className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-zinc-700 capitalize">{field}:</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-zinc-400">{String(delta.from ?? 'null')}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-400" />
                          <span className="text-black font-bold">{String(delta.to)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAudit.details.reason && (
                <div className="space-y-1 font-sans">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Signoff Justification</span>
                  <p className="text-xs text-zinc-600">
                    {selectedAudit.details.reason}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedAudit(null);
                  setActiveTab('Schedule');
                }}
                className="text-xs font-mono font-bold text-black hover:underline"
              >
                Jump to Schedule Activity →
              </button>

              <button
                onClick={() => setSelectedAudit(null)}
                className="px-4 py-2 border border-zinc-300 rounded text-black hover:bg-zinc-100 font-mono font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
