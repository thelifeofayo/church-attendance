import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
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
  summary: { wednesday: ServiceSummary | null; sunday: ServiceSummary | null };
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
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  if (dateRange === 'last-week') monday.setDate(monday.getDate() - 7);
  else if (dateRange === 'last-month') monday.setDate(monday.getDate() - 28);
  else if (dateRange === 'last-3-months') monday.setDate(monday.getDate() - 84);
  return monday.toISOString().split('T')[0];
}

export function ReportsPage() {
  const [selectedTeam, setSelectedTeam] = React.useState('all');
  const [selectedServiceType, setSelectedServiceType] = React.useState('all');
  const [dateRange, setDateRange] = React.useState('current-week');
  const [isExporting, setIsExporting] = React.useState(false);

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Team[] }>('/teams');
      return res.data.data;
    },
  });

  const { data: weeklyReport, isLoading } = useQuery({
    queryKey: ['weekly-report', dateRange, selectedTeam, selectedServiceType],
    queryFn: async () => {
      const params = new URLSearchParams({ weekStart: getWeekStart(dateRange) });
      if (selectedTeam !== 'all') params.append('teamId', selectedTeam);
      if (selectedServiceType !== 'all') params.append('serviceType', selectedServiceType);
      const res = await api.get<{ success: boolean; data: WeeklyReportData }>(`/reports/weekly?${params}`);
      return res.data.data;
    },
  });

  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ format, weekStart: getWeekStart(dateRange) });
      if (selectedTeam !== 'all') params.append('teamId', selectedTeam);
      if (selectedServiceType !== 'all') params.append('serviceType', selectedServiceType);
      const response = await api.get(`/reports/export?${params}`, { responseType: 'blob' });
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
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32" />
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export attendance reports"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={isExporting}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={isExporting}>
              <FileText className="h-4 w-4 mr-2" />Export PDF
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-week">Current Week</SelectItem>
                  <SelectItem value="last-week">Last Week</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Service</Label>
              <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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

      {weeklyReport && (
        <>
          {/* Service Summaries */}
          <div className="grid gap-4 md:grid-cols-2">
            {(['wednesday', 'sunday'] as const).map((day) => {
              const s = weeklyReport.summary[day];
              if (!s) return null;
              return (
                <Card key={day}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base capitalize">{day} Service</CardTitle>
                    <CardDescription>{s.serviceDate}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Overall Attendance</span>
                      <span className="text-2xl font-bold">{s.attendancePercentage}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all animate-progress" style={{ width: `${s.attendancePercentage}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <p>Present</p>
                        <p className="font-medium text-foreground">{s.totalPresent} / {s.totalExpected}</p>
                      </div>
                      <div>
                        <p>Submissions</p>
                        <p className="font-medium text-foreground">{s.submittedCount} / {s.totalDepartments}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Team Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Team Breakdown</CardTitle>
                  <CardDescription>Week of {weeklyReport.weekStart} — {weeklyReport.weekEnd}</CardDescription>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {weeklyReport.teams && weeklyReport.teams.length > 0 ? (
                <div className="rounded-md border">
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
                        const avg = count > 0 ? Math.round((wedPct + sunPct) / count) : 0;
                        return (
                          <TableRow key={team.teamName}>
                            <TableCell className="font-medium">{team.teamName}</TableCell>
                            <TableCell className="text-center">
                              {team.totals.wednesday ? (
                                <div className="flex flex-col items-center">
                                  <span className="font-medium">{team.totals.wednesday.percentage}%</span>
                                  <span className="text-[11px] text-muted-foreground">{team.totals.wednesday.present}/{team.totals.wednesday.expected}</span>
                                </div>
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              {team.totals.sunday ? (
                                <div className="flex flex-col items-center">
                                  <span className="font-medium">{team.totals.sunday.percentage}%</span>
                                  <span className="text-[11px] text-muted-foreground">{team.totals.sunday.present}/{team.totals.sunday.expected}</span>
                                </div>
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`font-bold ${avg >= 80 ? 'text-primary' : avg >= 60 ? 'text-warning' : 'text-destructive'}`}>
                                {avg}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No team data available for this period.</div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Quick Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />Full Report (CSV)
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />Summary (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
