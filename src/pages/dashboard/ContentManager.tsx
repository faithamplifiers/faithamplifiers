import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PromptDialog from '../../components/ui/PromptDialog';
import CloudinaryConfigRequiredModal from '../../components/ui/CloudinaryConfigRequiredModal';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Youtube from '@tiptap/extension-youtube';
import { Video, Audio } from '../../components/editor/extensions';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useCloudinaryUpload } from '../../lib/useCloudinaryUpload';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  Trash2,
  Upload,
  Search,
  Plus,
  Edit,
  FileText,
  Clock,
  Eye,
  Check,
  X,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Quote,
  Strikethrough,
  Youtube as YoutubeIcon,
  Video as VideoIcon,
  Music as AudioIcon,
  Cloud,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import UnsavedChangesModal from '../../components/ui/UnsavedChangesModal';

interface ContentForm {
  title: string;
  excerpt: string;
  category: string;
  imageFile?: FileList;
  videoFile?: FileList;
  audioFile?: FileList;
}

interface ContentManagerProps {
  isAdmin?: boolean;
}

const ContentManager: React.FC<ContentManagerProps> = ({ isAdmin = false }) => {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const actualIsAdmin = isAdmin || profile?.role === 'admin' || profile?.role === 'super_admin';
  const [view, setView] = useState<'list' | 'editor' | 'categories'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [editCategoryData, setEditCategoryData] = useState<{id: string, name: string} | null>(null);
  const [showCloudinaryGate, setShowCloudinaryGate] = useState(false);
  
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [existingAudio, setExistingAudio] = useState<string | null>(null);

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [unsavedAction, setUnsavedAction] = useState<(() => void) | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // BYOK Cloudinary hook — non-admins must have this configured to post
  const { uploadFile: cloudinaryUploadFile, isCloudinaryEnabled, loading: cloudinaryLoading } = useCloudinaryUpload();

  const queryClient = useQueryClient();

  const { data: articles = [], isLoading: loading } = useQuery({
    queryKey: ['author_content', user?.id],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('content')
        .select(`
          *,
          author:profiles(*)
        `)
        .order('created_at', { ascending: false });
        
      if (!actualIsAdmin) {
        query = query.eq('author_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && view === 'list'
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['content_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('content_categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Youtube.configure({ inline: false, width: 840, height: 472.5 }),
      Video,
      Audio,
    ],
    content: '',
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { isDirty } } = useForm<ContentForm>();

  const selectedCategory = watch('category');
  
  const hasUnsavedChanges = isDirty || 
    (editor && !editor.isEmpty && editor.getHTML() !== '<p></p>') || 
    !!existingImage || !!existingVideo || !!existingAudio ||
    !!watch('imageFile')?.[0] || !!watch('videoFile')?.[0] || !!watch('audioFile')?.[0];

  const handleNavigation = (action: () => void) => {
    if (view === 'editor' && hasUnsavedChanges) {
      setUnsavedAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  };
  
  useEffect(() => {
    if (selectedCategory === 'new_category') {
      setIsCreatingCategory(true);
      setValue('category', ''); // Clear it so it doesn't submit 'new_category'
    }
  }, [selectedCategory, setValue]);
  
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSubmittingCategory(true);
    const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { error } = await supabase.from('content_categories').insert({ name: newCategoryName, slug });
    setIsSubmittingCategory(false);
    if (error) {
      toast.error('Failed to create category');
    } else {
      toast.success('Category created');
      queryClient.invalidateQueries({ queryKey: ['content_categories'] });
      setIsCreatingCategory(false);
      setNewCategoryName('');
      setValue('category', slug);
    }
  };

  const handlePublish = async (data: ContentForm) => {
    if (!editor || !user) return;
    // Gate non-admin users who haven't configured Cloudinary
    if (!actualIsAdmin && !isCloudinaryEnabled) {
      setShowCloudinaryGate(true);
      return;
    }
    try {
      setIsPublishing(true);
      let imageUrl = '';
      let videoUrl = '';
      let audioUrl = '';

      if (data.imageFile?.[0]) {
        try {
          imageUrl = await cloudinaryUploadFile(data.imageFile[0], 'content');
        } catch (e: any) {
          if (e.message === 'CLOUDINARY_QUOTA_EXHAUSTED') {
            toast.error('Your Cloudinary storage quota is exhausted. Please upgrade your Cloudinary plan to continue uploading.');
            setIsPublishing(false);
            return;
          }
          throw e;
        }
      }
      if (data.videoFile?.[0]) {
        try {
          videoUrl = await cloudinaryUploadFile(data.videoFile[0], 'content');
        } catch (e: any) {
          if (e.message === 'CLOUDINARY_QUOTA_EXHAUSTED') {
            toast.error('Your Cloudinary storage quota is exhausted. Please upgrade your Cloudinary plan.');
            setIsPublishing(false);
            return;
          }
          throw e;
        }
      }
      if (data.audioFile?.[0]) {
        try {
          audioUrl = await cloudinaryUploadFile(data.audioFile[0], 'content');
        } catch (e: any) {
          if (e.message === 'CLOUDINARY_QUOTA_EXHAUSTED') {
            toast.error('Your Cloudinary storage quota is exhausted. Please upgrade your Cloudinary plan.');
            setIsPublishing(false);
            return;
          }
          throw e;
        }
      }

      let finalCategory = data.category;
      if (!isAdmin && !finalCategory) {
        finalCategory = 'general-blog';
      }

      if (!finalCategory) {
        toast.error('Please select a category');
        setIsPublishing(false);
        return;
      }

      const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;

      const insertData: any = {
        title: data.title,
        excerpt: data.excerpt,
        content: editor.getHTML(),
        category: finalCategory,
        author_id: user.id,
        status: 'published',
        slug: slug
      };
      
      if (imageUrl) {
         insertData.cover_image = imageUrl;
         insertData.image_url = imageUrl;
      } else {
         insertData.cover_image = existingImage;
         insertData.image_url = existingImage;
      }
      insertData.video_url = videoUrl || existingVideo;
      insertData.audio_url = audioUrl || existingAudio;

      if (editingId) {
        const { error } = await supabase.from('content').update(insertData).eq('id', editingId);
        if (error) throw error;
        toast.success('Updated successfully!');
      } else {
        const { error } = await supabase.from('content').insert(insertData);
        if (error) throw error;
        toast.success('Published successfully!');
      }
      
      queryClient.invalidateQueries({ queryKey: ['author_content'] });
      setView('list');
      reset();
      editor.commands.setContent('');
      setEditingId(null);
      setExistingImage(null);
      setExistingVideo(null);
      setExistingAudio(null);
    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error(error.message || (editingId ? 'Failed to update' : 'Failed to publish'));
    } finally {
      setIsPublishing(false);
    }
  };

  const editArticle = (article: any) => {
    setEditingId(article.id);
    setValue('title', article.title);
    setValue('excerpt', article.excerpt);
    setValue('category', article.category);
    setExistingImage(article.cover_image || article.image_url || null);
    setExistingVideo(article.video_url || null);
    setExistingAudio(article.audio_url || null);
    editor?.commands.setContent(article.content || '');
    setView('editor');
  };

  const deleteCategory = (id: string) => {
    setDeleteCategoryId(id);
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!deleteCategoryId) return;
    const { error } = await supabase.from('content_categories').delete().eq('id', deleteCategoryId);
    if (error) toast.error('Failed to delete category');
    else {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['content_categories'] });
    }
    setDeleteCategoryId(null);
  };

  const editCategory = (id: string, currentName: string) => {
    setEditCategoryData({ id, name: currentName });
  };

  const handleEditCategoryConfirm = async (newName: string) => {
    if (!editCategoryData || !newName || newName.trim() === editCategoryData.name) {
      setEditCategoryData(null);
      return;
    }
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { error } = await supabase.from('content_categories').update({ name: newName, slug }).eq('id', editCategoryData.id);
    if (error) toast.error('Failed to update category');
    else {
      toast.success('Category updated');
      queryClient.invalidateQueries({ queryKey: ['content_categories'] });
    }
    setEditCategoryData(null);
  };

  const deleteArticle = (id: string) => {
    setDeleteArticleId(id);
  };

  const handleDeleteArticleConfirm = async () => {
    if (!deleteArticleId) return;
    const { error } = await supabase.from('content').delete().eq('id', deleteArticleId);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['author_content'] });
    }
    setDeleteArticleId(null);
  };

  const MenuBar = () => {
    if (!editor) return null;
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex gap-1 border-r border-gray-200 dark:border-gray-700 pr-2 mr-1">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><Bold className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><Italic className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('underline') ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><UnderlineIcon className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><Strikethrough className="w-4 h-4" /></button>
        </div>

        <div className="flex gap-1 border-r border-gray-200 dark:border-gray-700 pr-2 mr-1">
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><Heading1 className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><Heading2 className="w-4 h-4" /></button>
        </div>

        <div className="flex gap-1 border-r border-gray-200 dark:border-gray-700 pr-2 mr-1">
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 rounded-lg transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><AlignLeft className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 rounded-lg transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><AlignCenter className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-2 rounded-lg transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><AlignRight className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`p-2 rounded-lg transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><AlignJustify className="w-4 h-4" /></button>
        </div>

        <div className="flex gap-1 border-r border-gray-200 dark:border-gray-700 pr-2 mr-1">
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><List className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><ListOrdered className="w-4 h-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><Quote className="w-4 h-4" /></button>
        </div>
        
        <div className="flex gap-1">
          <button type="button" onClick={() => {
            const url = window.prompt('URL');
            if (url) {
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            }
          }} className={`p-2 rounded-lg transition-colors ${editor.isActive('link') ? 'bg-secondary/20 text-secondary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}><LinkIcon className="w-4 h-4" /></button>
          <button type="button" onClick={() => {
            const url = window.prompt('Image URL');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"><ImageIcon className="w-4 h-4" /></button>
          <button type="button" onClick={() => {
            const url = window.prompt('YouTube URL');
            if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
          }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"><YoutubeIcon className="w-4 h-4" /></button>
          <button type="button" onClick={() => {
            const url = window.prompt('Video URL (MP4, WebM, etc)');
            if (url) editor.chain().focus().setVideo({ src: url }).run();
          }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"><VideoIcon className="w-4 h-4" /></button>
          <button type="button" onClick={() => {
            const url = window.prompt('Audio URL (MP3, WAV, etc)');
            if (url) editor.chain().focus().setAudio({ src: url }).run();
          }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"><AudioIcon className="w-4 h-4" /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <CloudinaryConfigRequiredModal
        isOpen={showCloudinaryGate}
        onClose={() => setShowCloudinaryGate(false)}
        onNavigateToSettings={() => navigate('/dashboard/settings', { state: { activeTab: 'cloudinary-guide' } })}
      />
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Content Manager</h1>
          <p className="text-sm text-gray-500 font-medium">Compose and moderate your devotionals, news, and testimonies</p>
        </div>
        <div className="flex items-center gap-2">
          {actualIsAdmin && (
            <button
              onClick={() => handleNavigation(() => {
                setView('categories');
                setEditingId(null);
              })}
              className={`btn ${view === 'categories' ? 'btn-secondary' : 'btn-outline'} flex items-center gap-2`}
            >
              <ListOrdered className="w-5 h-5" /> Categories
            </button>
          )}
          <button
            onClick={() => handleNavigation(() => {
              if (view === 'list') {
                // Gate non-admin users without Cloudinary configured
                if (!actualIsAdmin && !cloudinaryLoading && !isCloudinaryEnabled) {
                  setShowCloudinaryGate(true);
                  return;
                }
                setView('editor');
                setEditingId(null);
                reset();
                editor?.commands.setContent('');
                setExistingImage(null);
                setExistingVideo(null);
                setExistingAudio(null);
              } else {
                setView('list');
              }
            })}
            className="btn btn-secondary flex items-center gap-2 shadow-lg shadow-secondary/20"
          >
            {view === 'list' ? <><Plus className="w-5 h-5" /> Create New</> : <><FileText className="w-5 h-5" /> Manage List</>}
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search articles..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all outline-none" 
              />
            </div>
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)} 
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-secondary outline-none font-medium text-gray-700 dark:text-gray-300"
            >
              <option value="all">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Article</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Author</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date & Time</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {loading ? (
                    <tr><td colSpan={6} className="p-12 text-center text-gray-400">Loading your content...</td></tr>
                ) : articles.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-gray-400">No articles published yet.</td></tr>
                ) : articles.filter(article => 
                    (categoryFilter === 'all' || article.category === categoryFilter) &&
                    (article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-secondary" />
                         </div>
                         <div className="truncate max-w-xs md:max-w-md">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{article.title}</p>
                            <p className="text-xs text-gray-400 truncate">{article.excerpt}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {article.author?.full_name || article.author?.username || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500">{article.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${article.status === 'published' ? 'bg-green-100 text-green-700' : article.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                        {article.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {format(new Date(article.created_at), 'MMM d, yyyy')}
                      <br/>
                      <span className="text-gray-400">{format(new Date(article.created_at), 'h:mm a')}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 px-1">
                        <button onClick={() => editArticle(article)} className="p-2 text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => deleteArticle(article.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      ) : view === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
          <form className="lg:col-span-2 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Main Headline</label>
                  <input type="text" {...register('title', { required: true })} className="w-full px-5 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-secondary transition-all" placeholder="Enter article title" />
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Brief Excerpt</label>
                  <textarea {...register('excerpt', { required: true })} rows={2} className="w-full px-5 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-secondary transition-all" placeholder="Summary for previews" />
               </div>
               <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5 px-1">Context / Category</label>
                    {isCreatingCategory ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="New category name"
                          className="flex-1 px-5 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-secondary"
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={isSubmittingCategory || !newCategoryName.trim()}
                          className="p-3 bg-secondary text-primary rounded-xl hover:bg-secondary/90 disabled:opacity-50"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCreatingCategory(false)}
                          className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <select 
                        {...register('category')} 
                        className="w-full px-5 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-secondary"
                      >
                        <option value="">Choose category</option>
                        {actualIsAdmin ? (
                          <>
                            {categories.map((cat: any) => (
                              <option key={cat.id} value={cat.slug}>{cat.name}</option>
                            ))}
                            <option value="new_category" className="font-bold text-secondary">+ Create New Category</option>
                          </>
                        ) : (
                          // For members, only allow 'General Blog'
                          categories.filter((cat: any) => cat.slug === 'general-blog').map((cat: any) => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                          ))
                        )}
                      </select>
                    )}
                  </div>
                  
                  <div className="mt-2 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visuals / Media Cover (Optional)</label>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isCloudinaryEnabled ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                        <Cloud className="w-3 h-3" />
                        {isCloudinaryEnabled ? 'Cloudinary Active' : 'Supabase Storage'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight block">Cover Image</label>
                         {existingImage ? (
                           <div className="relative inline-block">
                             <img src={existingImage} alt="Cover" className="h-20 w-32 object-cover rounded-lg" />
                             <button type="button" onClick={() => setExistingImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                           </div>
                         ) : (
                           <input type="file" accept="image/*" {...register('imageFile')} className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 cursor-pointer" />
                         )}
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight block">Video File</label>
                         {existingVideo ? (
                           <div className="relative inline-block p-2 bg-gray-200 dark:bg-gray-800 rounded-lg">
                             <span className="text-xs">Video uploaded</span>
                             <button type="button" onClick={() => setExistingVideo(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                           </div>
                         ) : (
                           <input type="file" accept="video/*" {...register('videoFile')} className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 cursor-pointer" />
                         )}
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight block">Audio File</label>
                         {existingAudio ? (
                           <div className="relative inline-block p-2 bg-gray-200 dark:bg-gray-800 rounded-lg">
                             <span className="text-xs">Audio uploaded</span>
                             <button type="button" onClick={() => setExistingAudio(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                           </div>
                         ) : (
                           <input type="file" accept="audio/*" {...register('audioFile')} className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 cursor-pointer" />
                         )}
                      </div>
                    </div>
                  </div>
               </div>
               <div className="pt-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3 px-1">Extended Content</label>
                  <div className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-inner">
                    <MenuBar />
                    <EditorContent editor={editor} className="p-6 min-h-[400px] bg-white dark:bg-gray-900/20 prose dark:prose-invert max-w-none focus:outline-none" />
                  </div>
               </div>
            </div>
            <div className="pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-end">
               <button onClick={handleSubmit(handlePublish)} disabled={isPublishing} className="btn btn-secondary px-10 shadow-xl shadow-secondary/10">
                  {isPublishing ? 'Transmitting...' : 'Save & Publish'}
               </button>
            </div>
          </form>

           <div className="space-y-6">
              <div className="bg-primary dark:bg-black p-8 rounded-2xl text-white shadow-2xl relative overflow-hidden">
                 <div className="relative z-10">
                     <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-secondary" /> Publishing Guidelines</h3>
                     <ul className="space-y-4 text-xs font-medium text-white/70">
                         <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1" /> Use high-quality header images</li>
                         <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1" /> Ensure excerpt is concise</li>
                         <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1" /> Peer review before publishing</li>
                     </ul>
                 </div>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-5 blur-3xl" />
              </div>
           </div>
         </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
             <h2 className="text-lg font-bold text-gray-900 dark:text-white">Manage Categories</h2>
             <button onClick={() => { setIsCreatingCategory(true); setNewCategoryName(''); }} className="btn btn-secondary btn-sm flex items-center gap-2">
               <Plus className="w-4 h-4" /> New Category
             </button>
          </div>
          
          {isCreatingCategory && (
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex items-center gap-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category Name"
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <button onClick={handleCreateCategory} disabled={!newCategoryName.trim() || isSubmittingCategory} className="btn btn-secondary btn-sm">Save</button>
              <button onClick={() => setIsCreatingCategory(false)} className="btn btn-outline btn-sm">Cancel</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Slug</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {categories.map((cat: any) => (
                  <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{cat.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{cat.slug}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => editCategory(cat.id, cat.name)} className="p-2 text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-xl"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={!!deleteArticleId}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteArticleConfirm}
        onCancel={() => setDeleteArticleId(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteCategoryId}
        title="Delete Category"
        message="Are you sure you want to delete this category? This might affect articles linked to it."
        confirmText="Delete"
        onConfirm={handleDeleteCategoryConfirm}
        onCancel={() => setDeleteCategoryId(null)}
      />

      <PromptDialog
        isOpen={!!editCategoryData}
        title="Edit Category Name"
        message="Enter a new name for the category:"
        defaultValue={editCategoryData?.name || ''}
        placeholder="e.g. Featured News"
        confirmText="Save Changes"
        onConfirm={handleEditCategoryConfirm}
        onCancel={() => setEditCategoryData(null)}
      />

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSaveAsDraft={async () => {
          await handleSubmit(handlePublish)();
          setShowUnsavedModal(false);
          if (unsavedAction) unsavedAction();
        }}
        onDiscard={() => {
          setShowUnsavedModal(false);
          if (unsavedAction) unsavedAction();
        }}
        onCancel={() => setShowUnsavedModal(false)}
        isSaving={isPublishing}
      />
    </div>
  );
};

export default ContentManager;