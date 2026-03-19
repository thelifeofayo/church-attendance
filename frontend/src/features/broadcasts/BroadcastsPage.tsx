import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import api, { getErrorMessage } from '@/lib/api';
import { Broadcast, BroadcastWithCreator, PaginatedResponse, Team } from 'shared';
import { Plus, Send, Trash2, Mail, Filter, Megaphone } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface BroadcastFormData {
  subject: string;
  body: string;
  recipientType: string;
  teamIds: string[];
}

const RECIPIENT_TYPE_OPTIONS = [
  { value: 'all', label: 'Everyone', description: 'All users and members with email' },
  { value: 'admins', label: 'Admins Only', description: 'System administrators' },
  { value: 'team_heads', label: 'Team Heads', description: 'All team heads' },
  { value: 'hods', label: 'HODs', description: 'Heads of departments' },
  { value: 'members', label: 'Members', description: 'All department members' },
  { value: 'custom', label: 'Custom (Select Teams)', description: 'HODs and members in selected teams' },
];

const statusBadgeVariant: Record<string, 'secondary' | 'outline' | 'success' | 'destructive'> = {
  draft: 'secondary',
  sending: 'outline',
  sent: 'success',
  failed: 'destructive',
};

export function BroadcastsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [confirmSendId, setConfirmSendId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [formData, setFormData] = React.useState<BroadcastFormData>({
    subject: '', body: '', recipientType: 'all', teamIds: [],
  });
  const [formError, setFormError] = React.useState<string | null>(null);

  const isTeamHead = user?.role === 'TEAM_HEAD';

  const { data: broadcastsData, isLoading } = useQuery({
    queryKey: ['broadcasts', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<PaginatedResponse<BroadcastWithCreator>>(`/broadcasts?${params}`);
      return res.data;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Team[] }>('/teams');
      return res.data.data;
    },
    enabled: formData.recipientType === 'custom' && !isTeamHead,
  });

  const resetForm = () => {
    setFormData({ subject: '', body: '', recipientType: isTeamHead ? 'members' : 'all', teamIds: [] });
    setFormError(null);
  };

  const createMutation = useMutation({
    mutationFn: async (data: BroadcastFormData) => {
      const res = await api.post<{ success: boolean; data: Broadcast }>('/broadcasts', data);
      return res.data.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['broadcasts'] }); setCreateOpen(false); resetForm(); toast.success('Broadcast created as draft'); },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/broadcasts/${id}/send`);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['broadcasts'] }); setConfirmSendId(null); toast.success('Broadcast sent'); },
    onError: (err) => { setConfirmSendId(null); toast.error(getErrorMessage(err)); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/broadcasts/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['broadcasts'] }); setConfirmDeleteId(null); toast.success('Draft deleted'); },
    onError: (err) => { setConfirmDeleteId(null); toast.error(getErrorMessage(err)); },
  });

  const getRecipientLabel = (type: string) => RECIPIENT_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
  const availableRecipientTypes = isTeamHead
    ? RECIPIENT_TYPE_OPTIONS.filter((o) => ['members', 'hods'].includes(o.value))
    : RECIPIENT_TYPE_OPTIONS;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const broadcasts = broadcastsData?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcast Emails"
        description={`Send announcements and updates to ${isTeamHead ? 'your team' : 'platform users'}`}
        action={<Button size="sm" onClick={() => { resetForm(); setCreateOpen(true); }}><Plus className="h-4 w-4 mr-2" />New Broadcast</Button>}
      />

      {/* How it works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />How Broadcasts Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>1. Create a draft broadcast with your message and select recipients.</p>
          <p>2. Review your draft, then click Send to deliver emails to all recipients.</p>
          <p>3. Use <Badge variant="outline" className="text-xs">{'{{firstName}}'}</Badge> and <Badge variant="outline" className="text-xs">{'{{lastName}}'}</Badge> for personalization.</p>
          {isTeamHead && <p className="text-warning">Note: As a Team Head, you can only send to members and HODs in your team.</p>}
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium">Status:</span>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Broadcasts</CardTitle>
          <CardDescription>{broadcasts.length} broadcast{broadcasts.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          {broadcasts.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent/Failed</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {broadcasts.map((b) => (
                    <TableRow key={b.id} className="group">
                      <TableCell className="font-medium max-w-[200px] truncate">{b.subject}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{getRecipientLabel(b.recipientType)}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[b.status] || 'secondary'} className="capitalize text-xs">
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {b.status === 'sent' || b.status === 'failed' ? (
                          <span className="text-xs">
                            <span className="text-primary">{b.sentCount}</span> / <span className="text-destructive">{b.failedCount}</span>
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{b.createdBy?.firstName} {b.createdBy?.lastName}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDateTime(b.sentAt || b.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {b.status === 'draft' && (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setConfirmSendId(b.id)}>
                              <Send className="h-3.5 w-3.5 text-info" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setConfirmDeleteId(b.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={Megaphone}
              title="No broadcasts yet"
              description="Create one to get started."
              action={<Button size="sm" onClick={() => { resetForm(); setCreateOpen(true); }}><Plus className="h-4 w-4 mr-2" />New Broadcast</Button>}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Broadcast</DialogTitle>
            <DialogDescription>
              Compose an email to send to selected recipients. Use {'{{firstName}}'} and {'{{lastName}}'} as placeholders.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setFormError(null); createMutation.mutate(formData); }}>
            <div className="space-y-4 py-2">
              {formError && <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">{formError}</div>}
              <div className="space-y-2">
                <Label>Recipients</Label>
                <Select value={formData.recipientType} onValueChange={(v) => setFormData((f) => ({ ...f, recipientType: v, teamIds: [] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableRecipientTypes.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <div className="flex flex-col"><span>{o.label}</span><span className="text-xs text-muted-foreground">{o.description}</span></div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.recipientType === 'custom' && !isTeamHead && teams && (
                <div className="space-y-2">
                  <Label>Select Teams</Label>
                  <div className="border border-border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {teams.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="checkbox" checked={formData.teamIds.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) setFormData((f) => ({ ...f, teamIds: [...f.teamIds, t.id] }));
                            else setFormData((f) => ({ ...f, teamIds: f.teamIds.filter((id) => id !== t.id) }));
                          }} className="rounded" />
                        {t.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={formData.subject} onChange={(e) => setFormData((f) => ({ ...f, subject: e.target.value }))} placeholder="Church Service Announcement" required />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <RichTextEditor value={formData.body} onChange={(html) => setFormData((f) => ({ ...f, body: html }))} placeholder="Dear {{firstName}}, start typing..." minHeight="200px" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Draft'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation */}
      <AlertDialog open={!!confirmSendId} onOpenChange={() => setConfirmSendId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Broadcast?</AlertDialogTitle>
            <AlertDialogDescription>This will send the email to all selected recipients. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmSendId && sendMutation.mutate(confirmSendId)} disabled={sendMutation.isPending}>
              {sendMutation.isPending ? 'Sending...' : 'Send Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this draft? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
