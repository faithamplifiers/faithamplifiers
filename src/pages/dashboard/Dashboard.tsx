import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Briefcase,
  Users,
  BarChart2,
  Settings as SettingsIcon,
  LogOut,
  MessageSquare,
  Activity,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Crown,
  CreditCard
} from 'lucide-react';
import Logo from '../../components/ui/Logo';
import ThemeToggle from '../../components/ui/ThemeToggle';
import toast from 'react-hot-toast';

// Dashboard components
import DashboardHome from './DashboardHome';
import ContentManager from './ContentManager';
import EventManager from './EventManager';
import ServiceManager from './ServiceManager';
import UserManager from './UserManager';
import Analytics from './Analytics';
import Settings from './Settings';
import Activities from './Activities';
import UpgradePlan from './UpgradePlan';
import PaymentsHistory from './PaymentsHistory';


interface NavItem {
  name: string;
  icon: React.ElementType;
  href: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'My Content', icon: FileText, href: '/dashboard/content' },
  { name: 'Events', icon: Calendar, href: '/dashboard/events' },
  { name: 'Services', icon: Briefcase, href: '/dashboard/services' },
  { name: 'Upgrade Plan', icon: Crown, href: '/dashboard/upgrade' },
  { name: 'Billing & History', icon: CreditCard, href: '/dashboard/payments' },
  { name: 'Members', icon: Users, href: '/dashboard/users' },
  { name: 'Analytics', icon: BarChart2, href: '/dashboard/analytics' },
  { name: 'Activities', icon: Activity, href: '/dashboard/activities' },
  { name: 'Settings', icon: SettingsIcon, href: '/dashboard/settings' },
];

const SidebarLink: React.FC<{ item: NavItem; onClick?: () => void }> = ({ item, onClick }) => {
  const location = useLocation();
  const isActive =
    item.href === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(item.href);

  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 group ${
        isActive
          ? 'bg-secondary text-white shadow-md shadow-secondary/30'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-secondary dark:hover:text-secondary'
      }`}
    >
      <item.icon
        className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
          isActive ? 'text-white' : 'text-gray-400 group-hover:text-secondary'
        }`}
      />
      <span>{item.name}</span>
      {isActive && <ChevronRight className="w-4 h-4 ml-auto text-white/70" />}
    </Link>
  );
};

import ScrollToTop from '../../components/layout/ScrollToTop';

const Dashboard: React.FC = () => {
  const { user, profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleSignOut = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      await signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Sign out failed:', err);
      window.location.href = '/login';
    }
  };

  const avatarLetter = profile?.full_name?.charAt(0).toUpperCase() || profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    // Full-page layout — no public header, no footer
    <div className="flex h-screen overflow-hidden bg-gray-55 dark:bg-gray-900">
      <ScrollToTop />
      {/* ── Sidebar (Desktop) ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        {/* Branding */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <Logo className="w-8 h-8" />
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">Faith Amplifiers</p>
            <p className="text-xs text-secondary font-medium capitalize">{profile?.role?.replace('_', ' ') || 'Creator'} Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <SidebarLink key={item.name} item={item} />
          ))}
        </nav>

        {/* User Section */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {profile?.full_name || profile?.username || 'Creator'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 flex flex-col shadow-2xl z-50">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Logo className="w-8 h-8" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">Faith Amplifiers</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => (
                <SidebarLink key={item.name} item={item} onClick={() => setSidebarOpen(false)} />
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-4 flex items-center gap-4 flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <PageTitle />
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-secondary dark:hover:text-secondary transition-colors font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Return to Website
            </Link>
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs">
              {avatarLetter}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/content/*" element={<ContentManager />} />
            <Route path="/events/*" element={<EventManager />} />
            <Route path="/services/*" element={<ServiceManager />} />
            <Route path="/users/*" element={<UserManager />} />
             <Route path="/analytics" element={<Analytics />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/upgrade" element={<UpgradePlan />} />
            <Route path="/payments" element={<PaymentsHistory />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Dynamic page title based on route
const PageTitle: React.FC = () => {
  const location = useLocation();
  const item = navigation.find((n) =>
    n.href === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(n.href)
  );
  return (
    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
      {item?.name || 'Dashboard'}
    </h1>
  );
};

export default Dashboard;