import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Sliders, 
  Building, 
  SlidersHorizontal, 
  Bell, 
  Database,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Discipline, ProjectSettings } from '../types';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetDemoData, 
    exportAllData, 
    importAllData,
    setSelectedProject 
  } = useApp();

  const [formData, setFormData] = useState<ProjectSettings>({ ...settings });
  const [importJson, setImportJson] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const disciplines: Discipline[] = [
    'Civil',
    'Piping',
    'Static Equipment',
    'Rotating Equipment',
    'Electrical',
    'Instrumentation',
    'HSE'
  ];

  const handleToggleDiscipline = (disc: Discipline) => {
    setFormData(prev => ({
      ...prev,
      activeDisciplines: {
        ...prev.activeDisciplines,
        [disc]: !prev.activeDisciplines[disc]
      }
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSelectedProject(formData.projectName);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExport = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ProgressAI_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importJson.trim()) return;
    const success = importAllData(importJson);
    if (success) {
      setIsImportOpen(false);
      setImportJson('');
    } else {
      alert('Invalid JSON backup format.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-black text-white shadow-sm">
              <Settings className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-black text-black tracking-tight font-mono">
              Enterprise Project Settings
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-black font-bold border border-zinc-300 uppercase">
              Live Configuration
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Tune AI match confidence thresholds, toggle active engineering disciplines, configure schedule update safety gates, and manage data persistence.
          </p>
        </div>

        {saveSuccess && (
          <div className="px-4 py-2 bg-black text-white border border-black rounded text-xs font-mono font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved to LocalStorage!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: PROJECT SETTINGS */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
            <Building className="w-4 h-4 text-black" />
            <h2 className="text-sm font-mono font-bold text-black uppercase tracking-wide">
              Project Profile & Parameters
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <label className="font-bold text-black uppercase text-[10px]">Project Name</label>
              <input
                type="text"
                required
                value={formData.projectName}
                onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded outline-none focus:border-black font-medium text-black"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-black uppercase text-[10px]">Project ID</label>
              <input
                type="text"
                required
                value={formData.projectId}
                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded outline-none focus:border-black font-mono font-medium text-black"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-black uppercase text-[10px]">Client Organization</label>
              <input
                type="text"
                value={formData.client}
                onChange={e => setFormData({ ...formData, client: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded outline-none focus:border-black font-medium text-black"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-black uppercase text-[10px]">Project Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded outline-none focus:border-black font-medium text-black"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-black uppercase text-[10px]">Baseline Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded outline-none focus:border-black font-medium text-black"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-black uppercase text-[10px]">Baseline Completion Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded outline-none focus:border-black font-medium text-black"
              />
            </div>
          </div>
        </div>

        {/* Section 2: DISCIPLINES TOGGLE */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-black" />
              <h2 className="text-sm font-mono font-bold text-black uppercase tracking-wide">
                Active Engineering Disciplines
              </h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">Toggle trades monitored by ProgressAI</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {disciplines.map(disc => {
              const active = formData.activeDisciplines[disc];
              return (
                <button
                  key={disc}
                  type="button"
                  onClick={() => handleToggleDiscipline(disc)}
                  className={`p-3 rounded border text-left font-bold transition flex items-center justify-between ${
                    active
                      ? 'border-black bg-black text-white'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-zinc-400'
                  }`}
                >
                  <span>{disc}</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${active ? 'bg-white text-black' : 'border border-zinc-300'}`}>
                    {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: AI CONFIDENCE SETTINGS */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
            <Sparkles className="w-4 h-4 text-black" />
            <h2 className="text-sm font-mono font-bold text-black uppercase tracking-wide">
              AI Confidence Thresholds & Auto-Update Gate
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            {/* High Confidence Slider */}
            <div className="p-4 rounded border border-zinc-200 bg-zinc-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-black">High Confidence Threshold</span>
                <span className="font-mono font-extrabold text-black text-sm">
                  {formData.highConfidenceThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={75}
                max={99}
                value={formData.highConfidenceThreshold}
                onChange={e => setFormData({ ...formData, highConfidenceThreshold: parseInt(e.target.value, 10) })}
                className="w-full accent-black cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 font-sans">
                Matches at or above this score are qualified for 1-click Approval or automated update.
              </p>
            </div>

            {/* Review Threshold Slider */}
            <div className="p-4 rounded border border-zinc-200 bg-zinc-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-black">Planner Review Threshold</span>
                <span className="font-mono font-extrabold text-black text-sm">
                  {formData.reviewThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={85}
                value={formData.reviewThreshold}
                onChange={e => setFormData({ ...formData, reviewThreshold: parseInt(e.target.value, 10) })}
                className="w-full accent-black cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 font-sans">
                Matches between {formData.reviewThreshold}% and {formData.highConfidenceThreshold}% recommend planner verification. Below {formData.reviewThreshold}%, matches are flagged as unreliable.
              </p>
            </div>
          </div>

          {/* Auto Update Switch */}
          <div className="flex items-center justify-between p-4 rounded border border-zinc-200 bg-zinc-50">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-black font-mono">Allow Auto Update on Batch Ingestion</span>
              <p className="text-[11px] text-zinc-500 font-sans">
                When enabled, high confidence DPR reports will update the schedule immediately without pausing in review queue.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowAutoUpdate}
                onChange={e => setFormData({ ...formData, allowAutoUpdate: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
        </div>

        {/* Section 4: MATCHING ALGORITHM HEURISTICS */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
            <Sliders className="w-4 h-4 text-black" />
            <h2 className="text-sm font-mono font-bold text-black uppercase tracking-wide">
              Matching Algorithm Settings
            </h2>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <label className="flex items-center justify-between p-3 rounded border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
              <div>
                <span className="font-bold text-black">Enable Fuzzy Matching</span>
                <p className="text-[11px] text-zinc-500 font-sans">Tolerates typos and Levenshtein token distance differences</p>
              </div>
              <input
                type="checkbox"
                checked={formData.enableFuzzyMatching}
                onChange={e => setFormData({ ...formData, enableFuzzyMatching: e.target.checked })}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
              <div>
                <span className="font-bold text-black">Enable Semantic Synonym Normalization</span>
                <p className="text-[11px] text-zinc-500 font-sans">Maps domain terms (e.g. "spool erected" ↔ "erection", "footing" ↔ "foundation")</p>
              </div>
              <input
                type="checkbox"
                checked={formData.enableSemanticMatching}
                onChange={e => setFormData({ ...formData, enableSemanticMatching: e.target.checked })}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
              <div>
                <span className="font-bold text-black">Enable Discipline Heuristic Filtering</span>
                <p className="text-[11px] text-zinc-500 font-sans">Penalizes cross-discipline matches (e.g. Civil reports matching Piping tags)</p>
              </div>
              <input
                type="checkbox"
                checked={formData.enableDisciplineFiltering}
                onChange={e => setFormData({ ...formData, enableDisciplineFiltering: e.target.checked })}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Section 5: NOTIFICATIONS SETTINGS */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
            <Bell className="w-4 h-4 text-black" />
            <h2 className="text-sm font-mono font-bold text-black uppercase tracking-wide">
              Notification Preferences
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <label className="flex items-center justify-between p-3 rounded border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
              <span className="font-bold text-black">Review Alerts</span>
              <input
                type="checkbox"
                checked={formData.notifyReviewRequired}
                onChange={e => setFormData({ ...formData, notifyReviewRequired: e.target.checked })}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
              <span className="font-bold text-black">Update Alerts</span>
              <input
                type="checkbox"
                checked={formData.notifyScheduleUpdate}
                onChange={e => setFormData({ ...formData, notifyScheduleUpdate: e.target.checked })}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
              <span className="font-bold text-black">Daily Summary</span>
              <input
                type="checkbox"
                checked={formData.notifyDailySummary}
                onChange={e => setFormData({ ...formData, notifyDailySummary: e.target.checked })}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white rounded font-mono font-bold shadow-sm transition flex items-center gap-2 text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Section 6: DATA MANAGEMENT (RESET, IMPORT, EXPORT) */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
          <Database className="w-4 h-4 text-black" />
          <h2 className="text-sm font-mono font-bold text-black uppercase tracking-wide">
            Data Persistence & Demo Management
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <button
            type="button"
            onClick={handleExport}
            className="p-3.5 rounded border border-zinc-300 hover:bg-zinc-100 text-black font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-black" />
            <span>Export Project Data (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="p-3.5 rounded border border-zinc-300 hover:bg-zinc-100 text-black font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Upload className="w-4 h-4 text-black" />
            <span>Import Data Backup</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to reset all demo data? This will restore initial seeds for schedule, DPRs, audit trail and memory.')) {
                resetDemoData();
              }
            }}
            className="p-3.5 rounded border border-black hover:bg-black hover:text-white text-black font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-zinc-300 overflow-hidden flex flex-col p-6 text-xs space-y-4 font-mono">
            <h3 className="font-mono font-bold text-sm text-black">
              Import ProgressAI Project Backup (JSON)
            </h3>
            <textarea
              rows={6}
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              placeholder="Paste JSON string exported previously..."
              className="w-full p-2.5 font-mono text-[11px] border border-zinc-300 rounded outline-none focus:border-black bg-zinc-50"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 font-mono">
              <button
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded text-black hover:bg-zinc-100 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-5 py-2 bg-black hover:bg-zinc-800 text-white rounded font-bold"
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
