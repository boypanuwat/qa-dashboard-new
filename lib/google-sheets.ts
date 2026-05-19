import Papa from 'papaparse';

export interface DefectRow {
  issueKey: string;
  summary: string;
  status: string;
  severity: string;
  created: string;
  resolved?: string;
  module: string;
  reopened?: string;
  [key: string]: string | undefined; // Allow additional columns
}

// Google Sheets CSV export URL
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1uU_Ir9Lc059CmtNAhgQiDKAchzoTZcjEJaQUxYLThc4/export?format=csv';

// In-memory cache
let cachedData: DefectRow[] | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function fetchDefectsFromSheet(): Promise<DefectRow[]> {
  const now = Date.now();
  
  // Return cached data if available and fresh
  if (cachedData && (now - lastFetch) < CACHE_DURATION) {
    console.log('Returning cached defects data');
    return cachedData;
  }

  try {
    console.log('Fetching defects from Google Sheets...');
    const response = await fetch(SHEET_CSV_URL, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('CSV fetched, parsing...');
    
    const result = Papa.parse<DefectRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalize header names to match our interface
        const normalized = header.trim().toLowerCase();
        const mapping: Record<string, string> = {
          'issue key': 'issueKey',
          'key': 'issueKey',
          'summary': 'summary',
          'title': 'summary',
          'status': 'status',
          'severity': 'severity',
          'priority': 'severity',
          'created': 'created',
          'created date': 'created',
          'resolved': 'resolved',
          'resolved date': 'resolved',
          'module': 'module',
          'component': 'module',
          'sprint': 'module',
          'reopened': 'reopened',
          're-opened': 'reopened',
        };
        return mapping[normalized] || header;
      },
    });

    if (result.errors.length > 0) {
      console.warn('CSV parsing warnings:', result.errors);
    }

    cachedData = result.data;
    lastFetch = now;
    
    console.log(`Successfully parsed ${cachedData.length} defects`);
    return cachedData;
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    // Return cached data if fetch fails (stale data better than no data)
    if (cachedData) {
      console.log('Returning stale cached data due to fetch error');
      return cachedData;
    }
    return [];
  }
}

// Shared utility: Normalize severity string
function normalizeSeverity(sev: string): 'Critical' | 'Major' | 'Minor' {
  const s = sev.toLowerCase();
  if (s.includes('critical') || s === 'highest') return 'Critical';
  if (s.includes('major') || s === 'high') return 'Major';
  return 'Minor';
}

// Calculate defect metrics
export function calculateDefectMetrics(defects: DefectRow[]) {
  const total = defects.length;
  
  const critical = defects.filter(d => normalizeSeverity(d.severity) === 'Critical').length;
  const major = defects.filter(d => normalizeSeverity(d.severity) === 'Major').length;
  const minor = defects.filter(d => normalizeSeverity(d.severity) === 'Minor').length;
  
  const reopened = defects.filter(d => 
    d.reopened && (d.reopened.toLowerCase() === 'yes' || d.reopened === '1' || d.reopened.toLowerCase() === 'true')
  ).length;
  const reopenRate = total > 0 ? Number.parseFloat(((reopened / total) * 100).toFixed(1)) : 0;

  // Bug leakage: assume defects with status containing "production" or specific flag
  const foundInProduction = defects.filter(d => 
    d.status?.toLowerCase().includes('production') || 
    d.module?.toLowerCase().includes('production') ||
    (d as any).environment?.toLowerCase().includes('production')
  ).length;
  const foundInQA = total - foundInProduction;
  const leakageRate = total > 0 ? Number.parseFloat(((foundInProduction / total) * 100).toFixed(1)) : 0;

  return {
    total,
    critical,
    major,
    minor,
    reopenRate,
    reopened,
    bugLeakage: {
      foundInQA,
      foundInProduction,
      leakageRate,
    },
  };
}

// Group defects by module
export function groupDefectsByModule(defects: DefectRow[]) {
  const moduleMap = new Map<string, { critical: number; major: number; minor: number }>();
  
  defects.forEach(defect => {
    const module = defect.module || 'Unknown';
    if (!moduleMap.has(module)) {
      moduleMap.set(module, { critical: 0, major: 0, minor: 0 });
    }
    const stats = moduleMap.get(module);
    if (!stats) return;
    
    const severity = normalizeSeverity(defect.severity);
    if (severity === 'Critical') stats.critical++;
    else if (severity === 'Major') stats.major++;
    else stats.minor++;
  });

  return Array.from(moduleMap.entries())
    .map(([module, severity]) => ({
      module,
      count: severity.critical + severity.major + severity.minor,
      severity,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5
}

// Generate defect trend data (weekly)
export function generateDefectTrend(defects: DefectRow[]) {
  const weeklyMap = new Map<string, { critical: number; major: number; minor: number; total: number }>();
  
  const getWeekLabel = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const weekNumber = Math.ceil((date.getDate()) / 7);
      const month = date.toLocaleString('en', { month: 'short' });
      return `Week ${weekNumber} ${month}`;
    } catch {
      return 'Unknown';
    }
  };

  defects.forEach(defect => {
    if (!defect.created) return;
    
    const weekLabel = getWeekLabel(defect.created);
    if (!weeklyMap.has(weekLabel)) {
      weeklyMap.set(weekLabel, { critical: 0, major: 0, minor: 0, total: 0 });
    }
    const stats = weeklyMap.get(weekLabel);
    if (!stats) return;
    
    const severity = normalizeSeverity(defect.severity);
    if (severity === 'Critical') stats.critical++;
    else if (severity === 'Major') stats.major++;
    else stats.minor++;
    stats.total++;
  });

  return Array.from(weeklyMap.entries())
    .map(([week, stats]) => ({ week, ...stats }))
    .slice(-4); // Last 4 weeks
}

// Generate critical bug trend (daily for last 2 weeks)
export function generateCriticalBugTrend(defects: DefectRow[]) {
  const criticalDefects = defects.filter(d => 
    d.severity.toLowerCase().includes('critical') || d.severity === 'Highest'
  );

  // Group by date (last 14 days)
  const dateMap = new Map<string, { open: number; closed: number }>();
  const today = new Date();
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    dateMap.set(dateKey, { open: 0, closed: 0 });
  }

  criticalDefects.forEach(defect => {
    if (defect.created) {
      const createdDate = new Date(defect.created);
      const dateKey = createdDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      const stats = dateMap.get(dateKey);
      if (stats) stats.open++;
    }
    
    if (defect.resolved) {
      const resolvedDate = new Date(defect.resolved);
      const dateKey = resolvedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      const stats = dateMap.get(dateKey);
      if (stats) stats.closed++;
    }
  });

  return Array.from(dateMap.entries())
    .map(([date, stats]) => ({
      date,
      ...stats,
      net: stats.open - stats.closed,
    }))
    .filter((_, i, arr) => i % 3 === 0 || i === arr.length - 1); // Sample every 3rd day
}
