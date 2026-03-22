import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import api, { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { AttendanceRecordWithRelations, SubmissionStatus, ServiceType, Role } from 'shared';
import { formatDate } from '@/lib/utils';
import {
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Zap,
  CalendarPlus,
  ClipboardList,
} from 'lucide-react';

const statusConfig: Record<SubmissionStatus, { label: string; variant: 'success' | 'secondary' | 'destructive' | 'outline' }> = {
  [SubmissionStatus.SUBMITTED]: { label: 'Submitted', variant: 'success' },
  [SubmissionStatus.NOT_STARTED]: { label: 'Not Started', variant: 'secondary' },
  [SubmissionStatus.NOT_SUBMITTED]: { label: 'Not Submitted', variant: 'destructive' },
  [SubmissionStatus.LOCKED]: { label: 'Locked', variant: 'outline' },
};

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTriggerDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function AttendanceListPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === Role.ADMIN;

  const [currentPage, setCurrentPage] = React.useState(1);
  const [serviceTypeFilter, setServiceTypeFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const pageSize = 10;

  // Trigger dialog state
  const [triggerOpen, setTriggerOpen] = React.useState(false);
  const [triggerServiceType, setTriggerServiceType] = React.useState<string>('WEDNESDAY');
  const [triggerDate, setTriggerDate] = React.useState<string>(toLocalDateString(new Date()));

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-list', currentPage, serviceTypeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      if (serviceTypeFilter !== 'all') params.append('serviceType', serviceTypeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await api.get<{
        success: boolean;
        data: AttendanceRecordWithRelations[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>(`/attendance?${params.toString()}`);
      return response.data;
    },
  });

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ success: boolean; data: { created: number }; message?: string }>(
        '/attendance/trigger-creation',
        { serviceType: triggerServiceType, serviceDate: triggerDate }
      );
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || `Created ${res.data.created} attendance records`);
      setTriggerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['attendance-list'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const records = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="View and manage attendance records"
        action={isAdmin ? (
          <Button size="sm" onClick={() => setTriggerOpen(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Trigger Attendance
          </Button>
        ) : undefined}
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Service Type</label>
              <Select value={serviceTypeFilter} onValueChange={(v) => { setServiceTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value={ServiceType.WEDNESDAY}>Wednesday</SelectItem>
                  <SelectItem value={ServiceType.SUNDAY}>Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={SubmissionStatus.SUBMITTED}>Submitted</SelectItem>
                  <SelectItem value={SubmissionStatus.NOT_STARTED}>Not Started</SelectItem>
                  <SelectItem value={SubmissionStatus.NOT_SUBMITTED}>Not Submitted</SelectItem>
                  <SelectItem value={SubmissionStatus.LOCKED}>Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records */}
      {records.length > 0 ? (
        <>
          {/* Mobile card list */}
          <div className="space-y-3 lg:hidden">
            {records.map((record) => {
              const presentCount = record.entries?.filter((e) => e.isPresent).length || 0;
              const totalCount = record.entries?.length || 0;
              const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
              const sc = statusConfig[record.status] || { label: record.status, variant: 'secondary' as const };

              return (
                <Link key={record.id} to={`/attendance/${record.id}`}>
                  <Card className="active:scale-[0.99] transition-transform">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={record.serviceType === ServiceType.WEDNESDAY ? 'default' : 'secondary'} className="text-[10px]">
                              {record.serviceType === ServiceType.WEDNESDAY ? 'Wednesday' : 'Sunday'}
                            </Badge>
                            <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
                          </div>
                          <p className="font-medium text-sm">{formatDate(record.serviceDate)}</p>
                          {record.department?.name && (
                            <p className="text-xs text-muted-foreground truncate">{record.department.name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {totalCount > 0 && (
                            <div className="text-right">
                              <p className="text-sm font-semibold">{presentCount}/{totalCount}</p>
                              <p className="text-[11px] text-muted-foreground">{percentage}%</p>
                            </div>
                          )}
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Desktop table */}
          <Card className="hidden lg:block">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Attendance Records</CardTitle>
                  <CardDescription>{data?.meta?.total || 0} total records</CardDescription>
                </div>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md border mx-6 mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Attendance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => {
                      const presentCount = record.entries?.filter((e) => e.isPresent).length || 0;
                      const totalCount = record.entries?.length || 0;
                      const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
                      const sc = statusConfig[record.status] || { label: record.status, variant: 'secondary' as const };

                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{formatDate(record.serviceDate)}</TableCell>
                          <TableCell>
                            <Badge variant={record.serviceType === ServiceType.WEDNESDAY ? 'default' : 'secondary'}>
                              {record.serviceType === ServiceType.WEDNESDAY ? 'Wednesday' : 'Sunday'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{record.department?.name || '—'}</TableCell>
                          <TableCell className="text-center">
                            {totalCount > 0 ? (
                              <>
                                <span className="font-medium">{presentCount}/{totalCount}</span>
                                <span className="text-muted-foreground ml-1">({percentage}%)</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={sc.variant}>{sc.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/attendance/${record.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No attendance records"
          description={
            isAdmin
              ? 'No records match your filters. You can trigger attendance record creation using the button above.'
              : 'No records match your filters.'
          }
          action={isAdmin ? (
            <Button size="sm" onClick={() => setTriggerOpen(true)}>
              <Zap className="h-4 w-4 mr-2" />
              Trigger Attendance
            </Button>
          ) : undefined}
        />
      )}

      {/* Trigger Attendance Dialog */}
      <Dialog open={triggerOpen} onOpenChange={setTriggerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trigger Attendance Records</DialogTitle>
            <DialogDescription>
              Manually create attendance records for all active departments.
              Records that already exist will not be duplicated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={triggerServiceType} onValueChange={setTriggerServiceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEDNESDAY">Wednesday Service</SelectItem>
                  <SelectItem value="SUNDAY">Sunday Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service Date</Label>
              <Input
                type="date"
                value={triggerDate}
                onChange={(e) => setTriggerDate(e.target.value)}
              />
            </div>
            {triggerDate && (
              <div className="rounded-md bg-muted/50 border p-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">Creating records for: </span>
                  <span className="font-medium">
                    {triggerServiceType === 'WEDNESDAY' ? 'Wednesday' : 'Sunday'} Service — {formatTriggerDate(triggerDate)}
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriggerOpen(false)}>Cancel</Button>
            <Button
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending || !triggerDate}
            >
              {triggerMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4" />
                  Create Records
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
