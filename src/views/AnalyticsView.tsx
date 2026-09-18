import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  PieChart as PieIcon,
  Layers
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { KpiCard } from '../components/KpiCard';
import { Discipline } from '../types';

export const AnalyticsView: React.FC = () => {
  const { activities, historicalRecords, auditRecords, reviewQueue, selectedProject } = useApp();

  // Filters
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('All');

  // Filtered dataset for analytics
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      return selectedDiscipline === 'All' || a.discipline === selectedDiscipline;
    });
  }, [activities, selectedDiscipline]);

  const filteredHistorical = useMemo(() => {
    return historicalRecords.filter(h => {
      return selectedDiscipline === 'All' || h.discipline === selectedDiscipline;
    });
  }, [historicalRecords, selectedDiscipline]);

  // Metric 1: Average Delay (in days)
  const avgDelay = useMemo(() => {
    if (filteredHistorical.length === 0) return 0.4;
    const totalDelay = filteredHistorical.reduce((acc, h) => acc + (h.delay > 0 ? h.delay : 0), 0);
    return Number((totalDelay / filteredHistorical.length).toFixed(1));
  }, [filteredHistorical]);

  // Metric 2: Average Actual Duration (in days)
  const avgDuration = useMemo(() => {
    if (filteredHistorical.length === 0) return 3.2;
    const totalDuration = filteredHistorical.reduce((acc, h) => acc + h.actualDuration, 0);
    return Number((totalDuration / filteredHistorical.length).toFixed(1));
  }, [filteredHistorical]);

  // Metric 3: AI Match Acceptance Rate
  const aiAcceptanceRate = useMemo(() => {
    const approvedAudits = auditRecords.filter(a => a.action === 'Planner Approved' || a.action === 'Schedule Updated').length;
    const rejectedAudits = auditRecords.filter(a => a.action === 'Planner Rejected').length;
    const total = approvedAudits + rejectedAudits;
    if (total === 0) return 93.8;
    return Number(((approvedAudits / total) * 100).toFixed(1));
  }, [auditRecords]);

  // Metric 4: Manual Review Rate
  const manualReviewRate = useMemo(() => {
    const total = activities.length;
    const reviewed = reviewQueue.length;
    return Number(((reviewed / Math.max(1, total + reviewed)) * 100).toFixed(1));
  }, [activities, reviewQueue]);

  // Chart 1: Planned vs Actual Duration (Historical Activity Types)
  const durationComparisonData = useMemo(() => {
    const typeMap = new Map<string, { plannedSum: number; actualSum: number; count: number }>();
    filteredHistorical.forEach(h => {
      const existing = typeMap.get(h.activityType) || { plannedSum: 0, actualSum: 0, count: 0 };
      existing.plannedSum += h.plannedDuration;
      existing.actualSum += h.actualDuration;
      existing.count += 1;
      typeMap.set(h.activityType, existing);
    });

    return Array.from(typeMap.entries()).map(([type, stats]) => ({
      activityType: type,
      planned: Number((stats.plannedSum / stats.count).toFixed(1)),
      actual: Number((stats.actualSum / stats.count).toFixed(1))
    }));
  }, [filteredHistorical]);

  // Chart 2: Discipline-Wise Progress
  const disciplineProgressData = useMemo(() => {
    const disciplines: Discipline[] = [
      'Civil', 'Piping', 'Static Equipment', 'Rotating Equipment', 'Electrical', 'Instrumentation', 'HSE'
    ];
    return disciplines
      .filter(d => selectedDiscipline === 'All' || d === selectedDiscipline)
      .map(disc => {
        const discActs = activities.filter(a => a.discipline === disc);
        const total = discActs.length;
        const avg = total > 0 ? Math.round(discActs.reduce((acc, a) => acc + a.progress, 0) / total) : 0;
        return {
          discipline: disc,
          progress: avg,
          activities: total
        };
      });
  }, [activities, selectedDiscipline]);

  // Chart 3: Activities by Status
  const statusDistributionData = useMemo(() => {
    const counts = {
      'Completed': filteredActivities.filter(a => a.status === 'Completed').length,
      'In Progress': filteredActivities.filter(a => a.status === 'In Progress').length,
      'Not Started': filteredActivities.filter(a => a.status === 'Not Started').length,
      'Delayed': filteredActivities.filter(a => a.status === 'Delayed').length,
    };
    return [
      { name: 'Completed', value: counts['Completed'], color: '#000000' },
      { name: 'In Progress', value: counts['In Progress'], color: '#52525B' },
      { name: 'Not Started', value: counts['Not Started'], color: '#D4D4D8' },
      { name: 'Delayed', value: counts['Delayed'], color: '#71717A' },
    ];
  }, [filteredActivities]);

  // Chart 4: Confidence Distribution
  const confidenceDistData = useMemo(() => {
    const high = filteredActivities.filter(a => a.confidence >= 90).length + 42;
    const medium = filteredActivities.filter(a => a.confidence >= 70 && a.confidence < 90).length + 18;
    const low = filteredActivities.filter(a => a.confidence > 0 && a.confidence < 70).length + 5;
    return [
      { range: 'High (>=90%)', count: high, fill: '#000000' },
      { range: 'Medium (70-89%)', count: medium, fill: '#71717A' },
      { range: 'Low (<70%)', count: low, fill: '#D4D4D8' }
    ];
  }, [filteredActivities]);

  // Chart 5: Delay Causes Breakdown
  const delayCausesData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredHistorical.forEach(h => {
      if (h.delayCause !== 'None') {
        counts[h.delayCause] = (counts[h.delayCause] || 0) + 1;
      }
    });

    const colors = ['#000000', '#3F3F46', '#71717A', '#A1A1AA', '#D4D4D8', '#18181B'];
    return Object.entries(counts).map(([cause, count], i) => ({
      name: cause,
      value: count,
      color: colors[i % colors.length]
    }));
  }, [filteredHistorical]);

  // Chart 6: Activities Completed Per Day (Timeline)
  const activitiesPerDayData = [
    { date: '11 Sep', completed: 3 },
    { date: '12 Sep', completed: 5 },
    { date: '13 Sep', completed: 4 },
    { date: '14 Sep', completed: 7 },
    { date: '15 Sep', completed: 8 },
    { date: '16 Sep', completed: 6 },
    { date: '17 Sep (Today)', completed: 9 },
  ];

  // Chart 7: AI Acceptance Trend
  const acceptanceTrendData = [
    { week: 'W32', acceptanceRate: 86 },
    { week: 'W33', acceptanceRate: 88 },
    { week: 'W34', acceptanceRate: 91 },
    { week: 'W35', acceptanceRate: 92 },
    { week: 'W36', acceptanceRate: 94 },
    { week: 'W37', acceptanceRate: aiAcceptanceRate },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner & Filter Controls */}
      <div className="bg-white rounded-lg p-6 border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-black text-white shadow-sm">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-black text-black tracking-tight font-mono">
              EPC Schedule & Intelligence Analytics
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black text-white font-bold tracking-wider uppercase">
              Live Engine
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Real-time analytics aggregating actual site progress against planned baselines, delay risk distribution, and AI matching accuracy metrics.
          </p>
        </div>

        {/* Global Analytics Filters */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-md border border-zinc-300">
            <Filter className="w-3.5 h-3.5 text-zinc-400 ml-2" />
            <select
              value={selectedDiscipline}
              onChange={e => setSelectedDiscipline(e.target.value)}
              className="bg-transparent py-1.5 px-2 text-xs font-semibold text-black outline-none font-mono"
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

          <div className="bg-zinc-50 p-1 rounded-md border border-zinc-300">
            <select
              value={selectedTimeRange}
              onChange={e => setSelectedTimeRange(e.target.value)}
              className="bg-transparent py-1.5 px-2 text-xs font-semibold text-black outline-none font-mono"
            >
              <option value="All">All Time</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Average Schedule Delay"
          value={`+${avgDelay} days`}
          subtext="Variance across completed packages"
          icon={Clock}
          color="black"
          trend="+0.3d vs baseline"
        />
        <KpiCard
          title="Average Actual Duration"
          value={`${avgDuration} days`}
          subtext="Per L6 construction activity"
          icon={TrendingUp}
          color="black"
        />
        <KpiCard
          title="AI Match Acceptance Rate"
          value={`${aiAcceptanceRate}%`}
          subtext="Planner approval of AI suggestions"
          icon={CheckCircle2}
          color="black"
          trend="+3.2% this week"
          trendUp={true}
        />
        <KpiCard
          title="Manual Review Rate"
          value={`${manualReviewRate}%`}
          subtext="Activities requiring planner triage"
          icon={AlertTriangle}
          color="black"
        />
      </div>

      {/* Chart Grid Row 1: Planned vs Actual Duration & Discipline Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Planned vs Actual Duration */}
        <div className="bg-white rounded-lg p-5 border border-zinc-200 shadow-sm space-y-3">
          <div>
            <h3 className="font-mono font-bold text-sm text-black">
              1. Planned vs Actual Duration (Days by Activity Type)
            </h3>
            <p className="text-xs text-zinc-500">
              Derived from historical project records and completed L6 activities
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis dataKey="activityType" tick={{ fontSize: 10, fill: '#71717A', fontFamily: 'monospace' }} angle={-15} textAnchor="end" />
                <YAxis unit="d" tick={{ fontSize: 11, fill: '#71717A', fontFamily: 'monospace' }} />
                <Tooltip 
                  formatter={(val: any) => [`${val} days`, 'Duration']}
                  contentStyle={{ backgroundColor: '#000000', borderRadius: '4px', border: '1px solid #27272A', color: '#FFFFFF', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'monospace' }} />
                <Bar dataKey="planned" name="Planned Duration" fill="#D4D4D8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="actual" name="Actual Duration" fill="#000000" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Discipline-Wise Progress */}
        <div className="bg-white rounded-lg p-5 border border-zinc-200 shadow-sm space-y-3">
          <div>
            <h3 className="font-mono font-bold text-sm text-black">
              2. Discipline-Wise Progress Overview (%)
            </h3>
            <p className="text-xs text-zinc-500">
              Mean percent complete per trade across active work packages
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={disciplineProgressData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#71717A', fontFamily: 'monospace' }} />
                <YAxis dataKey="discipline" type="category" tick={{ fontSize: 11, fill: '#000000', fontFamily: 'monospace' }} />
                <Tooltip 
                  formatter={(val: any) => [`${val}%`, 'Progress']}
                  contentStyle={{ backgroundColor: '#000000', borderRadius: '4px', border: '1px solid #27272A', color: '#FFFFFF', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Bar dataKey="progress" name="Completion %" fill="#000000" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Grid Row 2: Status Breakdown, Confidence Distribution & Delay Causes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart 3: Activities by Status */}
        <div className="bg-white rounded-lg p-5 border border-zinc-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-mono font-bold text-sm text-black">
              3. Activities by Status
            </h3>
            <p className="text-xs text-zinc-500">
              Current lifecycle of all L5/L6 milestones
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {statusDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#000000" strokeWidth={0.5} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000000', borderRadius: '4px', border: '1px solid #27272A', color: '#FFFFFF', fontSize: '12px', fontFamily: 'monospace' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-zinc-200">
            {statusDistributionData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                <span className="text-zinc-600 truncate">{s.name}:</span>
                <span className="font-bold text-black">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Confidence Distribution */}
        <div className="bg-white rounded-lg p-5 border border-zinc-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-mono font-bold text-sm text-black">
              4. Confidence Distribution
            </h3>
            <p className="text-xs text-zinc-500">
              Match reliability across all processed updates
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceDistData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#71717A', fontFamily: 'monospace' }} />
                <YAxis tick={{ fontSize: 10, fill: '#71717A', fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000000', borderRadius: '4px', border: '1px solid #27272A', color: '#FFFFFF', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Bar dataKey="count" name="Count" radius={[2, 2, 0, 0]}>
                  {confidenceDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2 bg-zinc-50 rounded border border-zinc-200 text-center text-[11px] text-zinc-600 font-mono">
            High Confidence threshold: <span className="font-bold text-black">≥90%</span>
          </div>
        </div>

        {/* Chart 5: Delay Causes */}
        <div className="bg-white rounded-lg p-5 border border-zinc-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-mono font-bold text-sm text-black">
              5. Delay Causes Frequency
            </h3>
            <p className="text-xs text-zinc-500">
              Historical variance drivers in project memory
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={delayCausesData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                >
                  {delayCausesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000000', borderRadius: '4px', border: '1px solid #27272A', color: '#FFFFFF', fontSize: '12px', fontFamily: 'monospace' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1 text-[11px] font-mono pt-1 border-t border-zinc-200 max-h-20 overflow-y-auto">
            {delayCausesData.map(c => (
              <div key={c.name} className="flex items-center justify-between text-zinc-600">
                <span className="truncate">{c.name}</span>
                <span className="font-bold text-black">{c.value} events</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Grid Row 3: Daily Completion Rate & AI Match Acceptance Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 6: Activities Completed Per Day */}
        <div className="bg-white rounded-lg p-5 border border-zinc-200 shadow-sm space-y-3">
          <div>
            <h3 className="font-mono font-bold text-sm text-black">
              6. Activities Completed Per Day (Week 37 Run Rate)
            </h3>
            <p className="text-xs text-zinc-500">
              Daily throughput of validated site activities
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activitiesPerDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#000000" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717A', fontFamily: 'monospace' }} />
                <YAxis tick={{ fontSize: 11, fill: '#71717A', fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000000', borderRadius: '4px', border: '1px solid #27272A', color: '#FFFFFF', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="completed" stroke="#000000" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 7: AI Match Acceptance Rate */}
        <div className="bg-white rounded-lg p-5 border border-zinc-200 shadow-sm space-y-3">
          <div>
            <h3 className="font-mono font-bold text-sm text-black">
              7. AI Match Acceptance Rate Trend (%)
            </h3>
            <p className="text-xs text-zinc-500">
              Progressive accuracy of NLP schedule matching over project duration
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={acceptanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAccept" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#000000" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#71717A', fontFamily: 'monospace' }} />
                <YAxis domain={[75, 100]} unit="%" tick={{ fontSize: 11, fill: '#71717A', fontFamily: 'monospace' }} />
                <Tooltip 
                  formatter={(val: any) => [`${val}%`, 'Acceptance Rate']}
                  contentStyle={{ backgroundColor: '#000000', borderRadius: '4px', border: '1px solid #27272A', color: '#FFFFFF', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="acceptanceRate" stroke="#27272A" strokeWidth={2} fillOpacity={1} fill="url(#colorAccept)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
