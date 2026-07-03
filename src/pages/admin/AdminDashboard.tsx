import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings as SettingsIcon,
  LogOut,
  BarChart2,
  ChevronRight,
  Menu,
  X,
  Shield,
  ExternalLink,
  Calendar,
  Grid,
  Activity,
  Info,
  Mail
} from 'lucide-react';
import Logo from '../../components/ui/Logo';
import ThemeToggle from '../../components/ui/ThemeToggle';
import ContactMessages from './ContactMessages';

// Admin dashboard components
import DashboardHome from '../dashboard/DashboardHome';
import ContentManager from '../dashboard/ContentManager';
import UserManager from './UserManager';
import Analytics from '../dashboard/Analytics';
import AdminSettings from './Settings';
import Activities from '../dashboard/Activities';

import EventManager from '../dashboard/EventManager';
import ServiceManager from '../dashboard/ServiceManager';
import AboutPageEditor from './AboutPageEditor';
import { supabase } from '../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import BookingsManager from './BookingsManager';
import PagesManager from './PagesManager';
import PageEditorsList from './PageEditorsList';
import PageSectionEditor, {
  HOME_PAGE_CONFIG,
  CONTACT_PAGE_CONFIG,
  NEWS_PAGE_CONFIG,
  EVENTS_PAGE_CONFIG,
  SERVICES_PAGE_CONFIG,
  DIRECTORY_PAGE_CONFIG,
  RESOURCES_PAGE_CONFIG
} from './PageSectionEditor';
import { FileEdit } from 'lucide-react';


interface NavItem {
  name: string;
  icon: React.ElementType;
  href: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/fa-admin' },
  { name: 'Content', icon: FileText, href: '/fa-admin/content' },
  { name: 'Events', icon: Calendar, href: '/fa-admin/events' },
  { name: 'Services', icon: Grid, href: '/fa-admin/services' },
  { name: 'Messages', icon: Mail, href: '/fa-admin/messages' },
  { name: 'Bookings', icon: Calendar, href: '/fa-admin/bookings' },
  { name: 'Pages CMS', icon: FileText, href: '/fa-admin/pages' },
  { name: 'Page Editors', icon: FileEdit, href: '/fa-admin/page-editors' },
  { name: 'Users', icon: Users, href: '/fa-admin/users' },
  { name: 'Analytics', icon: BarChart2, href: '/fa-admin/analytics' },
  { name: 'Activities', icon: Activity, href: '/fa-admin/activities' },
  { name: 'Settings', icon: SettingsIcon, href: '/fa-admin/settings' },
];

const SidebarLink: React.FC<{ item: NavItem; onClick?: () => void }> = ({ item, onClick }) => {
  const location = useLocation();
  const isActive =
    item.href === '/fa-admin'
      ? location.pathname === '/fa-admin'
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

const AdminDashboard: React.FC = () => {
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
      window.location.href = '/fa-admin/login';
    } catch (err) {
      console.error('Sign out failed:', err);
      window.location.href = '/fa-admin/login';
    }
  };

  const avatarLetter = profile?.full_name?.charAt(0).toUpperCase() || profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* ── Sidebar (Desktop) ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        {/* Branding */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <Logo className="w-8 h-8" />
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">Faith Amplifiers</p>
            <p className="text-xs text-secondary font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin Portal
            </p>
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {profile?.full_name || profile?.username || 'Administrator'}
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
                <p className="text-sm font-bold text-gray-900 dark:text-white">Admin Portal</p>
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
            <AdminPageTitle />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-secondary dark:hover:text-secondary transition-colors font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Return to Website
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-secondary font-semibold bg-secondary/10 px-2.5 py-1 rounded-full">
              <Shield className="w-3 h-3" /> Admin
            </span>
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold text-xs">
              {avatarLetter}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Routes>
            <Route path="/" element={<DashboardHome isAdmin />} />
            <Route path="/content/*" element={<ContentManager isAdmin />} />
            <Route path="/events/*" element={<EventManager />} />
            <Route path="/services/*" element={<ServiceManager />} />
            <Route path="/messages" element={<ContactMessages />} />
            <Route path="/bookings" element={<BookingsManager />} />
            <Route path="/pages" element={<PagesManager />} />
            <Route path="/page-editors" element={<PageEditorsList />} />
            <Route path="/page-editors/home" element={<PageSectionEditor config={HOME_PAGE_CONFIG} />} />
            <Route path="/page-editors/about" element={<AboutPageEditor />} />
            <Route path="/page-editors/contact" element={<PageSectionEditor config={CONTACT_PAGE_CONFIG} />} />
            <Route path="/page-editors/news" element={<PageSectionEditor config={NEWS_PAGE_CONFIG} />} />
            <Route path="/page-editors/events" element={<PageSectionEditor config={EVENTS_PAGE_CONFIG} />} />
            <Route path="/page-editors/services" element={<PageSectionEditor config={SERVICES_PAGE_CONFIG} />} />
            <Route path="/page-editors/directory" element={<PageSectionEditor config={DIRECTORY_PAGE_CONFIG} />} />
            <Route path="/page-editors/resources" element={<PageSectionEditor config={RESOURCES_PAGE_CONFIG} />} />
            <Route path="/users/*" element={<UserManager />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const AdminPageTitle: React.FC = () => {
  const location = useLocation();
  const item = navigation.find((n) =>
    n.href === '/fa-admin' ? location.pathname === '/fa-admin' : location.pathname.startsWith(n.href)
  );
  return (
    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
      {item?.name || 'Admin Dashboard'}
    </h1>
  );
};



export default AdminDashboard;