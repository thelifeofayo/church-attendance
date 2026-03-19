import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Team, User } from 'shared';
import { Plus, Pencil, Building2, Users, Search } from 'lucide-react';

interface TeamWithDetails extends Team {
  teamHead?: User | null;
  _count?: { departments: number };
}

const NONE = '__none__';

export function TeamsPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingTeam, setEditingTeam] = React.useState<TeamWithDetails | null>(null);
  const [name, setName] = React.useState('');
  const [teamHeadId, setTeamHeadId] = React.useState(NONE);
  const [search, setSearch] = React.useState('');

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: TeamWithDetails[] }>('/teams');
      return res.data.data;
    },
  });

  const { data: teamHeads } = useQuery({
    queryKey: ['users', 'team-heads'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: User[] }>('/users?role=TEAM_HEAD');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string> = { name };
      if (teamHeadId !== NONE) payload.teamHeadId = teamHeadId;
      await api.post('/teams', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Team created successfully');
      closeAdd();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingTeam) return;
      await api.patch(`/teams/${editingTeam.id}`, {
        name,
        teamHeadId: teamHeadId === NONE ? null : teamHeadId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team updated successfully');
      closeEdit();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  function openAdd() {
    setName('');
    setTeamHeadId(NONE);
    setAddOpen(true);
  }
  function closeAdd() {
    setAddOpen(false);
  }
  function openEdit(team: TeamWithDetails) {
    setEditingTeam(team);
    setName(team.name);
    setTeamHeadId(team.teamHeadId ?? NONE);
    setEditOpen(true);
  }
  function closeEdit() {
    setEditOpen(false);
    setEditingTeam(null);
  }

  const filtered = React.useMemo(() => {
    if (!teams) return [];
    if (!search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.teamHead?.firstName?.toLowerCase().includes(q) ||
        t.teamHead?.lastName?.toLowerCase().includes(q)
    );
  }, [teams, search]);

  const activeCount = teams?.filter((t) => t.isActive).length ?? 0;
  const withHeadCount = teams?.filter((t) => t.teamHeadId).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Teams" description="Manage ministry teams and their heads">
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Active Teams" value={isLoading ? '—' : activeCount} icon={Building2} />
        <StatCard title="With Team Heads" value={isLoading ? '—' : withHeadCount} icon={Users} />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All Teams</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Team Head</TableHead>
                    <TableHead className="text-center">Departments</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((team) => (
                    <TableRow key={team.id} className="group">
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>
                        {team.teamHead ? (
                          <span>{team.teamHead.firstName} {team.teamHead.lastName}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{team._count?.departments ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={team.isActive ? 'outline' : 'secondary'} className={team.isActive ? 'border-primary/30 text-primary' : ''}>
                          {team.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openEdit(team)}
                        >
                          <Pencil className="h-4 w-4" />
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
              title={search ? 'No teams found' : 'No teams yet'}
              description={search ? 'Try adjusting your search query' : 'Create your first team to get started.'}
              actionLabel={search ? undefined : 'Add Team'}
              onAction={search ? undefined : openAdd}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { if (!open) closeAdd(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>Add a new ministry team. You can assign a team head later.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Music Ministry" required />
              </div>
              <div className="space-y-2">
                <Label>Team Head (Optional)</Label>
                <Select value={teamHeadId} onValueChange={setTeamHeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No team head</SelectItem>
                    {(teamHeads ?? []).map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAdd}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) closeEdit(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update team information and assign a team head.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Team Head</Label>
                <Select value={teamHeadId} onValueChange={setTeamHeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No team head</SelectItem>
                    {(teamHeads ?? []).map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEdit}>Cancel</Button>
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
