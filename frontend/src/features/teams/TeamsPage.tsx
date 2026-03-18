import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api, { getErrorMessage } from '@/lib/api';
import { Team, User } from 'shared';
import { Plus, Pencil, Building2, Users } from 'lucide-react';

interface TeamWithDetails extends Team {
  teamHead?: User | null;
  _count?: { departments: number };
}

interface TeamFormData {
  name: string;
  teamHeadId?: string;
}

export function TeamsPage() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedTeam, setSelectedTeam] = React.useState<TeamWithDetails | null>(null);
  const [formData, setFormData] = React.useState<TeamFormData>({ name: '' });
  const [error, setError] = React.useState<string | null>(null);

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: TeamWithDetails[] }>('/teams');
      return response.data.data;
    },
  });

  const { data: availableTeamHeads } = useQuery({
    queryKey: ['users', 'team-heads'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: User[] }>('/users?role=TEAM_HEAD');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      await api.post('/teams', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TeamFormData }) => {
      await api.patch(`/teams/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const resetForm = () => {
    setFormData({ name: '' });
    setError(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setError(null);
    updateMutation.mutate({ id: selectedTeam.id, data: formData });
  };

  const openEditDialog = (team: TeamWithDetails) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      teamHeadId: team.teamHeadId || undefined,
    });
    setError(null);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeTeams = teams?.filter((t) => t.isActive) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams Management</h1>
          <p className="text-muted-foreground">Manage ministry teams and their heads</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Add a new ministry team. You can assign a team head later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit}>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Music Ministry"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamHead">Team Head (Optional)</Label>
                  <Select
                    value={formData.teamHeadId || ''}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, teamHeadId: value || undefined }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team head" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No team head</SelectItem>
                      {availableTeamHeads?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Team'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTeams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Team Heads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTeams.filter((t) => t.teamHeadId).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
          <CardDescription>
            {teams?.length || 0} teams in the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teams && teams.length > 0 ? (
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
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      {team.teamHead ? (
                        `${team.teamHead.firstName} ${team.teamHead.lastName}`
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {team._count?.departments || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.isActive ? 'success' : 'secondary'}>
                        {team.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(team)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No teams yet. Create your first team to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update team information and assign a team head.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="editName">Team Name</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTeamHead">Team Head</Label>
                <Select
                  value={formData.teamHeadId || ''}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, teamHeadId: value || undefined }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No team head</SelectItem>
                    {availableTeamHeads?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    </div>
  );
}
