import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { 
  ScheduleActivity, 
  DPRReport, 
  ReviewItem, 
  AuditRecord, 
  HistoricalRecord, 
  SystemNotification, 
  ProjectSettings, 
  ExtractedSiteUpdate, 
  MatchAlternative,
  Discipline 
} from '../types';
import { 
  initialProjectSettings, 
  initialScheduleActivities, 
  initialDPRReports, 
  initialReviewQueue, 
  initialHistoricalRecords, 
  initialAuditRecords, 
  initialNotifications 
} from '../data/seedData';
import { matchSiteUpdate } from '../services/nlpMatcher';
import { extractSiteProgress } from '../services/activityExtractor';

const STORAGE_KEY = 'progress_ai_state_v1';

interface AppContextType {
  activities: ScheduleActivity[];
  reports: DPRReport[];
  reviewQueue: ReviewItem[];
  auditRecords: AuditRecord[];
  historicalRecords: HistoricalRecord[];
  notifications: SystemNotification[];
  settings: ProjectSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedProject: string;
  setSelectedProject: (proj: string) => void;
  
  // KPIs
  kpis: {
    activitiesProcessed: number;
    autoMatched: number;
    needsReview: number;
    unmatched: number;
    averageConfidence: number;
    projectCompletion: number;
  };

  // Actions
  approveReviewItem: (itemId: string) => void;
  rejectReviewItem: (itemId: string, reason: string) => void;
  editReviewMatch: (itemId: string, newActivityId: string, notes?: string, autoApprove?: boolean) => void;
  approveDirectSiteUpdate: (extracted: ExtractedSiteUpdate, matchedActivity: ScheduleActivity, confidence: number) => void;
  sendToPlanner: (extracted: ExtractedSiteUpdate, topMatch: ScheduleActivity | null, confidence: number, alternatives: MatchAlternative[]) => void;
  
  // Reports
  addReport: (report: Omit<DPRReport, 'id' | 'createdDate' | 'extractedActivitiesCount'>) => DPRReport;
  updateReport: (report: DPRReport) => void;
  deleteReport: (id: string) => void;
  processReportWithAI: (reportId: string) => Promise<{ matchedCount: number; reviewCount: number }>;

  // Schedule
  updateScheduleActivity: (activity: ScheduleActivity) => void;
  
