import React, { useState, useMemo } from 'react';
import { 
  BrainCircuit, 
  Search, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Building, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  X,
  History
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HistoricalRecord, Discipline, DelayCause } from '../types';

export const ProjectMemoryView: React.FC = () => {
  const { historicalRecords } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [selectedCause, setSelectedCause] = useState<string>('All');

  // Drawer / modal for "Use Historical Data"
  const [activeBenchmark, setActiveBenchmark] = useState<string | null>(null);
  const [selectedHistoricalRecord, setSelectedHistoricalRecord] = useState<HistoricalRecord | null>(null);

  // Benchmarks calculation (Average planned vs actual by activity type)
  const benchmarks = useMemo(() => {
    const map = new Map<string, {
      type: string;
      discipline: Discipline;
      plannedSum: number;
      actualSum: number;
      count: number;
      records: HistoricalRecord[];
    }>();

    historicalRecords.forEach(rec => {
      const existing = map.get(rec.activityType) || {
        type: rec.activityType,
        discipline: rec.discipline,
        plannedSum: 0,
        actualSum: 0,
        count: 0,
        records: []
      };
      existing.plannedSum += rec.plannedDuration;
      existing.actualSum += rec.actualDuration;
      existing.count += 1;
      existing.records.push(rec);
      map.set(rec.activityType, existing);
    });

    return Array.from(map.values()).map(b => ({
      activityType: b.type,
      discipline: b.discipline,
      plannedAvg: Number((b.plannedSum / b.count).toFixed(1)),
      actualAvg: Number((b.actualSum / b.count).toFixed(1)),
      variance: Number(((b.actualSum / b.count) - (b.plannedSum / b.count)).toFixed(1)),
      count: b.count,
      records: b.records
    }));
  }, [historicalRecords]);

  // Recurring delay causes
  const recurringDelayCauses: Array<{ cause: DelayCause; count: number; impact: string; mitigation: string }> = [
    {
      cause: 'Material Availability',
      count: 4,
      impact: '+1.1 days avg delay',
      mitigation: 'Pre-kit bolt kits and gaskets 48 hours prior to crane lift operations.'
    },
    {
      cause: 'Site Access',
      count: 3,
      impact: '+0.5 days avg delay',
      mitigation: 'Coordinate heavy vehicle movement schedules with civil trenching contractor.'
    },
    {
      cause: 'Preceding Activity Delay',
      count: 3,
      impact: '+0.7 days avg delay',
      mitigation: 'Implement L6 handoff checklist before mobilization of alignment crews.'
    },
    {
      cause: 'Manpower',
      count: 2,
      impact: '+0.6 days avg delay',
      mitigation: 'Maintain qualified welder reserve roster for high pressure pipe joints.'
    },
    {
      cause: 'Inspection/Approval',
      count: 2,
      impact: '+0.3 days avg delay',
      mitigation: 'Digitize QC pour card sign-off via tablet inspection workflows.'
    },
    {
      cause: 'Weather',
      count: 1,
      impact: '+2.0 days avg delay',
      mitigation: 'High gust wind safety buffers built into tall column tandem lifts.'
    }
  ];

  // Filtered historical records
  const filteredRecords = useMemo(() => {
    return historicalRecords.filter(r => {
      const matchesSearch = 
        r.activityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.activityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contractor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.lessonsLearned && r.lessonsLearned.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDiscipline = selectedDiscipline === 'All' || r.discipline === selectedDiscipline;
      const matchesCause = selectedCause === 'All' || r.delayCause === selectedCause;

      return matchesSearch && matchesDiscipline && matchesCause;
    });
  }, [historicalRecords, searchQuery, selectedDiscipline, selectedCause]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="bg-white rounded-lg p-6 border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-black text-white shadow-sm">
              <BrainCircuit className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-black text-black tracking-tight font-mono">
              Project Memory & Historical Intelligence
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-black font-bold border border-zinc-300 uppercase">
              {historicalRecords.length} Completed Benchmarks
            </span>
          </div>
          <p className="text-xs text-zinc-500 max-w-xl">
            Institutional knowledge repository capturing completed construction tasks, actual durations, recurrent delay root causes, and empirical mitigation advice for Primavera planning.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveBenchmark(benchmarks[0]?.activityType || null)}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-md text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>Benchmark Insights</span>
          </button>
        </div>
      </div>

      {/* Benchmark Cards: Section 14 Examples */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-mono font-bold text-sm text-black">
            Empirical Activity Benchmarks (Planned vs Actual Durations)
          </h3>
          <span className="text-xs text-zinc-400 font-mono">Click any card to inspect historical execution examples</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benchmarks.map(b => (
            <div
              key={b.activityType}
              onClick={() => setActiveBenchmark(b.activityType)}
              className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-black hover:shadow-md transition cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-black group-hover:underline transition">
                  {b.activityType}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                  {b.discipline}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-2.5 rounded border border-zinc-100 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Planned Avg</span>
                  <div className="font-bold text-zinc-700">{b.plannedAvg} days</div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Actual Avg</span>
                  <div className="font-bold text-black">
                    {b.actualAvg} days
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                <div className="flex items-center gap-1">
                  {b.variance > 0 ? (
                    <span className="text-zinc-900 font-bold flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3 text-black" />
                      +{b.variance}d delay
                    </span>
                  ) : (
                    <span className="text-zinc-600 font-bold flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3 text-zinc-500" />
                      {b.variance}d on track
                    </span>
                  )}
                </div>

                <span className="text-black font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Use Data</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recurring Delay Causes Breakdown */}
      <div className="bg-white rounded-lg p-5 border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-black" />
            <h3 className="font-mono font-bold text-sm text-black">
              Recurring Construction Delay Causes & Recommended Mitigations
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Derived from historical EPC project logs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recurringDelayCauses.map(item => (
            <div key={item.cause} className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-black">{item.cause}</span>
                <span className="text-[10px] font-mono font-bold text-white bg-black px-1.5 py-0.5 rounded">
                  {item.impact}
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                <span className="font-mono font-bold text-black">Best Practice:</span> {item.mitigation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Records Database */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-mono font-bold text-sm text-black">
              Historical Execution Database ({filteredRecords.length})
            </h3>
            <p className="text-xs text-zinc-500">Searchable completed activities and lessons learned</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search activity, lessons learned..."
                className="pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded text-xs outline-none focus:border-black font-mono"
              />
            </div>

            <select
              value={selectedDiscipline}
              onChange={e => setSelectedDiscipline(e.target.value)}
              className="py-1.5 px-2.5 bg-zinc-50 border border-zinc-300 rounded text-xs font-mono font-medium text-black outline-none"
            >
              <option value="All">All Disciplines</option>
              <option value="Civil">Civil</option>
              <option value="Piping">Piping</option>
              <option value="Static Equipment">Static Equipment</option>
              <option value="Rotating Equipment">Rotating Equipment</option>
              <option value="Electrical">Electrical</option>
              <option value="Instrumentation">Instrumentation</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 border-b border-zinc-300 text-black font-mono font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Activity Name</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Discipline</th>
                <th className="py-3 px-3 text-center">Planned</th>
                <th className="py-3 px-3 text-center">Actual</th>
                <th className="py-3 px-3 text-center">Delay</th>
                <th className="py-3 px-3">Delay Cause</th>
                <th className="py-3 px-4">Contractor</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-mono text-zinc-800">
              {filteredRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-zinc-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-black">
                    {rec.id}
                  </td>
                  <td className="py-3 px-4 font-bold text-black max-w-xs font-sans">
                    <div>{rec.activityName}</div>
                    {rec.lessonsLearned && (
                      <div className="text-[11px] text-zinc-500 line-clamp-1 italic font-normal font-sans">
                        "{rec.lessonsLearned}"
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-zinc-600 font-mono">{rec.activityType}</td>
                  <td className="py-3 px-3 font-semibold text-black font-mono">{rec.discipline}</td>
                  <td className="py-3 px-3 text-center font-mono">{rec.plannedDuration}d</td>
                  <td className="py-3 px-3 text-center font-bold text-black font-mono">{rec.actualDuration}d</td>
                  <td className="py-3 px-3 text-center font-mono">
                    {rec.delay > 0 ? (
                      <span className="font-bold text-black">+{rec.delay}d</span>
                    ) : rec.delay < 0 ? (
                      <span className="text-zinc-600 font-bold">{rec.delay}d</span>
                    ) : (
                      <span className="text-zinc-400">0d</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-100 text-black border border-zinc-300">
                      {rec.delayCause}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-600 font-mono">{rec.contractor}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedHistoricalRecord(rec)}
                      className="px-2.5 py-1 bg-white hover:bg-black hover:text-white text-black border border-zinc-300 rounded text-xs font-mono font-semibold transition"
                    >
                      View Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* "Use Historical Data" Drawer */}
      {activeBenchmark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-zinc-300 overflow-hidden flex flex-col p-6 text-xs space-y-4 max-h-[90vh] overflow-y-auto font-mono">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase text-black">Historical Benchmarking Drawer</span>
                <h3 className="font-mono font-bold text-base text-black">
                  Execution Records for: {activeBenchmark}
                </h3>
              </div>
              <button
                onClick={() => setActiveBenchmark(null)}
                className="p-1 text-zinc-400 hover:text-black rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-zinc-600 leading-relaxed font-sans text-xs">
              When scheduling future <span className="font-bold text-black">{activeBenchmark}</span> milestones, the engine suggests planning for empirical durations based on these past execution cycles:
            </p>

            <div className="space-y-3 font-mono">
              {historicalRecords
                .filter(r => r.activityType === activeBenchmark)
                .map(r => (
                  <div key={r.id} className="p-4 rounded border border-zinc-200 bg-zinc-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black text-sm">{r.activityName}</span>
                      <span className="font-mono text-[11px] text-zinc-500">{r.completionDate}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-zinc-500">Planned:</span>{' '}
                        <span className="font-bold text-black">{r.plannedDuration} days</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Actual:</span>{' '}
                        <span className="font-bold text-black">{r.actualDuration} days</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Variance:</span>{' '}
                        <span className="font-bold text-black">
                          {r.delay > 0 ? `+${r.delay}d delay` : 'On time'}
                        </span>
                      </div>
                    </div>

                    {r.lessonsLearned && (
                      <div className="bg-white p-2.5 rounded border border-zinc-200 text-[11px] text-zinc-800 font-sans">
                        <span className="font-mono font-bold text-black uppercase text-[10px]">Lessons Learned:</span> {r.lessonsLearned}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            <div className="pt-3 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setActiveBenchmark(null)}
                className="px-4 py-2 border border-zinc-300 rounded text-black hover:bg-zinc-100 font-mono font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Inspection Modal */}
      {selectedHistoricalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-zinc-300 overflow-hidden flex flex-col p-6 text-xs space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="space-y-0.5">
                <span className="font-mono text-xs font-bold text-white bg-black px-2 py-0.5 rounded">
                  {selectedHistoricalRecord.id}
                </span>
                <h3 className="font-bold text-sm text-black pt-1 font-sans">
                  {selectedHistoricalRecord.activityName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedHistoricalRecord(null)}
                className="p-1 text-zinc-400 hover:text-black rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded border border-zinc-200">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Discipline</span>
                <div className="font-bold text-black">{selectedHistoricalRecord.discipline}</div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Contractor</span>
                <div className="font-bold text-black">{selectedHistoricalRecord.contractor}</div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Planned vs Actual</span>
                <div className="font-bold text-black">{selectedHistoricalRecord.plannedDuration}d planned / {selectedHistoricalRecord.actualDuration}d actual</div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Delay Root Cause</span>
                <div className="font-bold text-black">{selectedHistoricalRecord.delayCause}</div>
              </div>
            </div>

            {selectedHistoricalRecord.lessonsLearned && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-zinc-500 font-mono">Institutional Knowledge / Lesson</span>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-zinc-900 leading-relaxed font-sans">
                  {selectedHistoricalRecord.lessonsLearned}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedHistoricalRecord(null)}
                className="px-4 py-2 border border-zinc-300 rounded text-black hover:bg-zinc-100 font-mono font-semibold"
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
