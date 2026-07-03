import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  Save, Plus, Trash2, ChevronDown, ChevronUp,
  User, Heart, Users, Globe, Award, Upload, Loader2,
  BookOpen, Eye, Target, Handshake, Info, Layout, AlignLeft,
  PhoneCall, Grid, Calendar, FileText, MapPin, Clock, HelpCircle,
  Check, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────
interface SectionField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'number';
  placeholder?: string;
  rows?: number;
}

interface SectionConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  fields: SectionField[];
  defaultData: Record<string, any>;
  /** If true, this section supports a list of items with icon, title, description */
  hasList?: boolean;
  listLabel?: string;
  /** If true, this section supports team-style members list */
  hasTeam?: boolean;
  teamLabel?: string;
}

interface PageEditorConfig {
  pageSlug: string;
  pageTitle: string;
  pageDescription: string;
  sections: SectionConfig[];
}

// ─── Icon Mapping ──────────────────────────────────────────────────
const ICON_OPTIONS = ['Heart', 'Users', 'Award', 'Globe', 'BookOpen', 'Target', 'Handshake', 'Info', 'Check', 'HelpCircle'] as const;
const ICON_MAP: Record<string, React.ReactNode> = {
  Heart: <Heart className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Award: <Award className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  BookOpen: <BookOpen className="w-5 h-5" />,
  Target: <Target className="w-5 h-5" />,
  Handshake: <Handshake className="w-5 h-5" />,
  Info: <Info className="w-5 h-5" />,
  Check: <Check className="w-5 h-5" />,
  HelpCircle: <HelpCircle className="w-5 h-5" />,
};

// ─── Section Collapse Wrapper ─────────────────────────────────────
const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3 text-gray-900 dark:text-white font-semibold">
          <span className="text-secondary">{icon}</span>
          {title}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700 pt-5 space-y-4">{children}</div>}
    </div>
  );
};

