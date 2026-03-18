import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { TeamHeadDashboardData, SubmissionStatus } from 'shared';
import { Users, Building2, TrendingUp, AlertTriangle } from 'lucide-react';

const statusBadge = (status: SubmissionStatus | null | undefined) => {
  if (!status) return <Badge variant="secondary">-</Badge>;

  switch (status) {
    case SubmissionStatus.SUBMITTED:
      return <Badge variant="success">Submitted</Badge>;
    case SubmissionStatus.NOT_STARTED:
      return <Badge variant="secondary">Pending</Badge>;
    case SubmissionStatus.NOT_SUBMITTED:
      return <Badge variant="destructive">Not Submitted</Badge>;
    case SubmissionStatus.LOCKED:
      return <Badge variant="outline">Locked</Badge>;
    default:
      return <Badge variant="secondary">-</Badge>;
  }
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load dashboard data
      </div>
    );
  }

  const pendingSubmissions = data.departmentBreakdown.filter(
    (d) =>
      d.wednesday?.status !== SubmissionStatus.SUBMITTED ||
      d.sunday?.status !== SubmissionStatus.SUBMITTED
  );

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.team.name}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.departmentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmissions.length}</div>
            <p className="text-xs text-muted-foreground">departments need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wednesday Summary</CardTitle>
            <CardDescription>
              {data.currentWeekSummary.wednesday.serviceDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attendance</span>
                <span className="font-medium">
                  {data.currentWeekSummary.wednesday.totalPresent} / {data.currentWeekSummary.wednesday.totalExpected}
                  ({data.currentWeekSummary.wednesday.attendancePercentage}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium">
                  {data.currentWeekSummary.wednesday.submittedCount} / {data.departmentCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sunday Summary</CardTitle>
            <CardDescription>
              {data.currentWeekSummary.sunday.serviceDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attendance</span>
                <span className="font-medium">
                  {data.currentWeekSummary.sunday.totalPresent} / {data.currentWeekSummary.sunday.totalExpected}
                  ({data.currentWeekSummary.sunday.attendancePercentage}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium">
                  {data.currentWeekSummary.sunday.submittedCount} / {data.departmentCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department Breakdown</CardTitle>
          <CardDescription>Current week submission status by department</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableCell>{dept.hodName || '-'}</TableCell>
                  <TableCell className="text-center">{dept.memberCount}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      {statusBadge(dept.wednesday?.status)}
                      {dept.wednesday && (
                        <span className="text-xs text-muted-foreground">
                          {dept.wednesday.present}/{dept.memberCount} ({dept.wednesday.percentage}%)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      {statusBadge(dept.sunday?.status)}
                      {dept.sunday && (
                        <span className="text-xs text-muted-foreground">
                          {dept.sunday.present}/{dept.memberCount} ({dept.sunday.percentage}%)
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link to="/departments">
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Manage Departments
          </Button>
        </Link>
        <Link to="/attendance">
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            View All Attendance
          </Button>
        </Link>
      </div>
    </div>
  );
}
