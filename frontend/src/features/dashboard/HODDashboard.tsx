import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { HODDashboardData, SubmissionStatus } from 'shared';
import { Users, Calendar, CheckCircle2, Clock, AlertCircle, Building2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const statusConfig: Record<SubmissionStatus, { label: string; variant: 'success' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  [SubmissionStatus.NOT_STARTED]: { label: 'Not Started', variant: 'secondary', icon: Clock },
  [SubmissionStatus.SUBMITTED]: { label: 'Submitted', variant: 'success', icon: CheckCircle2 },
  [SubmissionStatus.NOT_SUBMITTED]: { label: 'Not Submitted', variant: 'destructive', icon: AlertCircle },
  [SubmissionStatus.LOCKED]: { label: 'Locked', variant: 'outline', icon: CheckCircle2 },
};

export function HODDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['hod-dashboard'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: HODDashboardData }>('/dashboard/hod');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
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

  const renderServiceCard = (
    title: string,
    record: typeof data.currentWeekRecords.wednesday
  ) => {
    if (!record) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>No record available yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The attendance record will be created on the service day.
            </p>
          </CardContent>
        </Card>
      );
    }

    const config = statusConfig[record.status];
    const StatusIcon = config.icon;
    const presentCount = record.entries?.filter((e) => e.isPresent).length || 0;
    const totalCount = record.entries?.length || data.memberCount;
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    return (
      <Card className="relative overflow-hidden">
        {record.status === SubmissionStatus.NOT_STARTED && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-warning" />
        )}
        {record.status === SubmissionStatus.SUBMITTED && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
        )}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge variant={config.variant}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>
          <CardDescription>{formatDate(record.serviceDate)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Attendance</span>
              <span className="font-bold text-lg">{percentage}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all animate-progress"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {presentCount} of {totalCount} members present
            </p>
          </div>

          {record.status === SubmissionStatus.SUBMITTED && record.submittedAt && (
            <p className="text-xs text-muted-foreground">
              Submitted: {formatDate(record.submittedAt)}
            </p>
          )}

          {record.notes && (
            <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 italic">
              {record.notes}
            </p>
          )}

          <Link to={`/attendance/${record.id}`}>
            <Button
              className="w-full"
              variant={record.status === SubmissionStatus.NOT_STARTED ? 'default' : 'outline'}
              size="sm"
            >
              {record.status === SubmissionStatus.NOT_STARTED
                ? 'Take Attendance'
                : record.status === SubmissionStatus.SUBMITTED
                ? 'View / Edit'
                : 'Submit Now'}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Department Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Department" value={data.department.name} icon={Building2} />
        <StatCard
          title="Team"
          value={data.department.team?.name || 'Unassigned'}
          icon={Users}
        />
        <StatCard
          title="Active Members"
          value={data.memberCount}
          icon={Users}
        />
      </div>

      {/* Current Week Attendance */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">This Week's Attendance</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {renderServiceCard('Wednesday Service', data.currentWeekRecords.wednesday)}
          {renderServiceCard('Sunday Service', data.currentWeekRecords.sunday)}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to="/members">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </Button>
            </Link>
            <Link to="/attendance">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                View History
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
