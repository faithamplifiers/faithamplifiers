import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Info, Mail, FileText, Calendar, Grid, BookOpen, ChevronRight, Layout 
} from 'lucide-react';

const PageEditorsList: React.FC = () => {
  const pages = [
    {
      name: 'Home Page',
      description: 'Manage the hero slider slides and main call-to-action blocks.',
      icon: Home,
      href: '/fa-admin/page-editors/home',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      name: 'About Page',
      description: 'Manage hero banner, mission, vision, core values, and team members.',
      icon: Info,
      href: '/fa-admin/page-editors/about',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      name: 'Contact Page',
      description: 'Manage header details, office address, phone, email, and support hours.',
      icon: Mail,
      href: '/fa-admin/page-editors/contact',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      name: 'News Page',
      description: 'Manage header title and intro copy for latest articles & updates.',
      icon: FileText,
      href: '/fa-admin/page-editors/news',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      name: 'Events Page',
      description: 'Manage headers and intro titles for upcoming events listing.',
      icon: Calendar,
      href: '/fa-admin/page-editors/events',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    {
      name: 'Services Page',
      description: 'Manage description headings and title for service bookings.',
      icon: Grid,
      href: '/fa-admin/page-editors/services',
      color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      name: 'Directory Page',
      description: 'Manage gospel business directory titles and introduction banners.',
      icon: Layout,
      href: '/fa-admin/page-editors/directory',
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    {
      name: 'Resources Page',
      description: 'Manage spiritual growth library subheadings and titles.',
      icon: BookOpen,
      href: '/fa-admin/page-editors/resources',
      color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Page Section Editors</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select a system page to customize its banners, headers, and section details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((page) => {
          const Icon = page.icon;
          return (
            <Link
              key={page.name}
              to={page.href}
              className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-secondary dark:hover:border-secondary shadow-sm hover:shadow-md transition-all group"
            >
              <div className={`p-3 rounded-xl ${page.color} flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-secondary transition-colors truncate">
                  {page.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  {page.description}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-450 dark:text-gray-500 group-hover:text-secondary transition-colors flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default PageEditorsList;
