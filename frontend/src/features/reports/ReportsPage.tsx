import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { Team, ServiceType } from 'shared';
import { FileSpreadsheet, FileText, Download, BarChart3 } from 'lucide-react';

interface ServiceSummary {
  serviceDate: string;
  totalExpected: number;
  totalPresent: number;
  attendancePercentage: number;
  submittedCount: number;
  totalDepartments: number;
}

interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  summary: {
    wednesday: ServiceSummary | null;
    sunday: ServiceSummary | null;
  };
  teams: Array<{
    teamName: string;
    teamHeadName: string | null;
    totals: {
      wednesday: { expected: number; present: number; percentage: number } | null;
      sunday: { expected: number; present: number; percentage: number } | null;
    };
    departments: Array<{
      departmentName: string;
      hodName: string | null;
      memberCount: number;
      wednesday: { status: string; present: number; absent: number; percentage: number } | null;
      sunday: { status: string; present: number; absent: number; percentage: number } | null;
    }>;
  }>;
}

function getWeekStart(dateRange: string): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  if (dateRange === 'last-week') {
    monday.setDate(monday.getDate() - 7);
  } else if (dateRange === 'last-month') {
    monday.setDate(monday.getDate() - 28);
  } else if (dateRange === 'last-3-months') {
    monday.setDate(monday.getDate() - 84);
  }

  return monday.toISOString().split('T')[0];
}

export function ReportsPage() {
  const [selectedTeam, setSelectedTeam] = React.useState<string>('all');
  const [selectedServiceType, setSelectedServiceType] = React.useState<string>('all');
  const [dateRange, setDateRange] = React.useState<string>('current-week');
  const [isExporting, setIsExporting] = React.useState(false);

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Team[] }>('/teams');
      return response.data.data;
    },
  });

  const { data: weeklyReport, isLoading } = useQuery({
    queryKey: ['weekly-report', dateRange, selectedTeam, selectedServiceType],
    queryFn: async () => {
      const params = new URLSearchParams({ weekStart: getWeekStart(dateRange) });
      if (selectedTeam !== 'all') params.append('teamId', selectedTeam);
      if (selectedServiceType !== 'all') params.append('serviceType', selectedServiceType);
      const response = await api.get<{ success: boolean; data: WeeklyReportData }>(`/reports/weekly?${params.toString()}`);
      return response.data.data;
    },
  });

  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ format, weekStart: getWeekStart(dateRange) });
      if (selectedTeam !== 'all') params.append('teamId', selectedTeam);
      if (selectedServiceType !== 'all') params.append('serviceType', selectedServiceType);

      const response = await api.get(`/reports/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and export attendance reports</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-week">Current Week</SelectItem>
                  <SelectItem value="last-week">Last Week</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value={ServiceType.WEDNESDAY}>Wednesday</SelectItem>
                  <SelectItem value={ServiceType.SUNDAY}>Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      {weeklyReport && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {weeklyReport.summary.wednesday && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Wednesday Service</CardTitle>
                  <CardDescription>{weeklyReport.summary.wednesday.serviceDate}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Overall Attendance</span>
                      <span className="text-2xl font-bold">
                        {weeklyReport.summary.wednesday.attendancePercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${weeklyReport.summary.wednesday.attendancePercentage}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Present</p>
                        <p className="font-medium">
                          {weeklyReport.summary.wednesday.totalPresent} / {weeklyReport.summary.wednesday.totalExpected}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submissions</p>
                        <p className="font-medium">
                          {weeklyReport.summary.wednesday.submittedCount} / {weeklyReport.summary.wednesday.totalDepartments}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {weeklyReport.summary.sunday && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sunday Service</CardTitle>
                  <CardDescription>{weeklyReport.summary.sunday.serviceDate}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Overall Attendance</span>
                      <span className="text-2xl font-bold">
                        {weeklyReport.summary.sunday.attendancePercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${weeklyReport.summary.sunday.attendancePercentage}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Present</p>
                        <p className="font-medium">
                          {weeklyReport.summary.sunday.totalPresent} / {weeklyReport.summary.sunday.totalExpected}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submissions</p>
                        <p className="font-medium">
                          {weeklyReport.summary.sunday.submittedCount} / {weeklyReport.summary.sunday.totalDepartments}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Team Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Breakdown</CardTitle>
                  <CardDescription>
                    Week of {weeklyReport.weekStart} — {weeklyReport.weekEnd}
                  </CardDescription>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {weeklyReport.teams && weeklyReport.teams.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">Wednesday</TableHead>
                      <TableHead className="text-center">Sunday</TableHead>
                      <TableHead className="text-center">Average</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyReport.teams.map((team) => {
                      const wedPct = team.totals.wednesday?.percentage ?? 0;
                      const sunPct = team.totals.sunday?.percentage ?? 0;
                      const count = (team.totals.wednesday ? 1 : 0) + (team.totals.sunday ? 1 : 0);
                      const avgPercentage = count > 0 ? Math.round((wedPct + sunPct) / count) : 0;
                      return (
                        <TableRow key={team.teamName}>
                          <TableCell className="font-medium">{team.teamName}</TableCell>
                          <TableCell className="text-center">
                            {team.totals.wednesday ? (
                              <div className="flex flex-col items-center">
                                <span className="font-medium">{team.totals.wednesday.percentage}%</span>
                                <span className="text-xs text-muted-foreground">
                                  {team.totals.wednesday.present}/{team.totals.wednesday.expected}
                                </span>
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            {team.totals.sunday ? (
                              <div className="flex flex-col items-center">
                                <span className="font-medium">{team.totals.sunday.percentage}%</span>
                                <span className="text-xs text-muted-foreground">
                                  {team.totals.sunday.present}/{team.totals.sunday.expected}
                                </span>
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`font-bold ${
                                avgPercentage >= 80
                                  ? 'text-green-400'
                                  : avgPercentage >= 60
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {avgPercentage}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No team data available for this period.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={() => handleExport('csv')} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              Download Full Report (CSV)
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              Download Summary (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
