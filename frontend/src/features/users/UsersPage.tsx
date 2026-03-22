import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import api, { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { User, Role } from 'shared';
import {
  Plus,
  Pencil,
  Search,
  UserCog,
  Shield,
  Users,
  Copy,
  Check,
  UserX,
  Eye,
  EyeOff,
  Cake,
} from 'lucide-react';

const NO_SELECTION = '__none__';

const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.TEAM_HEAD]: 'Team Head',
  [Role.SUB_TEAM_HEAD]: 'Sub-Team Head',
  [Role.HOD]: 'Head of Department',
  [Role.ASSISTANT_HOD]: 'Assistant HOD',
};

const ROLE_COLORS: Record<Role, string> = {
  [Role.ADMIN]: 'bg-destructive/15 text-destructive border-destructive/20',
  [Role.TEAM_HEAD]: 'bg-primary/15 text-primary border-primary/20',
  [Role.SUB_TEAM_HEAD]: 'bg-blue-500/15 text-blue-600 border-blue-500/20',
  [Role.HOD]: 'bg-success/15 text-success border-success/20',
  [Role.ASSISTANT_HOD]: 'bg-green-500/15 text-green-600 border-green-500/20',
};

interface UserWithAssignment extends User {
  teamAsHead?: { id: string; name: string } | null;
  departmentAsHOD?: { id: string; name: string; team?: { id: string; name: string } } | null;
  departmentAsAssistantHOD?: { id: string; name: string; team?: { id: string; name: string } } | null;
}

interface TeamOption {
  id: string;
  name: string;
  teamHeadId: string | null;
  subTeamHeadId?: string | null;
}

interface DepartmentOption {
  id: string;
  name: string;
  hodId: string | null;
  assistantHodId?: string | null;
  team?: { id: string; name: string } | null;
}

interface CreateUserResponse extends User {
  temporaryPassword: string;
}

