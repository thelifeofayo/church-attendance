import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Role } from 'shared';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCog,
  UserPlus,
  ClipboardList,
  FileBarChart,
  LogOut,
  Menu,
  X,
  Mail,
  Megaphone,
  ChevronLeft,
  Church,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  group: 'main' | 'manage' | 'admin';
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.TEAM_HEAD, Role.SUB_TEAM_HEAD, Role.HOD, Role.ASSISTANT_HOD], group: 'main' },
  { label: 'Attendance', href: '/attendance', icon: ClipboardList, roles: [Role.ADMIN, Role.TEAM_HEAD, Role.SUB_TEAM_HEAD, Role.HOD, Role.ASSISTANT_HOD], group: 'main' },
  { label: 'Teams', href: '/teams', icon: Building2, roles: [Role.ADMIN], group: 'manage' },
  { label: 'Departments', href: '/departments', icon: Users, roles: [Role.ADMIN, Role.TEAM_HEAD, Role.SUB_TEAM_HEAD], group: 'manage' },
  { label: 'Users', href: '/users', icon: UserPlus, roles: [Role.ADMIN, Role.TEAM_HEAD, Role.SUB_TEAM_HEAD], group: 'manage' },
  { label: 'Members', href: '/members', icon: UserCog, roles: [Role.HOD, Role.ASSISTANT_HOD], group: 'manage' },
  { label: 'Reports', href: '/reports', icon: FileBarChart, roles: [Role.ADMIN], group: 'admin' },
  { label: 'Broadcasts', href: '/broadcasts', icon: Megaphone, roles: [Role.ADMIN, Role.TEAM_HEAD, Role.SUB_TEAM_HEAD], group: 'admin' },
  { label: 'Email Settings', href: '/email-settings', icon: Mail, roles: [Role.ADMIN], group: 'admin' },
];

const groupLabels: Record<string, string> = {
  main: 'Overview',
  manage: 'Management',
  admin: 'Administration',
};

export function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const filteredItems = navItems.filter((item) => user && item.roles.includes(user.role));

  const groups = React.useMemo(() => {
    const g: Record<string, NavItem[]> = {};
    for (const item of filteredItems) {
      if (!g[item.group]) g[item.group] = [];
      g[item.group].push(item);
    }
    return g;
  }, [filteredItems]);

  // Bottom nav: show first 4 items; if more than 4 show first 3 + "More"
  const showMore = filteredItems.length > 4;
  const bottomNavItems = showMore ? filteredItems.slice(0, 3) : filteredItems.slice(0, 4);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPageLabel =
    filteredItems.find((item) => location.pathname.startsWith(item.href))?.label || 'Dashboard';

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background">
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            className: 'border border-border bg-card text-card-foreground',
          }}
        />

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-200 ease-in-out lg:translate-x-0',
            collapsed ? 'lg:w-[var(--sidebar-width-collapsed)]' : 'lg:w-[var(--sidebar-width)]',
            sidebarOpen ? 'translate-x-0 w-[var(--sidebar-width)]' : '-translate-x-full'
          )}
        >
          {/* Logo */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/25">
                <Church className="h-4 w-4 text-primary" />
              </div>
              {!collapsed && (
                <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
                  Harvesters Attendance
                </span>
              )}
            </Link>
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                {!collapsed && (
                  <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                    {groupLabels[group]}
                  </p>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const isActive = location.pathname === item.href ||
                      (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                    const Icon = item.icon;

                    const link = (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all',
                          isActive
                            ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                          collapsed && 'justify-center px-2'
                        )}
                      >
                        <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-primary')} />
                        {!collapsed && <span>{item.label}</span>}
                        {isActive && !collapsed && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      );
                    }
                    return link;
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Collapse toggle */}
          <div className="hidden lg:block px-3 py-2 border-t border-border">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center justify-center rounded-lg py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
            </button>
          </div>

          {/* User area */}
          <div className="border-t border-border p-3">
            <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold ring-1 ring-primary/20">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate capitalize">
                    {user?.role?.replace(/_/g, ' ').toLowerCase()}
                  </p>
                </div>
              )}
              {!collapsed && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Logout</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div
          className={cn(
            'transition-all duration-200',
            collapsed ? 'lg:pl-[var(--sidebar-width-collapsed)]' : 'lg:pl-[var(--sidebar-width)]'
          )}
        >
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Separator orientation="vertical" className="h-5 lg:hidden" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/15 lg:hidden">
                <Church className="h-3.5 w-3.5 text-primary" />
              </div>
              <h1 className="text-sm font-semibold truncate">{currentPageLabel}</h1>
            </div>
            {/* User avatar on mobile header */}
            <div className="ml-auto flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold ring-1 ring-primary/20">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
          </header>

          {/* Page content — pb-20 on mobile so bottom nav doesn't overlap */}
          <main className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-7xl animate-fade-in">
            <Outlet />
          </main>
        </div>

        {/* Bottom navigation — mobile only */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-card border-t border-border safe-area-bottom">
          <div className="flex items-stretch h-16">
            {bottomNavItems.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors active:scale-95',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center rounded-full w-8 h-6 transition-colors',
                    isActive ? 'bg-primary/15' : ''
                  )}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <span className="leading-none">{item.label}</span>
                </Link>
              );
            })}
            {showMore && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors active:scale-95"
              >
                <div className="flex items-center justify-center w-8 h-6">
                  <MoreHorizontal className="h-[18px] w-[18px]" />
                </div>
                <span className="leading-none">More</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
