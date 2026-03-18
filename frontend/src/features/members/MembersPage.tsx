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
import api, { getErrorMessage } from '@/lib/api';
import { Member } from 'shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Users, RotateCcw, Phone, Mail, Cake } from 'lucide-react';

interface MemberFormData {
  firstName: string;
  lastName: string;
  birthMonth: string;
  birthDay: string;
  phoneNumber: string;
  email: string;
}

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

export function MembersPage() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
  const [formData, setFormData] = React.useState<MemberFormData>({
    firstName: '',
    lastName: '',
    birthMonth: '',
    birthDay: '',
    phoneNumber: '',
    email: '',
  });
  const [error, setError] = React.useState<string | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Member[] }>('/members');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        birthMonth: data.birthMonth ? parseInt(data.birthMonth) : undefined,
        birthDay: data.birthDay ? parseInt(data.birthDay) : undefined,
        phoneNumber: data.phoneNumber,
        email: data.email,
      };
      await api.post('/members', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['hod-dashboard'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MemberFormData }) => {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        birthMonth: data.birthMonth ? parseInt(data.birthMonth) : null,
        birthDay: data.birthDay ? parseInt(data.birthDay) : null,
        phoneNumber: data.phoneNumber,
        email: data.email,
      };
      await api.patch(`/members/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['hod-dashboard'] });
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/members/${id}/reactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['hod-dashboard'] });
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      birthMonth: '',
      birthDay: '',
      phoneNumber: '',
      email: '',
    });
    setError(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setError(null);
    updateMutation.mutate({ id: selectedMember.id, data: formData });
  };

  const handleDelete = () => {
    if (!selectedMember) return;
    deleteMutation.mutate(selectedMember.id);
  };

  const openEditDialog = (member: Member) => {
    setSelectedMember(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      birthMonth: member.birthMonth?.toString() || '',
      birthDay: member.birthDay?.toString() || '',
      phoneNumber: member.phoneNumber || '',
      email: member.email || '',
    });
    setError(null);
    setIsEditDialogOpen(true);
  };

  const formatBirthday = (month: number | null, day: number | null): string => {
    if (!month || !day) return '-';
    const monthName = MONTHS.find((m) => m.value === String(month))?.label || '';
    return `${monthName} ${day}`;
  };

  const openDeleteDialog = (member: Member) => {
    setSelectedMember(member);
    setError(null);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeMembers = members?.filter((m) => m.isActive) || [];
  const inactiveMembers = members?.filter((m) => !m.isActive) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Department Members</h1>
          <p className="text-muted-foreground">Manage the members in your department</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>
                Add a new member to your department. They will be included in attendance records.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit}>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Birthday (Optional)</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.birthMonth}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, birthMonth: value }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={formData.birthDay}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, birthDay: value }))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="e.g., +234 801 234 5678"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g., john@example.com"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Member'}
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
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveMembers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Members</CardTitle>
          <CardDescription>
            {members?.length || 0} total members in your department
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members && members.length > 0 ? (
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
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {member.birthMonth && member.birthDay ? (
                          <>
                            <Cake className="h-3 w-3 text-muted-foreground" />
                            {formatBirthday(member.birthMonth, member.birthDay)}
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {member.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {member.phoneNumber}
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {member.email}
                          </div>
                        )}
                        {!member.phoneNumber && !member.email && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.isActive ? 'success' : 'secondary'}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(member)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {member.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(member)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => reactivateMutation.mutate(member.id)}
                          disabled={reactivateMutation.isPending}
                          title="Reactivate member"
                        >
                          <RotateCcw className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No members yet. Add your first member to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>Update member information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Birthday (Optional)</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.birthMonth || "none"}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, birthMonth: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.birthDay || "none"}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, birthDay: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      {DAYS.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhoneNumber">Phone Number</Label>
                <Input
                  id="editPhoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="e.g., +234 801 234 5678"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g., john@example.com"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {selectedMember?.firstName} {selectedMember?.lastName}?
              They will no longer appear in new attendance records.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
