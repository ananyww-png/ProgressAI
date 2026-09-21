import React, { useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { api } from './api';
import { AIPanel } from './AIPanel';
import type { AIResult, Project } from './types';
import { fmtCr, fmtDate, fmtNum, ProgressBar, RiskBadge, SeverityTag } from './ui';

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1.5 text-sm">
    <span className="text-ink-2">{label}</span>
    <span className="tnum text-right font-medium">{value}</span>
  </div>
);

const Compare: React.FC<{ label: string; reported: string; predicted: string; worse: boolean }> = ({ label, reported, predicted, worse }) => (
  <div className="rounded-lg border border-line p-3">
    <div className="text-xs font-medium text-ink-2">{label}</div>
    <div className="mt-2 grid grid-cols-2 gap-2">
      <div>
        <div className="text-[11px] text-ink-3">Reported</div>
        <div className="tnum text-lg font-semibold">{reported}</div>
      </div>
      <div>
        <div className="text-[11px] text-ink-3">AI forecast</div>
        <div className={`tnum text-lg font-semibold ${worse ? 'text-critical' : ''}`}>{predicted}</div>
      </div>
    </div>
  </div>
);

export const ProjectDrawer: React.FC<{
  datasetId: string;
  project: Project;
  cached?: AIResult;
  onClose: () => void;
  onAsk: (projectId: string) => void;
}> = ({ datasetId, project: p, cached, onClose, onAsk }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const delayWorse = (p.predicted_delay_months ?? 0) - (p.reported_delay_months ?? 0) >= 6;
  const costWorse = (p.predicted_cost_overrun_pct ?? 0) - (p.reported_cost_overrun_pct ?? 0) >= 10;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-line bg-white px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-ink-3">{p.project_id} · {p.sector}{p.state ? ` · ${p.state}` : ''}</div>
            <h2 className="mt-0.5 text-lg font-semibold leading-snug">{p.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RiskBadge level={p.risk_level} score={p.risk_score} />
              <button onClick={() => onAsk(p.project_id)}
                className="inline-flex items-center gap-1 rounded-full border border-brand/40 px-2 py-0.5 text-xs font-medium text-brand hover:bg-brand-soft">
                <MessageSquare className="h-3.5 w-3.5" /> Ask AI about this project
              </button>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-2 hover:bg-plane" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-6 px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <Compare label="Time overrun" reported={fmtNum(p.reported_delay_months, 0, ' mo')}
              predicted={fmtNum(p.predicted_delay_months, 0, ' mo')} worse={delayWorse} />
            <Compare label="Cost overrun vs sanction" reported={fmtNum(p.reported_cost_overrun_pct, 0, '%')}
              predicted={fmtNum(p.predicted_cost_overrun_pct, 0, '%')} worse={costWorse} />
          </div>

          {p.delay_probability != null && (
            <div className="text-sm text-ink-2">
              ML model: <span className="font-semibold text-ink">{Math.round(p.delay_probability * 100)}%</span> probability of a delay over 3 months.
            </div>
          )}

          {p.alerts.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Early warnings</h3>
              <ul className="space-y-2">
                {p.alerts.map((a, i) => (
                  <li key={i} className="flex flex-col gap-1 text-sm">
                    <SeverityTag severity={a.severity}>{a.type}</SeverityTag>
                    <span className="text-ink-2">{a.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">What drives the risk score</h3>
            <div className="space-y-2">
              {p.drivers.map(d => (
                <div key={d.factor} className="text-sm">
                  <div className="flex justify-between"><span className="text-ink-2">{d.factor}</span><span className="tnum font-medium">{d.contribution.toFixed(0)} pts</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-plane"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, d.contribution / 30 * 100)}%` }} /></div>
                </div>
              ))}
              {p.drivers.length === 0 && <p className="text-sm text-ink-3">No risk factors detected.</p>}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Progress</h3>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-ink-2">Physical {fmtNum(p.progress, 0, '%')} · planned {fmtNum(p.planned_progress, 0, '%')}</span>
              <span className="tnum text-ink-2">SPI {fmtNum(p.spi, 2)}</span>
            </div>
            <ProgressBar value={p.progress} marker={p.planned_progress} />
          </div>

          <div className="divide-y divide-line">
            <Row label="Ministry" value={p.ministry ?? '—'} />
            <Row label="Implementing agency" value={p.agency ?? '—'} />
            <Row label="Original cost" value={fmtCr(p.original_cost)} />
            <Row label="Revised cost" value={fmtCr(p.revised_cost)} />
            <Row label="Expenditure" value={`${fmtCr(p.expenditure)} (${fmtNum(p.spend_ratio, 0, '%')})`} />
            <Row label="Forecast cost at completion" value={fmtCr(p.forecast_cost)} />
            <Row label="Start / approval" value={fmtDate(p.start_date)} />
            <Row label="Original completion" value={fmtDate(p.original_end)} />
            <Row label="Anticipated (agency)" value={fmtDate(p.anticipated_end)} />
            <Row label="Forecast completion (AI)" value={fmtDate(p.forecast_end)} />
            {p.delay_reason && <Row label="Reported reasons" value={p.delay_reason} />}
          </div>

          <div className="rounded-xl border border-brand/30 bg-brand-soft/40 p-4">
            <h3 className="mb-3 text-sm font-semibold">AI recommendations</h3>
            <AIPanel key={p.project_id} label="Get AI recommendations" initial={cached}
              load={refresh => api.recommend(datasetId, p.project_id, refresh)} />
          </div>
        </div>
      </aside>
    </div>
  );
};
