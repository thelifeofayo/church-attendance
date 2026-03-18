import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import api from '@/lib/api';
import { AttendanceRecordWithRelations, SubmissionStatus, ServiceType } from 'shared';
import { formatDate } from '@/lib/utils';
import { Calendar, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const statusBadge = (status: SubmissionStatus) => {
  switch (status) {
    case SubmissionStatus.SUBMITTED:
      return <Badge variant="success">Submitted</Badge>;
    case SubmissionStatus.NOT_STARTED:
      return <Badge variant="secondary">Not Started</Badge>;
    case SubmissionStatus.NOT_SUBMITTED:
      return <Badge variant="destructive">Not Submitted</Badge>;
    case SubmissionStatus.LOCKED:
      return <Badge variant="outline">Locked</Badge>;
    default:
      return <Badge variant="secondary">-</Badge>;
  }
};

const serviceTypeBadge = (type: ServiceType) => {
  return (
    <Badge variant={type === ServiceType.WEDNESDAY ? 'default' : 'secondary'}>
      {type === ServiceType.WEDNESDAY ? 'Wednesday' : 'Sunday'}
    </Badge>
  );
};

export function AttendanceListPage() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [serviceTypeFilter, setServiceTypeFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-list', currentPage, serviceTypeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (serviceTypeFilter !== 'all') {
        params.append('serviceType', serviceTypeFilter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await api.get<{
        success: boolean;
        data: AttendanceRecordWithRelations[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>(`/attendance?${params.toString()}`);
      return response.data;
    },
  });

  const records = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

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
          <h1 className="text-2xl font-bold">Attendance History</h1>
          <p className="text-muted-foreground">View and manage attendance records</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Type</label>
              <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value={ServiceType.WEDNESDAY}>Wednesday</SelectItem>
                  <SelectItem value={ServiceType.SUNDAY}>Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
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

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                {data?.meta?.total || 0} total records
              </CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <>
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

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {formatDate(record.serviceDate)}
                        </TableCell>
                        <TableCell>{serviceTypeBadge(record.serviceType)}</TableCell>
                        <TableCell>{record.department?.name || '-'}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{presentCount}/{totalCount}</span>
                          <span className="text-muted-foreground ml-1">({percentage}%)</span>
                        </TableCell>
                        <TableCell>{statusBadge(record.status)}</TableCell>
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

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center space-x-2">
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
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
