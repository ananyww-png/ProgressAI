export type Discipline = 
  | 'Civil'
  | 'Piping'
  | 'Static Equipment'
  | 'Rotating Equipment'
  | 'Electrical'
  | 'Instrumentation'
  | 'HSE';

export type WBSLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';

export type ActivityStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';

export interface ScheduleActivity {
  id: string; // e.g. "PIP-L6-024"
  wbsLevel: WBSLevel;
  discipline: Discipline;
  name: string; // e.g. "Erect Line 24-XX"
  plannedStart: string;
  plannedFinish: string;
  actualStart: string | null;
  actualFinish: string | null;
  progress: number; // 0-100%
  status: ActivityStatus;
  confidence: number;
  unit: string;
  plannedQty: number;
  actualQty: number;
  area: string;
  contractor: string;
  lastUpdated: string;
  sourceReportId?: string;
}

export type ReportStatus = 'Draft' | 'Processing' | 'Processed' | 'Needs Review' | 'Approved';

export interface DPRReport {
  id: string; // e.g. "DPR-001"
  date: string;
  project: string;
  discipline: Discipline;
  supervisor: string;
  shift: 'Day' | 'Night';
  weather: string;
  manpower: number;
  description: string;
  attachments: string[];
  status: ReportStatus;
  extractedActivitiesCount: number;
  createdDate: string;
}

export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected' | 'Edited';

export interface MatchAlternative {
  id: string;
  name: string;
  confidence: number;
  discipline: Discipline;
  rationale?: string;
}

export interface ReviewItem {
  id: string;
  reportedActivity: string;
  suggestedActivityId: string;
  suggestedActivityName: string;
  discipline: Discipline;
  confidence: number;
  confidenceCategory: 'HIGH' | 'MEDIUM' | 'LOW';
  reportedDate: string;
  startTime?: string;
  endTime?: string;
  source: string; // e.g. "Time Agent", "DPR-001"
  status: ReviewStatus;
  notes?: string;
  extractedData?: {
    status?: string;
    manpower?: number;
    equipment?: string;
    actualQty?: number;
  };
  alternatives: MatchAlternative[];
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  user: string;
  action: 
    | 'AI Extracted Activity'
    | 'Activity Matched'
    | 'Planner Approved'
    | 'Planner Rejected'
    | 'Schedule Updated'
    | 'Report Uploaded'
    | 'Activity Edited'
    | 'Batch Ingestion';
  activityId: string;
  source: string;
  confidence: number;
  details: {
    originalInput?: string;
    aiMatch?: string;
    changes?: Record<string, { from: any; to: any }>;
    reason?: string;
    supervisor?: string;
    discipline?: Discipline;
  };
}

export type DelayCause = 
  | 'Material Availability'
  | 'Site Access'
  | 'Preceding Activity Delay'
  | 'Manpower'
  | 'Inspection/Approval'
  | 'Weather'
  | 'None';

export interface HistoricalRecord {
  id: string;
  activityName: string;
  activityType: string;
  discipline: Discipline;
  plannedDuration: number; // in days
  actualDuration: number; // in days
  delay: number; // in days (positive = delayed, negative = early)
  delayCause: DelayCause;
  contractor: string;
  project: string;
  completionDate: string;
  lessonsLearned?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  linkTab?: string;
}

export interface ProjectSettings {
  projectName: string;
  projectId: string;
  client: string;
  location: string;
  startDate: string;
  endDate: string;
  activeDisciplines: Record<Discipline, boolean>;
  highConfidenceThreshold: number; // e.g. 90
  reviewThreshold: number; // e.g. 70
  allowAutoUpdate: boolean;
  enableFuzzyMatching: boolean;
  enableSemanticMatching: boolean;
  enableDisciplineFiltering: boolean;
  notifyReviewRequired: boolean;
  notifyScheduleUpdate: boolean;
  notifyDailySummary: boolean;
}

export interface ExtractedSiteUpdate {
  activity: string;
  discipline: Discipline;
  actualStart: string;
  actualEnd: string;
  status: 'Completed' | 'In Progress' | 'Started';
  date: string;
  manpower?: number;
  notes?: string;
  tagMatches?: string[];
}

export interface MatchResult {
  bestMatch: ScheduleActivity | null;
  confidence: number;
  confidenceCategory: 'HIGH' | 'MEDIUM' | 'LOW';
  alternatives: MatchAlternative[];
  rationale: string;
}
