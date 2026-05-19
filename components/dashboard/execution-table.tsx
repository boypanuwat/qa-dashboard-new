import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestExecution } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ExecutionTableProps {
  executions: TestExecution[];
}

const statusColors = {
  passed: "bg-green-500/10 text-green-700 dark:text-green-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400",
  blocked: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  not_run: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

export function ExecutionTable({ executions }: Readonly<ExecutionTableProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Test Executions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test Case</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Executed</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Assignee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.map((execution) => (
              <TableRow key={execution.id}>
                <TableCell className="font-medium">{execution.id}</TableCell>
                <TableCell>{execution.name}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={statusColors[execution.status]}
                  >
                    {execution.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {execution.executedDate}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {execution.duration}
                </TableCell>
                <TableCell>{execution.assignee}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
