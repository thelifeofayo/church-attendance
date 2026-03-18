import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { AdminDashboardData } from 'shared';
import { Users, Building2, FileBarChart, UserCog } from 'lucide-react';

export function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: AdminDashboardData }>('/dashboard/admin');
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

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTeams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalDepartments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalMembers}</div>
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
                <span className="text-muted-foreground">Total Attendance</span>
                <span className="font-medium text-xl">
                  {data.currentWeekSummary.wednesday.attendancePercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${data.currentWeekSummary.wednesday.attendancePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>
                  {data.currentWeekSummary.wednesday.totalPresent} / {data.currentWeekSummary.wednesday.totalExpected} present
                </span>
                <span>
                  {data.currentWeekSummary.wednesday.submittedCount} submitted
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
                <span className="text-muted-foreground">Total Attendance</span>
                <span className="font-medium text-xl">
                  {data.currentWeekSummary.sunday.attendancePercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${data.currentWeekSummary.sunday.attendancePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>
                  {data.currentWeekSummary.sunday.totalPresent} / {data.currentWeekSummary.sunday.totalExpected} present
                </span>
                <span>
                  {data.currentWeekSummary.sunday.submittedCount} submitted
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>Current week attendance by team</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Team Head</TableHead>
                <TableHead className="text-center">Departments</TableHead>
                <TableHead className="text-center">Wednesday</TableHead>
                <TableHead className="text-center">Sunday</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.teamBreakdown.map((team) => (
                <TableRow key={team.team.id}>
                  <TableCell className="font-medium">{team.team.name}</TableCell>
                  <TableCell>{team.teamHeadName || '-'}</TableCell>
                  <TableCell className="text-center">{team.departmentCount}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{team.wednesday.percentage}%</span>
                      <span className="text-xs text-muted-foreground">
                        {team.wednesday.submissionCompleteness}% complete
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{team.sunday.percentage}%</span>
                      <span className="text-xs text-muted-foreground">
                        {team.sunday.submissionCompleteness}% complete
                      </span>
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
        <Link to="/teams">
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Manage Teams
          </Button>
        </Link>
        <Link to="/reports">
          <Button variant="outline">
            <FileBarChart className="h-4 w-4 mr-2" />
            Generate Reports
          </Button>
        </Link>
      </div>
    </div>
  );
}
