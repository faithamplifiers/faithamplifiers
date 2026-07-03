import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, Plus, Edit, Trash2, Save, Globe, Eye, Search, X, Check, FileEdit,
  ChevronDown, ChevronUp, ArrowUp, ArrowDown, Upload, Loader2, Info, Grid,
  Calendar, Users, AlignLeft, AlignCenter, AlignRight, Layout, PhoneCall, HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// ─── Interfaces ───────────────────────────────────────────────────
interface PageItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

interface Section {
  id: string;
  type: 'hero' | 'text' | 'features' | 'team' | 'cta' | 'contact_form' | 'services_grid' | 'events_grid' | 'news_grid';
  data: any;
}

// ─── Constants ────────────────────────────────────────────────────
const SECTION_TYPES = [
  { value: 'hero', label: 'Hero Banner', icon: Layout, desc: 'Intro block with title, subtitle, CTA button and image' },
  { value: 'text', label: 'Text Block', icon: AlignLeft, desc: 'Rich text block for descriptions, articles, or policies' },
  { value: 'features', label: 'Features Grid', icon: Grid, desc: 'Grid of highlights, features, or values with icons' },
  { value: 'team', label: 'Team Members', icon: Users, desc: 'Collapsible grid of profile photos, roles, and bios' },
  { value: 'cta', label: 'Call to Action', icon: PhoneCall, desc: 'Attention-grabbing block with conversion buttons' },
  { value: 'contact_form', label: 'Contact Form', icon: PhoneCall, desc: 'Embeds a working email contact submission form' },
  { value: 'services_grid', label: 'Dynamic Services Grid', icon: Grid, desc: 'Dynamically fetches & displays gospel services' },
  { value: 'events_grid', label: 'Dynamic Events Grid', icon: Calendar, desc: 'Dynamically lists upcoming community events' },
  { value: 'news_grid', label: 'Dynamic News Grid', icon: FileText, desc: 'Dynamically pulls latest gospel articles' },
] as const;

const ICON_OPTIONS = ['Heart', 'Users', 'Award', 'Globe', 'BookOpen', 'Target', 'Handshake', 'Info', 'Check', 'HelpCircle'] as const;

// Helper to make styling input look cohesive
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-sm";
const labelCls = "block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5";

