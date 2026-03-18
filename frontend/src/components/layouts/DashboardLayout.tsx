import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Role } from 'shared';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCog,
  ClipboardList,
  FileBarChart,
  LogOut,
  Menu,
  X,
  Mail,
  Megaphone,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: [Role.ADMIN, Role.TEAM_HEAD, Role.HOD],
  },
  {
    label: 'Teams',
    href: '/teams',
    icon: <Building2 className="h-5 w-5" />,
    roles: [Role.ADMIN],
  },
  {
    label: 'Departments',
    href: '/departments',
    icon: <Users className="h-5 w-5" />,
    roles: [Role.ADMIN, Role.TEAM_HEAD],
  },
  {
    label: 'Members',
    href: '/members',
    icon: <UserCog className="h-5 w-5" />,
    roles: [Role.HOD],
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: <ClipboardList className="h-5 w-5" />,
    roles: [Role.ADMIN, Role.TEAM_HEAD, Role.HOD],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: <FileBarChart className="h-5 w-5" />,
    roles: [Role.ADMIN],
  },
  {
    label: 'Broadcasts',
    href: '/broadcasts',
    icon: <Megaphone className="h-5 w-5" />,
    roles: [Role.ADMIN, Role.TEAM_HEAD],
  },
  {
    label: 'Email Settings',
    href: '/email-settings',
    icon: <Mail className="h-5 w-5" />,
    roles: [Role.ADMIN],
  },
];

export function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #111111 0%, #0d0d0d 100%)',
          borderRight: '1px solid rgba(251,191,36,0.1)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className="flex items-center justify-between h-16 px-4"
            style={{ borderBottom: '1px solid rgba(251,191,36,0.1)' }}
          >
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000',
                }}
              >
                CA
              </div>
              <span className="text-sm font-semibold text-white tracking-wide">
                Attendance
              </span>
            </Link>
            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-150"
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))',
                          color: '#fbbf24',
                          borderLeft: '2px solid #f59e0b',
                        }
                      : {
                          color: 'rgba(255,255,255,0.55)',
                          borderLeft: '2px solid transparent',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div
            className="p-4"
            style={{ borderTop: '1px solid rgba(251,191,36,0.1)' }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.15))',
                  color: '#fbbf24',
                  border: '1px solid rgba(251,191,36,0.2)',
                }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs truncate" style={{ color: 'rgba(251,191,36,0.6)' }}>
                  {user?.role}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full text-sm"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)',
              }}
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 h-16 flex items-center px-4 lg:px-6"
          style={{
            background: 'rgba(10,10,10,0.95)',
            borderBottom: '1px solid rgba(251,191,36,0.1)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <button
            className="lg:hidden mr-4 text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-base font-semibold text-white">
            {filteredNavItems.find((item) => item.href === location.pathname)
              ?.label || 'Dashboard'}
          </h1>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
