import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, CircleAlert } from 'lucide-react';
import type { RiskLevel, Severity } from './types';

export const fmtCr = (v?: number | null) => {
  if (v == null) return '—';
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)} lakh Cr`;
  return `₹${Math.round(v).toLocaleString('en-IN')} Cr`;
};
export const fmtNum = (v?: number | null, digits = 0, suffix = '') =>
  v == null ? '—' : `${v.toFixed(digits)}${suffix}`;
export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—';

export const RISK_STYLE: Record<RiskLevel, { dot: string; text: string; bg: string; Icon: React.ElementType }> = {
  High: { dot: 'bg-critical', text: 'text-critical', bg: 'bg-red-50', Icon: AlertOctagon },
  Medium: { dot: 'bg-warn', text: 'text-amber-700', bg: 'bg-amber-50', Icon: AlertTriangle },
  Low: { dot: 'bg-good', text: 'text-green-700', bg: 'bg-green-50', Icon: CheckCircle2 },
};
export const RISK_HEX: Record<RiskLevel, string> = { High: '#d03b3b', Medium: '#fab219', Low: '#0ca30c' };

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: 'text-critical bg-red-50 border-red-200',
  serious: 'text-orange-700 bg-orange-50 border-orange-200',
  warning: 'text-amber-700 bg-amber-50 border-amber-200',
};

export const RiskBadge: React.FC<{ level: RiskLevel; score?: number }> = ({ level, score }) => {
  const s = RISK_STYLE[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
      <s.Icon className="h-3.5 w-3.5" />
      {level}
      {score != null && <span className="tnum font-medium opacity-80">· {score}</span>}
    </span>
  );
};

export const SeverityTag: React.FC<{ severity: Severity; children: React.ReactNode }> = ({ severity, children }) => (
  <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${SEVERITY_STYLE[severity]}`}>
    <CircleAlert className="h-3 w-3" />
    {children}
  </span>
);

export const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode }> = ({ label, value, hint }) => (
  <div className="card p-4">
    <div className="text-xs font-medium text-ink-2">{label}</div>
    <div className="mt-1 text-lg font-semibold tracking-tight sm:text-2xl">{value}</div>
    {hint && <div className="mt-1 text-xs text-ink-3">{hint}</div>}
  </div>
);

export const Section: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  title, subtitle, right, children, className = '',
}) => (
  <section className={`card p-5 ${className}`}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);

export const ProgressBar: React.FC<{ value?: number | null; marker?: number | null }> = ({ value, marker }) => (
  <div className="relative h-1.5 w-full rounded-full bg-plane">
    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, value ?? 0)}%` }} />
    {marker != null && (
      <div className="absolute -top-0.5 h-2.5 w-0.5 rounded bg-ink" style={{ left: `${Math.min(100, marker)}%` }} title={`Planned ${marker}%`} />
    )}
  </div>
);
