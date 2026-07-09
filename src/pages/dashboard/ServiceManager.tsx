import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PromptDialog from '../../components/ui/PromptDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import {
  Upload,
  Save,
  DollarSign,
  Trash2,
  Globe,
  Star,
  Plus,
  Edit,
  Briefcase,
  ListOrdered,
  Check,
  X,
  Search,
  Calendar,
  Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import UnsavedChangesModal from '../../components/ui/UnsavedChangesModal';

interface ServiceForm {
  title: string;
  description: string;
  category: string;
  price: string;
  currency: 'USD' | 'NGN' | 'EUR' | 'GBP';
  booking_notifications_enabled: boolean;
}

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'Pound Sterling' },
];

const ServiceManager = () => {
  const { user, profile } = useAuthStore();
  const actualIsAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const [view, setView] = useState<'list' | 'editor' | 'categories' | 'bookings'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
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
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: memberPlan } = useQuery({
    queryKey: ['member_plan', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('member_plans')
        .select('plan, payment_status, verification_status')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: services = [], isLoading: loading } = useQuery({
    queryKey: ['author_services', user?.id],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase.from('services').select(`
        *,
        provider:profiles(*)
      `).order('created_at', { ascending: false });
      if (!actualIsAdmin) query = query.eq('provider_id', user.id);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && view === 'list'
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['service_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: providerBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['provider_bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase.from('service_bookings').select(`
        *,
        service:services!inner(title, provider_id)
      `);
      if (!actualIsAdmin) {
        query = query.eq('service.provider_id', user.id);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && view === 'bookings'
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { isDirty } } = useForm<ServiceForm>({
    defaultValues: {
      currency: 'USD',
      booking_notifications_enabled: true
    }
  });

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
      if (error) throw error;
      toast.success('Booking status updated!');
      queryClient.invalidateQueries({ queryKey: ['provider_bookings'] });
    } catch (err: any) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const selectedCurrency = watch('currency');
  const currencySymbol = currencies.find(c => c.code === selectedCurrency)?.symbol || '$';


  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    onDrop: (acceptedFiles) => {
      setPortfolioImages(prev => [...prev, ...acceptedFiles]);
    }
  });

  const hasUnsavedChanges = isDirty || portfolioImages.length > 0;

  const handleNavigation = (action: () => void) => {
    if (view === 'editor' && hasUnsavedChanges) {
      setUnsavedAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  };

  const removeImage = (index: number) => {
    setPortfolioImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateService = async (data: ServiceForm) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Upload portfolio images
      const imageUrls = await Promise.all(
        portfolioImages.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `service-portfolio/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('services')
            .upload(filePath, file);

          if (uploadError) throw uploadError;
          return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/services/${filePath}`;
        })
      );

      const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;

      const insertData = {
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        currency: data.currency,
        provider_id: user.id,
        portfolio_images: [...existingImages, ...imageUrls],
        status: 'active',
        slug: slug,
        booking_notifications_enabled: data.booking_notifications_enabled
      };


      if (editingId) {
        const { error: serviceError } = await supabase.from('services').update(insertData).eq('id', editingId);
        if (serviceError) throw serviceError;
        toast.success('Service updated successfully!');
      } else {
        const { error: serviceError } = await supabase.from('services').insert(insertData);
        if (serviceError) throw serviceError;
        toast.success('Service created successfully!');
      }

      queryClient.invalidateQueries({ queryKey: ['author_services'] });
      setView('list');
      reset();
      setPortfolioImages([]);
      setExistingImages([]);
      setEditingId(null);
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(error.message || 'Failed to save service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const editService = (service: any) => {
    setEditingId(service.id);
    setValue('title', service.title);
    setValue('description', service.description);
    setValue('category', service.category);
    setValue('price', service.price);
    setValue('currency', service.currency);
    setValue('booking_notifications_enabled', service.booking_notifications_enabled ?? true);
    setExistingImages(service.portfolio_images || []);
    setPortfolioImages([]);
    setView('editor');
  };


  const deleteService = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    const { error } = await supabase.from('services').delete().eq('id', deleteConfirmId);
    if (error) toast.error('Failed to delete service');
    else {
      toast.success('Service deleted');
      queryClient.invalidateQueries({ queryKey: ['author_services'] });
    }
    setDeleteConfirmId(null);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setIsSubmittingCategory(true);
      const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { error } = await supabase.from('service_categories').insert([
        { name: newCategoryName, slug }
      ]);
      if (error) throw error;
      toast.success('Category created successfully');
      setNewCategoryName('');
      setIsCreatingCategory(false);
      queryClient.invalidateQueries({ queryKey: ['service_categories'] });
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!deleteCategoryId) return;
    const { error } = await supabase.from('service_categories').delete().eq('id', deleteCategoryId);
    if (error) toast.error('Failed to delete category');
    else {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['service_categories'] });
    }
    setDeleteCategoryId(null);
  };

  const handleEditCategoryConfirm = async (newName: string) => {
    if (!editCategoryData || !newName || newName.trim() === editCategoryData.name) {
      setEditCategoryData(null);
      return;
    }
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { error } = await supabase.from('service_categories').update({ name: newName, slug }).eq('id', editCategoryData.id);
    if (error) toast.error('Failed to update category');
    else {
      toast.success('Category updated');
      queryClient.invalidateQueries({ queryKey: ['service_categories'] });
    }
    setEditCategoryData(null);
  };

  const inputClasses = "w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all";

  const isPrivileged = profile?.role === 'event_organizer' || profile?.role === 'admin' || profile?.role === 'super_admin';
  const isPendingVerification =
    memberPlan?.plan === 'event_services' &&
    memberPlan?.payment_status === 'paid' &&
    memberPlan?.verification_status === 'pending';

  if (!isPrivileged && isPendingVerification) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-amber-200 dark:border-amber-800/40 p-10 text-center space-y-6 shadow-lg">
          {/* Animated icon */}
          <div className="relative inline-flex">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Crown className="w-10 h-10 text-amber-500" />
            </div>
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
              <span className="w-3 h-3 bg-white rounded-full" />
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Verification Under Review</h2>
            <p className="text-amber-700 dark:text-amber-400 font-semibold text-sm uppercase tracking-wider">Payment Received · Awaiting Admin Approval</p>
          </div>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto text-sm leading-relaxed">
            Thank you for completing your upgrade payment and submitting your identity verification. Our team is carefully reviewing your information to ensure the integrity and security of our community.
          </p>

          {/* Timeline cards */}
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            {[['Minutes', 'Quick reviews'], ['Hours', 'Standard reviews'], ['Days', 'Complex reviews']].map(([time, label]) => (
              <div key={time} className="bg-white/70 dark:bg-gray-700/50 rounded-xl p-3 border border-amber-100 dark:border-amber-800/30">
                <p className="text-amber-600 dark:text-amber-400 font-bold text-sm">{time}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* What to expect */}
          <div className="bg-white/60 dark:bg-gray-700/40 rounded-xl p-4 text-left space-y-2 max-w-sm mx-auto border border-amber-100 dark:border-amber-800/30">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">What happens next?</p>
            {[
              'Admin reviews your submitted identity documents',
              'You receive an email notification once approved',
              'Full access to Services & Events features is unlocked',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex-shrink-0 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Have questions? <a href="/contact" className="text-secondary hover:underline font-medium">Contact our support team</a>
          </p>
        </div>
      </div>
    );
  }

  if (!isPrivileged) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-secondary/15 rounded-2xl flex items-center justify-center mx-auto text-secondary animate-bounce">
          <Crown className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Upgrade Required</h2>
        <p className="text-gray-650 dark:text-gray-405 max-w-md mx-auto text-sm leading-relaxed">
          Creating and listing professional services is exclusive to our <strong>Event & Services Privilege</strong> plan. Upgrade today to list your services, receive bookings, and host events!
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
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Manager</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Offer your professional services to the community</p>
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
            <button
              onClick={handleSubmit(handleCreateService)}
              disabled={isSubmitting}
              className="btn btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update Service' : 'Create Service'}
                </>
              )}
            </button>
          )}
          <button
            onClick={() => handleNavigation(() => {
              setView(view === 'bookings' ? 'list' : 'bookings');
              setEditingId(null);
            })}
            className={`btn ${view === 'bookings' ? 'btn-secondary' : 'btn-outline'} flex items-center gap-2`}
          >
            <Calendar className="w-5 h-5" /> Bookings
          </button>
          <button
            onClick={() => handleNavigation(() => {
              if (view === 'list') {
                setView('editor');
                setEditingId(null);
                reset();
                setPortfolioImages([]);
                setExistingImages([]);
              } else {
                setView('list');
              }
            })}
            className="btn btn-secondary flex items-center gap-2 shadow-lg shadow-secondary/20"
          >
            {view === 'list' ? <><Plus className="w-5 h-5" /> Create New</> : <><Briefcase className="w-5 h-5" /> Manage List</>}
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
                placeholder="Search services..." 
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Service</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Provider</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date & Time</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {loading ? (
                    <tr><td colSpan={7} className="p-12 text-center text-gray-400">Loading services...</td></tr>
                ) : services.length === 0 ? (
                    <tr><td colSpan={7} className="p-12 text-center text-gray-400">No services created yet.</td></tr>
                ) : services.filter(sv => 
                    (categoryFilter === 'all' || sv.category === categoryFilter) &&
                    (sv.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     sv.description?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map((sv) => (
                  <tr key={sv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{sv.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{sv.provider?.full_name || sv.provider?.username || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500">{sv.category.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{sv.currency} {sv.price}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${sv.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {sv.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(sv.created_at), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => editService(sv)} className="p-2 text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-xl"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => deleteService(sv.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 className="w-4 h-4" /></button>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form className="lg:col-span-2 space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Service Title</label>
              <input
                type="text"
                {...register('title', { required: true })}
                className={inputClasses}
                placeholder="e.g. Professional Livestreaming Coverage"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <textarea
                {...register('description', { required: true })}
                rows={4}
                className={inputClasses}
                placeholder="Describe what you offer in detail..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                <select
                  {...register('category', { required: true })}
                  className={inputClasses}
                >
                  <option value="">Select category</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Price & Currency</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                      {currencySymbol}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      {...register('price', { required: true })}
                      placeholder="0.00"
                      className={`${inputClasses.replace('w-full', '')} w-full pl-8`}
                    />
                  </div>
                  <select
                    {...register('currency', { required: true })}
                    className={`${inputClasses.replace('w-full', '')} w-32`}
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 pt-2">
              <input
                type="checkbox"
                id="booking_notifications_enabled"
                {...register('booking_notifications_enabled')}
                className="h-4.5 w-4.5 rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer"
              />
              <label htmlFor="booking_notifications_enabled" className="text-sm font-semibold text-gray-700 dark:text-gray-305 cursor-pointer select-none">
                Enable email notifications for new bookings
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Portfolio Images</label>
            <div
              {...getRootProps()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-all group"
            >
              <input {...getInputProps()} />
              <div className="bg-gray-50 dark:bg-gray-700/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-gray-400 group-hover:text-secondary" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, or JPEG (Max 5MB)</p>
            </div>
          </div>

          {(portfolioImages.length > 0 || existingImages.length > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              {existingImages.map((url, index) => (
                <div key={`ext-${index}`} className="relative group aspect-square">
                  <img
                    src={url}
                    alt={`Existing Portfolio ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {portfolioImages.map((file, index) => (
                <div key={`new-${index}`} className="relative group aspect-square">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New Portfolio ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-xl text-white shadow-xl shadow-primary/20">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Service Performance
            </h3>
            <p className="text-white/80 text-sm mb-4">Complete your portfolio to attract more clients.</p>
            <div className="space-y-3">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-2/3 rounded-full" />
              </div>
              <p className="text-xs font-medium">Profile Score: 65%</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Tips for success</h3>
            <ul className="space-y-3">
              {[
                "Use high-quality portfolio images",
                "Be specific about your pricing",
                "Respond to inquiries within 24h",
                "Keep your availability updated"
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      ) : view === 'bookings' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden text-left">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Service Bookings</h2>
              <p className="text-xs text-gray-500">Track and update client requests for your services</p>
            </div>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['provider_bookings'] })}
              className="btn btn-outline btn-sm"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-750">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Service Booked</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Received Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-750">
                {bookingsLoading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400">Loading bookings...</td>
                  </tr>
                ) : providerBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400">No bookings received yet.</td>
                  </tr>
                ) : (
                  providerBookings.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/30">
                      <td className="px-6 py-4 text-sm">
                        <p className="font-bold text-gray-900 dark:text-white">{booking.client_name}</p>
                        <p className="text-xs text-gray-505 dark:text-gray-400">{booking.client_email}</p>
                        {booking.client_phone && <p className="text-xs text-gray-400">{booking.client_phone}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-750 dark:text-gray-300">
                        {booking.service?.title || 'Unknown Service'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-650 dark:text-gray-405 max-w-xs truncate" title={booking.message}>
                        {booking.message || <span className="text-gray-400 italic text-xs">No notes</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(booking.created_at), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={booking.status}
                          onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                          className="px-2 py-1 text-xs font-bold rounded-lg border border-gray-205 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-705 dark:text-gray-300 focus:ring-2 focus:ring-secondary outline-none capitalize"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
             <h2 className="text-lg font-bold text-gray-900 dark:text-white">Manage Service Categories</h2>
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
                           <button onClick={() => setEditCategoryData({ id: cat.id, name: cat.name })} className="p-2 text-gray-400 hover:text-secondary rounded-lg transition-colors">
                             <Edit className="w-4 h-4" />
                           </button>
                           <button onClick={() => setDeleteCategoryId(cat.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
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
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteCategoryId}
        title="Delete Category"
        message="Are you sure you want to delete this category? This might affect services linked to it."
        confirmText="Delete"
        onConfirm={handleDeleteCategoryConfirm}
        onCancel={() => setDeleteCategoryId(null)}
      />

      <PromptDialog
        isOpen={!!editCategoryData}
        title="Edit Category Name"
        message="Enter a new name for the category:"
        defaultValue={editCategoryData?.name || ''}
        placeholder="e.g. Creative Design"
        confirmText="Save Changes"
        onConfirm={handleEditCategoryConfirm}
        onCancel={() => setEditCategoryData(null)}
      />

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSaveAsDraft={async () => {
          await handleSubmit(handleCreateService)();
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

export default ServiceManager;