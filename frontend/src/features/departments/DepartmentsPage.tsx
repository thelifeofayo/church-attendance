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
import { Department, Team, User, Role } from 'shared';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Pencil, Building2, Users } from 'lucide-react';

interface DepartmentWithDetails extends Department {
  hod?: User | null;
  team?: Team | null;
  _count?: { members: number };
}

interface DepartmentFormData {
  name: string;
  teamId?: string;
  hodId?: string;
}

export function DepartmentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedDepartment, setSelectedDepartment] = React.useState<DepartmentWithDetails | null>(null);
  const [formData, setFormData] = React.useState<DepartmentFormData>({ name: '' });
  const [error, setError] = React.useState<string | null>(null);

  const isAdmin = user?.role === Role.ADMIN;

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: DepartmentWithDetails[] }>('/departments');
      return response.data.data;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Team[] }>('/teams');
      return response.data.data;
    },
    enabled: isAdmin,
  });

  const { data: availableHODs } = useQuery({
    queryKey: ['users', 'hods'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: User[] }>('/users?role=HOD');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      await api.post('/departments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['team-head-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DepartmentFormData> }) => {
      await api.patch(`/departments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const assignHODMutation = useMutation({
    mutationFn: async ({ id, hodId }: { id: string; hodId: string | null }) => {
      await api.patch(`/departments/${id}/assign-hod`, { hodId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
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
    if (!selectedDepartment) return;
    setError(null);
    updateMutation.mutate({ id: selectedDepartment.id, data: { name: formData.name } });
  };

  const handleHODChange = (departmentId: string, hodId: string | null) => {
    assignHODMutation.mutate({ id: departmentId, hodId });
  };

  const openEditDialog = (department: DepartmentWithDetails) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      teamId: department.teamId,
      hodId: department.hodId || undefined,
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

  const activeDepartments = departments?.filter((d) => d.isActive) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments Management</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage all departments across teams' : 'Manage departments in your team'}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>
                Add a new department. You can assign an HOD later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit}>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Department Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Choir"
                    required
                  />
                </div>
                {isAdmin && teams && (
                  <div className="space-y-2">
                    <Label htmlFor="team">Team</Label>
                    <Select
                      value={formData.teamId || ''}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, teamId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Department'}
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
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDepartments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With HODs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeDepartments.filter((d) => d.hodId).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
          <CardDescription>
            {departments?.length || 0} departments total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {departments && departments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  {isAdmin && <TableHead>Team</TableHead>}
                  <TableHead>HOD</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        {department.team?.name || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Select
                        value={department.hodId || 'none'}
                        onValueChange={(value) =>
                          handleHODChange(department.id, value === 'none' ? null : value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Assign HOD" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No HOD</SelectItem>
                          {availableHODs?.map((hod) => (
                            <SelectItem key={hod.id} value={hod.id}>
                              {hod.firstName} {hod.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      {department._count?.members || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={department.isActive ? 'success' : 'secondary'}>
                        {department.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(department)}
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
              No departments yet. Create your first department to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="editName">Department Name</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
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
    </div>
  );
}
