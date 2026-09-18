import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Download, 
  Edit3, 
  Trash2, 
  Eye, 
  Paperclip,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DPRReport, Discipline, ReportStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const ReportsView: React.FC = () => {
  const { reports, addReport, updateReport, deleteReport, processReportWithAI, selectedProject } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<DPRReport | null>(null);

  const [formData, setFormData] = useState({
    date: '2026-09-17',
    discipline: 'Piping' as Discipline,
    supervisor: 'Supervisor-07 (R. Sharma)',
    shift: 'Day' as 'Day' | 'Night',
    weather: 'Clear / 32°C',
    manpower: 12,
    description: '',
    status: 'Draft' as ReportStatus,
    attachments: 'daily_site_photos.jpg, welding_sheet.pdf'
  });

  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = 
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.supervisor.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDiscipline = selectedDiscipline === 'All' || r.discipline === selectedDiscipline;
      const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;
      const matchesDate = !selectedDate || r.date === selectedDate;

      return matchesSearch && matchesDiscipline && matchesStatus && matchesDate;
    });
  }, [reports, searchQuery, selectedDiscipline, selectedStatus, selectedDate]);

  const handleOpenCreate = () => {
    setFormData({
      date: '2026-09-17',
      discipline: 'Piping',
      supervisor: 'Supervisor-07 (R. Sharma)',
      shift: 'Day',
      weather: 'Clear / 32°C',
      manpower: 12,
      description: '',
      status: 'Draft',
      attachments: 'daily_site_photos.jpg'
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (report: DPRReport) => {
    setActiveReport(report);
    setFormData({
      date: report.date,
      discipline: report.discipline,
      supervisor: report.supervisor,
      shift: report.shift,
      weather: report.weather,
      manpower: report.manpower,
      description: report.description,
      status: report.status,
      attachments: report.attachments.join(', ')
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDetails = (report: DPRReport) => {
    setActiveReport(report);
    setIsDetailsModalOpen(true);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) return;

    addReport({
      date: formData.date,
      project: selectedProject,
      discipline: formData.discipline,
      supervisor: formData.supervisor,
      shift: formData.shift,
      weather: formData.weather,
      manpower: Number(formData.manpower),
      description: formData.description,
      status: formData.status,
      attachments: formData.attachments.split(',').map(a => a.trim()).filter(Boolean)
    });

    setIsCreateModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport || !formData.description.trim()) return;

    updateReport({
      ...activeReport,
      date: formData.date,
      discipline: formData.discipline,
      supervisor: formData.supervisor,
      shift: formData.shift,
      weather: formData.weather,
      manpower: Number(formData.manpower),
      description: formData.description,
      status: formData.status,
      attachments: formData.attachments.split(',').map(a => a.trim()).filter(Boolean)
    });

    setIsEditModalOpen(false);
  };

  const handleProcessAI = async (reportId: string) => {
    setProcessingId(reportId);
    await processReportWithAI(reportId);
    setProcessingId(null);
  };

  const handleExportCSV = () => {
    const headers = ['Report ID', 'Date', 'Project', 'Discipline', 'Supervisor', 'Shift', 'Weather', 'Manpower', 'Status', 'Description'];
    const rows = filteredReports.map(r => [
      r.id,
      r.date,
      `"${r.project}"`,
      r.discipline,
      `"${r.supervisor}"`,
      r.shift,
      `"${r.weather}"`,
      r.manpower,
      r.status,
      `"${r.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DPR_Reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Banner - Monochrome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-black text-white shadow-xs">
              <FileText className="w-4 h-4 text-white" />
            </span>
            <h1 className="text-xl font-black text-black tracking-tight uppercase font-mono">
              Daily Progress Reports (DPR)
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-black border border-zinc-300">
              {filteredReports.length} REPORTS
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Field reports submitted by discipline site supervisors. Ingest, parse with AI, review activities, and link with L5/L6 project schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-black text-xs font-bold font-mono flex items-center gap-1.5 transition"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-black font-mono flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE NEW DPR</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search report ID, description, supervisor..."
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
            <option value="Draft">Draft</option>
            <option value="Processing">Processing</option>
            <option value="Processed">Processed</option>
            <option value="Needs Review">Needs Review</option>
            <option value="Approved">Approved</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-black outline-none focus:border-black focus:bg-white transition"
          />
        </div>
      </div>

      {/* Reports Table - Monochrome */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-mono font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Discipline</th>
                <th className="py-3 px-4">Supervisor</th>
                <th className="py-3 px-4 max-w-xs">Site Update Summary</th>
                <th className="py-3 px-4 text-center">Attachments</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 font-mono">
                    No Daily Progress Reports match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-zinc-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-black">
                      {report.id}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono whitespace-nowrap">
                      {report.date}
                    </td>
                    <td className="py-3 px-4 font-bold text-black whitespace-nowrap">
                      {report.discipline}
                    </td>
                    <td className="py-3 px-4 text-zinc-700 whitespace-nowrap">
                      {report.supervisor}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="line-clamp-2 text-black leading-snug font-normal italic">
                        "{report.description}"
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {report.attachments.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-black bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">
                          <Paperclip className="w-3 h-3" />
                          <span>{report.attachments.length}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={report.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleProcessAI(report.id)}
                          disabled={processingId === report.id || report.status === 'Approved'}
                          className={`p-1.5 rounded-lg transition text-xs font-mono font-bold flex items-center gap-1 ${
                            report.status === 'Approved'
                              ? 'text-zinc-300 cursor-not-allowed'
                              : processingId === report.id
                              ? 'bg-zinc-200 text-black animate-pulse'
                              : 'bg-black text-white hover:bg-zinc-800'
                          }`}
                          title="Process with AI"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span className="hidden sm:inline">AI Match</span>
                        </button>

                        <button
                          onClick={() => handleOpenDetails(report)}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-black hover:bg-zinc-100 transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(report)}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-black hover:bg-zinc-100 transition"
                          title="Edit Report"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Delete report ${report.id}?`)) {
                              deleteReport(report.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition"
                          title="Delete Report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-zinc-300 overflow-hidden flex flex-col">
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-black" />
                <h3 className="font-mono font-bold text-sm text-black uppercase">
                  {isCreateModalOpen ? 'Create Daily Progress Report (DPR)' : `Edit Report ${activeReport?.id}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1 text-zinc-400 hover:text-black rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={isCreateModalOpen ? handleSaveCreate : handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono font-bold text-zinc-700 uppercase text-[10px]">Report Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono font-bold text-zinc-700 uppercase text-[10px]">Discipline</label>
                  <select
                    value={formData.discipline}
                    onChange={e => setFormData({ ...formData, discipline: e.target.value as Discipline })}
                    className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium"
                  >
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono font-bold text-zinc-700 uppercase text-[10px]">Supervisor</label>
                  <input
                    type="text"
                    required
                    value={formData.supervisor}
                    onChange={e => setFormData({ ...formData, supervisor: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium"
                    placeholder="Supervisor-07 (R. Sharma)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono font-bold text-zinc-700 uppercase text-[10px]">Manpower Count</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.manpower}
                    onChange={e => setFormData({ ...formData, manpower: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono font-bold text-zinc-700 uppercase text-[10px]">
                  Site Update / Progress Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Line 24 spool erection started at 9:15 AM and completed at 4:30 PM."
                  className="w-full p-2.5 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono font-bold text-zinc-700 uppercase text-[10px]">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as ReportStatus })}
                    className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Processing">Processing</option>
                    <option value="Processed">Processed</option>
                    <option value="Needs Review">Needs Review</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono font-bold text-zinc-700 uppercase text-[10px]">Shift / Weather</label>
                  <input
                    type="text"
                    value={formData.weather}
                    onChange={e => setFormData({ ...formData, weather: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded-lg outline-none focus:border-black font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 border border-zinc-300 rounded-lg text-black hover:bg-zinc-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg font-bold shadow-sm"
                >
                  {isCreateModalOpen ? 'Create Report' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      {isDetailsModalOpen && activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-zinc-300 overflow-hidden flex flex-col space-y-4 p-6 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white bg-black px-2 py-0.5 rounded">
                  {activeReport.id}
                </span>
                <span className="font-mono font-bold text-sm text-black uppercase">
                  {activeReport.discipline} Daily Log
                </span>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-black rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-200 font-mono">
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Date</span>
                <div className="font-bold text-black">{activeReport.date}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Supervisor</span>
                <div className="font-bold text-black">{activeReport.supervisor}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Weather / Shift</span>
                <div className="font-bold text-black">{activeReport.weather} • {activeReport.shift}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Status</span>
                <div className="mt-0.5"><StatusBadge status={activeReport.status} size="sm" /></div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">Description</span>
              <div className="p-3 bg-white border border-zinc-200 rounded-xl text-black font-medium leading-relaxed italic">
                "{activeReport.description}"
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between font-mono">
              <button
                onClick={() => {
                  handleProcessAI(activeReport.id);
                  setIsDetailsModalOpen(false);
                }}
                className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Process with AI</span>
              </button>

              <button
                onClick={() => setIsDetailsModalOpen(false)}
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
