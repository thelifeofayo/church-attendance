import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Role } from 'shared';

// Layouts
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

// Lazy route pages (reduces initial bundle size / improves first-load time)
const LoginPage = React.lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const ForgotPasswordPage = React.lazy(() =>
  import('@/features/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = React.lazy(() =>
  import('@/features/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const ChangePasswordPage = React.lazy(() =>
  import('@/features/auth/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage }))
);

const DashboardPage = React.lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);

const AttendanceFormPage = React.lazy(() =>
  import('@/features/attendance/AttendanceFormPage').then((m) => ({ default: m.AttendanceFormPage }))
);
const AttendanceListPage = React.lazy(() =>
  import('@/features/attendance/AttendanceListPage').then((m) => ({ default: m.AttendanceListPage }))
);

const MembersPage = React.lazy(() =>
  import('@/features/members/MembersPage').then((m) => ({ default: m.MembersPage }))
);
const TeamsPage = React.lazy(() =>
  import('@/features/teams/TeamsPage').then((m) => ({ default: m.TeamsPage }))
);
const DepartmentsPage = React.lazy(() =>
  import('@/features/departments/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage }))
);
const ReportsPage = React.lazy(() =>
  import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const EmailSettingsPage = React.lazy(() =>
  import('@/features/admin/EmailSettingsPage').then((m) => ({ default: m.EmailSettingsPage }))
);
const BroadcastsPage = React.lazy(() =>
  import('@/features/broadcasts/BroadcastsPage').then((m) => ({ default: m.BroadcastsPage }))
);
const UsersPage = React.lazy(() =>
  import('@/features/users/UsersPage').then((m) => ({ default: m.UsersPage }))
);

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
        <React.Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
              Loading...
            </div>
          }
        >
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
        </React.Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
