import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import api, { getErrorMessage } from '@/lib/api';
import { AdminDashboardData } from 'shared';
import { Users, Building2, FileBarChart, UserCog, CalendarPlus, Zap } from 'lucide-react';

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTriggerDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function AdminDashboard() {
  const [triggerOpen, setTriggerOpen] = React.useState(false);
  const [serviceType, setServiceType] = React.useState('WEDNESDAY');
  const [triggerDate, setTriggerDate] = React.useState(toLocalDateString(new Date()));

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: AdminDashboardData }>('/dashboard/admin');
      return res.data.data;
    },
  });

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ success: boolean; data: { created: number }; message?: string }>(
        '/attendance/trigger-creation',
        { serviceType, serviceDate: triggerDate }
      );
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || `Created ${res.data.created} attendance records`);
      setTriggerOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48" />)}
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Teams" value={data.totalTeams} icon={Building2} />
        <StatCard title="Total Departments" value={data.totalDepartments} icon={Users} />
        <StatCard title="Total Members" value={data.totalMembers} icon={UserCog} />
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
                  <span>{summary.submittedCount} submitted</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Performance</CardTitle>
          <CardDescription>Current week attendance by team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Team Head</TableHead>
                  <TableHead className="text-center">Depts</TableHead>
                  <TableHead className="text-center">Wed %</TableHead>
                  <TableHead className="text-center">Sun %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.teamBreakdown.map((team) => (
                  <TableRow key={team.team.id}>
                    <TableCell className="font-medium">{team.team.name}</TableCell>
                    <TableCell className="text-muted-foreground">{team.teamHeadName || '—'}</TableCell>
                    <TableCell className="text-center">{team.departmentCount}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-medium ${team.wednesday.percentage >= 80 ? 'text-primary' : team.wednesday.percentage >= 60 ? 'text-warning' : 'text-destructive'}`}>
                        {team.wednesday.percentage}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-medium ${team.sunday.percentage >= 80 ? 'text-primary' : team.sunday.percentage >= 60 ? 'text-warning' : 'text-destructive'}`}>
                        {team.sunday.percentage}%
                      </span>
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
            <Button variant="outline" size="sm" onClick={() => setTriggerOpen(true)}>
              <Zap className="h-4 w-4 mr-2" />Trigger Attendance
            </Button>
            <Link to="/teams"><Button variant="outline" size="sm"><Building2 className="h-4 w-4 mr-2" />Manage Teams</Button></Link>
            <Link to="/users"><Button variant="outline" size="sm"><UserCog className="h-4 w-4 mr-2" />Manage Users</Button></Link>
            <Link to="/reports"><Button variant="outline" size="sm"><FileBarChart className="h-4 w-4 mr-2" />Generate Reports</Button></Link>
          </div>
        </CardContent>
      </Card>

      {/* Trigger Attendance Dialog */}
      <Dialog open={triggerOpen} onOpenChange={setTriggerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trigger Attendance Records</DialogTitle>
            <DialogDescription>
              Manually create attendance records if the scheduled job didn't run. Duplicates won't be created.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEDNESDAY">Wednesday Service</SelectItem>
                  <SelectItem value="SUNDAY">Sunday Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service Date</Label>
              <Input type="date" value={triggerDate} onChange={(e) => setTriggerDate(e.target.value)} />
            </div>
            {triggerDate && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">Creating records for: </span>
                  <span className="font-medium text-primary">
                    {serviceType === 'WEDNESDAY' ? 'Wednesday' : 'Sunday'} Service — {formatTriggerDate(triggerDate)}
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriggerOpen(false)}>Cancel</Button>
            <Button onClick={() => triggerMutation.mutate()} disabled={triggerMutation.isPending || !triggerDate}>
              {triggerMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2"><CalendarPlus className="h-4 w-4" />Create Records</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
