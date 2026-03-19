import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { TeamHeadDashboardData, SubmissionStatus } from 'shared';
import { Users, Building2, AlertTriangle, ClipboardList } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'success' | 'secondary' | 'destructive' | 'outline' }> = {
  [SubmissionStatus.SUBMITTED]: { label: 'Submitted', variant: 'success' },
  [SubmissionStatus.NOT_STARTED]: { label: 'Pending', variant: 'secondary' },
  [SubmissionStatus.NOT_SUBMITTED]: { label: 'Not Submitted', variant: 'destructive' },
  [SubmissionStatus.LOCKED]: { label: 'Locked', variant: 'outline' },
};

export function TeamHeadDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['team-head-dashboard'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: TeamHeadDashboardData }>('/dashboard/team-head');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-destructive p-8">
        Failed to load dashboard data. Please refresh the page.
      </div>
    );
  }

  const pendingCount = data.departmentBreakdown.filter(
    (d) =>
      d.wednesday?.status !== SubmissionStatus.SUBMITTED ||
      d.sunday?.status !== SubmissionStatus.SUBMITTED
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Team" value={data.team.name} icon={Building2} />
        <StatCard title="Departments" value={data.departmentCount} icon={Users} />
        <StatCard title="Total Members" value={data.totalMembers} icon={Users} />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={AlertTriangle}
          description="departments need attention"
        />
      </div>

      {/* Weekly Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        {(['wednesday', 'sunday'] as const).map((day) => {
          const summary = data.currentWeekSummary[day];
          return (
            <Card key={day}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base capitalize">{day} Summary</CardTitle>
                <CardDescription>{summary.serviceDate}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Attendance</span>
                  <span className="text-2xl font-bold">{summary.attendancePercentage}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all animate-progress"
                    style={{ width: `${summary.attendancePercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{summary.totalPresent} / {summary.totalExpected} present</span>
                  <span>{summary.submittedCount} / {data.departmentCount} submitted</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department Breakdown</CardTitle>
          <CardDescription>Current week submission status by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>HOD</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  <TableHead className="text-center">Wednesday</TableHead>
                  <TableHead className="text-center">Sunday</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.departmentBreakdown.map((dept) => (
                  <TableRow key={dept.department.id}>
                    <TableCell className="font-medium">{dept.department.name}</TableCell>
                    <TableCell className="text-muted-foreground">{dept.hodName || '—'}</TableCell>
                    <TableCell className="text-center">{dept.memberCount}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {dept.wednesday ? (
                          <>
                            <Badge variant={statusConfig[dept.wednesday.status]?.variant || 'secondary'}>
                              {statusConfig[dept.wednesday.status]?.label || dept.wednesday.status}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {dept.wednesday.present}/{dept.memberCount} ({dept.wednesday.percentage}%)
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {dept.sunday ? (
                          <>
                            <Badge variant={statusConfig[dept.sunday.status]?.variant || 'secondary'}>
                              {statusConfig[dept.sunday.status]?.label || dept.sunday.status}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {dept.sunday.present}/{dept.memberCount} ({dept.sunday.percentage}%)
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to="/departments">
              <Button variant="outline" size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                Manage Departments
              </Button>
            </Link>
            <Link to="/attendance">
              <Button variant="outline" size="sm">
                <ClipboardList className="h-4 w-4 mr-2" />
                View All Attendance
              </Button>
            </Link>
            <Link to="/users">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
