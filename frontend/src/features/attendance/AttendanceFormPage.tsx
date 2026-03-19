import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', id],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: AttendanceRecordWithRelations }>(`/attendance/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const { data: departmentMembers } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Member[] }>('/members');
      return response.data.data.filter(m => m.isActive);
    },
    enabled: !!data && (!data.entries || data.entries.length === 0),
  });

  React.useEffect(() => {
    if (data?.entries && data.entries.length > 0) {
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
      await api.post(`/attendance/${id}/submit`, {
        entries,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['hod-dashboard'] });
      toast.success('Attendance submitted successfully');
      navigate('/dashboard');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
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
      toast.success('Attendance updated successfully');
      navigate('/dashboard');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const needsMembers = data && (!data.entries || data.entries.length === 0);
  const isLoadingMembers = needsMembers && !departmentMembers;

  if (isLoading || isLoadingMembers) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-destructive p-8">
        Attendance record not found
      </div>
    );
  }

  const members: Member[] = (data.entries && data.entries.length > 0)
    ? data.entries.map((e) => e.member).filter((m): m is Member => !!m)
    : (departmentMembers || []);

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const totalCount = members.length;
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const isSubmitted = data.status === SubmissionStatus.SUBMITTED;
  const isLocked = data.isLocked;
  const canEdit = !isLocked;
  const hasChanges = Object.keys(attendance).length > 0;

  const toggleMember = (memberId: string) => {
    if (!canEdit) return;
    const newValue = !attendance[memberId];
    setAttendance((prev) => ({ ...prev, [memberId]: newValue }));
    if (!newValue) {
      setExpandedMembers((prev) => ({ ...prev, [memberId]: true }));
    }
  };

  const handleSubmit = () => {
    if (isSubmitted) {
      updateMutation.mutate();
    } else {
      submitMutation.mutate();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg capitalize">
                {data.serviceType.toLowerCase()} Attendance
              </CardTitle>
              <CardDescription>
                {data.department?.name} — {formatDateWithDay(data.serviceDate)}
              </CardDescription>
            </div>
            <Badge
              variant={
                data.status === SubmissionStatus.SUBMITTED ? 'success'
                  : data.status === SubmissionStatus.LOCKED ? 'outline'
                  : 'secondary'
              }
            >
              {data.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Attendance</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{presentCount}/{totalCount}</span>
              <span className="text-sm text-muted-foreground ml-2">({percentage}%)</span>
            </div>
          </div>

          {/* Member list */}
          <div className="space-y-1.5">
            {members.map((member) => {
              const isPresent = attendance[member.id];
              const isExpanded = expandedMembers[member.id];

              return (
                <div
                  key={member.id}
                  className={`rounded-lg border transition-all ${
                    isPresent
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-card border-border'
                  } ${!canEdit ? 'opacity-50' : ''}`}
                >
                  <div
                    className={`flex items-center justify-between p-3 ${
                      canEdit ? 'cursor-pointer hover:bg-accent/50' : 'cursor-not-allowed'
                    } rounded-lg transition-colors`}
                    onClick={() => toggleMember(member.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          isPresent
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {isPresent ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          member.firstName[0]
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-sm">
                          {member.firstName} {member.lastName}
                        </span>
                        {!isPresent && absenceReasons[member.id] && (
                          <p className="text-[11px] text-muted-foreground">
                            Reason: {absenceReasons[member.id]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isPresent && canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedMembers((prev) => ({ ...prev, [member.id]: !prev[member.id] }));
                          }}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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

                  {!isPresent && isExpanded && canEdit && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="ml-11">
                        <Input
                          placeholder="Reason for absence (optional)"
                          value={absenceReasons[member.id] || ''}
                          onChange={(e) => setAbsenceReasons((prev) => ({ ...prev, [member.id]: e.target.value }))}
                          maxLength={200}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm h-8"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Add any notes about this service..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={300}
              disabled={!canEdit}
            />
            <p className="text-[11px] text-muted-foreground">{notes.length}/300 characters</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!canEdit || !hasChanges || submitMutation.isPending || updateMutation.isPending}
            >
              {submitMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isSubmitted ? 'Update Attendance' : 'Submit Attendance'}
            </Button>
          </div>

          {isLocked && (
            <p className="text-xs text-muted-foreground text-center">
              This record is locked. Contact the Ministry Team for corrections.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
