import React, { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts';
import {
  ArrowDown, ArrowUp, BellRing, ChevronDown, ChevronRight, Factory, LayoutDashboard, ListChecks, Search, Sparkles,
} from 'lucide-react';
import { api } from './api';
import { AIPanel } from './AIPanel';
import { Assistant } from './Assistant';
import { ProjectDrawer } from './ProjectDrawer';
import type { AskRequest, Dataset, Project, RiskLevel } from './types';
import { fmtCr, fmtNum, ProgressBar, RISK_HEX, RISK_STYLE, RiskBadge, Section, SeverityTag, Stat } from './ui';

const AXIS = { fontSize: 11, fill: '#898781' };
const GRID = '#ecebe6';
const BAR = '#2a78d6';
const LEVELS: RiskLevel[] = ['High', 'Medium', 'Low'];

type Tab = 'overview' | 'projects' | 'warnings' | 'sectors' | 'insights';
type SortKey = 'risk_score' | 'predicted_delay_months' | 'predicted_cost_overrun_pct' | 'revised_cost' | 'progress' | 'name';

const ChartTip: React.FC<{ active?: boolean; payload?: any[]; render: (d: any) => React.ReactNode }> = ({ active, payload, render }) =>
  active && payload?.length ? (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg">{render(payload[0].payload)}</div>
  ) : null;

const SectorBars: React.FC<{ data: { sector: string; value: number; count: number }[]; unit: string; label: string }> = ({ data, unit, label }) => (
  <ResponsiveContainer width="100%" height={Math.max(220, data.length * 30)}>
    <BarChart data={data} layout="vertical" margin={{ left: 4, right: 24, top: 0, bottom: 0 }} barCategoryGap={6}>
      <CartesianGrid horizontal={false} stroke={GRID} />
      <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} unit={unit} />
      <YAxis type="category" dataKey="sector" width={150} tick={{ ...AXIS, fill: '#52514e' }} axisLine={false} tickLine={false} />
      <Tooltip cursor={{ fill: '#f6f6f3' }} content={<ChartTip render={d => (
        <><div className="font-semibold">{d.sector}</div><div className="tnum text-ink-2">{label}: {d.value.toFixed(1)}{unit} · {d.count} projects</div></>
      )} />} />
      <Bar dataKey="value" fill={BAR} radius={[0, 4, 4, 0]} maxBarSize={16} />
    </BarChart>
  </ResponsiveContainer>
);

const WarningCard: React.FC<{ p: Project; onOpen: (p: Project) => void; full?: boolean }> = ({ p, onOpen, full }) => (
  <button onClick={() => onOpen(p)} className="w-full rounded-lg border border-line bg-white p-3 text-left hover:border-ink-3">
    <div className="flex items-start justify-between gap-2">
      <span className="text-sm font-medium leading-snug">{p.name}</span>
      <RiskBadge level={p.risk_level} score={p.risk_score} />
    </div>
    <div className="mt-0.5 text-xs text-ink-3">{p.project_id} · {p.sector}{p.state ? ` · ${p.state}` : ''}</div>
    <div className="mt-2 flex flex-wrap gap-1">
      {p.alerts.map(a => <SeverityTag key={a.type} severity={a.severity}>{a.type}</SeverityTag>)}
    </div>
    {full ? (
      <ul className="mt-2 space-y-1 text-xs text-ink-2">
        {p.alerts.map(a => <li key={a.type}>• {a.text}</li>)}
      </ul>
    ) : (
      <div className="mt-1.5 text-xs text-ink-3">{p.alerts[0].text}</div>
    )}
  </button>
);