// ─── PagesManager Component ───────────────────────────────────────
const PagesManager: React.FC = () => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Page level metadata states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Dynamic sections state
  const [sections, setSections] = useState<Section[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [uploadingState, setUploadingState] = useState<string | null>(null); // tracks which section/index is uploading

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  // Convert legacy HTML string content to modular JSON sections array
  const parsePageContent = (rawContent: string, pageTitle: string): Section[] => {
    if (!rawContent) return [];
    try {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Not JSON or legacy content, migrate it as a single Text section
      return [{
        id: `legacy-${Date.now()}`,
        type: 'text',
        data: {
          title: pageTitle,
          content: rawContent
        }
      }];
    }
    return [];
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (!editingId) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  };

  const editPage = (page: PageItem) => {
    setEditingId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setMetaTitle(page.meta_title || '');
    setMetaDescription(page.meta_description || '');
    setStatus(page.status);
    
    const parsedSections = parsePageContent(page.content, page.title);
    setSections(parsedSections);

    // Default open first section
    if (parsedSections.length > 0) {
      setOpenSections({ [parsedSections[0].id]: true });
    } else {
      setOpenSections({});
    }

    setView('editor');
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) {
      toast.error('Title and slug are required');
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      toast.error('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    setIsSaving(true);
    try {
      // Serialize sections back to the content string column
      const contentString = JSON.stringify(sections);

      const pageData = {
        title,
        slug,
        content: contentString,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        status,
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { error } = await supabase
          .from('pages')
          .update(pageData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Page saved successfully!');
      } else {
        const { error } = await supabase
          .from('pages')
          .insert({
            ...pageData,
            created_at: new Date().toISOString()
          });
        if (error) throw error;
        toast.success('Page created successfully!');
      }

      fetchPages();
      setView('list');
      clearForm();
    } catch (error: any) {
      console.error('Error saving page:', error);
      toast.error(error.message || 'Failed to save page. Slug might be taken.');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Page deleted successfully');
      setPages(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Failed to delete page');
    }
  };

  const clearForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setMetaTitle('');
    setMetaDescription('');
    setStatus('draft');
    setSections([]);
    setOpenSections({});
  };

  // ─── Sections operations ─────────────────────────────────────────
  const addSection = (type: Section['type']) => {
    const id = `sec-${Date.now()}`;
    let data: any = {};

    switch (type) {
      case 'hero':
        data = { title: '', subtitle: '', bg_image: '', cta_label: '', cta_link: '', align: 'center' };
        break;
      case 'text':
        data = { title: '', content: '' };
        break;
      case 'features':
        data = { title: '', subtitle: '', items: [] };
        break;
      case 'team':
        data = { title: '', subtitle: '', members: [] };
        break;
      case 'cta':
        data = { title: '', text: '', primary_cta_label: '', primary_cta_link: '', secondary_cta_label: '', secondary_cta_link: '' };
        break;
      case 'contact_form':
        data = { title: 'Contact Us', description: 'Fill out the form below to get in touch.', recipient_email: 'faithamplifiers@gmail.com' };
        break;
      case 'services_grid':
      case 'events_grid':
      case 'news_grid':
        data = { title: '', limit: 6 };
        break;
    }

    setSections(prev => [...prev, { id, type, data }]);
    setOpenSections(prev => ({ ...prev, [id]: true }));
    toast.success(`Section added!`);
  };

  const deleteSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    setSections(prev => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return list;
    });
  };

  const toggleSectionOpen = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMediaUpload = async (sectionIndex: number, file: File, nestedIndex?: number) => {
    const stateKey = `${sectionIndex}-${nestedIndex ?? 'bg'}`;
    setUploadingState(stateKey);
    try {
      const ext = file.name.split('.').pop();
      const path = `cms-pages/${Date.now()}-${sectionIndex}${nestedIndex !== undefined ? `-${nestedIndex}` : ''}.${ext}`;
      
      const { error: uploadErr } = await supabase.storage.from('content').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('content').getPublicUrl(path);
      const url = urlData.publicUrl;

      setSections(prev => {
        const next = [...prev];
        const sec = { ...next[sectionIndex] };
        
        if (nestedIndex !== undefined) {
          // Team members images
          const members = [...(sec.data.members || [])];
          members[nestedIndex] = { ...members[nestedIndex], image: url };
          sec.data = { ...sec.data, members };
        } else {
          // Hero Background Image
          sec.data = { ...sec.data, bg_image: url };
        }

        next[sectionIndex] = sec;
        return next;
      });
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingState(null);
    }
  };

  const filteredPages = pages.filter(p => {
    const matchesFilter = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* CMS Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-primary">Pages CMS</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage dynamic marketing and resource pages on the website</p>
        </div>
        <button
          onClick={() => {
            if (view === 'list') {
              clearForm();
              setView('editor');
            } else {
              setView('list');
            }
          }}
          className="btn btn-secondary flex items-center gap-2"
        >
          {view === 'list' ? (
            <><Plus className="w-5 h-5" /> Create Page</>
          ) : (
            <><Eye className="w-5 h-5" /> Back to List</>
          )}
        </button>
      </div>

      {view === 'list' ? (
        <>
          {/* Filters & Search */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search pages by title or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-750 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-secondary outline-none transition-all text-sm"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {(['all', 'published', 'draft'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    statusFilter === tab
                      ? 'bg-secondary text-primary shadow-sm'
                      : 'bg-gray-105 dark:bg-gray-750 text-gray-655 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* List Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto text-left">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-750">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Page Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">URL Slug</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Last Updated</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-750">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-400">Loading pages...</td>
                    </tr>
                  ) : filteredPages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-400">No pages found. Click "Create Page" to add one!</td>
                    </tr>
                  ) : (
                    filteredPages.map((page) => (
                      <tr key={page.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/30">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 dark:text-white">{page.title}</p>
                          {page.meta_title && <p className="text-xs text-gray-405 mt-0.5">{page.meta_title}</p>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-655 dark:text-gray-400">
                          <code className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded font-mono">
                            {page.slug === 'home' ? '/' : `/${page.slug}`}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                            page.status === 'published'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/20'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-750/30'
                          }`}>
                            {page.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {format(new Date(page.updated_at || page.created_at), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={page.slug === 'home' ? '/' : `/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-450 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-colors"
                              title="Preview Page"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => editPage(page)}
                              className="p-2 text-gray-405 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-colors"
                              title="Edit Page"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {!page.is_system_page && (
                              <button
                                onClick={() => deletePage(page.id)}
                                className="p-2 text-gray-405 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                title="Delete Page"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Section-based Editor view */
        <form onSubmit={handleSavePage} className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-secondary" /> {editingId ? 'Edit Page Layout' : 'Create Custom Page'}
              </h3>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Page Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Terms of Service"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    placeholder="terms-of-service"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>
            </div>

            {/* Visual Sections Editor */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layout className="w-5 h-5 text-secondary" /> Page Sections ({sections.length})
                </h3>
              </div>

              {sections.length === 0 ? (
                <div className="p-12 text-center bg-gray-55 dark:bg-gray-800/40 border border-dashed border-gray-250 dark:border-gray-700 rounded-2xl text-gray-400">
                  <p className="font-semibold text-sm">No sections on this page.</p>
                  <p className="text-xs mt-1">Use the "Add Section" panel below to get started.</p>
                </div>
              ) : (
                sections.map((section, sIndex) => {
                  const sType = SECTION_TYPES.find(t => t.value === section.type);
                  const isOpen = !!openSections[section.id];
                  const SectionIcon = sType?.icon || Info;

                  return (
                    <div key={section.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden">
                      {/* Section Card Header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-750">
                        <button
                          type="button"
                          onClick={() => toggleSectionOpen(section.id)}
                          className="flex items-center gap-3 text-left font-bold text-gray-900 dark:text-white text-sm"
                        >
                          <span className="p-1.5 bg-secondary/15 rounded-lg text-secondary">
                            <SectionIcon className="w-4 h-4" />
                          </span>
                          <div>
                            <span>{sType?.label || 'Custom Section'}</span>
                            <span className="text-[10px] text-gray-405 font-mono ml-2 font-normal block sm:inline">
                              (#{sIndex + 1})
                            </span>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={sIndex === 0}
                            onClick={() => moveSection(sIndex, 'up')}
                            className="p-1.5 text-gray-450 hover:text-secondary disabled:opacity-30 rounded-lg"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={sIndex === sections.length - 1}
                            onClick={() => moveSection(sIndex, 'down')}
                            className="p-1.5 text-gray-450 hover:text-secondary disabled:opacity-30 rounded-lg"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSection(section.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSectionOpen(section.id)}
                            className="p-1 text-gray-455 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Section Card Content fields */}
                      {isOpen && (
                        <div className="p-6 space-y-4">
                          {section.type === 'hero' && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelCls}>Hero Title</label>
                                  <input
                                    type="text"
                                    value={section.data.title || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.title = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>Hero Subtitle</label>
                                  <input
                                    type="text"
                                    value={section.data.subtitle || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.subtitle = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelCls}>CTA Link Destination</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. /services"
                                    value={section.data.cta_link || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.cta_link = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>CTA Button Text</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Find Services"
                                    value={section.data.cta_label || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.cta_label = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={labelCls}>Alignment</label>
                                <div className="flex gap-2">
                                  {(['left', 'center', 'right'] as const).map(alignOpt => (
                                    <button
                                      key={alignOpt}
                                      type="button"
                                      onClick={() => {
                                        const next = [...sections];
                                        next[sIndex].data.align = alignOpt;
                                        setSections(next);
                                      }}
                                      className={`px-4 py-2 border rounded-lg text-xs font-bold transition-all ${
                                        (section.data.align || 'center') === alignOpt
                                          ? 'bg-secondary text-primary border-transparent'
                                          : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                      }`}
                                    >
                                      {alignOpt.toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className={labelCls}>Background Image</label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="text"
                                    placeholder="https://..."
                                    value={section.data.bg_image || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.bg_image = e.target.value;
                                      setSections(next);
                                    }}
                                    className={`${inputCls} flex-1`}
                                  />
                                  <label className="btn btn-outline py-2.5 flex items-center gap-2 cursor-pointer text-xs">
                                    <Upload className="w-4 h-4" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) handleMediaUpload(sIndex, file);
                                      }}
                                    />
                                    {uploadingState === `${sIndex}-bg` ? 'Uploading...' : 'Upload'}
                                  </label>
                                </div>
                              </div>
                            </>
                          )}

                          {section.type === 'text' && (
                            <>
                              <div>
                                <label className={labelCls}>Section Title (Optional)</label>
                                <input
                                  type="text"
                                  value={section.data.title || ''}
                                  onChange={e => {
                                    const next = [...sections];
                                    next[sIndex].data.title = e.target.value;
                                    setSections(next);
                                  }}
                                  className={inputCls}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Body Content (HTML allowed)</label>
                                <textarea
                                  rows={8}
                                  value={section.data.content || ''}
                                  onChange={e => {
                                    const next = [...sections];
                                    next[sIndex].data.content = e.target.value;
                                    setSections(next);
                                  }}
                                  placeholder="Enter rich text paragraphs..."
                                  className={inputCls}
                                />
                              </div>
                            </>
                          )}

                          {section.type === 'features' && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelCls}>Section Title</label>
                                  <input
                                    type="text"
                                    value={section.data.title || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.title = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>Subtitle</label>
                                  <input
                                    type="text"
                                    value={section.data.subtitle || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.subtitle = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                              </div>

                              <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-gray-500">FEATURE ITEMS ({section.data.items?.length || 0})</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...sections];
                                      const items = [...(next[sIndex].data.items || [])];
                                      items.push({ icon: 'Heart', title: '', description: '' });
                                      next[sIndex].data.items = items;
                                      setSections(next);
                                    }}
                                    className="text-xs text-secondary flex items-center gap-1 font-bold hover:underline"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Add Feature Item
                                  </button>
                                </div>

                                {(section.data.items || []).map((feat: any, fIdx: number) => (
                                  <div key={fIdx} className="p-4 bg-gray-55 dark:bg-gray-750/30 rounded-xl relative border border-gray-100 dark:border-gray-700/50">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = [...sections];
                                        const items = next[sIndex].data.items.filter((_: any, i: number) => i !== fIdx);
                                        next[sIndex].data.items = items;
                                        setSections(next);
                                      }}
                                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                                      <div>
                                        <label className={labelCls}>Icon</label>
                                        <select
                                          value={feat.icon || 'Heart'}
                                          onChange={e => {
                                            const next = [...sections];
                                            next[sIndex].data.items[fIdx].icon = e.target.value;
                                            setSections(next);
                                          }}
                                          className={inputCls}
                                        >
                                          {ICON_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <label className={labelCls}>Title</label>
                                        <input
                                          type="text"
                                          value={feat.title || ''}
                                          onChange={e => {
                                            const next = [...sections];
                                            next[sIndex].data.items[fIdx].title = e.target.value;
                                            setSections(next);
                                          }}
                                          className={inputCls}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className={labelCls}>Description</label>
                                      <textarea
                                        rows={2}
                                        value={feat.description || ''}
                                        onChange={e => {
                                          const next = [...sections];
                                          next[sIndex].data.items[fIdx].description = e.target.value;
                                          setSections(next);
                                        }}
                                        className={inputCls}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {section.type === 'team' && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelCls}>Section Title</label>
                                  <input
                                    type="text"
                                    value={section.data.title || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.title = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>Subtitle</label>
                                  <input
                                    type="text"
                                    value={section.data.subtitle || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.subtitle = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                              </div>

                              <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-gray-500">TEAM MEMBERS ({section.data.members?.length || 0})</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...sections];
                                      const members = [...(next[sIndex].data.members || [])];
                                      members.push({ name: '', role: '', bio: '', image: '' });
                                      next[sIndex].data.members = members;
                                      setSections(next);
                                    }}
                                    className="text-xs text-secondary flex items-center gap-1 font-bold hover:underline"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Add Team Member
                                  </button>
                                </div>

                                {(section.data.members || []).map((member: any, mIdx: number) => (
                                  <div key={mIdx} className="p-4 bg-gray-55 dark:bg-gray-755/30 rounded-xl relative border border-gray-100 dark:border-gray-700/50">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = [...sections];
                                        const members = next[sIndex].data.members.filter((_: any, i: number) => i !== mIdx);
                                        next[sIndex].data.members = members;
                                        setSections(next);
                                      }}
                                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                                      <div>
                                        <label className={labelCls}>Name</label>
                                        <input
                                          type="text"
                                          value={member.name || ''}
                                          onChange={e => {
                                            const next = [...sections];
                                            next[sIndex].data.members[mIdx].name = e.target.value;
                                            setSections(next);
                                          }}
                                          className={inputCls}
                                        />
                                      </div>
                                      <div>
                                        <label className={labelCls}>Role</label>
                                        <input
                                          type="text"
                                          value={member.role || ''}
                                          onChange={e => {
                                            const next = [...sections];
                                            next[sIndex].data.members[mIdx].role = e.target.value;
                                            setSections(next);
                                          }}
                                          className={inputCls}
                                        />
                                      </div>
                                    </div>
                                    <div className="mb-2">
                                      <label className={labelCls}>Bio</label>
                                      <textarea
                                        rows={2}
                                        value={member.bio || ''}
                                        onChange={e => {
                                          const next = [...sections];
                                          next[sIndex].data.members[mIdx].bio = e.target.value;
                                          setSections(next);
                                        }}
                                        className={inputCls}
                                      />
                                    </div>
                                    <div>
                                      <label className={labelCls}>Profile Image</label>
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="text"
                                          placeholder="https://..."
                                          value={member.image || ''}
                                          onChange={e => {
                                            const next = [...sections];
                                            next[sIndex].data.members[mIdx].image = e.target.value;
                                            setSections(next);
                                          }}
                                          className={`${inputCls} flex-1`}
                                        />
                                        <label className="btn btn-outline py-2.5 flex items-center gap-2 cursor-pointer text-xs">
                                          <Upload className="w-4 h-4" />
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={e => {
                                              const file = e.target.files?.[0];
                                              if (file) handleMediaUpload(sIndex, file, mIdx);
                                            }}
                                          />
                                          {uploadingState === `${sIndex}-${mIdx}` ? 'Uploading...' : 'Upload'}
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {section.type === 'cta' && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelCls}>CTA Title</label>
                                  <input
                                    type="text"
                                    value={section.data.title || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.title = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>CTA Text</label>
                                  <input
                                    type="text"
                                    value={section.data.text || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.text = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelCls}>Primary Button Label</label>
                                  <input
                                    type="text"
                                    value={section.data.primary_cta_label || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.primary_cta_label = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>Primary Button Link</label>
                                  <input
                                    type="text"
                                    value={section.data.primary_cta_link || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.primary_cta_link = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelCls}>Secondary Button Label</label>
                                  <input
                                    type="text"
                                    value={section.data.secondary_cta_label || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.secondary_cta_label = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>Secondary Button Link</label>
                                  <input
                                    type="text"
                                    value={section.data.secondary_cta_link || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.secondary_cta_link = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {section.type === 'contact_form' && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelCls}>Title</label>
                                  <input
                                    type="text"
                                    value={section.data.title || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.title = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>Recipient Email</label>
                                  <input
                                    type="email"
                                    value={section.data.recipient_email || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.recipient_email = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={labelCls}>Description</label>
                                <textarea
                                  rows={2}
                                  value={section.data.description || ''}
                                  onChange={e => {
                                    const next = [...sections];
                                    next[sIndex].data.description = e.target.value;
                                    setSections(next);
                                  }}
                                  className={inputCls}
                                />
                              </div>
                            </>
                          )}

                          {(section.type === 'services_grid' || section.type === 'events_grid' || section.type === 'news_grid') && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelCls}>Section Title</label>
                                  <input
                                    type="text"
                                    value={section.data.title || ''}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.title = e.target.value;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>Display Limit</label>
                                  <input
                                    type="number"
                                    value={section.data.limit || 6}
                                    onChange={e => {
                                      const next = [...sections];
                                      next[sIndex].data.limit = parseInt(e.target.value) || 6;
                                      setSections(next);
                                    }}
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* "Add Section" selector toolbar layer */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Plus className="w-4 h-4 text-secondary" /> Add Section To Page
              </h4>
              <p className="text-xs text-gray-500">Choose a section template block below to insert it dynamically into your page layout.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SECTION_TYPES.map((typeObj) => {
                  const SIcon = typeObj.icon;
                  return (
                    <button
                      key={typeObj.value}
                      type="button"
                      onClick={() => addSection(typeObj.value)}
                      className="p-3 border border-gray-150 dark:border-gray-700 rounded-xl hover:border-secondary hover:bg-secondary/5 transition-all text-left flex flex-col justify-between h-24 group"
                    >
                      <span className="p-1 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400 group-hover:text-secondary group-hover:bg-secondary/10 self-start">
                        <SIcon className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="block text-xs font-bold text-gray-900 dark:text-white mt-2">{typeObj.label}</span>
                        <span className="block text-[10px] text-gray-400 line-clamp-1 mt-0.5">{typeObj.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Meta and Status Settings */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-6">
              <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
                SEO & Status Settings
              </h3>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Publish Status
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      status === 'draft'
                        ? 'bg-gray-100 dark:bg-gray-900 border-gray-400 dark:border-gray-600 text-gray-800 dark:text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      status === 'published'
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-400 font-black'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    Published
                  </button>
                </div>
              </div>

              {/* Meta Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Meta Title (Optional)
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Defaults to Page Title"
                  className={inputCls}
                />
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Meta Description (Optional)
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Brief summary for search results..."
                  rows={4}
                  className={inputCls}
                />
              </div>

              {/* Form CTAs */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-755">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="flex-1 py-2 rounded-xl border border-gray-250 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-75 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl bg-secondary text-primary font-black hover:bg-secondary-light transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-60 shadow-md shadow-secondary/15"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  ) : (
                    <><Save className="w-3.5 h-3.5" /> Save Page</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default PagesManager;
