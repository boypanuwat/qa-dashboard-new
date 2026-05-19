import {
  mockTrendData,
  mockStatusDistribution,
  mockAssigneePerformance,
  mockStats,
} from "@/lib/mock-data";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CustomPieChart } from "@/components/dashboard/pie-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Users, Calendar } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive test execution reports and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Calendar className="h-4 w-4" />
            Export PDF
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
            <FileText className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalTestCases}</div>
            <p className="text-xs text-muted-foreground">
              Across all test suites
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.passRate}%</div>
            <p className="text-xs text-green-600">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1m 52s</div>
            <p className="text-xs text-muted-foreground">
              Per test case
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Line Chart */}
      <TrendChart data={mockTrendData} />

      {/* Pie Chart and Assignee Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <CustomPieChart
          data={mockStatusDistribution}
          title="Test Status Distribution"
        />

        <Card>
          <CardHeader>
            <CardTitle>Assignee Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignee</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Passed</TableHead>
                  <TableHead className="text-right">Pass Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAssigneePerformance.map((assignee) => (
                  <TableRow key={assignee.name}>
                    <TableCell className="font-medium">{assignee.name}</TableCell>
                    <TableCell className="text-right">{assignee.total}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {assignee.passed}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold">{assignee.passRate}%</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Tests Executed
              </p>
              <p className="text-3xl font-bold">{mockStats.totalTestCases}</p>
              <p className="text-xs text-muted-foreground">
                Total test cases run this month
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Success Rate
              </p>
              <p className="text-3xl font-bold text-green-600">
                {mockStats.passRate}%
              </p>
              <p className="text-xs text-green-600">
                Above target (70%)
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Issues Found
              </p>
              <p className="text-3xl font-bold text-red-600">
                {mockStats.failed}
              </p>
              <p className="text-xs text-muted-foreground">
                Critical bugs requiring attention
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