// ─── Save Button Helper ────────────────────────────────────────────
const SaveBtn: React.FC<{ section: string; saving: string | null; onSave: () => void }> = ({ section, saving, onSave }) => (
  <div className="flex justify-end pt-2">
    <button
      onClick={onSave}
      disabled={!!saving}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary hover:text-white font-semibold text-sm transition-all"
    >
      {saving === section ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      Save Section
    </button>
  </div>
);

// ─── Input helpers ─────────────────────────────────────────────────
const inputCls = "w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-sm";
const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

// ─── Page Section Configs ──────────────────────────────────────────

export const HOME_PAGE_CONFIG: PageEditorConfig = {
  pageSlug: 'home',
  pageTitle: 'Home Page Editor',
  pageDescription: 'Manage the hero slider and intro sections displayed on the home page',
  sections: [
    {
      key: 'hero_slide_1',
      label: 'Hero Slide 1',
      icon: <Layout className="w-5 h-5" />,
      fields: [
        { key: 'title', label: 'Slide Title', type: 'text', placeholder: 'Amplify Your Faith Journey' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Discover the latest gospel news...', rows: 3 },
        { key: 'image', label: 'Background Image URL', type: 'url', placeholder: 'https://...' },
        { key: 'link', label: 'Button Link', type: 'text', placeholder: '/news' },
        { key: 'buttonText', label: 'Button Text', type: 'text', placeholder: 'Explore News' },
      ],
      defaultData: {
        title: 'Amplify Your Faith Journey',
        subtitle: 'Discover the latest gospel news, events, and resources to strengthen your spiritual walk.',
        image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1170&q=80',
        link: '/news',
        buttonText: 'Explore News',
      },
    },
    {
      key: 'hero_slide_2',
      label: 'Hero Slide 2',
      icon: <Layout className="w-5 h-5" />,
      fields: [
        { key: 'title', label: 'Slide Title', type: 'text', placeholder: 'Professional Services for Ministry' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'From livestreaming to event production...', rows: 3 },
        { key: 'image', label: 'Background Image URL', type: 'url', placeholder: 'https://...' },
        { key: 'link', label: 'Button Link', type: 'text', placeholder: '/services' },
        { key: 'buttonText', label: 'Button Text', type: 'text', placeholder: 'View Services' },
      ],
      defaultData: {
        title: 'Professional Services for Ministry',
        subtitle: 'From livestreaming to event production, we provide the tools you need to share your message.',
        image: 'https://images.unsplash.com/photo-1603731125896-1e4ce9d4b6b5?auto=format&fit=crop&w=1170&q=80',
        link: '/services',
        buttonText: 'View Services',
      },
    },
    {
      key: 'hero_slide_3',
      label: 'Hero Slide 3',
      icon: <Layout className="w-5 h-5" />,
      fields: [
        { key: 'title', label: 'Slide Title', type: 'text', placeholder: 'Connect with Gospel Events' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Find and promote concerts...', rows: 3 },
        { key: 'image', label: 'Background Image URL', type: 'url', placeholder: 'https://...' },
        { key: 'link', label: 'Button Link', type: 'text', placeholder: '/events' },
        { key: 'buttonText', label: 'Button Text', type: 'text', placeholder: 'Discover Events' },
      ],
      defaultData: {
        title: 'Connect with Gospel Events',
        subtitle: 'Find and promote concerts, workshops, and faith-based gatherings in your community.',
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1170&q=80',
        link: '/events',
        buttonText: 'Discover Events',
      },
    },
    {
      key: 'cta',
      label: 'Call to Action',
      icon: <PhoneCall className="w-5 h-5" />,
      fields: [
        { key: 'title', label: 'Headline', type: 'text', placeholder: 'Ready to Amplify Your Faith?' },
        { key: 'text', label: 'Body Text', type: 'textarea', placeholder: 'Join our growing community...', rows: 3 },
        { key: 'primary_label', label: 'Primary Button Label', type: 'text', placeholder: 'Join Us' },
        { key: 'primary_link', label: 'Primary Button Link', type: 'text', placeholder: '/register' },
        { key: 'secondary_label', label: 'Secondary Button Label', type: 'text', placeholder: 'Learn More' },
        { key: 'secondary_link', label: 'Secondary Button Link', type: 'text', placeholder: '/about' },
      ],
      defaultData: {
        title: 'Ready to Amplify Your Faith?',
        text: 'Join our community of believers and access premium resources, connect with others, and grow in your spiritual journey.',
        primary_label: 'Join Us',
        primary_link: '/register',
        secondary_label: 'Learn More',
        secondary_link: '/about',
      },
    },
  ],
};

export const CONTACT_PAGE_CONFIG: PageEditorConfig = {
  pageSlug: 'contact',
  pageTitle: 'Contact Page Editor',
  pageDescription: 'Manage the header and contact information displayed on the Contact page',
  sections: [
    {
      key: 'hero',
      label: 'Page Header',
      icon: <Eye className="w-5 h-5" />,
      fields: [
        { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Get In Touch' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Have a question or want to connect?...', rows: 3 },
      ],
      defaultData: { title: 'Get In Touch', subtitle: 'Have a question, suggestion, or want to connect? We\'d love to hear from you.' },
    },
    {
      key: 'info',
      label: 'Contact Information',
      icon: <MapPin className="w-5 h-5" />,
      fields: [
        { key: 'email', label: 'Email Address', type: 'text', placeholder: 'faithamplifiers@gmail.com' },
        { key: 'phone', label: 'Phone Number', type: 'text', placeholder: '+234 xxx xxx xxxx' },
        { key: 'address', label: 'Office Address', type: 'textarea', placeholder: 'Lagos, Nigeria', rows: 2 },
        { key: 'hours', label: 'Office Hours', type: 'text', placeholder: 'Monday - Friday: 9am - 5pm' },
      ],
      defaultData: {
        email: 'faithamplifiers@gmail.com',
        phone: '+234 000 000 0000',
        address: 'Lagos, Nigeria',
        hours: 'Monday - Friday: 9am - 5pm WAT',
      },
    },
  ],
};

export const NEWS_PAGE_CONFIG: PageEditorConfig = {
  pageSlug: 'news',
  pageTitle: 'News Page Editor',
  pageDescription: 'Manage the header and intro text displayed on the News page',
  sections: [
    {
      key: 'hero',
      label: 'Page Header',
      icon: <Eye className="w-5 h-5" />,
      fields: [
        { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Gospel News & Updates' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Stay informed with the latest...', rows: 3 },
      ],
      defaultData: { title: 'Gospel News & Updates', subtitle: 'Stay informed with the latest news, stories, and updates from the gospel community.' },
    },
  ],
};

export const EVENTS_PAGE_CONFIG: PageEditorConfig = {
  pageSlug: 'events',
  pageTitle: 'Events Page Editor',
  pageDescription: 'Manage the header and intro text displayed on the Events page',
  sections: [
    {
      key: 'hero',
      label: 'Page Header',
      icon: <Eye className="w-5 h-5" />,
      fields: [
        { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Gospel Events' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Discover and connect with faith-based events...', rows: 3 },
      ],
      defaultData: { title: 'Gospel Events', subtitle: 'Discover and connect with faith-based events happening in your community and beyond.' },
    },
  ],
};

export const SERVICES_PAGE_CONFIG: PageEditorConfig = {
  pageSlug: 'services',
  pageTitle: 'Services Page Editor',
  pageDescription: 'Manage the header and intro text displayed on the Services page',
  sections: [
    {
      key: 'hero',
      label: 'Page Header',
      icon: <Eye className="w-5 h-5" />,
      fields: [
        { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Professional Services' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Find and hire trusted professionals...', rows: 3 },
      ],
      defaultData: { title: 'Professional Services', subtitle: 'Find and hire trusted professionals for livestreaming, audio engineering, event production, and more.' },
    },
  ],
};

export const DIRECTORY_PAGE_CONFIG: PageEditorConfig = {
  pageSlug: 'directory',
  pageTitle: 'Directory Page Editor',
  pageDescription: 'Manage the header and intro text displayed on the Directory page',
  sections: [
    {
      key: 'hero',
      label: 'Page Header',
      icon: <Eye className="w-5 h-5" />,
      fields: [
        { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Gospel Business Directory' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Connect with trusted professionals...', rows: 3 },
      ],
      defaultData: { title: 'Gospel Business Directory', subtitle: 'Connect with trusted professionals and businesses in the gospel community.' },
    },
  ],
};

export const RESOURCES_PAGE_CONFIG: PageEditorConfig = {
  pageSlug: 'resources',
  pageTitle: 'Resources Page Editor',
  pageDescription: 'Manage the header and intro text displayed on the Resources page',
  sections: [
    {
      key: 'hero',
      label: 'Page Header',
      icon: <Eye className="w-5 h-5" />,
      fields: [
        { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Spiritual Growth Resources' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Discover videos, podcasts, and devotionals...', rows: 3 },
      ],
      defaultData: { title: 'Spiritual Growth Resources', subtitle: 'Discover videos, podcasts, and devotionals to strengthen your faith journey.' },
    },
  ],
};

// ─── Generic Page Section Editor Component ─────────────────────────
interface PageSectionEditorProps {
  config: PageEditorConfig;
}

const PageSectionEditor: React.FC<PageSectionEditorProps> = ({ config }) => {
  const queryClient = useQueryClient();
  const [sectionData, setSectionData] = useState<Record<string, Record<string, any>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Initialize defaults
  useEffect(() => {
    const defaults: Record<string, Record<string, any>> = {};
    config.sections.forEach(s => {
      defaults[s.key] = { ...s.defaultData };
    });
    setSectionData(defaults);
  }, [config.pageSlug]);

  // Fetch from DB
  const { data: rows, isLoading } = useQuery({
    queryKey: ['page_sections', config.pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', config.pageSlug);
      if (error) throw error;
      return data;
    },
  });

  // Hydrate form state from DB rows
  useEffect(() => {
    if (!rows) return;
    const map: Record<string, any> = {};
    rows.forEach((r: any) => { map[r.section] = r.content; });

    setSectionData(prev => {
      const next = { ...prev };
      config.sections.forEach(s => {
        if (map[s.key]) {
          next[s.key] = { ...s.defaultData, ...map[s.key] };
        }
      });
      return next;
    });
  }, [rows]);

  // Update a field in a section
  const updateField = (sectionKey: string, fieldKey: string, value: any) => {
    setSectionData(prev => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [fieldKey]: value },
    }));
  };

  // Save a single section
  const saveSection = async (sectionKey: string) => {
    setSaving(sectionKey);
    try {
      const { error } = await supabase
        .from('page_sections')
        .upsert(
          { page_slug: config.pageSlug, section: sectionKey, content: sectionData[sectionKey], updated_at: new Date().toISOString() },
          { onConflict: 'page_slug,section' }
        );
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['page_sections', config.pageSlug] });
      toast.success(`"${sectionKey.replace(/_/g, ' ')}" section saved!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save section');
    } finally {
      setSaving(null);
    }
  };

  // Save all sections at once
  const saveAll = async () => {
    setSaving('all');
    try {
      const upserts = config.sections.map(s => ({
        page_slug: config.pageSlug,
        section: s.key,
        content: sectionData[s.key] || s.defaultData,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('page_sections')
        .upsert(upserts, { onConflict: 'page_slug,section' });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['page_sections', config.pageSlug] });
      toast.success('All sections saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/fa-admin/page-editors"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{config.pageTitle}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{config.pageDescription}</p>
          </div>
        </div>
        <button
          onClick={saveAll}
          disabled={saving === 'all'}
          className="btn btn-secondary flex items-center gap-2 shadow-lg shadow-secondary/20"
        >
          {saving === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All
        </button>
      </div>

      {/* Sections */}
      {config.sections.map((section, idx) => (
        <SectionCard
          key={section.key}
          title={section.label}
          icon={section.icon}
          defaultOpen={idx === 0}
        >
          {section.fields.map(field => (
            <div key={field.key}>
              <label className={labelCls}>{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  rows={field.rows || 3}
                  className={inputCls}
                  value={sectionData[section.key]?.[field.key] || ''}
                  placeholder={field.placeholder}
                  onChange={e => updateField(section.key, field.key, e.target.value)}
                />
              ) : (
                <input
                  type={field.type}
                  className={inputCls}
                  value={sectionData[section.key]?.[field.key] || ''}
                  placeholder={field.placeholder}
                  onChange={e => updateField(section.key, field.key, e.target.value)}
                />
              )}
            </div>
          ))}
          <SaveBtn section={section.key} saving={saving} onSave={() => saveSection(section.key)} />
        </SectionCard>
      ))}

      {/* Bottom Save All */}
      <div className="flex justify-end pb-6">
        <button
          onClick={saveAll}
          disabled={saving === 'all'}
          className="btn btn-primary flex items-center gap-2 shadow-xl shadow-primary/30 px-8 py-3 text-base"
        >
          {saving === 'all' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save All Changes
        </button>
      </div>
    </div>
  );
};

export default PageSectionEditor;
