import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import api, { getErrorMessage } from '@/lib/api';
import { EmailTemplate, EmailLog, PaginatedResponse } from 'shared';
import { Plus, Pencil, Trash2, Mail, Eye, CheckCircle, XCircle, Clock, FileText, Send } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface EmailTemplateFormData {
  name: string;
  subject: string;
  body: string;
}

type TabType = 'templates' | 'logs';

export function EmailSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<TabType>('templates');
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<EmailTemplate | null>(null);
  const [form, setForm] = React.useState<EmailTemplateFormData>({ name: '', subject: '', body: '' });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [logFilter, setLogFilter] = React.useState('all');

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: EmailTemplate[] }>('/email-templates');
      return res.data.data;
    },
  });

  const { data: emailLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['email-logs', logFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '100' });
      if (logFilter && logFilter !== 'all') params.set('status', logFilter);
      const res = await api.get<PaginatedResponse<EmailLog>>(`/email-templates/logs/list?${params}`);
      return res.data;
    },
    enabled: activeTab === 'logs',
  });

  const { data: emailStats } = useQuery({
    queryKey: ['email-stats'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: { sent: number; failed: number; pending: number; total: number } }>('/email-templates/logs/stats');
      return res.data.data;
    },
    enabled: activeTab === 'logs',
  });

  const createMutation = useMutation({
    mutationFn: async (data: EmailTemplateFormData) => { await api.post('/email-templates', data); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['email-templates'] }); setAddOpen(false); toast.success('Template created'); },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmailTemplateFormData> & { isActive?: boolean } }) => {
      await api.patch(`/email-templates/${id}`, data);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['email-templates'] }); setEditOpen(false); toast.success('Template updated'); },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/email-templates/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['email-templates'] }); toast.success('Template deleted'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const resetForm = () => { setForm({ name: '', subject: '', body: '' }); setFormError(null); };

  const openEdit = (t: EmailTemplate) => {
    setSelected(t);
    setForm({ name: t.name, subject: t.subject, body: t.body });
    setFormError(null);
    setEditOpen(true);
  };

  const interpolatePreview = (s: string) => s.replace(/\{\{firstName\}\}/g, 'John').replace(/\{\{lastName\}\}/g, 'Doe');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent': return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'failed': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending': return <Badge variant="outline" className="border-warning/30 text-warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const isLoading = activeTab === 'templates' ? templatesLoading : logsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Settings"
        description="Manage email templates and view delivery logs"
        action={activeTab === 'templates' ? (
          <Button size="sm" onClick={() => { resetForm(); setAddOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Template</Button>
        ) : undefined}
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['templates', 'logs'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'templates' ? <><FileText className="h-4 w-4 inline mr-1.5" />Templates</> : <><Mail className="h-4 w-4 inline mr-1.5" />Email Logs</>}
          </button>
        ))}
      </div>

      {activeTab === 'templates' && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />Available Placeholders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">{'{{firstName}}'}</Badge><span className="text-xs text-muted-foreground">First name</span></div>
                <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">{'{{lastName}}'}</Badge><span className="text-xs text-muted-foreground">Last name</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Email Templates</CardTitle>
              <CardDescription>{templates?.length || 0} templates configured</CardDescription>
            </CardHeader>
            <CardContent>
              {templates && templates.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((t) => (
                        <TableRow key={t.id} className="group">
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">{t.subject}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch checked={t.isActive} onCheckedChange={() => updateMutation.mutate({ id: t.id, data: { isActive: !t.isActive } })} />
                              <span className="text-xs">{t.isActive ? 'Active' : 'Off'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDateTime(t.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setSelected(t); setPreviewOpen(true); }}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(t)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {t.name !== 'birthday_wishes' && (
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteMutation.mutate(t.id)} disabled={deleteMutation.isPending}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No templates configured. The default birthday template will be created automatically.</div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'logs' && (
        <>
          {emailStats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Sent" value={emailStats.sent} icon={CheckCircle} />
              <StatCard title="Failed" value={emailStats.failed} icon={XCircle} />
              <StatCard title="Pending" value={emailStats.pending} icon={Clock} />
              <StatCard title="Total" value={emailStats.total} icon={Send} />
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium">Status:</span>
            <Select value={logFilter} onValueChange={setLogFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Email Delivery Logs</CardTitle>
              <CardDescription>Track all sent emails including birthday wishes and broadcasts</CardDescription>
            </CardHeader>
            <CardContent>
              {emailLogs?.data && emailLogs.data.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailLogs.data.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{log.recipientName}</div>
                            <div className="text-xs text-muted-foreground">{log.recipientEmail}</div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">{log.subject}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDateTime(log.sentAt)}</TableCell>
                          <TableCell className="max-w-[150px] truncate text-xs text-destructive">{log.errorMessage || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No email logs found.</div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Template */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>Use {'{{firstName}}'} and {'{{lastName}}'} as placeholders.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setFormError(null); createMutation.mutate(form); }}>
            <div className="space-y-4 py-2">
              {formError && <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">{formError}</div>}
              <div className="space-y-2"><Label>Template Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., birthday_wishes" required /></div>
              <div className="space-y-2"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Happy Birthday, {{firstName}}!" required /></div>
              <div className="space-y-2"><Label>Body</Label><RichTextEditor value={form.body} onChange={(html) => setForm((f) => ({ ...f, body: html }))} placeholder="Start typing..." minHeight="250px" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create Template'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Template */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit: {selected?.name}</DialogTitle>
            <DialogDescription>Use {'{{firstName}}'} and {'{{lastName}}'} as placeholders.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (selected) updateMutation.mutate({ id: selected.id, data: { subject: form.subject, body: form.body } }); }}>
            <div className="space-y-4 py-2">
              {formError && <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">{formError}</div>}
              <div className="space-y-2"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Body</Label><RichTextEditor value={form.body} onChange={(html) => setForm((f) => ({ ...f, body: html }))} placeholder="Edit..." minHeight="250px" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview: {selected?.name}</DialogTitle>
            <DialogDescription>Subject: {selected ? interpolatePreview(selected.subject) : ''}</DialogDescription>
          </DialogHeader>
          <div className="border border-border rounded-lg p-4 bg-card">
            {selected && <div dangerouslySetInnerHTML={{ __html: interpolatePreview(selected.body) }} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
