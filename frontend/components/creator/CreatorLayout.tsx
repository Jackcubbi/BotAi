import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../shared/ConfirmDialog';
import {
  Bot,
  TrendingUp,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Plus,
  LayoutDashboard
} from 'lucide-react';

export default function CreatorLayout() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  React.useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      navigate('/login?redirect=/creator/dashboard');
    }
  }, [user, navigate, isLoading]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/creator/dashboard', icon: LayoutDashboard },
    { name: 'My Bots', href: '/creator/bots', icon: Bot },
    { name: 'Create New Bot', href: '/creator/bots/create', icon: Plus },
    { name: 'Conversations', href: '/creator/conversations', icon: MessageSquare },
    { name: 'Analytics', href: '/creator/analytics', icon: TrendingUp },
    { name: 'Settings', href: '/creator/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/creator/dashboard') {
      return location.pathname === '/creator/dashboard' || location.pathname === '/creator';
    }
    if (path === '/creator/bots') {
      return location.pathname === '/creator/bots' && !location.pathname.includes('create') && !location.pathname.includes('analytics');
    }
    return location.pathname.startsWith(path);
  };

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const userInitial = ((user.email && user.email.trim().charAt(0)) || 'U').toUpperCase();

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
            <Link to="/creator/dashboard" className="font-space-grotesk font-bold text-xl text-white flex items-center gap-2">
              Creator Hub
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
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-botai-grey-line">
            <div className="flex items-center gap-3 px-4 py-3 mb-2 text-white">
              <div className="w-10 h-10 rounded-full bg-botai-accent-green flex items-center justify-center text-botai-black font-bold">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-noto-sans font-semibold text-sm truncate">
                  {(user as any).full_name || 'Creator'}
                </p>
                <p className="text-xs text-botai-grey-text truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-white hover:bg-botai-dark transition-colors font-noto-sans"
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
                Home
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

