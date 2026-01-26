import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../shared/ConfirmDialog';
import { apiClient } from '../../lib/api';
import { hasAnyPermission, hasPermission } from '../../lib/rbac';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bot,
  TrendingUp,
  DollarSign,
  BarChart3,
  MessageSquare,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [supportBadgeCount, setSupportBadgeCount] = useState(0);

  // Check if user is admin
  const canAccessAdminPanel = hasAnyPermission(user as any, [
    'admin.access',
    'analytics.read',
    'support.manage',
    'users.read',
    'bots.manage',
    'products.manage',
  ]);

  React.useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      navigate('/login?redirect=/admin');
    } else if (!canAccessAdminPanel) {
      navigate('/');
    }
  }, [user, canAccessAdminPanel, navigate, isLoading]);

  React.useEffect(() => {
    if (!user || !canAccessAdminPanel || !hasPermission(user as any, 'support.manage')) return;

    const loadSupportBadge = async () => {
      const response = await apiClient.getAdminSupportConversations({ page: 1, limit: 200 });
      if (response.success && response.data) {
        const conversations = response.data.conversations || [];
        const pendingCount = conversations.reduce((total: number, item: any) => {
          if (!item?.id || item?.status !== 'open') return total;
          return total + Number(item?.unread_count || 0);
        }, 0);
        setSupportBadgeCount(pendingCount);
      }
    };

    loadSupportBadge();
    const intervalId = window.setInterval(loadSupportBadge, 5000);
    return () => window.clearInterval(intervalId);
  }, [user, canAccessAdminPanel]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: 'analytics.read' },
    { name: 'Bots Management', href: '/admin/bots', icon: Bot, permission: 'bots.manage' },
    { name: 'Users & Creators', href: '/admin/users', icon: Users, permission: 'users.read' },
    { name: 'Support Chat', href: '/admin/support-chat', icon: MessageSquare, permission: 'support.manage' },
    { name: 'Revenue', href: '/admin/revenue', icon: DollarSign, permission: 'analytics.read' },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: 'analytics.read' },
    { name: 'Bot Categories', href: '/admin/categories', icon: Package, permission: 'bots.manage' },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck, permission: 'system.manage' },
    { name: 'Platform Settings', href: '/admin/settings', icon: Settings, permission: 'system.manage' },
  ].filter((item) => hasPermission(user as any, item.permission));

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  if (isLoading) {
    return null;
  }

  if (!user || !canAccessAdminPanel) {
    return null;
  }

  return (
    <div className="min-h-screen bg-botai-grey-bg">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-botai-black transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-botai-grey-line">
            <Link to="/admin" className="font-space-grotesk font-bold text-xl text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-botai-accent-green" />
              BotAi Admin
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-botai-accent-green"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg font-noto-sans transition-colors
                    ${active
                      ? 'bg-botai-accent-green text-botai-black font-semibold'
                      : 'bg-botai-dark text-white hover:bg-botai-accent-green hover:text-botai-black'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.name}</span>
                  {item.href === '/admin/support-chat' && supportBadgeCount > 0 && (
                    <span className={`min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center ${active ? 'bg-botai-black text-white' : 'bg-red-500 text-white'}`}>
                      {supportBadgeCount > 99 ? '99+' : supportBadgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-botai-grey-line">
            <div className="flex items-center gap-3 px-4 py-3 mb-2 text-white">
              <div className="w-10 h-10 rounded-full bg-botai-accent-green flex items-center justify-center text-botai-black font-bold">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-noto-sans font-semibold text-sm truncate">
                  {(user as any).full_name || 'Admin'}
                </p>
                <p className="text-xs text-botai-grey-text truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-botai-white bg-botai-dark hover:bg-botai-star hover:text-botai-dark transition-colors font-noto-sans"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-botai-grey-line">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-botai-dark hover:text-botai-accent-green"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <Link
                to="/"
                className="font-noto-sans text-sm text-botai-text hover:text-botai-black"
              >
                View Store
              </Link>
              <Link
                to="/marketplace"
                className="font-noto-sans text-sm text-botai-text hover:text-botai-black"
              >
                Marketplace
              </Link>
              <Link
                to="/account"
                className="font-noto-sans text-sm text-botai-text hover:text-botai-black"
              >
                My Account
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="CONFIRM LOGOUT"
        message="Are you sure you want to logout? You'll need to sign in again to access your account."
        confirmText="LOGOUT"
        cancelText="CANCEL"
        type="logout"
      />
    </div>
  );
}