export const Dashboard: React.FC<{ dataset: Dataset }> = ({ dataset: d }) => {
  const s = d.summary;
  const [tab, setTab] = useState<Tab>('overview');
  const [selected, setSelected] = useState<Project | null>(null);
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('All');
  const [risk, setRisk] = useState<RiskLevel | 'All'>('All');
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'risk_score', dir: -1 });
  const [limit, setLimit] = useState(25);
  const [alertType, setAlertType] = useState('All');
  const [warnLimit, setWarnLimit] = useState(20);
  const [askRequest, setAskRequest] = useState<AskRequest | null>(null);
  const askAbout = (projectId: string) => {
    setSelected(null);
    setAskRequest({ text: 'Give me a briefing on this project: status, why it is at risk, and what to do first.', projectId, nonce: Date.now() });
  };

  const go = (t: Tab) => {
    setTab(t);
    window.scrollTo({ top: 0 });
  };
  const showProjects = (filters: { risk?: RiskLevel | 'All'; sector?: string }) => {
    setRisk(filters.risk ?? 'All');
    setSector(filters.sector ?? 'All');
    setAlertsOnly(false);
    setQuery('');
    setLimit(25);
    go('projects');
  };

  const projects = useMemo(() => {
    const q = query.toLowerCase();
    return d.projects
      .filter(p => sector === 'All' || p.sector === sector)
      .filter(p => risk === 'All' || p.risk_level === risk)
      .filter(p => !alertsOnly || p.alerts.length > 0)
      .filter(p => !q || [p.name, p.project_id, p.state, p.agency, p.ministry].some(v => v?.toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = a[sort.key] ?? -Infinity, bv = b[sort.key] ?? -Infinity;
        return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
      });
  }, [d.projects, query, sector, risk, alertsOnly, sort]);

  const flagged = useMemo(() => [...d.projects].filter(p => p.alerts.length).sort((a, b) => b.risk_score - a.risk_score), [d.projects]);
  const flaggedFiltered = alertType === 'All' ? flagged : flagged.filter(p => p.alerts.some(a => a.type === alertType));

  const delayBySector = s.sectors.filter(x => x.avg_predicted_delay != null)
    .map(x => ({ sector: x.sector, value: x.avg_predicted_delay!, count: x.count })).sort((a, b) => b.value - a.value);
  const costBySector = s.sectors.filter(x => x.avg_cost_overrun != null)
    .map(x => ({ sector: x.sector, value: x.avg_cost_overrun!, count: x.count })).sort((a, b) => b.value - a.value);
  const scatter = (lvl: RiskLevel) => d.projects
    .filter(p => p.risk_level === lvl && p.planned_progress != null && p.progress != null)
    .map(p => ({ x: p.planned_progress, y: p.progress, name: p.name, score: p.risk_score, id: p.project_id }));
  const overrun = s.original_cost ? ((s.revised_cost - s.original_cost) / s.original_cost) * 100 : null;

  const TABS: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: ListChecks, count: s.total_projects },
    { id: 'warnings', label: 'Early warnings', icon: BellRing, count: flagged.length },
    { id: 'sectors', label: 'Sectors', icon: Factory, count: s.sectors.length },
    { id: 'insights', label: 'AI insights', icon: Sparkles },
  ];

  const header = (key: SortKey, label: string, align = 'text-right') => (
    <th className={`px-3 py-2 font-medium ${align}`}>
      <button className="inline-flex items-center gap-1 hover:text-ink"
        onClick={() => setSort(prev => ({ key, dir: prev.key === key ? (prev.dir === 1 ? -1 : 1) : -1 }))}>
        {label}
        {sort.key === key && (sort.dir === -1 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <>
      {/* Tab bar */}
      <nav className="sticky top-14 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" role="tablist">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} role="tab" aria-selected={active} onClick={() => go(t.id)}
                className={`relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium transition ${
                  active ? 'text-brand' : 'text-ink-2 hover:text-ink'
                }`}>
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.count != null && (
                  <span className={`tnum rounded-full px-1.5 py-px text-[11px] ${active ? 'bg-brand-soft text-brand-dark' : 'bg-plane text-ink-3'}`}>{t.count}</span>
                )}
                {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        {/* ─── Overview ─── */}
        {tab === 'overview' && (
          <>
            <details className="card px-4 py-3 text-sm">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 text-ink-2">
                <ChevronDown className="h-4 w-4 shrink-0" />
                <span>Parsed <span className="font-semibold text-ink">{s.total_projects}</span> projects from{' '}
                  <span className="break-all font-medium text-ink">{d.filename}</span> · {d.mapping.length} columns mapped</span>
                {d.missing.length > 0 && <span className="text-amber-700">· missing: {d.missing.join(', ')}</span>}
                <span className="text-xs text-ink-3 sm:ml-auto">Report date {d.as_of}</span>
              </summary>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.mapping.map(m => (
                  <span key={m.field} className="rounded-md border border-line bg-plane px-2 py-1 text-xs">
                    <span className="text-ink-3">{m.column}</span> → <span className="font-medium">{m.label}</span>
                  </span>
                ))}
              </div>
              {d.skipped_rows > 0 && <p className="mt-2 text-xs text-ink-3">{d.skipped_rows} blank / total rows skipped.</p>}
            </details>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <Stat label="Projects" value={s.total_projects} hint={`${fmtNum(s.avg_progress, 0, '%')} avg physical progress`} />
              <Stat label="Original cost" value={fmtCr(s.original_cost)} />
              <Stat label="Revised cost" value={fmtCr(s.revised_cost)} hint={overrun != null ? `+${overrun.toFixed(1)}% over sanction` : undefined} />
              <Stat label="Expenditure" value={fmtCr(s.expenditure)} hint={s.revised_cost ? `${(s.expenditure / s.revised_cost * 100).toFixed(0)}% of revised cost` : undefined} />
              <Stat label="Avg forecast delay" value={fmtNum(s.avg_predicted_delay, 1, ' mo')} hint={`Agencies report ${fmtNum(s.avg_reported_delay, 1, ' mo')}`} />
              <Stat label="Early warnings" value={s.alert_count} hint={`${s.delayed_projects} projects forecast > 3 mo late`} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {LEVELS.map(lvl => {
                const st = RISK_STYLE[lvl];
                return (
                  <button key={lvl} onClick={() => showProjects({ risk: lvl })}
                    className="card group flex items-center gap-4 p-4 text-left transition hover:border-ink-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${st.bg}`}><st.Icon className={`h-5 w-5 ${st.text}`} /></span>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-ink-2">{lvl} risk</div>
                      <div className="tnum text-2xl font-semibold">{s.risk_counts[lvl]}</div>
                    </div>
                    <div className="tnum text-sm text-ink-3">{Math.round(s.risk_counts[lvl] / s.total_projects * 100)}%</div>
                    <ChevronRight className="h-4 w-4 text-ink-3 transition group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>

            <div className="grid gap-5 lg:grid-cols-5">
              <Section className="lg:col-span-3" title="Pace check — actual vs planned progress"
                subtitle="Each dot is a project. Below the diagonal = behind schedule. Click a dot for details.">
                <div className="mb-2 flex gap-4 text-xs text-ink-2">
                  {LEVELS.map(l => (
                    <span key={l} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_HEX[l] }} />{l} risk</span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart margin={{ left: -10, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid stroke={GRID} />
                    <XAxis type="number" dataKey="x" domain={[0, 100]} unit="%" tick={AXIS} axisLine={false} tickLine={false} name="Planned" />
                    <YAxis type="number" dataKey="y" domain={[0, 100]} unit="%" tick={AXIS} axisLine={false} tickLine={false} name="Actual" />
                    <ZAxis range={[48, 48]} />
                    <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="#c3c2b7" />
                    <Tooltip cursor={false} content={<ChartTip render={p => (
                      <><div className="max-w-[220px] font-semibold">{p.name}</div><div className="tnum text-ink-2">Planned {p.x}% · actual {p.y}% · risk {p.score}</div></>
                    )} />} />
                    {(['Low', 'Medium', 'High'] as RiskLevel[]).map(l => (
                      <Scatter key={l} data={scatter(l)} fill={RISK_HEX[l]} fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} className="cursor-pointer"
                        onClick={(pt: any) => setSelected(d.projects.find(p => p.project_id === pt.id) ?? null)} />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </Section>

              <Section className="lg:col-span-2" title="Top early warnings" subtitle="Highest-risk projects with active alerts"
                right={<button onClick={() => go('warnings')} className="text-xs font-medium text-brand hover:underline">View all {flagged.length}</button>}>
                <ul className="space-y-3">
                  {flagged.slice(0, 4).map(p => <li key={p.project_id}><WarningCard p={p} onOpen={setSelected} /></li>)}
                  {flagged.length === 0 && <p className="text-sm text-ink-3">No early warnings.</p>}
                </ul>
              </Section>
            </div>
          </>
        )}

        {/* ─── Projects ─── */}
        {tab === 'projects' && (
          <Section title="All projects" subtitle={`${projects.length} of ${d.projects.length} shown · click a row for forecast and AI recommendations`}>
            <div className="mb-3 flex flex-wrap gap-2">
              <label className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-3" />
                <input value={query} onChange={e => { setQuery(e.target.value); setLimit(25); }} placeholder="Search project, state, agency…"
                  className="w-full rounded-lg border border-line py-2 pl-8 pr-3 text-sm outline-none focus:border-brand" />
              </label>
              <select value={sector} onChange={e => { setSector(e.target.value); setLimit(25); }} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
                <option value="All">All sectors</option>
                {s.sectors.map(x => <option key={x.sector}>{x.sector}</option>)}
              </select>
              <select value={risk} onChange={e => { setRisk(e.target.value as RiskLevel | 'All'); setLimit(25); }} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
                <option value="All">All risk levels</option>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
              <label className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <input type="checkbox" checked={alertsOnly} onChange={e => setAlertsOnly(e.target.checked)} /> With alerts
              </label>
            </div>
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="border-y border-line bg-plane text-xs text-ink-2">
                  <tr>
                    {header('name', 'Project', 'text-left pl-5')}
                    <th className="px-3 py-2 text-left font-medium">Sector</th>
                    {header('revised_cost', 'Revised cost')}
                    {header('progress', 'Progress', 'text-left')}
                    {header('predicted_delay_months', 'Forecast delay')}
                    {header('predicted_cost_overrun_pct', 'Forecast cost overrun')}
                    {header('risk_score', 'Risk')}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {projects.slice(0, limit).map(p => (
                    <tr key={p.project_id} onClick={() => setSelected(p)} className="cursor-pointer hover:bg-plane">
                      <td className="max-w-[320px] py-2.5 pl-5 pr-3">
                        <div className="truncate font-medium">{p.name}</div>
                        <div className="truncate text-xs text-ink-3">{p.project_id}{p.state ? ` · ${p.state}` : ''}{p.alerts.length ? ` · ${p.alerts.length} alert${p.alerts.length > 1 ? 's' : ''}` : ''}</div>
                      </td>
                      <td className="px-3 py-2.5 text-ink-2">{p.sector}</td>
                      <td className="tnum px-3 py-2.5 text-right">{fmtCr(p.revised_cost)}</td>
                      <td className="w-40 px-3 py-2.5">
                        <div className="tnum mb-1 text-xs text-ink-2">{fmtNum(p.progress, 0, '%')} <span className="text-ink-3">/ {fmtNum(p.planned_progress, 0, '%')} plan</span></div>
                        <ProgressBar value={p.progress} marker={p.planned_progress} />
                      </td>
                      <td className="tnum px-3 py-2.5 text-right">{fmtNum(p.predicted_delay_months, 0, ' mo')}</td>
                      <td className="tnum px-3 py-2.5 text-right">{fmtNum(p.predicted_cost_overrun_pct, 0, '%')}</td>
                      <td className="px-3 py-2.5 text-right"><RiskBadge level={p.risk_level} score={p.risk_score} /></td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-sm text-ink-3">No projects match these filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {projects.length > limit && (
              <button onClick={() => setLimit(l => l + 50)} className="mt-3 w-full rounded-lg border border-line py-2 text-sm font-medium text-ink-2 hover:bg-plane">
                Show more ({projects.length - limit} remaining)
              </button>
            )}
          </Section>
        )}

        {/* ─── Early warnings ─── */}
        {tab === 'warnings' && (
          <>
            <div className="flex flex-wrap gap-2">
              {[{ type: 'All', count: flagged.length }, ...s.alert_types].map(a => (
                <button key={a.type} onClick={() => { setAlertType(a.type); setWarnLimit(20); }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    alertType === a.type ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-white text-ink-2 hover:border-ink-3'
                  }`}>
                  {a.type === 'All' ? 'All flagged projects' : a.type}
                  <span className="tnum text-xs opacity-70">{a.count}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-3">
              <b>Hidden delay</b>: pace implies ≥ 6 months more delay than the agency reports · <b>Burn anomaly</b>: spend ≥ 15 pts ahead of progress ·{' '}
              <b>Stalled</b>: progress below 60% of plan · <b>Past due</b>: original date passed · <b>Cost revised</b>: ≥ 25% over sanction
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {flaggedFiltered.slice(0, warnLimit).map(p => <WarningCard key={p.project_id} p={p} onOpen={setSelected} full />)}
            </div>
            {flaggedFiltered.length === 0 && <p className="card p-8 text-center text-sm text-ink-3">No projects with this alert.</p>}
            {flaggedFiltered.length > warnLimit && (
              <button onClick={() => setWarnLimit(l => l + 20)} className="w-full rounded-lg border border-line bg-white py-2 text-sm font-medium text-ink-2 hover:bg-plane">
                Show more ({flaggedFiltered.length - warnLimit} remaining)
              </button>
            )}
          </>
        )}

        {/* ─── Sectors ─── */}
        {tab === 'sectors' && (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              <Section title="Forecast time overrun by sector" subtitle="Average predicted delay, months">
                <SectorBars data={delayBySector} unit=" mo" label="Avg delay" />
              </Section>
              <Section title="Forecast cost overrun by sector" subtitle="Average predicted cost at completion vs original sanction">
                <SectorBars data={costBySector} unit="%" label="Avg overrun" />
              </Section>
            </div>
            <Section title="Sector benchmark" subtitle="Click a sector to see its projects">
              <div className="-mx-5 overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="border-y border-line bg-plane text-xs text-ink-2">
                    <tr>
                      <th className="py-2 pl-5 pr-3 text-left font-medium">Sector</th>
                      <th className="px-3 py-2 text-right font-medium">Projects</th>
                      <th className="px-3 py-2 text-right font-medium">Revised cost</th>
                      <th className="px-3 py-2 text-right font-medium">Spent</th>
                      <th className="px-3 py-2 text-right font-medium">Avg forecast delay</th>
                      <th className="px-3 py-2 text-right font-medium">Avg cost overrun</th>
                      <th className="px-3 py-2 text-right font-medium">Avg risk</th>
                      <th className="px-3 py-2 pr-5 text-right font-medium">High risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[...s.sectors].sort((a, b) => (b.avg_risk ?? 0) - (a.avg_risk ?? 0)).map(x => (
                      <tr key={x.sector} onClick={() => showProjects({ sector: x.sector })} className="tnum cursor-pointer hover:bg-plane">
                        <td className="py-2.5 pl-5 pr-3 font-medium">{x.sector}</td>
                        <td className="px-3 py-2.5 text-right">{x.count}</td>
                        <td className="px-3 py-2.5 text-right">{fmtCr(x.revised_cost)}</td>
                        <td className="px-3 py-2.5 text-right">{fmtCr(x.expenditure)}</td>
                        <td className="px-3 py-2.5 text-right">{fmtNum(x.avg_predicted_delay, 1, ' mo')}</td>
                        <td className="px-3 py-2.5 text-right">{fmtNum(x.avg_cost_overrun, 0, '%')}</td>
                        <td className="px-3 py-2.5 text-right">{fmtNum(x.avg_risk, 0)}</td>
                        <td className="px-3 py-2.5 pr-5 text-right">
                          {x.high_risk > 0 ? <span className="font-semibold text-critical">{x.high_risk}</span> : <span className="text-ink-3">0</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

        {/* ─── AI insights ─── */}
        {tab === 'insights' && (
          <div className="grid gap-5 lg:grid-cols-5">
            <Section className="lg:col-span-3" title="AI portfolio brief" subtitle="Portfolio-level diagnosis and interventions">
              <AIPanel label="Generate portfolio brief" initial={d.brief} load={refresh => api.brief(d._id, refresh)} />
            </Section>
            <div className="space-y-5 lg:col-span-2">
              {d.model ? (
                <Section title="Delay prediction model" subtitle={`${d.model.type} · label: ${d.model.label}`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-brand-soft/60 p-3">
                      <div className="text-xs text-ink-2">ML accuracy</div>
                      <div className="tnum text-2xl font-semibold">{d.model.accuracy}%</div>
                    </div>
                    <div className="rounded-lg bg-plane p-3">
                      <div className="text-xs text-ink-2">{d.model.baseline}</div>
                      <div className="tnum text-2xl font-semibold">{d.model.baseline_accuracy}%</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-ink-3">{d.model.evaluation} on {d.model.train_size} projects with a reported timeline. Delay drivers (standardised weight):</div>
                  <div className="mt-2 space-y-1.5">
                    {d.model.drivers.map(x => (
                      <div key={x.feature} className="flex items-center gap-2 text-xs">
                        <span className="w-44 shrink-0 text-ink-2">{x.feature}</span>
                        <div className="h-1.5 flex-1 rounded-full bg-plane">
                          <div className={`h-full rounded-full ${x.weight >= 0 ? 'bg-brand' : 'bg-ink-3'}`} style={{ width: `${Math.min(100, Math.abs(x.weight) / Math.abs(d.model!.drivers[0].weight) * 100)}%` }} />
                        </div>
                        <span className="tnum w-10 text-right">{x.weight > 0 ? '+' : ''}{x.weight.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              ) : (
                <Section title="Delay prediction model">
                  <p className="text-sm text-ink-2">Not trained for this file: it needs at least 20 projects with both an original and an anticipated completion date.</p>
                </Section>
              )}
              {s.delay_reasons.length > 0 && (
                <Section title="Reported delay reasons" subtitle="From the agency-reported reason column">
                  <div className="space-y-2">
                    {s.delay_reasons.map(r => (
                      <div key={r.reason} className="flex items-center gap-2 text-xs">
                        <span className="w-44 shrink-0 truncate text-ink-2">{r.reason}</span>
                        <div className="h-1.5 flex-1 rounded-full bg-plane"><div className="h-full rounded-full bg-brand" style={{ width: `${r.count / s.delay_reasons[0].count * 100}%` }} /></div>
                        <span className="tnum w-8 text-right">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </div>
        )}
      </div>

      <Assistant datasetId={d._id} projects={d.projects} onOpenProject={setSelected} request={askRequest} />

      {selected && (
        <ProjectDrawer datasetId={d._id} project={selected} onClose={() => setSelected(null)} onAsk={askAbout}
          cached={d.recommendations?.[selected.project_id.replace(/[.$]/g, '_')]} />
      )}
    </>
  );
};
