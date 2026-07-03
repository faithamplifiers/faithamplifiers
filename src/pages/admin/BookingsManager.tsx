import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Check, Trash2, X, Filter, User, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const BookingsManager: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          service:services(title, provider_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Booking status updated to ${newStatus}`);
      setBookings(prev => prev.map(bk => bk.id === id ? { ...bk, status: newStatus } : bk));
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking? This will remove it from the system permanently.')) return;

    try {
      const { error } = await supabase
        .from('service_bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Booking deleted successfully');
      setBookings(prev => prev.filter(bk => bk.id !== id));
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  const filteredBookings = bookings.filter(bk => {
    const matchesFilter = filter === 'all' || bk.status === filter;
    const matchesSearch = 
      bk.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bk.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bk.service?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Bookings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track client service bookings across the platform</p>
        </div>
        <button
          onClick={fetchBookings}
          className="btn btn-outline flex items-center gap-2 text-xs py-1.5"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client or service name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-750 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-secondary outline-none transition-all text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {(['all', 'pending', 'confirmed', 'cancelled', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                filter === tab
                  ? 'bg-secondary text-primary shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto text-left">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-750">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Client Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Service Booked</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Client Message</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Created Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-750">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">Loading bookings list...</td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">No bookings found matching filters.</td>
                </tr>
              ) : (
                filteredBookings.map((bk) => (
                  <tr key={bk.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/30">
                    <td className="px-6 py-4 text-sm">
                      <p className="font-bold text-gray-900 dark:text-white">{bk.client_name}</p>
                      <p className="text-xs text-gray-500">{bk.client_email}</p>
                      {bk.client_phone && <p className="text-xs text-gray-400">{bk.client_phone}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {bk.service?.title || <span className="text-red-500 italic">Deleted Service</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-650 dark:text-gray-400 max-w-xs truncate" title={bk.message}>
                      {bk.message || <span className="text-gray-400 italic text-xs">No notes</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-550 dark:text-gray-400">
                      {format(new Date(bk.created_at), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={bk.status}
                        onChange={(e) => handleUpdateStatus(bk.id, e.target.value as any)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border-transparent focus:ring-2 focus:ring-secondary outline-none capitalize ${getStatusBadge(bk.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteBooking(bk.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        title="Delete Booking Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingsManager;
