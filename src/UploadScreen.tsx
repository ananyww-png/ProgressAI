import React, { useEffect, useRef, useState } from 'react';
import { Database, Download, FileSpreadsheet, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import { api } from './api';
import type { Dataset, DatasetListItem, Health } from './types';

const STEPS = ['Reading workbook', 'Mapping columns', 'Forecasting delays & cost', 'Scoring risk'];

export const UploadScreen: React.FC<{ onLoaded: (d: Dataset) => void; health: Health | null }> = ({ onLoaded, health }) => {
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [recent, setRecent] = useState<DatasetListItem[]>([]);
  const [samples, setSamples] = useState<{ file: string; title: string; description: string }[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.datasets().then(setRecent).catch(() => setRecent([]));
    api.samples().then(setSamples).catch(() => setSamples([]));
  }, []);

  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const t = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 450);
    return () => clearInterval(t);
  }, [busy]);

  const run = async (getFile: () => Promise<File>) => {
    setBusy(true);
    setError(null);
    try {
      onLoaded(await api.upload(await getFile()));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (f) run(async () => f);
  };

  const openRecent = async (id: string) => {
    setBusy(true);
    try {
      onLoaded(await api.dataset(id));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-2xl flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Upload a project monitoring report</h1>
      <p className="mt-2 text-ink-2">
        Drop a PAIMANA / CUF Excel export. ProgressAI maps the columns, forecasts time and cost overruns, scores
        every project for risk and recommends interventions.
      </p>

      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
        onClick={() => !busy && input.current?.click()}
        className={`mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white px-6 py-14 text-center transition ${
          drag ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/60'
        }`}
      >
        <input ref={input} type="file" accept=".xlsx,.xlsm,.csv" className="hidden" onChange={e => onFiles(e.target.files)} />
        {busy ? (
          <>
            <Loader2 className="h-9 w-9 animate-spin text-brand" />
            <div className="mt-4 font-medium">{STEPS[step]}…</div>
            <div className="mt-3 flex gap-1.5">
              {STEPS.map((_, i) => (
                <span key={i} className={`h-1 w-8 rounded-full ${i <= step ? 'bg-brand' : 'bg-line'}`} />
              ))}
            </div>
          </>
        ) : (
          <>
            <UploadCloud className="h-9 w-9 text-brand" />
            <div className="mt-4 font-medium">Drag & drop your file, or click to browse</div>
            <div className="mt-1 text-sm text-ink-3">.xlsx, .xlsm or .csv · up to 15 MB</div>
          </>
        )}
      </div>

      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-critical">{error}</div>}

      {samples.length > 0 && (
        <div className="mt-8">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-3">
            <Sparkles className="h-3.5 w-3.5" /> Or try a sample report
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {samples.map(s => (
              <div key={s.file} className="card flex items-start gap-3 p-3 transition hover:border-brand">
                <button disabled={busy} onClick={() => run(() => api.sampleFile(s.file))} className="flex flex-1 items-start gap-3 text-left disabled:opacity-50">
                  <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>
                    <span className="block text-sm font-medium">{s.title}</span>
                    <span className="block text-xs text-ink-3">{s.description}</span>
                  </span>
                </button>
                <a href={`/api/sample/${s.file}`} title={`Download ${s.file}`} className="rounded p-1 text-ink-3 hover:bg-plane hover:text-brand">
                  <Download className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-10">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-3">Recent uploads</div>
          <div className="card divide-y divide-line">
            {recent.slice(0, 5).map(d => (
              <button key={d._id} onClick={() => openRecent(d._id)} disabled={busy}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-plane">
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-ink-3" />
                <span className="flex-1 truncate font-medium">{d.filename}</span>
                <span className="tnum text-ink-3">{d.summary.total_projects} projects</span>
                <span className="tnum text-critical">{d.summary.risk_counts.High} high risk</span>
                <span className="tnum hidden text-ink-3 sm:inline">{new Date(d.uploaded_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {health && (
        <div className="mt-10 flex flex-wrap gap-4 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" />
            {health.store === 'mongodb' ? 'Saved to MongoDB' : 'MongoDB not connected — in-memory store'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {health.llm.configured ? `OpenRouter · ${health.llm.model}` : 'OpenRouter key not set — rule-based recommendations'}
          </span>
        </div>
      )}
    </div>
  );
};
