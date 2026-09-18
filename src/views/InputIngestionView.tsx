import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  FileSpreadsheet, 
  File, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  Database
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Discipline } from '../types';

interface IngestedFile {
  id: string;
  name: string;
  type: 'PDF' | 'CSV' | 'XLSX' | 'TXT';
  size: string;
  uploadedAt: string;
  status: 'Processing' | 'Extracted' | 'Error';
  extractedCount: number;
  extractedActivities: Array<{
    id: string;
    rawText: string;
    normalizedName: string;
    discipline: Discipline;
    confidence: number;
    suggestedWbs: string;
  }>;
}

export const InputIngestionView: React.FC = () => {
  const { activities, setActiveTab, addNotification } = useApp();

  const [files, setFiles] = useState<IngestedFile[]>([
    {
      id: 'FILE-101',
      name: 'DPR_Piping_Shift_Day_17Sep.pdf',
      type: 'PDF',
      size: '1.4 MB',
      uploadedAt: '17 Sep 2026 14:15',
      status: 'Extracted',
      extractedCount: 2,
      extractedActivities: [
        {
          id: 'EXT-01',
          rawText: 'Line 24 spool erection started at 9:15 AM and completed at 4:30 PM.',
          normalizedName: 'Line 24 spool erection',
          discipline: 'Piping',
          confidence: 96,
          suggestedWbs: 'PIP-L6-024'
        },
        {
          id: 'EXT-02',
          rawText: 'Line 30-HP Feed header root pass welding joints 05-09.',
          normalizedName: 'Fitup and Weld Line 30-HP Feed',
          discipline: 'Piping',
          confidence: 91,
          suggestedWbs: 'PIP-L6-030'
        }
      ]
    },
    {
      id: 'FILE-102',
      name: 'Civil_Foundation_PourCard_F102.xlsx',
      type: 'XLSX',
      size: '420 KB',
      uploadedAt: '16 Sep 2026 18:30',
      status: 'Extracted',
      extractedCount: 1,
      extractedActivities: [
        {
          id: 'EXT-03',
          rawText: 'Constructed Foundation F102 casting of 65 m3 M35 grade concrete completed.',
          normalizedName: 'Construct Foundation F102',
          discipline: 'Civil',
          confidence: 95,
          suggestedWbs: 'CIV-L6-102'
        }
      ]
    }
  ]);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<IngestedFile | null>(files[0]);

  const handleLoadSample = (sampleType: 'daily' | 'spreadsheet' | 'schedule') => {
    setIsUploading(true);

    setTimeout(() => {
      let newFile: IngestedFile;

      if (sampleType === 'daily') {
        newFile = {
          id: `FILE-${Date.now().toString().slice(-4)}`,
          name: 'Supervisor_Site_Diary_Unit100.pdf',
          type: 'PDF',
          size: '2.1 MB',
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Extracted',
          extractedCount: 2,
          extractedActivities: [
            {
              id: `EXT-${Date.now()}-1`,
              rawText: 'Line 24 spool erection completed by crew A with 14 spools erected.',
              normalizedName: 'Line 24 spool erection',
              discipline: 'Piping',
              confidence: 96,
              suggestedWbs: 'PIP-L6-024'
            },
            {
              id: `EXT-${Date.now()}-2`,
              rawText: 'Earthing grid copper conductors laid 135 meters along East battery limit.',
              normalizedName: 'Install Plant Earthing Grid Sector 3',
              discipline: 'Electrical',
              confidence: 89,
              suggestedWbs: 'ELE-L6-108'
            }
          ]
        };
      } else if (sampleType === 'spreadsheet') {
        newFile = {
          id: `FILE-${Date.now().toString().slice(-4)}`,
          name: 'Substation_Cable_Progress_Log.xlsx',
          type: 'XLSX',
          size: '850 KB',
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Extracted',
          extractedCount: 2,
          extractedActivities: [
            {
              id: `EXT-${Date.now()}-3`,
              rawText: 'Installed Cable Tray CT102 40 LM on Level 2 rack.',
              normalizedName: 'Install Cable Tray CT102',
              discipline: 'Electrical',
              confidence: 86,
              suggestedWbs: 'ELE-L6-102'
            },
            {
              id: `EXT-${Date.now()}-4`,
              rawText: 'Cable work completed.',
              normalizedName: 'Cable work completed',
              discipline: 'Electrical',
              confidence: 68,
              suggestedWbs: 'ELE-L6-102'
            }
          ]
        };
      } else {
        newFile = {
          id: `FILE-${Date.now().toString().slice(-4)}`,
          name: 'Primavera_P6_L5_Schedule_Export.csv',
          type: 'CSV',
          size: '3.4 MB',
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Extracted',
          extractedCount: activities.length,
          extractedActivities: activities.slice(0, 4).map((a, i) => ({
            id: `EXT-${Date.now()}-${i}`,
            rawText: `WBS Activity: ${a.id} - ${a.name}`,
            normalizedName: a.name,
            discipline: a.discipline,
            confidence: 100,
            suggestedWbs: a.id
          }))
        };
      }

      setFiles(prev => [newFile, ...prev]);
      setSelectedFile(newFile);
      setIsUploading(false);

      addNotification({
        title: 'File Ingested & Activities Extracted',
        message: `Parsed ${newFile.extractedCount} activities from ${newFile.name}`,
        type: 'success',
        linkTab: 'Input Ingestion'
      });
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      const ext = file.name.split('.').pop()?.toUpperCase() as any;
      const fileType = ['PDF', 'CSV', 'XLSX', 'TXT'].includes(ext) ? ext : 'TXT';

      const newFile: IngestedFile = {
        id: `FILE-${Date.now().toString().slice(-4)}`,
        name: file.name,
        type: fileType,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Extracted',
        extractedCount: 2,
        extractedActivities: [
          {
            id: `EXT-${Date.now()}-A`,
            rawText: `Parsed text section from ${file.name}: "Spool erection Line 24 finished."`,
            normalizedName: 'Line 24 spool erection',
            discipline: 'Piping',
            confidence: 96,
            suggestedWbs: 'PIP-L6-024'
          },
          {
            id: `EXT-${Date.now()}-B`,
            rawText: `Parsed text section from ${file.name}: "Foundation excavation unit 200."`,
            normalizedName: 'Excavate Foundation F103 Footing',
            discipline: 'Civil',
            confidence: 84,
            suggestedWbs: 'CIV-L6-103'
          }
        ]
      };

      setFiles(prev => [newFile, ...prev]);
      setSelectedFile(newFile);
      setIsUploading(false);

      addNotification({
        title: 'Custom File Processed',
        message: `Extracted ${newFile.extractedCount} activities from ${file.name}`,
        type: 'success'
      });
    }, 1000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-black text-white shadow-xs">
              <UploadCloud className="w-4 h-4 text-white" />
            </span>
            <h1 className="text-xl font-black text-black tracking-tight uppercase font-mono">
              Input Ingestion Pipeline
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-black border border-zinc-300">
              MULTI-FORMAT PARSER
            </span>
          </div>
          <p className="text-xs text-zinc-500 max-w-xl">
            Batch ingest daily site diaries, contractor Excel spreadsheets, PDFs, and text logs. The engine strips formatting, normalizes descriptions, and structures activities for schedule mapping.
          </p>
        </div>

        {/* Quick Sample Loaders */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 font-mono">
          <button
            onClick={() => handleLoadSample('daily')}
            disabled={isUploading}
            className="px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 rounded-xl text-xs font-bold text-black transition flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-black" />
            <span>DAILY REPORT (PDF)</span>
          </button>

          <button
            onClick={() => handleLoadSample('spreadsheet')}
            disabled={isUploading}
            className="px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 rounded-xl text-xs font-bold text-black transition flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-black" />
            <span>SPREADSHEET (XLSX)</span>
          </button>

          <button
            onClick={() => handleLoadSample('schedule')}
            disabled={isUploading}
            className="px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 rounded-xl text-xs font-bold text-black transition flex items-center gap-1.5 shadow-xs"
          >
            <Database className="w-3.5 h-3.5 text-black" />
            <span>SCHEDULE (CSV)</span>
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) {
            handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center gap-3 bg-white ${
          isDragging ? 'border-black bg-zinc-100' : 'border-zinc-300 hover:border-black'
        }`}
      >
        <div className="p-3 rounded-full bg-zinc-100 text-black border border-zinc-300">
          <UploadCloud className="w-7 h-7 text-black" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-black">
            Drag & drop site progress files here, or{' '}
            <label className="text-black underline cursor-pointer font-black font-mono">
              browse device
              <input
                type="file"
                className="hidden"
                accept=".pdf,.csv,.xlsx,.xls,.txt"
                onChange={handleFileUpload}
              />
            </label>
          </p>
          <p className="text-xs text-zinc-400 font-mono">
            Supports PDF daily logs, CSV / XLSX spreadsheets, and plain TXT supervisor notes
          </p>
        </div>

        {isUploading && (
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-black bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-300 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
            <span>INGESTING & EXTRACTING ACTIVITIES...</span>
          </div>
        )}
      </div>

      {/* Columns: Ingested Documents & Extracted Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingested Documents */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-black uppercase font-mono">
              Ingested Documents ({files.length})
            </h3>
            <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">Batch Logs</span>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {files.map(f => (
              <div
                key={f.id}
                onClick={() => setSelectedFile(f)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition space-y-1.5 ${
                  selectedFile?.id === f.id
                    ? 'border-2 border-black bg-zinc-50 font-bold'
                    : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-black truncate">
                    {f.type === 'PDF' && <FileText className="w-4 h-4 text-black shrink-0" />}
                    {f.type === 'XLSX' && <FileSpreadsheet className="w-4 h-4 text-black shrink-0" />}
                    {f.type === 'CSV' && <Database className="w-4 h-4 text-black shrink-0" />}
                    {f.type === 'TXT' && <File className="w-4 h-4 text-black shrink-0" />}
                    <span className="truncate">{f.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-zinc-100 text-black px-1.5 py-0.2 rounded border border-zinc-300 shrink-0">
                    {f.type}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>{f.size} • {f.uploadedAt}</span>
                  <span className="font-bold text-black flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-black" />
                    <span>{f.extractedCount} acts</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extracted Activities Preview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <div>
              <h3 className="font-bold text-sm text-black uppercase font-mono">
                Extracted Activities Preview
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Source Document: <span className="font-bold text-black">{selectedFile?.name || 'None'}</span>
              </p>
            </div>

            <button
              onClick={() => setActiveTab('Review Queue')}
              className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Go to Review Queue</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          <div className="space-y-3">
            {(!selectedFile || selectedFile.extractedActivities.length === 0) ? (
              <div className="py-16 text-center text-xs text-zinc-400 font-mono">
                Select an ingested file on the left to view extracted activities.
              </div>
            ) : (
              selectedFile.extractedActivities.map(act => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-black transition space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white bg-black px-2 py-0.5 rounded">
                        {act.suggestedWbs}
                      </span>
                      <span className="font-bold text-black">{act.discipline}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[11px] text-zinc-400">Match Confidence:</span>
                      <span className="font-bold px-2 py-0.5 rounded-full text-xs bg-black text-white">
                        {act.confidence}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">Raw Extracted Text</span>
                    <p className="font-medium text-black italic bg-white p-2 rounded border border-zinc-200 mt-0.5">
                      "{act.rawText}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-zinc-500 font-mono">
                      Normalized Target: <span className="font-bold text-black">{act.normalizedName}</span>
                    </div>

                    <button
                      onClick={() => setActiveTab('Review Queue')}
                      className="text-xs font-bold text-black hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>Triage in Review</span>
                      <ArrowRight className="w-3 h-3 text-black" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
