import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Role } from 'shared';
import { HODDashboard } from './HODDashboard';
import { TeamHeadDashboard } from './TeamHeadDashboard';
import { AdminDashboard } from './AdminDashboard';

export function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) {
    return null;
  }

  switch (user.role) {
    case Role.HOD:
      return <HODDashboard />;
    case Role.TEAM_HEAD:
      return <TeamHeadDashboard />;
    case Role.ADMIN:
      return <AdminDashboard />;
    default:
      return <div>Unknown role</div>;
  }
}
