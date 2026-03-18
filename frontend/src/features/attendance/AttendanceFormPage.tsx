import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api, { getErrorMessage } from '@/lib/api';
import { AttendanceRecordWithRelations, SubmissionStatus, Member } from 'shared';
import { formatDateWithDay } from '@/lib/utils';
import { CheckCircle2, Users, ArrowLeft, ChevronDown } from 'lucide-react';

export function AttendanceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [attendance, setAttendance] = React.useState<Record<string, boolean>>({});
  const [absenceReasons, setAbsenceReasons] = React.useState<Record<string, string>>({});
  const [expandedMembers, setExpandedMembers] = React.useState<Record<string, boolean>>({});
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', id],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: AttendanceRecordWithRelations }>(`/attendance/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Fetch department members for new attendance records
  const { data: departmentMembers } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Member[] }>('/members');
      return response.data.data.filter(m => m.isActive);
    },
    enabled: !!data && (!data.entries || data.entries.length === 0),
  });

  // Initialize attendance state when data loads
  React.useEffect(() => {
    if (data?.entries && data.entries.length > 0) {
      // Existing entries - populate from saved data
      const initialAttendance: Record<string, boolean> = {};
      const initialReasons: Record<string, string> = {};
      data.entries.forEach((entry) => {
        initialAttendance[entry.memberId] = entry.isPresent;
        if (entry.absenceReason) {
          initialReasons[entry.memberId] = entry.absenceReason;
        }
      });
      setAttendance(initialAttendance);
      setAbsenceReasons(initialReasons);
      setNotes(data.notes || '');
    } else if (departmentMembers && departmentMembers.length > 0) {
      // New record - initialize all members as absent (unchecked)
      const initialAttendance: Record<string, boolean> = {};
      departmentMembers.forEach((member) => {
        initialAttendance[member.id] = false;
      });
      setAttendance(initialAttendance);
    }
  }, [data, departmentMembers]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(attendance).map(([memberId, isPresent]) => {
        const entry: { memberId: string; isPresent: boolean; absenceReason?: string } = {
          memberId,
          isPresent,
        };
        if (!isPresent && absenceReasons[memberId]) {
          entry.absenceReason = absenceReasons[memberId];
        }
        return entry;
      });

      console.log('Submitting attendance:', { entries, notes }); // Debug log

      await api.post(`/attendance/${id}/submit`, {
        entries,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['hod-dashboard'] });
      navigate('/dashboard');
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(attendance).map(([memberId, isPresent]) => ({
        memberId,
        isPresent,
        absenceReason: !isPresent ? absenceReasons[memberId] || null : null,
      }));

      await api.patch(`/attendance/${id}`, {
        entries,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['hod-dashboard'] });
      navigate('/dashboard');
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  // Show loading while fetching attendance record or members (for new records)
  const needsMembers = data && (!data.entries || data.entries.length === 0);
  const isLoadingMembers = needsMembers && !departmentMembers;

  if (isLoading || isLoadingMembers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-red-500 p-4">
        Attendance record not found
      </div>
    );
  }

  // Use entries members if available, otherwise use department members
  const members: Member[] = (data.entries && data.entries.length > 0)
    ? data.entries.map((e) => e.member).filter((m): m is Member => !!m)
    : (departmentMembers || []);

  // Debug: Log members to see their IDs
  console.log('Members:', members.map(m => ({ id: m.id, name: `${m.firstName} ${m.lastName}` })));
  console.log('Attendance state:', attendance);
  const presentCount = Object.values(attendance).filter(Boolean).length;
  const totalCount = members.length;
  const isSubmitted = data.status === SubmissionStatus.SUBMITTED;
  const isLocked = data.isLocked;
  const canEdit = !isLocked;
  const hasChanges = Object.keys(attendance).length > 0;

  const toggleMember = (memberId: string) => {
    if (!canEdit) return;
    const newValue = !attendance[memberId];
    setAttendance((prev) => ({
      ...prev,
      [memberId]: newValue,
    }));
    // Auto-expand when marking absent
    if (!newValue) {
      setExpandedMembers((prev) => ({ ...prev, [memberId]: true }));
    }
  };

  const toggleExpanded = (memberId: string) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const setAbsenceReason = (memberId: string, reason: string) => {
    setAbsenceReasons((prev) => ({
      ...prev,
      [memberId]: reason,
    }));
  };

  const handleSubmit = () => {
    setError(null);
    if (isSubmitted) {
      updateMutation.mutate();
    } else {
      submitMutation.mutate();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {data.serviceType} Attendance
              </CardTitle>
              <CardDescription>
                {data.department?.name} - {formatDateWithDay(data.serviceDate)}
              </CardDescription>
            </div>
            <Badge
              variant={
                data.status === SubmissionStatus.SUBMITTED
                  ? 'success'
                  : data.status === SubmissionStatus.LOCKED
                  ? 'outline'
                  : 'secondary'
              }
            >
              {data.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Attendance</span>
            </div>
            <div className="text-lg font-semibold">
              {presentCount} / {totalCount}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* Member list */}
          <div className="space-y-2 mb-6">
            {members.map((member) => {
              const isPresent = attendance[member.id];
              const isExpanded = expandedMembers[member.id];

              return (
                <div
                  key={member.id}
                  className={`rounded-lg border transition-colors ${
                    isPresent
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white'
                  } ${!canEdit ? 'opacity-60' : ''}`}
                >
                  <div
                    className={`flex items-center justify-between p-3 cursor-pointer ${
                      canEdit ? 'hover:bg-gray-50' : 'cursor-not-allowed'
                    }`}
                    onClick={() => toggleMember(member.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isPresent
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isPresent ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-medium">
                            {member.firstName[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">
                          {member.firstName} {member.lastName}
                        </span>
                        {!isPresent && absenceReasons[member.id] && (
                          <p className="text-xs text-muted-foreground">
                            Reason: {absenceReasons[member.id]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!isPresent && canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(member.id);
                          }}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </Button>
                      )}
                      <Switch
                        checked={isPresent || false}
                        onCheckedChange={() => toggleMember(member.id)}
                        disabled={!canEdit}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Absence reason input - shown when absent and expanded */}
                  {!isPresent && isExpanded && canEdit && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="ml-11">
                        <Input
                          placeholder="Reason for absence (optional)"
                          value={absenceReasons[member.id] || ''}
                          onChange={(e) => setAbsenceReason(member.id, e.target.value)}
                          maxLength={200}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Add any notes about this service..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={300}
              disabled={!canEdit}
            />
            <p className="text-xs text-muted-foreground">{notes.length}/300 characters</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canEdit || !hasChanges || submitMutation.isPending || updateMutation.isPending}
            >
              {submitMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isSubmitted
                ? 'Update Attendance'
                : 'Submit Attendance'}
            </Button>
          </div>

          {/* Locked notice */}
          {isLocked && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              This attendance record is locked. Contact the Ministry Team for any corrections.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
