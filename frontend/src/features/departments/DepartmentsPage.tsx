import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import api, { getErrorMessage } from '@/lib/api';
import { Department, Team, User, Role } from 'shared';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Pencil, Building2, Users, Search } from 'lucide-react';

const NO_SELECTION = '__none__';

interface DepartmentWithDetails extends Department {
  hod?: User | null;
  assistantHod?: User | null;
  team?: Team | null;
  _count?: { members: number };
}

export function DepartmentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === Role.ADMIN;

  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DepartmentWithDetails | null>(null);
  const [name, setName] = React.useState('');
  const [teamId, setTeamId] = React.useState(NO_SELECTION);
  const [departmentTeamFilterId, setDepartmentTeamFilterId] = React.useState(NO_SELECTION);
  const [teamSearch, setTeamSearch] = React.useState('');
  const [editHodId, setEditHodId] = React.useState(NO_SELECTION);
  const [editAssistantHodId, setEditAssistantHodId] = React.useState(NO_SELECTION);
  const [search, setSearch] = React.useState('');

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments', departmentTeamFilterId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        includeInactive: 'false',
      });

      if (departmentTeamFilterId !== NO_SELECTION) {
        params.set('teamId', departmentTeamFilterId);
      }

      const res = await api.get<{ success: boolean; data: DepartmentWithDetails[] }>(
        `/departments?${params.toString()}`
      );
      return res.data.data;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Team[] }>(
        '/teams?page=1&limit=100&includeInactive=false'
      );
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const filteredTeams = React.useMemo(() => {
    if (!teams) return [];
    if (!teamSearch.trim()) return teams;
    const q = teamSearch.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, teamSearch]);

  const { data: availableHODs } = useQuery({
    queryKey: ['users', 'hods'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: User[] }>('/users?role=HOD');
      return res.data.data;
    },
  });

  const { data: availableAssistantHODs } = useQuery({
    queryKey: ['users', 'assistant-hods'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: User[] }>('/users?role=ASSISTANT_HOD');
      return res.data.data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['team-head-dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string> = { name };
      if (teamId !== NO_SELECTION) payload.teamId = teamId;
      await api.post('/departments', payload);
    },
    onSuccess: () => { invalidate(); setAddOpen(false); toast.success('Department created'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const payload: Record<string, string | boolean> = { name };
      if (isAdmin && teamId !== NO_SELECTION) {
        payload.teamId = teamId;
      }

      await api.patch(`/departments/${editing.id}`, payload);

      const currentHodId = editing.hodId ?? null;
      const newHodId = editHodId === NO_SELECTION ? null : editHodId;
      if (currentHodId !== newHodId) {
        await api.patch(`/departments/${editing.id}/assign-hod`, { hodId: newHodId });
      }

      const currentAssistantHodId = editing.assistantHodId ?? null;
      const newAssistantHodId = editAssistantHodId === NO_SELECTION ? null : editAssistantHodId;
      if (currentAssistantHodId !== newAssistantHodId) {
        await api.patch(`/departments/${editing.id}/assign-assistant-hod`, { assistantHodId: newAssistantHodId });
      }
    },
    onSuccess: () => { invalidate(); setEditOpen(false); toast.success('Department updated'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const assignHODMutation = useMutation({
    mutationFn: async ({ id, hodId }: { id: string; hodId: string | null }) => {
      await api.patch(`/departments/${id}/assign-hod`, { hodId });
    },
    onSuccess: () => { invalidate(); toast.success('HOD assignment updated'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const assignAssistantHODMutation = useMutation({
    mutationFn: async ({ id, assistantHodId }: { id: string; assistantHodId: string | null }) => {
      await api.patch(`/departments/${id}/assign-assistant-hod`, { assistantHodId });
    },
    onSuccess: () => { invalidate(); toast.success('Assistant HOD assignment updated'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  function openAdd() { setName(''); setTeamId(NO_SELECTION); setAddOpen(true); }
  function openEdit(d: DepartmentWithDetails) {
    setEditing(d);
    setName(d.name);
    setTeamId(d.teamId || NO_SELECTION);
    setEditHodId(d.hodId || NO_SELECTION);
    setEditAssistantHodId(d.assistantHodId || NO_SELECTION);
    setEditOpen(true);
  }

  const filtered = React.useMemo(() => {
    if (!departments) return [];
    if (!search.trim()) return departments;
    const q = search.toLowerCase();
    return departments.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      d.team?.name?.toLowerCase().includes(q) ||
      d.hod?.firstName?.toLowerCase().includes(q) ||
      d.hod?.lastName?.toLowerCase().includes(q)
    );
  }, [departments, search]);

  const activeCount = departments?.filter((d) => d.isActive).length ?? 0;
  const withHODCount = departments?.filter((d) => d.hodId).length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description={isAdmin ? 'Manage all departments across teams' : 'Manage departments in your team'}
        action={<Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Department</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Active Departments" value={activeCount} icon={Building2} />
        <StatCard title="With HODs" value={withHODCount} icon={Users} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All Departments</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isAdmin && teams && (
            <div className="mb-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teams..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>

                <Select value={departmentTeamFilterId} onValueChange={setDepartmentTeamFilterId}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SELECTION}>All teams</SelectItem>
                    {filteredTeams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {filtered.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    {isAdmin && <TableHead>Team</TableHead>}
                    <TableHead>HOD</TableHead>
                    <TableHead>Assistant HOD</TableHead>
                    <TableHead className="text-center">Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((dept) => (
                    <TableRow key={dept.id} className="group">
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      {isAdmin && <TableCell className="text-muted-foreground">{dept.team?.name || '—'}</TableCell>}
                      <TableCell>
                        <Select
                          value={dept.hodId || NO_SELECTION}
                          onValueChange={(v) => assignHODMutation.mutate({ id: dept.id, hodId: v === NO_SELECTION ? null : v })}
                        >
                          <SelectTrigger className="w-[160px] h-8 text-xs">
                            <SelectValue placeholder="Assign HOD" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_SELECTION}>No HOD</SelectItem>
                            {availableHODs?.map((hod) => (
                              <SelectItem key={hod.id} value={hod.id}>{hod.firstName} {hod.lastName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={dept.assistantHodId || NO_SELECTION}
                          onValueChange={(v) => assignAssistantHODMutation.mutate({ id: dept.id, assistantHodId: v === NO_SELECTION ? null : v })}
                        >
                          <SelectTrigger className="w-[160px] h-8 text-xs">
                            <SelectValue placeholder="Assign Asst. HOD" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_SELECTION}>No Assistant HOD</SelectItem>
                            {availableAssistantHODs?.map((u) => (
                              <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">{dept._count?.members || 0}</TableCell>
                      <TableCell>
                        <Badge variant={dept.isActive ? 'outline' : 'secondary'} className={dept.isActive ? 'border-primary/30 text-primary' : ''}>
                          {dept.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100" onClick={() => openEdit(dept)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title={search ? 'No departments found' : 'No departments yet'}
              description={search ? 'Try adjusting your search' : 'Create your first department to get started.'}
              action={!search ? <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Department</Button> : undefined}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
            <DialogDescription>Add a new department. You can assign an HOD later.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Choir" required />
            </div>
            {isAdmin && teams && (
              <div className="space-y-2">
                <Label>Team</Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SELECTION}>No team</SelectItem>
                    {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Department'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            {isAdmin && teams && (
              <div className="space-y-2">
                <Label>Team</Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SELECTION}>No team</SelectItem>
                    {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>HOD</Label>
              <Select value={editHodId} onValueChange={setEditHodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign HOD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SELECTION}>No HOD</SelectItem>
                  {availableHODs?.map((hod) => (
                    <SelectItem key={hod.id} value={hod.id}>
                      {hod.firstName} {hod.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assistant HOD</Label>
              <Select value={editAssistantHodId} onValueChange={setEditAssistantHodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign Assistant HOD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SELECTION}>No Assistant HOD</SelectItem>
                  {availableAssistantHODs?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
