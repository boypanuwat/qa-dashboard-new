import { NextResponse } from 'next/server';
import {
  fetchDefectsFromSheet,
  calculateDefectMetrics,
  groupDefectsByModule,
  generateDefectTrend,
  generateCriticalBugTrend,
} from '@/lib/google-sheets';

export const dynamic = 'force-dynamic'; // Disable static generation
export const revalidate = 0; // Disable caching

export async function GET() {
  try {
    console.log('Defects API called');
    const defects = await fetchDefectsFromSheet();
    
    if (defects.length === 0) {
      return NextResponse.json(
        { error: 'No defects data available' },
        { status: 404 }
      );
    }

    const metrics = calculateDefectMetrics(defects);
    const topModules = groupDefectsByModule(defects);
    const defectTrend = generateDefectTrend(defects);
    const criticalBugTrend = generateCriticalBugTrend(defects);

    // Calculate severity distribution
    const severityStats = [
      { name: 'Critical', value: metrics.critical, fill: '#dc2626' },
      { name: 'Major', value: metrics.major, fill: '#f97316' },
      { name: 'Minor', value: metrics.minor, fill: '#fbbf24' },
    ];

    return NextResponse.json({
      metrics,
      topModules,
      defectTrend,
      criticalBugTrend,
      severityStats,
      totalDefects: defects.length,
    });
  } catch (error) {
    console.error('Error in defects API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch defects data', details: String(error) },
      { status: 500 }
    );
  }
}
