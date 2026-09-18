import { Discipline, ExtractedSiteUpdate } from '../types';
import { extractTags } from './nlpMatcher';

// Extract times from strings like "9:15 AM", "09:15", "4:30 PM", "16:30", "at 9 AM"
function extractTimeRange(text: string): { start: string; end: string } {
  const norm = text.toLowerCase();

  // Pattern: "started at 9:15 AM and completed at 4:30 PM" or "from 08:00 to 17:00"
  const timeRegex = /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/gi;
  const matches = text.match(timeRegex);

  let start = '08:00 AM';
  let end = '05:00 PM';

  const startMatch = text.match(/(?:start|started|commenced|from)\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  const endMatch = text.match(/(?:finish|finished|completed|ended|to|until)\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);

  if (startMatch && startMatch[1]) {
    start = formatTime(startMatch[1]);
  } else if (matches && matches.length >= 1) {
    start = formatTime(matches[0]);
  }

  if (endMatch && endMatch[1]) {
    end = formatTime(endMatch[1]);
  } else if (matches && matches.length >= 2) {
    end = formatTime(matches[1]);
  }

  return { start, end };
}

function formatTime(raw: string): string {
  const trimmed = raw.trim();
  if (/am|pm/i.test(trimmed)) {
    // If it's e.g. "9:15 AM" or "4:30 PM"
    const parts = trimmed.split(/[\s:]+/);
    let hours = parseInt(parts[0], 10);
    const mins = parts[1] && !isNaN(parseInt(parts[1], 10)) ? parts[1].padStart(2, '0') : '00';
    const period = /pm/i.test(trimmed) ? 'PM' : 'AM';
    return `${hours.toString().padStart(2, '0')}:${mins} ${period}`;
  }
  
  // Format military / 24hr or simple numbers
  const colonParts = trimmed.split(':');
  if (colonParts.length === 2) {
    let h = parseInt(colonParts[0], 10);
    const m = colonParts[1].padStart(2, '0');
    const period = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, '0')}:${m} ${period}`;
  }

  return trimmed;
}

// Heuristic discipline detector
export function detectDiscipline(text: string): Discipline {
  const lower = text.toLowerCase();

  if (
    lower.includes('pipe') ||
    lower.includes('piping') ||
    lower.includes('spool') ||
    lower.includes('hydrotest') ||
    lower.includes('valve') ||
    lower.includes('flange') ||
    lower.includes('weld') ||
    lower.includes('line ') ||
    lower.includes('tie-in')
  ) {
    return 'Piping';
  }

  if (
    lower.includes('cable') ||
    lower.includes('tray') ||
    lower.includes('termination') ||
    lower.includes('conduit') ||
    lower.includes('switchgear') ||
    lower.includes('transformer') ||
    lower.includes('substation') ||
    lower.includes('earthing') ||
    lower.includes('lighting')
  ) {
    return 'Electrical';
  }

  if (
    lower.includes('civil') ||
    lower.includes('foundation') ||
    lower.includes('excavation') ||
    lower.includes('concrete') ||
    lower.includes('casting') ||
    lower.includes('footing') ||
    lower.includes('plinth') ||
    lower.includes('rebar') ||
    lower.includes('trench') ||
    lower.includes('backfill')
  ) {
    return 'Civil';
  }

  if (
    lower.includes('instrument') ||
    lower.includes('transmitter') ||
    lower.includes('calibration') ||
    lower.includes('loop check') ||
    lower.includes('dcs') ||
    lower.includes('plc') ||
    lower.includes('sensor') ||
    lower.includes('junction box')
  ) {
    return 'Instrumentation';
  }

  if (
    lower.includes('pump') ||
    lower.includes('compressor') ||
    lower.includes('turbine') ||
    lower.includes('motor') ||
    lower.includes('alignment') ||
    lower.includes('rotating') ||
    lower.includes('blower')
  ) {
    return 'Rotating Equipment';
  }

  if (
    lower.includes('vessel') ||
    lower.includes('column') ||
    lower.includes('tank') ||
    lower.includes('exchanger') ||
    lower.includes('drum') ||
    lower.includes('static equipment')
  ) {
    return 'Static Equipment';
  }

  if (
    lower.includes('safety') ||
    lower.includes('hse') ||
    lower.includes('permit') ||
    lower.includes('incident') ||
    lower.includes('toolbox') ||
    lower.includes('ppe') ||
    lower.includes('first aid')
  ) {
    return 'HSE';
  }

  return 'Piping'; // Default fallback
}

// Clean activity name from sentence
function extractActivityName(text: string): string {
  // Strip common conversational boilerplates
  let cleaned = text
    .replace(/^(today|yesterday|we have|the crew|team has|site supervisor reports that)/i, '')
    .replace(/(started at \d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi, '')
    .replace(/(completed at \d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi, '')
    .replace(/(finished at \d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi, '')
    .replace(/(ended at \d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi, '')
    .replace(/(from \d{1,2}(?::\d{2})?\s*(?:am|pm)? to \d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi, '')
    .replace(/and\s+completed/gi, '')
    .replace(/and\s+finished/gi, '')
    .trim();

  // If text starts with e.g. "Line 24 spool erection", retain that clean activity
  const lineMatch = cleaned.match(/(Line\s*\d+[A-Za-z0-9-]*\s*(?:spool\s+erection|erection|spool erected|installation|hydrotest)?)/i);
  if (lineMatch) {
    return lineMatch[0].trim();
  }

  // Remove trailing punct
  cleaned = cleaned.replace(/[.,;]+$/, '').trim();

  if (cleaned.length < 3) {
    return text.trim();
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Extract status
function detectStatus(text: string): 'Completed' | 'In Progress' | 'Started' {
  const lower = text.toLowerCase();
  if (lower.includes('completed') || lower.includes('finished') || lower.includes('done') || lower.includes('erected') || lower.includes('installed')) {
    return 'Completed';
  }
  if (lower.includes('ongoing') || lower.includes('in progress') || lower.includes('continuing')) {
    return 'In Progress';
  }
  if (lower.includes('started') || lower.includes('commenced') || lower.includes('began')) {
    return 'Started';
  }
  return 'Completed';
}

// Extract manpower count if mentioned
function extractManpower(text: string): number | undefined {
  const match = text.match(/(\d+)\s*(?:workers|welders|fitters|riggers|laborers|manpower|crew)/i);
  return match ? parseInt(match[1], 10) : undefined;
}

// Main Extraction Function
export function extractSiteProgress(rawText: string, defaultDate = '17 September 2026'): ExtractedSiteUpdate {
  const text = rawText.trim();
  const discipline = detectDiscipline(text);
  const timeRange = extractTimeRange(text);
  const activity = extractActivityName(text);
  const status = detectStatus(text);
  const manpower = extractManpower(text);
  const tags = extractTags(text);

  return {
    activity,
    discipline,
    actualStart: timeRange.start,
    actualEnd: timeRange.end,
    status,
    date: defaultDate,
    manpower,
    notes: text,
    tagMatches: tags
  };
}
