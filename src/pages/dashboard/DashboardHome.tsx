import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  Users,
  Calendar,
  FileText,
  MessageSquare,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Plus,
  Shield,
  Search,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchRecentActivity } from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface DashboardHomeProps {
  isAdmin?: boolean;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ isAdmin = false }) => {
  const { user, profile } = useAuthStore();
  const basePath = isAdmin ? '/fa-admin' : '/dashboard';

  const [showNewsletter, setShowNewsletter] = useState(false);

  useEffect(() => {
    if (!isAdmin && user && profile && !profile.newsletter_subscribed) {
      const alreadyPrompted = localStorage.getItem('fa_newsletter_prompted');
      if (!alreadyPrompted) {
        // Delay slightly for smooth UX
        const timer = setTimeout(() => setShowNewsletter(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isAdmin, user, profile]);

  const handleNewsletterResponse = async (subscribe: boolean) => {
    if (subscribe && user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ newsletter_subscribed: true })
          .eq('id', user.id);
        if (error) throw error;
        toast.success('Successfully subscribed to newsletter! 📧');
      } catch (err) {
        console.error('Newsletter error:', err);
      }
    }
    localStorage.setItem('fa_newsletter_prompted', 'true');
    setShowNewsletter(false);
  };

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', isAdmin, user?.id],
    queryFn: () => fetchDashboardStats(isAdmin ? undefined : user?.id)
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard-activity', isAdmin, user?.id],
    queryFn: () => fetchRecentActivity(isAdmin ? undefined : user?.id)
  });

  const stats = [
    { 
      name: 'Total Users', 
      value: statsData?.users.toLocaleString() || '0', 
      icon: Users, 
      change: '+12%', 
      color: 'secondary',
      link: `${basePath}/users`,
      visible: isAdmin
    },
    { 
      name: 'Active Events', 
      value: statsData?.events.toLocaleString() || '0', 
      icon: Calendar, 
      change: '+23%', 
      color: 'primary',
      link: `${basePath}/events`,
      visible: true
    },
    { 
      name: 'Content Pieces', 
      value: statsData?.content.toLocaleString() || '0', 
      icon: FileText, 
      change: '+8%', 
      color: 'amber',
      link: `${basePath}/content`,
      visible: true
    },
    { 
      name: 'Services', 
      value: statsData?.services.toLocaleString() || '0', 
      icon: MessageSquare, 
      change: '+42%', 
      color: 'indigo',
      link: `${basePath}/services`,
      visible: true
    },
  ].filter(s => s.visible);

  const shortcuts = [
    { label: 'Moderate Content', icon: Shield, link: `${basePath}/content` },
    { label: 'View Public Site', icon: ExternalLink, link: '/' },
    { label: 'User Directory', icon: Users, link: `${basePath}/users` },
    { label: 'Event Planning', icon: Calendar, link: `${basePath}/events` }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Newsletter subscription prompt modal */}
      {showNewsletter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Stay Inspired!
            </h3>
            <p className="text-gray-650 dark:text-gray-350 text-center mb-8 leading-relaxed text-sm">
              Would you like to receive our newsletter? Stay updated with the latest gospel news, upcoming events, and community stories. You can unsubscribe anytime.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleNewsletterResponse(true)}
                className="w-full btn btn-primary py-3 text-base font-bold shadow-lg shadow-primary/20"
              >
                Yes, Subscribe Me
              </button>
              <button 
                onClick={() => handleNewsletterResponse(false)}
                className="w-full py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold transition-colors text-sm"
              >
                No thanks, skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
            {isAdmin ? "Your community platform is growing. Here's your summary for today." : "Amplify your faith. Check out your dashboard summary below."}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link to={`${basePath}/content`} className="btn btn-outline btn-sm flex-1 md:flex-none flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            New Post
          </Link>
          <Link to={`${basePath}/events`} className="btn btn-secondary btn-sm flex-1 md:flex-none flex items-center justify-center gap-2 shadow-lg shadow-secondary/20">
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} gap-6`}>
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.link}>
            <StatCard {...stat} isLoading={statsLoading} />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary" />
                Recent Activity
              </h2>
              <Link to={`${basePath}/content`} className="text-xs font-bold text-secondary uppercase tracking-widest hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {activitiesLoading ? (
                <div className="p-12 flex justify-center"><LoadingSpinner /></div>
              ) : activities?.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No activity yet.</div>
              ) : activities?.map((activity) => (
                <div
                  key={activity.id}
                  className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 group-hover:scale-110 transition-transform`}>
                      <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                        {activity.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {activity.time} • {activity.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 capitalize">
                      {activity.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-indigo-900 p-8 rounded-2xl text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Platform Health</h3>
              <p className="text-white/70 text-sm mb-6">Database connected and services are operational.</p>
              <div className="flex items-center gap-4">
                 <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                 </div>
                 <span className="text-sm font-bold">100%</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Shortcuts</h3>
            <div className="grid grid-cols-2 gap-3">
               {shortcuts.map((item, i) => (
                 <Link key={i} to={item.link} className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-50 dark:border-gray-700 hover:border-secondary hover:bg-secondary/5 transition-all gap-2 group text-center">
                    <item.icon className="w-5 h-5 text-gray-400 group-hover:text-secondary" />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">{item.label}</span>
                 </Link>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ 
  name: string; 
  value: string; 
  change: string; 
  icon: any; 
  color: string;
  isLoading: boolean;
}> = ({ name, value, change, icon: Icon, color, isLoading }) => {
  const colorMap: any = {
    secondary: 'text-secondary bg-secondary/10',
    primary: 'text-primary bg-primary/10',
    amber: 'text-amber-500 bg-amber-500/10',
    indigo: 'text-indigo-500 bg-indigo-500/10',
  };

  const isPositive = change.startsWith('+');

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-xl hover:shadow-primary/5 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {change}
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{name}</p>
      {isLoading ? (
        <div className="h-9 w-24 bg-gray-100 dark:bg-gray-700 animate-pulse rounded" />
      ) : (
        <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
      )}
    </div>
  );
};

export default DashboardHome;