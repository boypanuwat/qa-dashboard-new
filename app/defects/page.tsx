"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bug,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
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
} from "recharts";

interface DefectData {
  metrics: {
    total: number;
    critical: number;
    major: number;
    minor: number;
    reopenRate: number;
    reopened: number;
    bugLeakage: {
      foundInQA: number;
      foundInProduction: number;
      leakageRate: number;
    };
  };
  topModules: Array<{
    module: string;
    count: number;
    severity: { critical: number; major: number; minor: number };
  }>;
  defectTrend: Array<{
    week: string;
    critical: number;
    major: number;
    minor: number;
    total: number;
  }>;
  criticalBugTrend: Array<{
    date: string;
    open: number;
    closed: number;
    net: number;
  }>;
  severityStats: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  totalDefects: number;
}

export default function DefectsPage() {
  const [data, setData] = useState<DefectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/defects')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch defects data');
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const totalDefects = useMemo(
    () => data?.severityStats.reduce((sum, stat) => sum + stat.value, 0) || 0,
    [data]
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลจาก Google Sheets...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 space-y-6 p-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Defect Analytics</h2>
          <p className="text-muted-foreground">
            การติดตามและวิเคราะห์ข้อบกพร่องอย่างครบถ้วน (Comprehensive defect tracking and analysis)
          </p>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <h3 className="text-sm font-semibold mb-1">ไม่สามารถโหลดข้อมูลได้</h3>
                <p className="text-sm text-muted-foreground">{error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  โปรดตรวจสอบ:
                  <ul className="list-disc list-inside ml-2">
                    <li>Google Sheets ถูกแชร์สาธารณะหรือมีสิทธิ์ที่เหมาะสม</li>
                    <li>URL ของ Sheet ถูกต้อง</li>
                    <li>การเชื่อมต่อเครือข่ายมีความเสถียร</li>
                  </ul>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Defect Analytics</h2>
        <p className="text-muted-foreground">
          การติดตามและวิเคราะห์ข้อบกพร่องอย่างครบถ้วน (Comprehensive defect tracking and analysis)
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Defects</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDefects}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                ลดลง 8.2% จากสัปดาห์ที่แล้ว (8.2% from last week)
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Bugs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.severityStats[0].value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Requires immediate attention
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reopen Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.reopenRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.reopened} of {data.metrics.total} defects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bug Leakage</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.bugLeakage.leakageRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.bugLeakage.foundInProduction} found in production
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Defect Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Defect Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.defectTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="critical"
                  stroke="#dc2626"
                  strokeWidth={2}
                  name="Critical"
                />
                <Line
                  type="monotone"
                  dataKey="major"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Major"
                />
                <Line
                  type="monotone"
                  dataKey="minor"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  name="Minor"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Critical Bug Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Critical Bug Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.criticalBugTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="open" fill="#dc2626" name="Opened" />
                <Bar dataKey="closed" fill="#10b981" name="Closed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Defect Modules */}
        <Card>
          <CardHeader>
            <CardTitle>Top Defect Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topModules.map((module, index) => (
                <div key={module.module} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{index + 1}.</span>
                      <span className="text-sm font-medium">{module.module}</span>
                    </div>
                    <span className="text-sm font-bold">{module.count}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-red-600">
                      Critical: {module.severity.critical}
                    </span>
                    <span className="text-orange-600">
                      Major: {module.severity.major}
                    </span>
                    <span className="text-yellow-600">
                      Minor: {module.severity.minor}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600"
                      style={{
                        width: `${(module.count / data.topModules[0].count) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Defect Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Defect Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="60%" height={250}>
                <PieChart>
                  <Pie
                    data={data.severityStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {data.severityStats.map((stat) => (
                  <div key={stat.name} className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: stat.fill }}
                    />
                    <div>
                      <div className="text-sm font-medium">{stat.name}</div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Source Info */}
      <Card className="border-dashed bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
              <Bug className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold mb-1 text-green-900 dark:text-green-100">
                ✅ Connected to Google Sheets
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                ข้อมูลบนหน้านี้ดึงมาจาก Google Sheets แบบ real-time (cached 10 นาที)
              </p>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p><strong>Sheet URL:</strong>{" "}
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1uU_Ir9Lc059CmtNAhgQiDKAchzoTZcjEJaQUxYLThc4/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Sheet
                  </a>
                </p>
                <p><strong>Total Defects:</strong> {data.totalDefects}</p>
                <p><strong>Cache:</strong> Data updates every 10 minutes</p>
                <p className="pt-2 text-xs">
                  💡 To update data: Edit the Google Sheet and refresh this page after 10 minutes, or clear cache and reload.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
