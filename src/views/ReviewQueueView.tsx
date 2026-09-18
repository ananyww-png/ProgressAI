import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Check, 
  X, 
  Edit3, 
  Eye, 
  AlertTriangle, 
  Search, 
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReviewItem } from '../types';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { StatusBadge } from '../components/StatusBadge';

export const ReviewQueueView: React.FC = () => {
  const { 
    reviewQueue, 
    activities, 
    approveReviewItem, 
    rejectReviewItem, 
    editReviewMatch 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');

  const [activeItem, setActiveItem] = useState<ReviewItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const [targetActivityId, setTargetActivityId] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const filteredQueue = useMemo(() => {
    return reviewQueue.filter(item => {
      const matchesSearch = 
        item.reportedActivity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.suggestedActivityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.suggestedActivityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDiscipline = selectedDiscipline === 'All' || item.discipline === selectedDiscipline;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesDiscipline && matchesStatus;
    });
  }, [reviewQueue, searchQuery, selectedDiscipline, statusFilter]);

  const availableActivities = useMemo(() => {
    return activities.filter(a => {
      const q = activitySearch.toLowerCase();
      return a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.discipline.toLowerCase().includes(q);
    });
  }, [activities, activitySearch]);

  const handleOpenEdit = (item: ReviewItem) => {
    setActiveItem(item);
    setTargetActivityId(item.suggestedActivityId);
    setActivitySearch('');
    setEditNotes('');
    setIsEditModalOpen(true);
  };

  const handleOpenReject = (item: ReviewItem) => {
    setActiveItem(item);
    setRejectReason('Mismatch between reported site scope and schedule milestone.');
    setIsRejectModalOpen(true);
  };

  const handleOpenSource = (item: ReviewItem) => {
    setActiveItem(item);
    setIsSourceModalOpen(true);
  };

  const handleConfirmEdit = (autoApprove: boolean) => {
    if (!activeItem || !targetActivityId) return;
    editReviewMatch(activeItem.id, targetActivityId, editNotes, autoApprove);
    setIsEditModalOpen(false);
  };

  const handleConfirmReject = () => {
    if (!activeItem) return;
    rejectReviewItem(activeItem.id, rejectReason);
    setIsRejectModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-black text-white shadow-xs">
              <CheckSquare className="w-4 h-4 text-white" />
            </span>
            <h1 className="text-xl font-black text-black tracking-tight uppercase font-mono">
              Planner Triage & Review Queue
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-black border border-zinc-300">
              {reviewQueue.filter(r => r.status === 'Pending').length} PENDING REVIEW
            </span>
          </div>
          <p className="text-xs text-zinc-500 max-w-xl">
            Human-in-the-loop validation workbench. Ambiguous supervisor inputs or medium/low confidence matches are routed here for planner review, re-linking, and approval before schedule alteration.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200 text-xs font-mono font-bold">
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'Pending' ? 'bg-black text-white shadow-xs' : 'text-zinc-600 hover:text-black'
              }`}
            >
              Pending ({reviewQueue.filter(r => r.status === 'Pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'All' ? 'bg-black text-white shadow-xs' : 'text-zinc-600 hover:text-black'
              }`}
            >
              All ({reviewQueue.length})
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search reported activity text, suggested schedule activity, source..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-black placeholder-zinc-400 outline-none focus:border-black focus:bg-white transition"
          />
        </div>

        <div>
          <select
            value={selectedDiscipline}
            onChange={e => setSelectedDiscipline(e.target.value)}
            className="w-full py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-black outline-none focus:border-black focus:bg-white transition"
          >
            <option value="All">All Disciplines</option>
            <option value="Civil">Civil</option>
            <option value="Piping">Piping</option>
            <option value="Static Equipment">Static Equipment</option>
            <option value="Rotating Equipment">Rotating Equipment</option>
            <option value="Electrical">Electrical</option>
            <option value="Instrumentation">Instrumentation</option>
            <option value="HSE">HSE</option>
          </select>
        </div>
      </div>

      {/* Queue Table - Monochrome */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-mono font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Queue ID</th>
                <th className="py-3 px-4 max-w-xs">Reported Field Activity</th>
                <th className="py-3 px-4">Suggested Schedule Activity (L5/L6)</th>
                <th className="py-3 px-3">Discipline</th>
                <th className="py-3 px-3 text-center">Confidence</th>
                <th className="py-3 px-3">Reported Date & Time</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400 font-mono">
                    No items currently in the review queue.
                  </td>
                </tr>
              ) : (
                filteredQueue.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-black">
                      {item.id}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-black leading-snug">
                        "{item.reportedActivity}"
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          Note: {item.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-white bg-black px-1.5 py-0.2 rounded">
                          {item.suggestedActivityId}
                        </span>
                        <span className="font-bold text-black">
                          {item.suggestedActivityName}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-bold text-black">
                      {item.discipline}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <ConfidenceBadge score={item.confidence} size="sm" showBar={true} />
                    </td>

                    <td className="py-3 px-3 text-zinc-500 font-mono whitespace-nowrap text-[11px]">
                      <div>{item.reportedDate}</div>
                      {item.startTime && <div className="text-zinc-400">{item.startTime} - {item.endTime}</div>}
                    </td>

                    <td className="py-3 px-3 text-zinc-500 font-mono whitespace-nowrap text-[11px]">
                      {item.source}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <StatusBadge status={item.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {item.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5 font-mono">
                          <button
                            onClick={() => approveReviewItem(item.id)}
                            className="px-2.5 py-1 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1"
                            title="Approve & Update Schedule"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-black border border-zinc-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            title="Re-link Match to another L5/L6 Activity"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleOpenReject(item)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition"
                            title="Reject Match"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenSource(item)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition"
                            title="View Raw Source"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic font-mono">
                          Action completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Match Modal */}
      {isEditModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-300 overflow-hidden flex flex-col p-6 text-xs space-y-4 max-h-[90vh] font-mono">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Re-link L5/L6 Activity</span>
                <h3 className="font-bold text-sm text-black">
                  Select Target Schedule Activity for: "{activeItem.reportedActivity}"
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-black rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternatives */}
            {activeItem.alternatives.length > 0 && (
              <div className="space-y-1.5 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">AI Suggested Alternatives</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeItem.alternatives.map(alt => (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => setTargetActivityId(alt.id)}
                      className={`text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${
                        targetActivityId === alt.id
                          ? 'border-2 border-black bg-white text-black font-black'
                          : 'border-zinc-200 bg-white hover:border-zinc-400 text-zinc-700'
                      }`}
                    >
                      <div>
                        <span className="font-mono text-xs font-bold text-black">{alt.id}</span>
                        <div className="line-clamp-1">{alt.name}</div>
                      </div>
                      <span className="text-xs font-bold text-black">{alt.confidence}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All Schedule Activities Search */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Or Search Entire Master Schedule</span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={e => setActivitySearch(e.target.value)}
                  placeholder="Filter schedule by ID or description (e.g. 'CT102', 'Foundation', 'Erect')..."
                  className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:border-black font-medium"
                />
              </div>

              <div className="max-h-44 overflow-y-auto border border-zinc-200 rounded-xl divide-y divide-zinc-100">
                {availableActivities.slice(0, 15).map(act => (
                  <div
                    key={act.id}
                    onClick={() => setTargetActivityId(act.id)}
                    className={`p-2.5 cursor-pointer flex items-center justify-between transition ${
                      targetActivityId === act.id
                        ? 'bg-zinc-100 font-black text-black'
                        : 'hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-black bg-white px-1.5 py-0.2 rounded border border-zinc-200">
                        {act.id}
                      </span>
                      <span className="text-xs">{act.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">{act.discipline}</span>
                      {targetActivityId === act.id && <CheckCircle2 className="w-4 h-4 text-black shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-zinc-700 uppercase text-[10px]">Planner Notes / Justification</label>
              <input
                type="text"
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="e.g. Corrected to Cable Tray CT102 based on supervisor shift diary."
                className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium font-sans"
              />
            </div>

            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg text-black hover:bg-zinc-100 font-bold"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmEdit(false)}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-black border border-zinc-300 rounded-lg font-bold"
                >
                  Save Link Only
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmEdit(true)}
                  className="px-5 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Approve & Sync Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-300 overflow-hidden flex flex-col p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-sm text-black uppercase font-mono">
                Reject Reported Activity Match
              </h3>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-black rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-zinc-600 leading-relaxed">
              Rejecting will keep the source progress log intact in reports, but will NOT alter actual dates on schedule activity <span className="font-mono font-bold text-black">{activeItem.suggestedActivityId}</span>.
            </p>

            <div className="space-y-1">
              <label className="font-mono font-bold text-zinc-700 uppercase text-[10px]">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full p-2.5 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium font-sans"
              />
            </div>

            <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2 font-mono">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg text-black hover:bg-zinc-100 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg font-bold shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Source Modal */}
      {isSourceModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-300 overflow-hidden flex flex-col p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-mono font-bold text-sm text-black uppercase">
                Source Log Metadata: {activeItem.id}
              </h3>
              <button
                onClick={() => setIsSourceModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-black rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-zinc-50 p-4 rounded-xl border border-zinc-200 font-mono">
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Ingested Text</span>
                <p className="font-bold text-black text-sm mt-0.5 italic font-sans">
                  "{activeItem.reportedActivity}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                <div>
                  <span className="text-zinc-400">Source:</span>
                  <div className="font-bold text-black">{activeItem.source}</div>
                </div>
                <div>
                  <span className="text-zinc-400">Reported Date:</span>
                  <div className="font-bold text-black">{activeItem.reportedDate}</div>
                </div>
                <div>
                  <span className="text-zinc-400">Times:</span>
                  <div className="font-bold text-black">{activeItem.startTime || '08:00'} to {activeItem.endTime || '17:00'}</div>
                </div>
                <div>
                  <span className="text-zinc-400">Engine Confidence:</span>
                  <div className="font-bold text-black">{activeItem.confidence}% ({activeItem.confidenceCategory})</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end font-mono">
              <button
                onClick={() => setIsSourceModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg text-black hover:bg-zinc-100 font-bold"
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