  // Settings & System
  updateSettings: (newSettings: Partial<ProjectSettings>) => void;
  resetDemoData: () => void;
  exportAllData: () => string;
  importAllData: (jsonData: string) => boolean;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial state from localStorage or fallback to seeds
  const [activities, setActivities] = useState<ScheduleActivity[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_activities`);
    return saved ? JSON.parse(saved) : initialScheduleActivities;
  });

  const [reports, setReports] = useState<DPRReport[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_reports`);
    return saved ? JSON.parse(saved) : initialDPRReports;
  });

  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_reviewQueue`);
    return saved ? JSON.parse(saved) : initialReviewQueue;
  });

  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_auditRecords`);
    return saved ? JSON.parse(saved) : initialAuditRecords;
  });

  const [historicalRecords, setHistoricalRecords] = useState<HistoricalRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_historicalRecords`);
    return saved ? JSON.parse(saved) : initialHistoricalRecords;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [settings, setSettings] = useState<ProjectSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : initialProjectSettings;
  });

  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [selectedProject, setSelectedProject] = useState<string>('Demo EPC Project – Jaipur');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_activities`, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_reports`, JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_reviewQueue`, JSON.stringify(reviewQueue));
  }, [reviewQueue]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_auditRecords`, JSON.stringify(auditRecords));
  }, [auditRecords]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_historicalRecords`, JSON.stringify(historicalRecords));
  }, [historicalRecords]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  // Reactive KPI Calculations
  const kpis = useMemo(() => {
    const pendingReviews = reviewQueue.filter(r => r.status === 'Pending').length;
    const completedOrActive = activities.filter(a => a.status === 'Completed' || a.progress > 0);
    
    // Confidence scores from active matches and completed activities
    const validConfidences = activities
      .filter(a => a.confidence > 0)
      .map(a => a.confidence);
    
    const avgConf = validConfidences.length > 0 
      ? Number((validConfidences.reduce((a, b) => a + b, 0) / validConfidences.length).toFixed(1))
      : 92.4;

    const totalProgress = activities.reduce((acc, curr) => acc + curr.progress, 0);
    const projComp = Math.round(totalProgress / Math.max(1, activities.length));

    // Calculate processed & auto matched based on completed/in-progress and review counts
    const autoMatchedCount = activities.filter(a => a.confidence >= settings.highConfidenceThreshold).length + 195;
    const activitiesProcessedCount = autoMatchedCount + pendingReviews + 15;

    return {
      activitiesProcessed: activitiesProcessedCount,
      autoMatched: autoMatchedCount,
      needsReview: pendingReviews,
      unmatched: 15,
      averageConfidence: avgConf,
      projectCompletion: projComp || 68
    };
  }, [activities, reviewQueue, settings.highConfidenceThreshold]);

  // Helper to add notification
  const addNotification = (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: SystemNotification = {
      id: `NOTIF-${Date.now()}`,
      ...notif,
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Helper to trigger confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore in test or non-window environments
    }
  };

  // Approve an item from Review Queue
  const approveReviewItem = (itemId: string) => {
    const item = reviewQueue.find(r => r.id === itemId);
    if (!item) return;

    const targetActivity = activities.find(a => a.id === item.suggestedActivityId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const today = '2026-09-17';

    // 1. Update Schedule Activity
    if (targetActivity) {
      setActivities(prev => prev.map(act => {
        if (act.id === targetActivity.id) {
          return {
            ...act,
            actualStart: act.actualStart || today,
            actualFinish: today,
            progress: 100,
            status: 'Completed',
            confidence: Math.max(act.confidence, item.confidence),
            actualQty: act.plannedQty,
            lastUpdated: now
          };
        }
        return act;
      }));
    }

    // 2. Remove from pending review queue
    setReviewQueue(prev => prev.filter(r => r.id !== itemId));

    // 3. Add to Audit Trail
    const newAudit: AuditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      user: 'Planner-02 (Lead EPC Planner)',
      action: 'Planner Approved',
      activityId: item.suggestedActivityId,
      source: item.source,
      confidence: item.confidence,
      details: {
        originalInput: item.reportedActivity,
        aiMatch: item.suggestedActivityName,
        changes: {
          status: { from: targetActivity?.status || 'Not Started', to: 'Completed' },
          actualFinish: { from: targetActivity?.actualFinish || null, to: today },
          progress: { from: targetActivity?.progress || 0, to: 100 }
        },
        reason: 'Planner verified field progress and signed off schedule update.',
        discipline: item.discipline
      }
    };
    setAuditRecords(prev => [newAudit, ...prev]);

    // 4. Store Historical Record in Project Memory
    const plannedDays = targetActivity 
      ? Math.max(1, Math.round((new Date(targetActivity.plannedFinish).getTime() - new Date(targetActivity.plannedStart).getTime()) / (1000 * 3600 * 24)))
      : 2;

    const newHistorical: HistoricalRecord = {
      id: `HIST-${Date.now().toString().slice(-4)}`,
      activityName: item.suggestedActivityName,
      activityType: targetActivity ? targetActivity.name.split(' ')[0] + ' ' + (targetActivity.name.split(' ')[1] || 'Works') : 'Field Works',
      discipline: item.discipline,
      plannedDuration: plannedDays,
      actualDuration: plannedDays,
      delay: 0,
      delayCause: 'None',
      contractor: targetActivity?.contractor || 'General Contractor',
      project: selectedProject,
      completionDate: today,
      lessonsLearned: `Approved after review of ${item.source}. Verified without rework.`
    };
    setHistoricalRecords(prev => [newHistorical, ...prev]);

    // 5. Add notification
    addNotification({
      title: 'Activity Approved & Schedule Updated',
      message: `Activity ${item.suggestedActivityId} (${item.suggestedActivityName}) marked Completed.`,
      type: 'success',
      linkTab: 'Schedule'
    });

    triggerConfetti();
  };

  // Reject an item from Review Queue
  const rejectReviewItem = (itemId: string, reason: string) => {
    const item = reviewQueue.find(r => r.id === itemId);
    if (!item) return;

    setReviewQueue(prev => prev.filter(r => r.id !== itemId));

    const newAudit: AuditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      user: 'Planner-02 (Lead EPC Planner)',
      action: 'Planner Rejected',
      activityId: item.suggestedActivityId,
      source: item.source,
      confidence: item.confidence,
      details: {
        originalInput: item.reportedActivity,
        aiMatch: item.suggestedActivityName,
        reason: reason || 'Mismatch between reported scope and schedule milestone.',
        discipline: item.discipline
      }
    };
    setAuditRecords(prev => [newAudit, ...prev]);

    addNotification({
      title: 'Activity Review Rejected',
      message: `Match for "${item.reportedActivity}" was rejected. Schedule untouched.`,
      type: 'warning',
      linkTab: 'Review Queue'
    });
  };

  // Edit match in Review Queue
  const editReviewMatch = (itemId: string, newActivityId: string, notes?: string, autoApprove = false) => {
    const item = reviewQueue.find(r => r.id === itemId);
    const newTarget = activities.find(a => a.id === newActivityId);
    if (!item || !newTarget) return;

    const updatedItem: ReviewItem = {
      ...item,
      suggestedActivityId: newTarget.id,
      suggestedActivityName: newTarget.name,
      discipline: newTarget.discipline,
      confidence: 100, // Manual planner link is 100% authoritative
      confidenceCategory: 'HIGH',
      notes: notes || 'Manually re-linked by Planner.',
      status: 'Pending'
    };

    if (autoApprove) {
      // Approve immediately with new target
      const today = '2026-09-17';
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

      setActivities(prev => prev.map(act => {
        if (act.id === newTarget.id) {
          return {
            ...act,
            actualStart: act.actualStart || today,
            actualFinish: today,
            progress: 100,
            status: 'Completed',
            confidence: 100,
            actualQty: act.plannedQty,
            lastUpdated: now
          };
        }
        return act;
      }));

      setReviewQueue(prev => prev.filter(r => r.id !== itemId));

      const newAudit: AuditRecord = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        user: 'Planner-02 (Lead EPC Planner)',
        action: 'Planner Approved',
        activityId: newTarget.id,
        source: item.source,
        confidence: 100,
        details: {
          originalInput: item.reportedActivity,
          aiMatch: `${newTarget.name} (Re-assigned by Planner)`,
          changes: {
            status: { from: newTarget.status, to: 'Completed' },
            actualFinish: { from: newTarget.actualFinish, to: today },
            progress: { from: newTarget.progress, to: 100 }
          },
          reason: `Planner re-assigned from initial suggestion to ${newTarget.id}. ${notes || ''}`,
          discipline: newTarget.discipline
        }
      };
      setAuditRecords(prev => [newAudit, ...prev]);

      const plannedDays = Math.max(1, Math.round((new Date(newTarget.plannedFinish).getTime() - new Date(newTarget.plannedStart).getTime()) / (1000 * 3600 * 24)));

      const newHistorical: HistoricalRecord = {
        id: `HIST-${Date.now().toString().slice(-4)}`,
        activityName: newTarget.name,
        activityType: newTarget.name.split(' ')[0] + ' ' + (newTarget.name.split(' ')[1] || 'Works'),
        discipline: newTarget.discipline,
        plannedDuration: plannedDays,
        actualDuration: plannedDays,
        delay: 0,
        delayCause: 'None',
        contractor: newTarget.contractor,
        project: selectedProject,
        completionDate: today,
        lessonsLearned: 'Re-assigned to correct L6 activity during planner triage.'
      };
      setHistoricalRecords(prev => [newHistorical, ...prev]);

      addNotification({
        title: 'Activity Reassigned & Approved',
        message: `Successfully linked and marked ${newTarget.id} as Completed.`,
        type: 'success',
        linkTab: 'Schedule'
      });

      triggerConfetti();
    } else {
      setReviewQueue(prev => prev.map(r => r.id === itemId ? updatedItem : r));
      addNotification({
        title: 'Match Re-linked',
        message: `Suggested activity updated to ${newTarget.id}. Ready for approval.`,
        type: 'info',
        linkTab: 'Review Queue'
      });
    }
  };

  // Direct Time Agent Approval (Scenario 1)
  const approveDirectSiteUpdate = (
    extracted: ExtractedSiteUpdate, 
    matchedActivity: ScheduleActivity, 
    confidence: number
  ) => {
    const today = '2026-09-17';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // 1. Update Schedule
    setActivities(prev => prev.map(act => {
      if (act.id === matchedActivity.id) {
        return {
          ...act,
          actualStart: act.actualStart || today,
          actualFinish: today,
          progress: 100,
          status: 'Completed',
          confidence: confidence,
          actualQty: act.plannedQty,
          lastUpdated: now
        };
      }
      return act;
    }));

    // 2. Create Audit Record
    const newAudit: AuditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      user: 'Planner-02 (Lead EPC Planner)',
      action: 'Schedule Updated',
      activityId: matchedActivity.id,
      source: 'Time Agent / Supervisor Update',
      confidence: confidence,
      details: {
        originalInput: extracted.notes || extracted.activity,
        aiMatch: matchedActivity.name,
        changes: {
          status: { from: matchedActivity.status, to: 'Completed' },
          actualStart: { from: matchedActivity.actualStart, to: today },
          actualFinish: { from: matchedActivity.actualFinish, to: today },
          progress: { from: matchedActivity.progress, to: 100 }
        },
        reason: `High confidence AI match (${confidence}%) approved by planner. Start: ${extracted.actualStart}, End: ${extracted.actualEnd}`,
        discipline: matchedActivity.discipline
      }
    };
    setAuditRecords(prev => [newAudit, ...prev]);

    // 3. Create Project Memory Historical Record
    const plannedDays = Math.max(1, Math.round((new Date(matchedActivity.plannedFinish).getTime() - new Date(matchedActivity.plannedStart).getTime()) / (1000 * 3600 * 24)));

    const newHistorical: HistoricalRecord = {
      id: `HIST-${Date.now().toString().slice(-4)}`,
      activityName: matchedActivity.name,
      activityType: 'Pipe Spool Erection',
      discipline: matchedActivity.discipline,
      plannedDuration: plannedDays,
      actualDuration: plannedDays,
      delay: 0,
      delayCause: 'None',
      contractor: matchedActivity.contractor,
      project: selectedProject,
      completionDate: today,
      lessonsLearned: 'Executed within 1 day shift without punch points.'
    };
    setHistoricalRecords(prev => [newHistorical, ...prev]);

    // 4. Add Notification
    addNotification({
      title: 'Schedule Updated Successfully',
      message: `Activity ${matchedActivity.id} (${matchedActivity.name}) marked as Completed.`,
      type: 'success',
      linkTab: 'Schedule'
    });

    triggerConfetti();
  };

  // Send to Planner from Time Agent (Scenario 2)
  const sendToPlanner = (
    extracted: ExtractedSiteUpdate, 
    topMatch: ScheduleActivity | null, 
    confidence: number, 
    alternatives: MatchAlternative[]
  ) => {
    const newReviewItem: ReviewItem = {
      id: `REV-${Date.now().toString().slice(-4)}`,
      reportedActivity: extracted.notes || extracted.activity,
      suggestedActivityId: topMatch ? topMatch.id : 'UNMATCHED',
      suggestedActivityName: topMatch ? topMatch.name : 'No reliable match found',
      discipline: extracted.discipline,
      confidence: confidence,
      confidenceCategory: confidence >= settings.highConfidenceThreshold ? 'HIGH' : confidence >= settings.reviewThreshold ? 'MEDIUM' : 'LOW',
      reportedDate: extracted.date,
      startTime: extracted.actualStart,
      endTime: extracted.actualEnd,
      source: 'Time Agent / Supervisor Log',
      status: 'Pending',
      notes: 'Sent to Review Queue by user for expert planner verification.',
      alternatives: alternatives
    };

    setReviewQueue(prev => [newReviewItem, ...prev]);

    const newAudit: AuditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      user: 'AI Time Agent',
      action: 'AI Extracted Activity',
      activityId: topMatch ? topMatch.id : 'N/A',
      source: 'Time Agent',
      confidence: confidence,
      details: {
        originalInput: extracted.notes || extracted.activity,
        aiMatch: topMatch?.name || 'Unassigned',
        reason: 'Low/Medium confidence match routed to planner review queue.',
        discipline: extracted.discipline
      }
    };
    setAuditRecords(prev => [newAudit, ...prev]);

    addNotification({
      title: 'Sent to Review Queue',
      message: `Update "${extracted.activity}" added to Review Queue for planner decision.`,
      type: 'warning',
      linkTab: 'Review Queue'
    });
  };

  // Reports CRUD & AI Processing
  const addReport = (reportData: Omit<DPRReport, 'id' | 'createdDate' | 'extractedActivitiesCount'>): DPRReport => {
    const newReport: DPRReport = {
      ...reportData,
      id: `DPR-${String(reports.length + 1).padStart(3, '0')}`,
      createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      extractedActivitiesCount: 0
    };
    setReports(prev => [newReport, ...prev]);

    addNotification({
      title: 'Daily Report Created',
      message: `Report ${newReport.id} logged for ${newReport.discipline}.`,
      type: 'info',
      linkTab: 'Reports'
    });

    return newReport;
  };

  const updateReport = (updated: DPRReport) => {
    setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
    addNotification({
      title: 'Report Updated',
      message: `Report ${updated.id} was updated.`,
      type: 'info',
      linkTab: 'Reports'
    });
  };

  const deleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    addNotification({
      title: 'Report Deleted',
      message: `Report ${id} removed from records.`,
      type: 'info',
      linkTab: 'Reports'
    });
  };

  const processReportWithAI = async (reportId: string): Promise<{ matchedCount: number; reviewCount: number }> => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return { matchedCount: 0, reviewCount: 0 };

    // Set status to Processing
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'Processing' } : r));

    // Simulate async AI extraction step
    await new Promise(res => setTimeout(res, 800));

    const extracted = extractSiteProgress(report.description, report.date);
    const match = matchSiteUpdate(extracted.activity, activities, extracted.discipline, settings);

    let matchedCount = 0;
    let reviewCount = 0;

    if (match.confidence >= settings.highConfidenceThreshold && settings.allowAutoUpdate && match.bestMatch) {
      // Auto match & update schedule
      approveDirectSiteUpdate(extracted, match.bestMatch, match.confidence);
      matchedCount = 1;
      setReports(prev => prev.map(r => r.id === reportId ? { 
        ...r, 
        status: 'Approved',
        extractedActivitiesCount: 1 
      } : r));
    } else {
      // Send to review queue
      sendToPlanner(extracted, match.bestMatch, match.confidence, match.alternatives);
      reviewCount = 1;
      setReports(prev => prev.map(r => r.id === reportId ? { 
        ...r, 
        status: 'Needs Review',
        extractedActivitiesCount: 1 
      } : r));
    }

    return { matchedCount, reviewCount };
  };

  // Schedule Update
  const updateScheduleActivity = (updated: ScheduleActivity) => {
    const previous = activities.find(a => a.id === updated.id);
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));

    const newAudit: AuditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      user: 'Planner-02 (Lead EPC Planner)',
      action: 'Activity Edited',
      activityId: updated.id,
      source: 'Manual Schedule Edit',
      confidence: 100,
      details: {
        aiMatch: updated.name,
        changes: {
          progress: { from: previous?.progress, to: updated.progress },
          status: { from: previous?.status, to: updated.status },
          actualFinish: { from: previous?.actualFinish, to: updated.actualFinish }
        },
        reason: 'Planner manually adjusted schedule parameters.',
        discipline: updated.discipline
      }
    };
    setAuditRecords(prev => [newAudit, ...prev]);

    addNotification({
      title: 'Schedule Updated',
      message: `Activity ${updated.id} parameters revised.`,
      type: 'info',
      linkTab: 'Schedule'
    });
  };

  // Settings
  const updateSettings = (newSettings: Partial<ProjectSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addNotification({
      title: 'Settings Saved',
      message: 'System parameters and matching thresholds updated.',
      type: 'info',
      linkTab: 'Settings'
    });
  };

  const resetDemoData = () => {
    setActivities(initialScheduleActivities);
    setReports(initialDPRReports);
    setReviewQueue(initialReviewQueue);
    setAuditRecords(initialAuditRecords);
    setHistoricalRecords(initialHistoricalRecords);
    setNotifications(initialNotifications);
    setSettings(initialProjectSettings);
    localStorage.clear();
    addNotification({
      title: 'Demo Data Reset',
      message: 'All schedule activities, DPRs and queues restored to original seed.',
      type: 'info',
      linkTab: 'Dashboard'
    });
  };

  const exportAllData = (): string => {
    const data = {
      activities,
      reports,
      reviewQueue,
      auditRecords,
      historicalRecords,
      notifications,
      settings,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  };

  const importAllData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.activities) setActivities(parsed.activities);
      if (parsed.reports) setReports(parsed.reports);
      if (parsed.reviewQueue) setReviewQueue(parsed.reviewQueue);
      if (parsed.auditRecords) setAuditRecords(parsed.auditRecords);
      if (parsed.historicalRecords) setHistoricalRecords(parsed.historicalRecords);
      if (parsed.settings) setSettings(parsed.settings);
      addNotification({
        title: 'Data Imported Successfully',
        message: 'All project data restored from imported JSON backup.',
        type: 'success',
        linkTab: 'Dashboard'
      });
      return true;
    } catch {
      return false;
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <AppContext.Provider
      value={{
        activities,
        reports,
        reviewQueue,
        auditRecords,
        historicalRecords,
        notifications,
        settings,
        activeTab,
        setActiveTab,
        selectedProject,
        setSelectedProject,
        kpis,
        approveReviewItem,
        rejectReviewItem,
        editReviewMatch,
        approveDirectSiteUpdate,
        sendToPlanner,
        addReport,
        updateReport,
        deleteReport,
        processReportWithAI,
        updateScheduleActivity,
        updateSettings,
        resetDemoData,
        exportAllData,
        importAllData,
        markNotificationRead,
        clearAllNotifications,
        addNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
