import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Search, 
  Edit3, 
  ArrowUpDown, 
  History, 
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScheduleActivity, ActivityStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ConfidenceBadge } from '../components/ConfidenceBadge';

export const ScheduleView: React.FC = () => {
  const { activities, auditRecords, updateScheduleActivity, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedWbs, setSelectedWbs] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof ScheduleActivity>('id');
  const [sortAsc, setSortAsc] = useState(true);

  const [selectedActivity, setSelectedActivity] = useState<ScheduleActivity | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdateActualOpen, setIsUpdateActualOpen] = useState(false);

  const [editFormData, setEditFormData] = useState<ScheduleActivity | null>(null);
  const [actualData, setActualData] = useState({
    actualStart: '2026-09-17',
    actualFinish: '2026-09-17',
    progress: 100,
    status: 'Completed' as ActivityStatus,
    actualQty: 14
  });

  const filteredActivities = useMemo(() => {
    return activities
      .filter(a => {
        const matchesSearch = 
          a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.contractor.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDiscipline = selectedDiscipline === 'All' || a.discipline === selectedDiscipline;
        const matchesStatus = selectedStatus === 'All' || a.status === selectedStatus;
        const matchesWbs = selectedWbs === 'All' || a.wbsLevel === selectedWbs;

        return matchesSearch && matchesDiscipline && matchesStatus && matchesWbs;
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? '';
        const valB = b[sortField] ?? '';
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [activities, searchQuery, selectedDiscipline, selectedStatus, selectedWbs, sortField, sortAsc]);

  const handleSort = (field: keyof ScheduleActivity) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleOpenDetails = (activity: ScheduleActivity) => {
    setSelectedActivity(activity);
    setIsDetailsOpen(true);
  };

  const handleOpenEdit = (activity: ScheduleActivity) => {
    setSelectedActivity(activity);
    setEditFormData({ ...activity });
    setIsEditOpen(true);
  };

  const handleOpenUpdateActual = (activity: ScheduleActivity) => {
    setSelectedActivity(activity);
    setActualData({
      actualStart: activity.actualStart || '2026-09-17',
      actualFinish: activity.actualFinish || '2026-09-17',
      progress: activity.progress || 100,
      status: activity.status === 'Completed' ? 'Completed' : 'In Progress',
      actualQty: activity.actualQty || activity.plannedQty
    });
    setIsUpdateActualOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    updateScheduleActivity(editFormData);
    setIsEditOpen(false);
  };

  const handleSaveActual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    updateScheduleActivity({
      ...selectedActivity,
      actualStart: actualData.actualStart,
      actualFinish: actualData.actualFinish,
      progress: Number(actualData.progress),
      status: actualData.status,
      actualQty: Number(actualData.actualQty),
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    setIsUpdateActualOpen(false);
    if (isDetailsOpen) {
      setSelectedActivity(prev => prev ? {
        ...prev,
        actualStart: actualData.actualStart,
        actualFinish: actualData.actualFinish,
        progress: Number(actualData.progress),
        status: actualData.status,
        actualQty: Number(actualData.actualQty)
      } : null);
    }
  };

  const activityAudits = useMemo(() => {
    if (!selectedActivity) return [];
    return auditRecords.filter(a => a.activityId === selectedActivity.id);
  }, [selectedActivity, auditRecords]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-black text-white shadow-xs">
              <CalendarDays className="w-4 h-4 text-white" />
            </span>
            <h1 className="text-xl font-black text-black tracking-tight uppercase font-mono">
              L5/L6 Schedule Master WBS
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-black border border-zinc-300">
              {filteredActivities.length} ACTIVITIES
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Primavera P6 & MS Project synchronized schedule hierarchy. Real-time site updates link directly into executable L5/L6 milestones with variance and audit tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSearchQuery('PIP-L6-024')}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-black font-mono text-xs font-bold rounded-lg border border-zinc-300 transition"
          >
            Find PIP-L6-024 (Line 24)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search activity ID, name, area, contractor..."
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

        <div>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-black outline-none focus:border-black focus:bg-white transition"
          >
            <option value="All">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Delayed">Delayed</option>
          </select>
        </div>

        <div>
          <select
            value={selectedWbs}
            onChange={e => setSelectedWbs(e.target.value)}
            className="w-full py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-black outline-none focus:border-black focus:bg-white transition"
          >
            <option value="All">All WBS Levels</option>
            <option value="L5">L5 (Work Package)</option>
            <option value="L6">L6 (Executable Activity)</option>
          </select>
        </div>
      </div>

      {/* Schedule Table - Monochrome */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-mono font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">
                    <span>Activity ID</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-center">WBS</th>
                <th className="py-3 px-3">Discipline</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Activity Name</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Planned Dates</th>
                <th className="py-3 px-3">Actual Dates</th>
                <th className="py-3 px-3 text-center">Progress</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Confidence</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-zinc-400 font-mono">
                    No schedule activities matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredActivities.map(activity => (
                  <tr
                    key={activity.id}
                    className="hover:bg-zinc-50 transition cursor-pointer group"
                    onClick={() => handleOpenDetails(activity)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-black whitespace-nowrap">
                      {activity.id}
                    </td>

                    <td className="py-3 px-2 text-center">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-black border border-zinc-300">
                        {activity.wbsLevel}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-bold text-black whitespace-nowrap">
                      {activity.discipline}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-black text-black">
                        {activity.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate">
                        {activity.area} • {activity.contractor}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-zinc-500 font-mono whitespace-nowrap text-[11px]">
                      <div>{activity.plannedStart}</div>
                      <div className="text-zinc-400">to {activity.plannedFinish}</div>
                    </td>

                    <td className="py-3 px-3 font-mono whitespace-nowrap text-[11px]">
                      {activity.actualStart ? (
                        <div>
                          <span className="font-bold text-black">{activity.actualStart}</span>
                          <div className="text-zinc-400 font-medium">
                            {activity.actualFinish ? `to ${activity.actualFinish}` : '(ongoing)'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-300 italic">Not recorded</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center gap-1 font-mono">
                        <span className="font-bold text-black">{activity.progress}%</span>
                        <div className="w-16 h-1 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                          <div
                            className="h-full bg-black rounded-full transition-all duration-300"
                            style={{ width: `${activity.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={activity.status} size="sm" />
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {activity.confidence > 0 ? (
                        <ConfidenceBadge score={activity.confidence} size="sm" />
                      ) : (
                        <span className="text-zinc-300 text-[11px] font-mono">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 font-mono">
                        <button
                          onClick={() => handleOpenUpdateActual(activity)}
                          className="px-2.5 py-1 bg-black text-white hover:bg-zinc-800 rounded-lg text-xs font-bold transition shadow-xs"
                          title="Update Actual Progress"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleOpenEdit(activity)}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-black hover:bg-zinc-100 transition"
                          title="Edit Activity"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Drawer */}
      {isDetailsOpen && selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-300 overflow-hidden flex flex-col space-y-4 p-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white bg-black px-2 py-0.5 rounded">
                    {selectedActivity.id}
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-500 uppercase">{selectedActivity.wbsLevel} • {selectedActivity.discipline}</span>
                  <StatusBadge status={selectedActivity.status} size="sm" />
                </div>
                <h2 className="text-base font-black text-black pt-1">
                  {selectedActivity.name}
                </h2>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="p-1 text-zinc-400 hover:text-black rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200 font-mono">
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Planned Dates</span>
                <div className="font-bold text-black">{selectedActivity.plannedStart}</div>
                <div className="text-[11px] text-zinc-500">to {selectedActivity.plannedFinish}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Actual Dates</span>
                <div className="font-bold text-black">
                  {selectedActivity.actualStart || 'Not started'}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {selectedActivity.actualFinish ? `to ${selectedActivity.actualFinish}` : 'Pending finish'}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Quantity / Units</span>
                <div className="font-bold text-black">
                  {selectedActivity.actualQty} / {selectedActivity.plannedQty} {selectedActivity.unit}
                </div>
                <div className="text-[11px] text-zinc-500">Progress: {selectedActivity.progress}%</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Match Confidence</span>
                <div className="mt-0.5">
                  <ConfidenceBadge score={selectedActivity.confidence} size="sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-zinc-200 rounded-xl font-mono">
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Area</span>
                <div className="font-bold text-black">{selectedActivity.area}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Contractor</span>
                <div className="font-bold text-black">{selectedActivity.contractor}</div>
              </div>
            </div>

            {/* Audit History */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-black uppercase tracking-wide">
                <History className="w-4 h-4 text-black" />
                <span>Audit Trail & Historical Changes ({activityAudits.length})</span>
              </div>

              <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto font-mono">
                {activityAudits.length === 0 ? (
                  <div className="p-4 text-center text-zinc-400 text-xs">
                    No explicit audit changes logged yet for this activity.
                  </div>
                ) : (
                  activityAudits.map(aud => (
                    <div key={aud.id} className="p-3 bg-white space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-black">{aud.action}</span>
                        <span className="text-[10px] text-zinc-400">{aud.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 font-sans">
                        {aud.details.reason || aud.details.originalInput || 'Updated by planner.'}
                      </p>
                      <div className="text-[10px] text-zinc-400">
                        User: <span className="font-bold text-black">{aud.user}</span> • Source: {aud.source}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenUpdateActual(selectedActivity)}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg font-bold shadow-xs transition"
                >
                  Update Actual
                </button>
                <button
                  onClick={() => handleOpenEdit(selectedActivity)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-black border border-zinc-300 rounded-lg font-bold transition"
                >
                  Edit Activity
                </button>
              </div>

              <button
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg text-black hover:bg-zinc-100 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Actual Progress Modal */}
      {isUpdateActualOpen && selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-300 overflow-hidden flex flex-col p-6 text-xs space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="space-y-0.5">
                <span className="font-mono text-xs font-bold text-white bg-black px-2 py-0.5 rounded">
                  {selectedActivity.id}
                </span>
                <h3 className="font-bold text-sm text-black pt-1 uppercase">
                  Update Actual Site Progress
                </h3>
              </div>
              <button
                onClick={() => setIsUpdateActualOpen(false)}
                className="p-1 text-zinc-400 hover:text-black rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveActual} className="space-y-3 font-mono">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 uppercase text-[10px]">Actual Start Date</label>
                <input
                  type="date"
                  required
                  value={actualData.actualStart}
                  onChange={e => setActualData({ ...actualData, actualStart: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700 uppercase text-[10px]">Actual Finish Date</label>
                <input
                  type="date"
                  value={actualData.actualFinish}
                  onChange={e => setActualData({ ...actualData, actualFinish: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700 uppercase text-[10px]">
                  Execution Progress: {actualData.progress}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={actualData.progress}
                  onChange={e => {
                    const p = Number(e.target.value);
                    setActualData({
                      ...actualData,
                      progress: p,
                      status: p === 100 ? 'Completed' : p > 0 ? 'In Progress' : 'Not Started'
                    });
                  }}
                  className="w-full accent-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 uppercase text-[10px]">Status</label>
                  <select
                    value={actualData.status}
                    onChange={e => setActualData({ ...actualData, status: e.target.value as ActivityStatus })}
                    className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 uppercase text-[10px]">
                    Installed Qty ({selectedActivity.unit})
                  </label>
                  <input
                    type="number"
                    value={actualData.actualQty}
                    onChange={e => setActualData({ ...actualData, actualQty: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateActualOpen(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-lg text-black hover:bg-zinc-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Save & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
      {isEditOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-300 overflow-hidden flex flex-col p-6 text-xs space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-sm text-black uppercase">
                Edit Activity Parameters: {editFormData.id}
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 text-zinc-400 hover:text-black rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 font-mono">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 uppercase text-[10px]">Activity Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 uppercase text-[10px]">Planned Start</label>
                  <input
                    type="date"
                    required
                    value={editFormData.plannedStart}
                    onChange={e => setEditFormData({ ...editFormData, plannedStart: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 uppercase text-[10px]">Planned Finish</label>
                  <input
                    type="date"
                    required
                    value={editFormData.plannedFinish}
                    onChange={e => setEditFormData({ ...editFormData, plannedFinish: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-lg text-black hover:bg-zinc-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
