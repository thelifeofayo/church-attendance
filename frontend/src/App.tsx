import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Role } from 'shared';

// Layouts
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

// Auth pages
import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';

// Dashboard
import { DashboardPage } from '@/features/dashboard/DashboardPage';

// Attendance
import { AttendanceFormPage } from '@/features/attendance/AttendanceFormPage';
import { AttendanceListPage } from '@/features/attendance/AttendanceListPage';

// Members
import { MembersPage } from '@/features/members/MembersPage';

// Teams
import { TeamsPage } from '@/features/teams/TeamsPage';

// Departments
import { DepartmentsPage } from '@/features/departments/DepartmentsPage';

// Reports
import { ReportsPage } from '@/features/reports/ReportsPage';

// Admin
import { EmailSettingsPage } from '@/features/admin/EmailSettingsPage';

// Broadcasts
import { BroadcastsPage } from '@/features/broadcasts/BroadcastsPage';

// Users
import { UsersPage } from '@/features/users/UsersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, requiresPasswordChange } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isChangePasswordRoute = location.pathname === '/change-password';
  if (requiresPasswordChange && !isChangePasswordRoute) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, requiresPasswordChange } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={requiresPasswordChange ? '/change-password' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Attendance routes - all roles */}
            <Route path="attendance" element={<AttendanceListPage />} />
            <Route path="attendance/:id" element={<AttendanceFormPage />} />

            {/* Members - HOD only */}
            <Route
              path="members"
              element={
                <ProtectedRoute allowedRoles={[Role.HOD]}>
                  <MembersPage />
                </ProtectedRoute>
              }
            />

            {/* Teams - Admin only */}
            <Route
              path="teams"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                  <TeamsPage />
                </ProtectedRoute>
              }
            />

            {/* Users - Admin and Team Head */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN, Role.TEAM_HEAD]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* Departments - Admin and Team Head */}
            <Route
              path="departments"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN, Role.TEAM_HEAD]}>
                  <DepartmentsPage />
                </ProtectedRoute>
              }
            />

            {/* Reports - Admin only */}
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Email Settings - Admin only */}
            <Route
              path="email-settings"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                  <EmailSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Broadcasts - Admin and Team Head */}
            <Route
              path="broadcasts"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN, Role.TEAM_HEAD]}>
                  <BroadcastsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
