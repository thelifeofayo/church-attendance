import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import api, { getErrorMessage } from '@/lib/api';
import { Broadcast, BroadcastWithCreator, PaginatedResponse, Team } from 'shared';
import { Plus, Send, Trash2, Mail, Users, Filter } from 'lucide-react';
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

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sending: 'bg-blue-100 text-blue-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export function BroadcastsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [confirmSendId, setConfirmSendId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [formData, setFormData] = React.useState<BroadcastFormData>({
    subject: '',
    body: '',
    recipientType: 'all',
    teamIds: [],
  });
  const [error, setError] = React.useState<string | null>(null);

  const isTeamHead = user?.role === 'TEAM_HEAD';

  // Fetch broadcasts
  const { data: broadcastsData, isLoading, error: queryError } = useQuery({
    queryKey: ['broadcasts', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      const response = await api.get<PaginatedResponse<BroadcastWithCreator>>(`/broadcasts?${params}`);
      return response.data;
    },
  });

  // Fetch teams for custom recipient selection
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Team[] }>('/teams');
      return response.data.data;
    },
    enabled: formData.recipientType === 'custom' && !isTeamHead,
  });

  const createMutation = useMutation({
    mutationFn: async (data: BroadcastFormData) => {
      const response = await api.post<{ success: boolean; data: Broadcast }>('/broadcasts', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<{ success: boolean; data: Broadcast }>(`/broadcasts/${id}/send`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      setConfirmSendId(null);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
      setConfirmSendId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/broadcasts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      setConfirmDeleteId(null);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
      setConfirmDeleteId(null);
    },
  });

  const resetForm = () => {
    setFormData({
      subject: '',
      body: '',
      recipientType: isTeamHead ? 'members' : 'all',
      teamIds: [],
    });
    setError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate(formData);
  };

  const getRecipientTypeLabel = (type: string): string => {
    const option = RECIPIENT_TYPE_OPTIONS.find((o) => o.value === type);
    return option?.label || type;
  };

  // Filter recipient options for Team Heads
  const availableRecipientTypes = isTeamHead
    ? RECIPIENT_TYPE_OPTIONS.filter((o) => ['members', 'hods'].includes(o.value))
    : RECIPIENT_TYPE_OPTIONS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <p className="font-medium">Failed to load broadcasts</p>
              <p className="text-sm mt-2">{getErrorMessage(queryError)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const broadcasts = broadcastsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Broadcast Emails</h1>
          <p className="text-muted-foreground">
            Send announcements and updates to {isTeamHead ? 'your team' : 'platform users'}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Broadcast
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Broadcast</DialogTitle>
              <DialogDescription>
                Compose an email to send to selected recipients. Use {'{{firstName}}'} and {'{{lastName}}'} as placeholders.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="recipientType">Recipients</Label>
                  <Select
                    value={formData.recipientType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, recipientType: value, teamIds: [] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRecipientTypes.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.recipientType === 'custom' && !isTeamHead && teams && (
                  <div className="space-y-2">
                    <Label>Select Teams</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                      {teams.map((team) => (
                        <label key={team.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.teamIds.includes(team.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((prev) => ({ ...prev, teamIds: [...prev.teamIds, team.id] }));
                              } else {
                                setFormData((prev) => ({ ...prev, teamIds: prev.teamIds.filter((id) => id !== team.id) }));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{team.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Church Service Announcement"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <RichTextEditor
                    value={formData.body}
                    onChange={(html) => setFormData((prev) => ({ ...prev, body: html }))}
                    placeholder="Dear {{firstName}}, start typing your message..."
                    minHeight="200px"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Draft'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            How Broadcasts Work
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Create a draft broadcast with your message and select recipients.</p>
          <p>2. Review your draft, then click "Send" to deliver emails to all recipients.</p>
          <p>3. Use <Badge variant="outline">{'{{firstName}}'}</Badge> and <Badge variant="outline">{'{{lastName}}'}</Badge> placeholders for personalization.</p>
          {isTeamHead && (
            <p className="text-amber-600">Note: As a Team Head, you can only send to members and HODs in your team.</p>
          )}
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by status:</span>
        </div>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Broadcasts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Broadcasts
          </CardTitle>
          <CardDescription>
            {broadcasts.length} broadcast{broadcasts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {broadcasts.length > 0 ? (
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
                {broadcasts.map((broadcast) => (
                  <TableRow key={broadcast.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {broadcast.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRecipientTypeLabel(broadcast.recipientType)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[broadcast.status] || ''}>
                        {broadcast.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {broadcast.status === 'sent' || broadcast.status === 'failed' ? (
                        <span>
                          <span className="text-green-600">{broadcast.sentCount}</span>
                          {' / '}
                          <span className="text-red-600">{broadcast.failedCount}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {broadcast.createdBy?.firstName} {broadcast.createdBy?.lastName}
                    </TableCell>
                    <TableCell>
                      {broadcast.sentAt
                        ? formatDateTime(broadcast.sentAt)
                        : formatDateTime(broadcast.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {broadcast.status === 'draft' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmSendId(broadcast.id)}
                            title="Send"
                          >
                            <Send className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(broadcast.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No broadcasts found. Create one to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={!!confirmSendId} onOpenChange={() => setConfirmSendId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Broadcast?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send the email to all selected recipients. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmSendId && sendMutation.mutate(confirmSendId)}
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending ? 'Sending...' : 'Send Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft broadcast? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Global Error Display */}
      {error && !isCreateDialogOpen && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="mt-2">
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
