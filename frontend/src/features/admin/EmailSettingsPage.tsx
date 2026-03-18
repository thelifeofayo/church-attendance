import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
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
import api, { getErrorMessage } from '@/lib/api';
import { EmailTemplate, EmailLog, PaginatedResponse } from 'shared';
import { Plus, Pencil, Trash2, Mail, Eye, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
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
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<EmailTemplate | null>(null);
  const [formData, setFormData] = React.useState<EmailTemplateFormData>({
    name: '',
    subject: '',
    body: '',
  });
  const [error, setError] = React.useState<string | null>(null);
  const [logStatusFilter, setLogStatusFilter] = React.useState<string>('all');

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: EmailTemplate[] }>('/email-templates');
      return response.data.data;
    },
  });

  const { data: emailLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['email-logs', logStatusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '100' });
      if (logStatusFilter && logStatusFilter !== 'all') {
        params.set('status', logStatusFilter);
      }
      const response = await api.get<PaginatedResponse<EmailLog>>(`/email-templates/logs/list?${params}`);
      return response.data;
    },
    enabled: activeTab === 'logs',
  });

  const { data: emailStats } = useQuery({
    queryKey: ['email-stats'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: { sent: number; failed: number; pending: number; total: number } }>('/email-templates/logs/stats');
      return response.data.data;
    },
    enabled: activeTab === 'logs',
  });

  const createMutation = useMutation({
    mutationFn: async (data: EmailTemplateFormData) => {
      await api.post('/email-templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmailTemplateFormData> & { isActive?: boolean } }) => {
      await api.patch(`/email-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const resetForm = () => {
    setFormData({ name: '', subject: '', body: '' });
    setError(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setError(null);
    updateMutation.mutate({
      id: selectedTemplate.id,
      data: { subject: formData.subject, body: formData.body },
    });
  };

  const openEditDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
    });
    setError(null);
    setIsEditDialogOpen(true);
  };

  const openPreviewDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const toggleTemplateActive = (template: EmailTemplate) => {
    updateMutation.mutate({
      id: template.id,
      data: { isActive: !template.isActive },
    });
  };

  const interpolatePreview = (template: string): string => {
    return template
      .replace(/\{\{firstName\}\}/g, 'John')
      .replace(/\{\{lastName\}\}/g, 'Doe');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const isLoading = activeTab === 'templates' ? templatesLoading : logsLoading;

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
          <h1 className="text-2xl font-bold">Email Settings</h1>
          <p className="text-muted-foreground">Manage email templates and view delivery logs</p>
        </div>
        {activeTab === 'templates' && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Email Template</DialogTitle>
                <DialogDescription>
                  Create a new email template. Use {'{{firstName}}'} and {'{{lastName}}'} as placeholders.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit}>
                <div className="space-y-4 py-4">
                  {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., birthday_wishes, event_reminder"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Happy Birthday, {{firstName}}!"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Body</Label>
                    <RichTextEditor
                      value={formData.body}
                      onChange={(html) => setFormData((prev) => ({ ...prev, body: html }))}
                      placeholder="Start typing your email template..."
                      minHeight="250px"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Template'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Templates
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mail className="h-4 w-4 inline mr-2" />
          Email Logs
        </button>
      </div>

      {activeTab === 'templates' && (
        <>
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Available Placeholders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{'{{firstName}}'}</Badge>
                  <span className="text-sm text-muted-foreground">Recipient's first name</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{'{{lastName}}'}</Badge>
                  <span className="text-sm text-muted-foreground">Recipient's last name</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                {templates?.length || 0} templates configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates && templates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={template.isActive}
                              onCheckedChange={() => toggleTemplateActive(template)}
                            />
                            <span className="text-sm">
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(template.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPreviewDialog(template)}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(template)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {template.name !== 'birthday_wishes' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(template.id)}
                              disabled={deleteMutation.isPending}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No templates configured. The default birthday template will be created automatically.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'logs' && (
        <>
          {/* Stats Cards */}
          {emailStats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{emailStats.sent}</div>
                  <p className="text-sm text-muted-foreground">Emails Sent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{emailStats.failed}</div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">{emailStats.pending}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{emailStats.total}</div>
                  <p className="text-sm text-muted-foreground">Total</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filter */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Filter by status:</span>
            <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Email Delivery Logs</CardTitle>
              <CardDescription>
                Track all sent emails including birthday wishes and broadcasts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailLogs?.data && emailLogs.data.length > 0 ? (
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
                          <div>
                            <div className="font-medium">{log.recipientName}</div>
                            <div className="text-sm text-muted-foreground">{log.recipientEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>{formatDateTime(log.sentAt)}</TableCell>
                        <TableCell className="max-w-xs truncate text-red-500">
                          {log.errorMessage || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No email logs found. Emails will appear here once sent.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Update the email template. Use {'{{firstName}}'} and {'{{lastName}}'} as placeholders.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="editSubject">Email Subject</Label>
                <Input
                  id="editSubject"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email Body</Label>
                <RichTextEditor
                  value={formData.body}
                  onChange={(html) => setFormData((prev) => ({ ...prev, body: html }))}
                  placeholder="Edit your email template..."
                  minHeight="250px"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Subject: {selectedTemplate ? interpolatePreview(selectedTemplate.subject) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            {selectedTemplate && (
              <div
                dangerouslySetInnerHTML={{
                  __html: interpolatePreview(selectedTemplate.body),
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
