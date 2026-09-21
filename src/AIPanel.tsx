import React, { useState } from 'react';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import type { AIResult } from './types';

const PRIORITY: Record<string, string> = {
  High: 'bg-red-50 text-critical',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-green-50 text-green-700',
};

export const AIPanel: React.FC<{
  label: string;
  initial?: AIResult | null;
  load: (refresh: boolean) => Promise<AIResult>;
}> = ({ label, initial, load }) => {
  const [result, setResult] = useState<AIResult | null>(initial ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (refresh: boolean) => {
    setBusy(true);
    setError(null);
    try {
      setResult(await load(refresh));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!result) {
    return (
      <div>
        <button onClick={() => run(false)} disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? 'Analysing…' : label}
        </button>
        {error && <p className="mt-2 text-sm text-critical">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          {result.source === 'openrouter' ? `OpenRouter · ${result.model}` : 'Rule-based (OpenRouter unavailable)'}
        </span>
        <button onClick={() => run(true)} disabled={busy} className="inline-flex items-center gap-1 text-xs text-ink-2 hover:text-brand">
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} /> Regenerate
        </button>
      </div>
      <p className="leading-relaxed">{result.summary}</p>

      {result.root_causes?.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs font-semibold text-ink-2">Likely root causes</div>
          <ul className="list-disc space-y-1 pl-5 text-ink-2">
            {result.root_causes.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}

      <div>
        <div className="mb-1.5 text-xs font-semibold text-ink-2">Recommended interventions</div>
        <ol className="space-y-2">
          {result.recommendations?.map((r, i) => (
            <li key={i} className="rounded-lg border border-line p-3">
              <div className="flex items-start gap-2">
                <span className="tnum mt-0.5 text-xs font-semibold text-ink-3">{i + 1}</span>
                <div className="flex-1">
                  <div className="font-medium">{r.action}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-2">
                    {r.priority && <span className={`rounded px-1.5 py-0.5 font-semibold ${PRIORITY[r.priority] ?? ''}`}>{r.priority}</span>}
                    {r.owner && <span>Owner: {r.owner}</span>}
                  </div>
                  {r.impact && <div className="mt-1 text-xs text-ink-3">{r.impact}</div>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {result.watch_items?.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs font-semibold text-ink-2">Watch next month</div>
          <div className="flex flex-wrap gap-1.5">
            {result.watch_items.map((w, i) => <span key={i} className="rounded-md bg-plane px-2 py-1 text-xs text-ink-2">{w}</span>)}
          </div>
        </div>
      )}
      {error && <p className="text-critical">{error}</p>}
    </div>
  );
};
