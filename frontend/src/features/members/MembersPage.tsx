import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import api, { getErrorMessage } from '@/lib/api';
import { Member } from 'shared';
import { Plus, Pencil, Users, RotateCcw, Phone, Mail, Cake, UserX, Search } from 'lucide-react';

const NO_SELECTION = '__none__';
const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
  { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
  { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
];
const DAYS = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

interface MemberForm {
  firstName: string;
  lastName: string;
  birthMonth: string;
  birthDay: string;
  phoneNumber: string;
  email: string;
}

const emptyForm: MemberForm = { firstName: '', lastName: '', birthMonth: '', birthDay: '', phoneNumber: '', email: '' };

export function MembersPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Member | null>(null);
  const [form, setForm] = React.useState<MemberForm>(emptyForm);
  const [search, setSearch] = React.useState('');

  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Member[] }>('/members');
      return res.data.data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });
    queryClient.invalidateQueries({ queryKey: ['hod-dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/members', {
        firstName: form.firstName, lastName: form.lastName,
        birthMonth: form.birthMonth ? parseInt(form.birthMonth) : undefined,
        birthDay: form.birthDay ? parseInt(form.birthDay) : undefined,
        phoneNumber: form.phoneNumber, email: form.email,
      });
    },
    onSuccess: () => { invalidate(); setAddOpen(false); toast.success('Member added'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      await api.patch(`/members/${selected.id}`, {
        firstName: form.firstName, lastName: form.lastName,
        birthMonth: form.birthMonth ? parseInt(form.birthMonth) : null,
        birthDay: form.birthDay ? parseInt(form.birthDay) : null,
        phoneNumber: form.phoneNumber, email: form.email,
      });
    },
    onSuccess: () => { invalidate(); setEditOpen(false); toast.success('Member updated'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (selected) await api.delete(`/members/${selected.id}`); },
    onSuccess: () => { invalidate(); setDeleteOpen(false); setSelected(null); toast.success('Member deactivated'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => { await api.post(`/members/${id}/reactivate`); },
    onSuccess: () => { invalidate(); toast.success('Member reactivated'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  function openAdd() { setForm(emptyForm); setAddOpen(true); }
  function openEdit(m: Member) {
    setSelected(m);
    setForm({
      firstName: m.firstName, lastName: m.lastName,
      birthMonth: m.birthMonth?.toString() || '', birthDay: m.birthDay?.toString() || '',
      phoneNumber: m.phoneNumber || '', email: m.email || '',
    });
    setEditOpen(true);
  }

  const formatBirthday = (month: number | null, day: number | null) => {
    if (!month || !day) return '—';
    return `${MONTHS.find((m) => m.value === String(month))?.label || ''} ${day}`;
  };

  const activeCount = members?.filter((m) => m.isActive).length ?? 0;
  const inactiveCount = members?.filter((m) => !m.isActive).length ?? 0;

  const filtered = React.useMemo(() => {
    if (!members) return [];
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter((m) =>
      m.firstName.toLowerCase().includes(q) || m.lastName.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) || m.phoneNumber?.toLowerCase().includes(q)
    );
  }, [members, search]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const MemberFormFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Birthday (Optional)</Label>
        <div className="flex gap-2">
          <Select value={form.birthMonth || NO_SELECTION} onValueChange={(v) => setForm((f) => ({ ...f, birthMonth: v === NO_SELECTION ? '' : v }))}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Month" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SELECTION}>Not set</SelectItem>
              {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.birthDay || NO_SELECTION} onValueChange={(v) => setForm((f) => ({ ...f, birthDay: v === NO_SELECTION ? '' : v }))}>
            <SelectTrigger className="w-24"><SelectValue placeholder="Day" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SELECTION}>Not set</SelectItem>
              {DAYS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Phone Number</Label>
        <Input value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} placeholder="+234 801 234 5678" required />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="john@example.com" required />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Members"
        description="Manage the members in your department"
        action={<Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Member</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Active Members" value={activeCount} icon={Users} />
        <StatCard title="Inactive Members" value={inactiveCount} icon={UserX} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All Members</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Birthday</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.id} className="group">
                      <TableCell className="font-medium">{m.firstName} {m.lastName}</TableCell>
                      <TableCell>
                        {m.birthMonth && m.birthDay ? (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Cake className="h-3 w-3" />{formatBirthday(m.birthMonth, m.birthDay)}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          {m.phoneNumber && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{m.phoneNumber}</span>}
                          {m.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{m.email}</span>}
                          {!m.phoneNumber && !m.email && '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.isActive ? 'outline' : 'secondary'} className={m.isActive ? 'border-primary/30 text-primary' : ''}>
                          {m.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(m)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {m.isActive ? (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => { setSelected(m); setDeleteOpen(true); }}>
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary hover:text-primary"
                              onClick={() => reactivateMutation.mutate(m.id)} disabled={reactivateMutation.isPending}>
                              <RotateCcw className="h-3.5 w-3.5" />
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
            <EmptyState
              icon={Users}
              title={search ? 'No members found' : 'No members yet'}
              description={search ? 'Try adjusting your search' : 'Add your first member to get started.'}
              action={!search ? <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Member</Button> : undefined}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Add a new member to your department.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <MemberFormFields />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>Update member information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
            <MemberFormFields />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {selected?.firstName} {selected?.lastName}?
              They will no longer appear in new attendance records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
