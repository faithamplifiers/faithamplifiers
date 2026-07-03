import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PromptDialog from '../../components/ui/PromptDialog';
import { useDropzone } from 'react-dropzone';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Upload,
  Save,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ListOrdered,
  Check,
  X,
  Search,
  Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import UnsavedChangesModal from '../../components/ui/UnsavedChangesModal';

interface EventForm {
  title: string;
  description: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  coverImage: File | null;
  ticketUrl?: string;
  livestreamUrl?: string;
  price: string;
  currency: 'USD' | 'NGN' | 'EUR' | 'GBP';
  vendors: {
    name: string;
    service: string;
    email: string;
    phone: string;
  }[];
}

const currencies = [
  { code: 'USD', symbol: '$' },
  { code: 'NGN', symbol: '₦' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
];

const EventManager = () => {
  const { user, profile } = useAuthStore();
  const actualIsAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const [view, setView] = useState<'list' | 'editor' | 'categories'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [vendors, setVendors] = useState<EventForm['vendors']>([]);
  const [existingCoverImage, setExistingCoverImage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [editCategoryData, setEditCategoryData] = useState<{id: string, name: string} | null>(null);
  const queryClient = useQueryClient();

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [unsavedAction, setUnsavedAction] = useState<(() => void) | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: ['author_events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase.from('events').select(`
        *,
        organizer:profiles(*)
      `).order('created_at', { ascending: false });
      if (!actualIsAdmin) query = query.eq('organizer_id', user.id);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && view === 'list'
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['event_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { isDirty, errors } } = useForm<EventForm>({
    defaultValues: {
      currency: 'USD',
      price: '0.00'
    }
  });

  const selectedCurrency = watch('currency');
  const currencySymbol = currencies.find(c => c.code === selectedCurrency)?.symbol || '$';
  
  const coverImageFile = watch('coverImage');
  const coverImagePreview = coverImageFile ? URL.createObjectURL(coverImageFile) : existingCoverImage;

  const hasUnsavedChanges = isDirty || !!coverImageFile || vendors.length > 0;

  const handleNavigation = (action: () => void) => {
    if (view === 'editor' && hasUnsavedChanges) {
      setUnsavedAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setValue('coverImage', acceptedFiles[0]);
    }
  });

  const addVendor = () => {
    setVendors([...vendors, { name: '', service: '', email: '', phone: '' }]);
  };

  const removeVendor = (index: number) => {
    setVendors(vendors.filter((_, i) => i !== index));
  };

  const updateVendor = (index: number, field: keyof EventForm['vendors'][0], value: string) => {
    const updatedVendors = [...vendors];
    updatedVendors[index][field] = value;
    setVendors(updatedVendors);
  };

  const handleCreateEvent = async (data: EventForm) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      
      let coverImageUrl = '';
      if (data.coverImage) {
        const fileExt = data.coverImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `event-covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(filePath, data.coverImage);

        if (uploadError) throw uploadError;
        coverImageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/events/${filePath}`;
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('events')
          .update({
            title: data.title,
            description: data.description,
            type: data.type,
            location: data.location,
            start_date: data.startDate,
            end_date: data.endDate,
            cover_image: coverImageUrl || existingCoverImage,
            ticket_url: data.ticketUrl,
            livestream_url: data.livestreamUrl,
            price: data.price,
            currency: data.currency
          })
          .eq('id', editingId);

        if (updateError) throw updateError;
        
        // Very basic vendor update strategy: delete existing, insert new
        if (vendors.length >= 0) {
          await supabase.from('event_vendors').delete().eq('event_id', editingId);
          if (vendors.length > 0) {
            await supabase.from('event_vendors').insert(
              vendors.map(vendor => ({
                event_id: editingId,
                name: vendor.name,
                service: vendor.service,
                email: vendor.email,
                phone: vendor.phone
              }))
            );
          }
        }
        toast.success('Event updated successfully!');
      } else {
        const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;

        const { error: eventError, data: eventData } = await supabase
          .from('events')
          .insert({
            title: data.title,
            description: data.description,
            type: data.type,
            location: data.location,
            start_date: data.startDate,
            end_date: data.endDate,
            cover_image: coverImageUrl,
            ticket_url: data.ticketUrl,
            livestream_url: data.livestreamUrl,
            price: data.price,
            currency: data.currency,
            organizer_id: user.id,
            status: 'upcoming',
            slug: slug
          })
          .select()
          .single();

        if (eventError) throw eventError;

        if (vendors.length > 0) {
          const { error: vendorError } = await supabase
            .from('event_vendors')
            .insert(
              vendors.map(vendor => ({
                event_id: eventData.id,
                name: vendor.name,
                service: vendor.service,
                email: vendor.email,
                phone: vendor.phone
              }))
            );
          if (vendorError) throw vendorError;
        }
        toast.success('Event created successfully!');
      }

      queryClient.invalidateQueries({ queryKey: ['author_events'] });
      setView('list');
      reset();
      setVendors([]);
      setExistingCoverImage(null);
      setEditingId(null);
      setStep(1);
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(error.message || 'Failed to save event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const editEvent = async (event: any) => {
    setEditingId(event.id);
    setValue('title', event.title);
    setValue('description', event.description);
    setValue('type', event.type);
    setValue('location', event.location);
    setValue('startDate', event.start_date);
    setValue('endDate', event.end_date);
    setValue('ticketUrl', event.ticket_url);
    setValue('livestreamUrl', event.livestream_url);
    setValue('price', event.price);
    setValue('currency', event.currency);
    setExistingCoverImage(event.cover_image || event.cover_url || null);
    
    // Fetch vendors
    const { data: vData } = await supabase.from('event_vendors').select('*').eq('event_id', event.id);
    if (vData) setVendors(vData);
    else setVendors([]);
    
    setView('editor');
    setStep(1);
  };

  const deleteEvent = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    const { error } = await supabase.from('events').delete().eq('id', deleteConfirmId);
    if (error) toast.error('Failed to delete event');
    else {
      toast.success('Event deleted');
      queryClient.invalidateQueries({ queryKey: ['author_events'] });
    }
    setDeleteConfirmId(null);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setIsSubmittingCategory(true);
      const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { error } = await supabase.from('event_categories').insert([
        { name: newCategoryName, slug }
      ]);
      if (error) throw error;
      toast.success('Category created successfully');
      setNewCategoryName('');
      setIsCreatingCategory(false);
      queryClient.invalidateQueries({ queryKey: ['event_categories'] });
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!deleteCategoryId) return;
    const { error } = await supabase.from('event_categories').delete().eq('id', deleteCategoryId);
    if (error) toast.error('Failed to delete category');
    else {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['event_categories'] });
    }
    setDeleteCategoryId(null);
  };

  const handleEditCategoryConfirm = async (newName: string) => {
    if (!editCategoryData || !newName || newName.trim() === editCategoryData.name) {
      setEditCategoryData(null);
      return;
    }
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { error } = await supabase.from('event_categories').update({ name: newName, slug }).eq('id', editCategoryData.id);
    if (error) toast.error('Failed to update category');
    else {
      toast.success('Category updated');
      queryClient.invalidateQueries({ queryKey: ['event_categories'] });
    }
    setEditCategoryData(null);
  };

  const inputClasses = "w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all";

  const isPrivileged = profile?.role === 'event_organizer' || profile?.role === 'admin' || profile?.role === 'super_admin';

  if (!isPrivileged) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-secondary/15 rounded-2xl flex items-center justify-center mx-auto text-secondary animate-bounce">
          <Crown className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Upgrade Required</h2>
        <p className="text-gray-650 dark:text-gray-405 max-w-md mx-auto text-sm leading-relaxed">
          Creating and managing events is exclusive to our <strong>Event & Services Privilege</strong> plan. Upgrade today to list your services, receive bookings, and host events!
        </p>
        <div className="pt-2">
          <Link
            to="/dashboard/upgrade"
            className="btn btn-secondary inline-flex items-center gap-2 font-bold px-6 py-2.5 shadow-lg shadow-secondary/20"
          >
            Explore Upgrade Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Manager</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Plan and manage your upcoming events</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
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
          {view === 'editor' && (
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    step === s 
                      ? 'bg-white dark:bg-gray-600 text-secondary shadow-sm' 
                      : 'text-gray-400'
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
          {view === 'editor' && step === 3 && (
            <button
              onClick={handleSubmit(handleCreateEvent)}
              disabled={isSubmitting}
              className="btn btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update Event' : 'Publish Event'}
                </>
              )}
            </button>
          )}
          <button
            onClick={() => handleNavigation(() => {
              if (view === 'list') {
                setView('editor');
                setEditingId(null);
                reset();
                setVendors([]);
                setExistingCoverImage(null);
                setStep(1);
              } else {
                setView('list');
              }
            })}
            className="btn btn-secondary flex items-center gap-2 shadow-lg shadow-secondary/20"
          >
            {view === 'list' ? <><Plus className="w-5 h-5" /> Create New</> : <><Calendar className="w-5 h-5" /> Manage List</>}
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
                placeholder="Search events..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all outline-none" 
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-secondary outline-none font-medium text-gray-700 dark:text-gray-300"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="past">Past</option>
            </select>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Event</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Organizer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {loading ? (
                    <tr><td colSpan={6} className="p-12 text-center text-gray-400">Loading events...</td></tr>
                ) : events.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-gray-400">No events created yet.</td></tr>
                ) : events.filter(ev => 
                    (statusFilter === 'all' || ev.status === statusFilter) &&
                    (ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     ev.location.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{ev.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{ev.organizer?.full_name || ev.organizer?.username || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(ev.start_date), 'MMM d, yyyy h:mm a')}
                      <br/>
                      <span className="text-xs text-gray-400">Created: {format(new Date(ev.created_at), 'MMM d, yyyy')}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{ev.location}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${ev.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : ev.status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {ev.status || 'upcoming'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => editEvent(ev)} className="p-2 text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-xl"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => deleteEvent(ev.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 className="w-4 h-4" /></button>
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
        <form className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Event Title</label>
                  <input
                    type="text"
                    {...register('title', { required: true })}
                    className={inputClasses}
                    placeholder="e.g. Annual Community Fest"
                  />
                </div>

                <div className="space-y-4 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    {...register('description', { required: true })}
                    rows={4}
                    className={inputClasses}
                    placeholder="Tell everyone what this event is about..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Event Type</label>
                  <select
                    {...register('type', { required: true })}
                    className={inputClasses}
                  >
                    <option value="">Select type</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      {...register('location', { required: true })}
                      className={`${inputClasses} pl-10`}
                      placeholder="Physical address or Online link"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    {...register('startDate', { required: true })}
                    className={inputClasses}
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">End Date & Time</label>
                  <input
                    type="datetime-local"
                    {...register('endDate', { required: true })}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  Next Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Cover Image</label>
                  {coverImagePreview ? (
                    <div className="relative border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden text-center lg:min-h-[240px] flex flex-col justify-center bg-gray-50 dark:bg-gray-800">
                      <img src={coverImagePreview} alt="Cover" className="max-h-[240px] w-auto mx-auto object-contain" />
                      <button type="button" onClick={() => {
                        setValue('coverImage', null);
                        setExistingCoverImage(null);
                      }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-md">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-all group lg:min-h-[240px] flex flex-col justify-center"
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400 group-hover:text-secondary group-hover:scale-110 transition-all" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Drag & drop cover photo
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Ticket / Entry Price</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currencySymbol}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          {...register('price')}
                          className={`${inputClasses.replace('w-full', '')} w-full pl-8`}
                          placeholder="0.00"
                        />
                      </div>
                      <select {...register('currency')} className={`${inputClasses.replace('w-full', '')} w-32`}>
                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                      </select>
                    </div>
                    <p className="text-xs text-gray-400">Set to 0.00 for free events.</p>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">External Links</label>
                    <input
                      type="url"
                      {...register('ticketUrl')}
                      className={inputClasses}
                      placeholder="Ticket booking URL"
                    />
                    <input
                      type="url"
                      {...register('livestreamUrl')}
                      className={inputClasses}
                      placeholder="Livestream / Online meeting URL"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => setStep(1)} className="btn btn-outline flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn btn-secondary flex items-center gap-2">
                  Next: Vendors
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vendor Partners</h2>
                  <p className="text-sm text-gray-500">List service providers associated with this event</p>
                </div>
                <button
                  type="button"
                  onClick={addVendor}
                  className="btn btn-outline btn-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Vendor
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendors.map((vendor, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3 shadow-sm relative group"
                  >
                    <button
                      type="button"
                      onClick={() => removeVendor(index)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 gap-3">
                      <input
                        type="text"
                        placeholder="Vendor Name"
                        value={vendor.name}
                        onChange={(e) => updateVendor(index, 'name', e.target.value)}
                        className={inputClasses}
                      />
                      <input
                        type="text"
                        placeholder="Service (e.g. Catering)"
                        value={vendor.service}
                        onChange={(e) => updateVendor(index, 'service', e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {vendors.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                  <Users className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No vendors added yet.</p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => setStep(2)} className="btn btn-outline flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
            </div>
          )}
        </form>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
             <h2 className="text-lg font-bold text-gray-900 dark:text-white">Manage Event Categories</h2>
             <button
               onClick={() => setIsCreatingCategory(true)}
               className="btn btn-secondary flex items-center gap-2"
             >
               <Plus className="w-4 h-4" /> Create Category
             </button>
          </div>
          
          {isCreatingCategory && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name..."
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-secondary outline-none"
                autoFocus
              />
              <button
                onClick={handleCreateCategory}
                disabled={isSubmittingCategory || !newCategoryName.trim()}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Save
              </button>
              <button
                onClick={() => setIsCreatingCategory(false)}
                className="btn btn-outline flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Slug</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No categories found.</td>
                  </tr>
                ) : (
                  categories.map((cat: any) => (
                    <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{cat.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{cat.slug}</td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <button type="button" onClick={() => setEditCategoryData({ id: cat.id, name: cat.name })} className="p-2 text-gray-400 hover:text-secondary rounded-lg transition-colors">
                             <Edit className="w-4 h-4" />
                           </button>
                           <button type="button" onClick={() => setDeleteCategoryId(cat.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteCategoryId}
        title="Delete Category"
        message="Are you sure you want to delete this category? This might affect events linked to it."
        confirmText="Delete"
        onConfirm={handleDeleteCategoryConfirm}
        onCancel={() => setDeleteCategoryId(null)}
      />

      <PromptDialog
        isOpen={!!editCategoryData}
        title="Edit Category Name"
        message="Enter a new name for the category:"
        defaultValue={editCategoryData?.name || ''}
        placeholder="e.g. Workshop"
        confirmText="Save Changes"
        onConfirm={handleEditCategoryConfirm}
        onCancel={() => setEditCategoryData(null)}
      />

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSaveAsDraft={async () => {
          await handleSubmit(handleCreateEvent)();
          setShowUnsavedModal(false);
          if (unsavedAction) unsavedAction();
        }}
        onDiscard={() => {
          setShowUnsavedModal(false);
          if (unsavedAction) unsavedAction();
        }}
        onCancel={() => setShowUnsavedModal(false)}
        isSaving={isSubmitting}
      />
    </div>
  );
};

export default EventManager;