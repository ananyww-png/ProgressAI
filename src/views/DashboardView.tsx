import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileQuestion, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Building, 
  Layers, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { KpiCard } from '../components/KpiCard';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { StatusBadge } from '../components/StatusBadge';
import { Discipline } from '../types';

export const DashboardView: React.FC = () => {
  const { 
    kpis, 
    activities, 
    reports, 
    reviewQueue, 
    auditRecords, 
    approveReviewItem, 
    setActiveTab 
  } = useApp();

  const disciplines: Discipline[] = [
    'Civil', 
    'Piping', 
    'Static Equipment', 
    'Rotating Equipment', 
    'Electrical', 
    'Instrumentation', 
    'HSE'
  ];

  const disciplineData = disciplines.map(disc => {
    const discActivities = activities.filter(a => a.discipline === disc);
    const total = discActivities.length;
    const completed = discActivities.filter(a => a.status === 'Completed').length;
    const progressAvg = total > 0 
      ? Math.round(discActivities.reduce((acc, a) => acc + a.progress, 0) / total)
      : 0;

    return {
      discipline: disc,
      progress: progressAvg,
      completed,
      total
    };
  });

  const sCurveData = [
    { week: 'W32', planned: 12, actual: 10 },
    { week: 'W33', planned: 24, actual: 22 },
    { week: 'W34', planned: 38, actual: 35 },
    { week: 'W35', planned: 52, actual: 50 },
    { week: 'W36', planned: 64, actual: 61 },
    { week: 'W37', planned: 76, actual: kpis.projectCompletion },
    { week: 'W38', planned: 85, actual: null },
    { week: 'W39', planned: 92, actual: null },
    { week: 'W40', planned: 100, actual: null },
  ];

  const recentAiMatches = auditRecords
    .filter(a => a.action === 'Schedule Updated' || a.action === 'Planner Approved' || a.action === 'AI Extracted Activity')
    .slice(0, 4);

  const pendingReviews = reviewQueue
    .filter(r => r.status === 'Pending')
    .slice(0, 3);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Welcome Banner - Pure Pitch Black */}
      <div className="bg-black border border-zinc-800 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-white border border-zinc-700 uppercase tracking-widest">
              EPC SCHEDULE INTELLIGENCE • NOIR
            </span>
            <span className="text-xs font-mono text-zinc-400">• ML PIPELINE READY</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            Project Executive Control Center
          </h1>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            AI-powered parsing translates site diaries, supervisor updates, and daily progress logs directly into L5/L6 Primavera P6 schedule milestones with confidence scoring.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('Time Agent')}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs transition shadow-sm flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>Open Time Agent</span>
          </button>
          <button
            onClick={() => setActiveTab('Review Queue')}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-bold text-xs transition flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-zinc-300" />
            <span>Review Queue ({kpis.needsReview})</span>
          </button>
        </div>
      </div>

      {/* 6 Reactive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Processed"
          value={kpis.activitiesProcessed}
          subtext="Total site activities logged"
          icon={TrendingUp}
          trend="+12 today"
          onClick={() => setActiveTab('Schedule')}
        />
        <KpiCard
          title="Auto Matched"
          value={kpis.autoMatched}
          subtext="High confidence (≥90%)"
          icon={CheckCircle2}
          trend="81.0%"
          onClick={() => setActiveTab('Audit Trail')}
        />
        <KpiCard
          title="Needs Review"
          value={kpis.needsReview}
          subtext="Pending planner triage"
          icon={Clock}
          onClick={() => setActiveTab('Review Queue')}
        />
        <KpiCard
          title="Unmatched"
          value={kpis.unmatched}
          subtext="Requiring clarification"
          icon={FileQuestion}
          onClick={() => setActiveTab('Review Queue')}
        />
        <KpiCard
          title="Avg Confidence"
          value={`${kpis.averageConfidence}%`}
          subtext="NLP match precision"
          icon={Sparkles}
        />
        <KpiCard
          title="Completion"
          value={`${kpis.projectCompletion}%`}
          subtext="Overall L5/L6 Progress"
          icon={Layers}
          trend="Planned: 76%"
          onClick={() => setActiveTab('Analytics')}
        />
      </div>

      {/* Row 2: S-Curve & Discipline Progress - Monochrome Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Planned vs Actual S-Curve */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-zinc-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-black uppercase font-mono">
                Project S-Curve: Planned vs Actual Progress
              </h3>
              <p className="text-xs text-zinc-500">
                L5/L6 milestone tracking across 12-week baseline schedule
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-black"></span>
                <span className="text-black">Actual ({kpis.projectCompletion}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-zinc-300"></span>
                <span className="text-zinc-500">Planned (76%)</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="monoActualColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#000000" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip 
                  formatter={(val: any) => [`${val}%`, 'Progress']}
                  contentStyle={{ backgroundColor: '#000000', borderRadius: '8px', border: '1px solid #27272a', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="actual" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#monoActualColor)" />
                <Area type="monotone" dataKey="planned" stroke="#a1a1aa" strokeWidth={2} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Discipline-Wise Progress */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-black uppercase font-mono">
              Discipline-Wise Execution
            </h3>
            <p className="text-xs text-zinc-500">
              Aggregated completion % across engineering trades
            </p>
          </div>

          <div className="space-y-2.5 flex-1 pt-2">
            {disciplineData.map(disc => (
              <div key={disc.discipline} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-black">{disc.discipline}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-zinc-400 text-[10px]">{disc.completed}/{disc.total}</span>
                    <span className="font-bold text-black">{disc.progress}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                  <div 
                    className="h-full bg-black rounded-full transition-all duration-500"
                    style={{ width: `${disc.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Pending Reviews & Recent AI Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Planner Reviews */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-black" />
              <h3 className="font-bold text-sm text-black uppercase font-mono">
                Pending Planner Reviews ({pendingReviews.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('Review Queue')}
              className="text-xs font-bold text-black hover:underline flex items-center gap-1 font-mono"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {pendingReviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 font-mono">
                No items currently awaiting review in the queue.
              </div>
            ) : (
              pendingReviews.map(item => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-white bg-black px-1.5 py-0.2 rounded">
                        {item.id}
                      </span>
                      <span className="text-xs font-bold text-black">
                        {item.reportedActivity}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Suggested: <span className="font-bold text-black">{item.suggestedActivityName}</span> ({item.discipline})
                    </p>
                    <div className="pt-0.5">
                      <ConfidenceBadge score={item.confidence} size="sm" />
                    </div>
                  </div>

                  <button
                    onClick={() => approveReviewItem(item.id)}
                    className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition shrink-0 shadow-xs font-mono"
                  >
                    1-Click Approve
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent AI Matches */}
        <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-black" />
              <h3 className="font-bold text-sm text-black uppercase font-mono">
                Recent AI Activity Matches
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('Audit Trail')}
              className="text-xs font-bold text-black hover:underline flex items-center gap-1 font-mono"
            >
              <span>Audit Trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {recentAiMatches.map(audit => (
              <div key={audit.id} className="py-3 flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-black">
                      {audit.activityId}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">• {audit.timestamp}</span>
                  </div>
                  <p className="text-xs text-zinc-700 font-medium line-clamp-1 italic">
                    "{audit.details.aiMatch || audit.details.originalInput}"
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Source: {audit.source} • Verified by {audit.user}
                  </p>
                </div>

                <div className="shrink-0 pt-0.5">
                  <ConfidenceBadge score={audit.confidence} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Reports & Delay Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-zinc-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-black" />
              <h3 className="font-bold text-sm text-black uppercase font-mono">
                Recent Daily Progress Reports (DPR)
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('Reports')}
              className="text-xs font-bold text-black hover:underline flex items-center gap-1 font-mono"
            >
              <span>View All ({reports.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {reports.slice(0, 4).map(r => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-black px-1.5 py-0.2 rounded">
                      {r.id}
                    </span>
                    <span className="text-xs font-bold text-black">{r.supervisor}</span>
                    <span className="text-[11px] text-zinc-400 font-mono">• {r.discipline}</span>
                  </div>
                  <p className="text-xs text-zinc-700 line-clamp-1 italic">
                    "{r.description}"
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={r.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Critical Insights */}
        <div className="bg-black text-white rounded-xl p-5 border border-zinc-800 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-white" />
              <h3 className="font-bold text-sm tracking-tight text-white uppercase font-mono">
                Schedule Critical Insights
              </h3>
            </div>
            
            <p className="text-xs text-zinc-300 leading-relaxed">
              Based on historical project memory benchmarks, <span className="text-white font-bold underline">Pipe Spool Erection</span> typically experiences a +1.1 day variance due to flange bolt customs clearances.
            </p>

            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5">
              <div className="text-[10px] text-zinc-400 uppercase font-mono font-semibold">Top Delay Driver</div>
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Material Availability</span>
                <span className="text-zinc-300 font-mono">42% impact</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Pre-kitting spools with bolting kits before lifting reduces crane standby.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('Project Memory')}
            className="w-full py-2 bg-white hover:bg-zinc-200 rounded-lg text-xs font-black text-black transition flex items-center justify-center gap-1.5 shadow-sm uppercase font-mono"
          >
            <span>Explore Project Memory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