export function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === Role.ADMIN;

  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>(NO_SELECTION);

  // Create dialog
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({
    email: '',
    firstName: '',
    lastName: '',
    role: '' as string,
    teamId: '',
    departmentId: '',
    birthMonth: '',
    birthDay: '',
    phoneNumber: '',
  });

  // Credential dialog (shown after creation)
  const [credentialOpen, setCredentialOpen] = React.useState(false);
  const [newCredentials, setNewCredentials] = React.useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserWithAssignment | null>(null);
  const [editForm, setEditForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    birthMonth: '',
    birthDay: '',
    phoneNumber: '',
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', roleFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '100', includeInactive: 'true' });
      if (roleFilter !== NO_SELECTION) params.set('role', roleFilter);
      if (search) params.set('search', search);
      const res = await api.get<{ success: boolean; data: UserWithAssignment[]; meta: any }>(`/users?${params}`);
      return res.data;
    },
  });

  // Fetch teams (for assigning Team Heads - admin only)
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: TeamOption[] }>('/teams');
      return res.data.data;
    },
    enabled: isAdmin,
  });

  // Fetch departments (for assigning HODs)
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: DepartmentOption[] }>('/departments');
      return res.data.data;
    },
  });

  const users = usersData?.data || [];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    queryClient.invalidateQueries({ queryKey: ['departments'] });
  };

  // Create user
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        email: createForm.email,
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        role: createForm.role,
      };
      if ((createForm.role === Role.TEAM_HEAD || createForm.role === Role.SUB_TEAM_HEAD) && createForm.teamId) {
        payload.teamId = createForm.teamId;
      }
      if ((createForm.role === Role.HOD || createForm.role === Role.ASSISTANT_HOD) && createForm.departmentId) {
        payload.departmentId = createForm.departmentId;
      }
      if (createForm.birthMonth) payload.birthMonth = parseInt(createForm.birthMonth);
      if (createForm.birthDay) payload.birthDay = parseInt(createForm.birthDay);
      if (createForm.phoneNumber) payload.phoneNumber = createForm.phoneNumber;
      const res = await api.post<{ success: boolean; data: CreateUserResponse }>('/users', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      invalidateAll();
      setCreateOpen(false);
      resetCreateForm();
      setNewCredentials({ email: data.email, password: data.temporaryPassword });
      setCredentialOpen(true);
      toast.success(`${ROLE_LABELS[data.role]} account created`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Update user
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser) return;
      const payload: Record<string, unknown> = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        birthMonth: editForm.birthMonth ? parseInt(editForm.birthMonth) : null,
        birthDay: editForm.birthDay ? parseInt(editForm.birthDay) : null,
        phoneNumber: editForm.phoneNumber || null,
      };
      const res = await api.patch<{ success: boolean; data: User }>(`/users/${editingUser.id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      invalidateAll();
      setEditOpen(false);
      toast.success('User updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Deactivate / reactivate
  const toggleActiveMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('User deactivated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const reactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/users/${userId}`, { isActive: true });
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('User activated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  function resetCreateForm() {
    setCreateForm({ email: '', firstName: '', lastName: '', role: '', teamId: '', departmentId: '', birthMonth: '', birthDay: '', phoneNumber: '' });
  }

  function openCreate() {
    resetCreateForm();
    if (!isAdmin) {
      setCreateForm((f) => ({ ...f, role: Role.HOD }));
    }
    setCreateOpen(true);
  }

  function openEdit(u: UserWithAssignment) {
    setEditingUser(u);
    setEditForm({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      birthMonth: u.birthMonth?.toString() || '',
      birthDay: u.birthDay?.toString() || '',
      phoneNumber: u.phoneNumber || '',
    });
    setEditOpen(true);
  }

  function handleCopy() {
    if (!newCredentials) return;
    const text = `Email: ${newCredentials.email}\nTemporary Password: ${newCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Available teams without a Team Head assigned
  const availableTeams = (teams || []).filter((t) => !t.teamHeadId);
  const availableTeamsForSubHead = (teams || []).filter((t) => !t.subTeamHeadId);

  // Available departments without an HOD assigned
  const availableDepartments = (departments || []).filter((d) => !d.hodId);
  const availableDepartmentsForAssistantHOD = (departments || []).filter((d) => !d.assistantHodId);

  // Allowed roles for the create form
  const allowedRoles: Role[] = isAdmin
    ? [Role.ADMIN, Role.TEAM_HEAD, Role.SUB_TEAM_HEAD, Role.HOD, Role.ASSISTANT_HOD]
    : [Role.HOD, Role.ASSISTANT_HOD];

  // Stats
  const adminCount = users.filter((u) => u.role === Role.ADMIN).length;
  const teamHeadCount = users.filter((u) => u.role === Role.TEAM_HEAD).length;
  const hodCount = users.filter((u) => u.role === Role.HOD).length;

  // Search filter (client-side since API might not support all we need)
  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const canCreateUser =
    isAdmin ||
    (currentUser?.role === Role.TEAM_HEAD && availableDepartments.length > 0);

  function getAssignment(u: UserWithAssignment): string {
    if (u.teamAsHead) return u.teamAsHead.name;
    if (u.departmentAsHOD) return u.departmentAsHOD.name;
    if (u.departmentAsAssistantHOD) return u.departmentAsAssistantHOD.name;
    return '—';
  }

  if (usersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description={isAdmin ? 'Manage admins, team heads, and department heads' : 'Manage department heads in your team'}
        action={canCreateUser ? (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        ) : undefined}
      />

      {/* Stats */}
      {isAdmin ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Admins" value={adminCount} icon={Shield} />
          <StatCard title="Team Heads" value={teamHeadCount} icon={Users} />
          <StatCard title="HODs" value={hodCount} icon={UserCog} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard title="Department Heads" value={hodCount} icon={UserCog} />
          <StatCard title="Available Departments" value={availableDepartments.length} icon={Users} />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {isAdmin && (
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SELECTION}>All Roles</SelectItem>
                  <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                  <SelectItem value={Role.TEAM_HEAD}>Team Head</SelectItem>
                  <SelectItem value={Role.SUB_TEAM_HEAD}>Sub-Team Head</SelectItem>
                  <SelectItem value={Role.HOD}>HOD</SelectItem>
                  <SelectItem value={Role.ASSISTANT_HOD}>Assistant HOD</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No users found"
          description={search ? 'Try adjusting your search or filters' : 'Get started by creating your first user'}
          action={canCreateUser ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          ) : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Birthday</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className={!u.isActive ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">
                        {u.firstName} {u.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ROLE_COLORS[u.role]}>
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getAssignment(u as UserWithAssignment)}
                      </TableCell>
                      <TableCell>
                        {u.birthMonth && u.birthDay ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Cake className="h-3 w-3" />
                            {['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][u.birthMonth]} {u.birthDay}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? 'outline' : 'secondary'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEdit(u as UserWithAssignment)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {u.isActive && u.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => toggleActiveMutation.mutate(u.id)}
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {!u.isActive && u.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-primary hover:text-primary"
                              onClick={() => reactivateMutation.mutate(u.id)}
                              disabled={reactivateMutation.isPending}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              {isAdmin
                ? 'Add a new admin, team head, or department head'
                : 'Add a new department head to your team'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            {isAdmin && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={createForm.role || NO_SELECTION}
                  onValueChange={(v) =>
                    setCreateForm((f) => ({
                      ...f,
                      role: v === NO_SELECTION ? '' : v,
                      teamId: '',
                      departmentId: '',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SELECTION} disabled>Select a role</SelectItem>
                    {allowedRoles.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Team selection for Team Head */}
            {createForm.role === Role.SUB_TEAM_HEAD && (
              <div className="space-y-2">
                <Label>Assign to Team</Label>
                {availableTeamsForSubHead.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    All teams already have a Sub-Team Head assigned.
                  </p>
                ) : (
                  <Select
                    value={createForm.teamId || NO_SELECTION}
                    onValueChange={(v) => setCreateForm((f) => ({ ...f, teamId: v === NO_SELECTION ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SELECTION} disabled>Select a team</SelectItem>
                      {availableTeamsForSubHead.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {createForm.role === Role.TEAM_HEAD && (
              <div className="space-y-2">
                <Label>Assign to Team</Label>
                {availableTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    All teams already have a Team Head assigned. Create a new team first.
                  </p>
                ) : (
                  <Select
                    value={createForm.teamId || NO_SELECTION}
                    onValueChange={(v) => setCreateForm((f) => ({ ...f, teamId: v === NO_SELECTION ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SELECTION} disabled>Select a team</SelectItem>
                      {availableTeams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Department selection for Assistant HOD */}
            {createForm.role === Role.ASSISTANT_HOD && (
              <div className="space-y-2">
                <Label>Assign to Department</Label>
                {availableDepartmentsForAssistantHOD.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    All departments already have an Assistant HOD assigned.
                  </p>
                ) : (
                  <Select
                    value={createForm.departmentId || NO_SELECTION}
                    onValueChange={(v) => setCreateForm((f) => ({ ...f, departmentId: v === NO_SELECTION ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDepartmentsForAssistantHOD.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}{d.team ? ` (${d.team.name})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Department selection for HOD */}
            {createForm.role === Role.HOD && (
              <div className="space-y-2">
                <Label>Assign to Department</Label>
                {availableDepartments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    All departments already have an HOD assigned. Create a new department first.
                  </p>
                ) : (
                  <Select
                    value={createForm.departmentId || NO_SELECTION}
                    onValueChange={(v) => setCreateForm((f) => ({ ...f, departmentId: v === NO_SELECTION ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDepartments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}{d.team ? ` (${d.team.name})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Phone Number (Optional)</Label>
              <Input
                value={createForm.phoneNumber}
                onChange={(e) => setCreateForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                placeholder="+234 801 234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth (Optional)</Label>
              <div className="flex gap-2">
                <Select
                  value={createForm.birthMonth || NO_SELECTION}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, birthMonth: v === NO_SELECTION ? '' : v }))}
                >
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SELECTION}>Month</SelectItem>
                    {[
                      { v: '1', l: 'January' }, { v: '2', l: 'February' }, { v: '3', l: 'March' },
                      { v: '4', l: 'April' }, { v: '5', l: 'May' }, { v: '6', l: 'June' },
                      { v: '7', l: 'July' }, { v: '8', l: 'August' }, { v: '9', l: 'September' },
                      { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' },
                    ].map((m) => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select
                  value={createForm.birthDay || NO_SELECTION}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, birthDay: v === NO_SELECTION ? '' : v }))}
                >
                  <SelectTrigger className="w-24"><SelectValue placeholder="Day" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SELECTION}>Day</SelectItem>
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  !createForm.email ||
                  !createForm.firstName ||
                  !createForm.lastName ||
                  !createForm.role ||
                  (createForm.role === Role.TEAM_HEAD && !createForm.teamId) ||
                  (createForm.role === Role.HOD && !createForm.departmentId)
                }
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  'Create User'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={credentialOpen} onOpenChange={(open) => {
        setCredentialOpen(open);
        if (!open) {
          setNewCredentials(null);
          setCopied(false);
          setShowPassword(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Created Successfully</DialogTitle>
            <DialogDescription>
              Share these credentials with the new user. The temporary password cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>
          {newCredentials && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 border p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm font-mono font-medium">{newCredentials.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Temporary Password</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono font-medium flex-1">
                      {showPassword ? newCredentials.password : '••••••••••••'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleCopy}>
                {copied ? (
                  <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Copied!</span>
                ) : (
                  <span className="flex items-center gap-2"><Copy className="h-4 w-4" /> Copy Credentials</span>
                )}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCredentialOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details for {editingUser?.firstName} {editingUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={editForm.phoneNumber}
                onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                placeholder="+234 801 234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <div className="flex gap-2">
                <Select
                  value={editForm.birthMonth || NO_SELECTION}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, birthMonth: v === NO_SELECTION ? '' : v }))}
                >
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SELECTION}>Not set</SelectItem>
                    {[
                      { v: '1', l: 'January' }, { v: '2', l: 'February' }, { v: '3', l: 'March' },
                      { v: '4', l: 'April' }, { v: '5', l: 'May' }, { v: '6', l: 'June' },
                      { v: '7', l: 'July' }, { v: '8', l: 'August' }, { v: '9', l: 'September' },
                      { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' },
                    ].map((m) => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select
                  value={editForm.birthDay || NO_SELECTION}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, birthDay: v === NO_SELECTION ? '' : v }))}
                >
                  <SelectTrigger className="w-24"><SelectValue placeholder="Day" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SELECTION}>Not set</SelectItem>
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editingUser && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className={ROLE_COLORS[editingUser.role]}>
                  {ROLE_LABELS[editingUser.role]}
                </Badge>
                <span>— Role cannot be changed after creation</span>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
