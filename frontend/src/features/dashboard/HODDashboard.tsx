import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { HODDashboardData, SubmissionStatus } from 'shared';
import { Users, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const statusConfig = {
  [SubmissionStatus.NOT_STARTED]: { label: 'Not Started', variant: 'secondary' as const, icon: Clock },
  [SubmissionStatus.SUBMITTED]: { label: 'Submitted', variant: 'success' as const, icon: CheckCircle2 },
  [SubmissionStatus.NOT_SUBMITTED]: { label: 'Not Submitted', variant: 'destructive' as const, icon: AlertCircle },
  [SubmissionStatus.LOCKED]: { label: 'Locked', variant: 'outline' as const, icon: CheckCircle2 },
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

  const renderServiceCard = (
    title: string,
    record: typeof data.currentWeekRecords.wednesday
  ) => {
    if (!record) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
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

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant={config.variant}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>
          <CardDescription>{formatDate(record.serviceDate)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Attendance</span>
              <span className="font-medium">
                {presentCount} / {totalCount} ({totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%)
              </span>
            </div>

            {record.status === SubmissionStatus.SUBMITTED && record.submittedAt && (
              <p className="text-xs text-muted-foreground">
                Submitted: {formatDate(record.submittedAt)}
              </p>
            )}

            {record.notes && (
              <p className="text-sm text-muted-foreground border-l-2 pl-2">
                {record.notes}
              </p>
            )}

            <Link to={`/attendance/${record.id}`}>
              <Button
                className="w-full"
                variant={
                  record.status === SubmissionStatus.NOT_STARTED
                    ? 'default'
                    : 'outline'
                }
              >
                {record.status === SubmissionStatus.NOT_STARTED
                  ? 'Take Attendance'
                  : record.status === SubmissionStatus.SUBMITTED
                  ? 'View / Edit'
                  : 'Submit Now'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Department Info */}
      <Card>
        <CardHeader>
          <CardTitle>{data.department.name}</CardTitle>
          <CardDescription>
            {data.department.team?.name || 'No team assigned'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{data.memberCount} active members</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Week Attendance */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          This Week's Attendance
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {renderServiceCard('Wednesday Service', data.currentWeekRecords.wednesday)}
          {renderServiceCard('Sunday Service', data.currentWeekRecords.sunday)}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link to="/members">
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Manage Members
          </Button>
        </Link>
        <Link to="/attendance">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            View History
          </Button>
        </Link>
      </div>
    </div>
  );
}
