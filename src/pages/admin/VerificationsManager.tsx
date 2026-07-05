import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  Check, X, FileText, Loader2, ShieldAlert, 
  ExternalLink, Calendar, MapPin, Phone, User 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const VerificationsManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Fetch pending verifications
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-pending-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_plans')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('verification_status', 'pending')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const handleApprove = async (userId: string) => {
    setActioningId(userId);
    try {
      // 1. Update verification_status to verified
      const { error: planErr } = await supabase
        .from('member_plans')
        .update({ verification_status: 'verified', updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (planErr) throw planErr;

      // 2. Grant role privileges
      const { error: roleErr } = await supabase
        .from('profiles')
        .update({ role: 'event_organizer' })
        .eq('id', userId);

      if (roleErr) throw roleErr;

      toast.success('Verification request approved successfully! User is now upgraded.');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve request');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActioningId(userId);
    try {
      const { error } = await supabase
        .from('member_plans')
        .update({ verification_status: 'rejected', updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Verification request rejected.');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setActioningId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" className="text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Identity Verification Requests</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review legal identity credentials, verify fee payments, and upgrade member accounts.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
          <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-bold">No Pending Requests</p>
          <p className="text-sm mt-1">There are no user verification requests waiting to be reviewed right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((req: any) => (
            <div 
              key={req.user_id} 
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow"
            >
              {/* Left Column: User details */}
              <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 md:w-80 shrink-0 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3 mb-6">
                  <img 
                    src={req.user?.avatar_url || `https://ui-avatars.com/api/?name=${req.user?.full_name || 'User'}&background=random`} 
                    alt="avatar" 
                    className="w-12 h-12 rounded-full border dark:border-gray-600"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{req.user?.full_name || req.user?.username}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{req.user?.email}</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-gray-600 dark:text-gray-350">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>Legal: <strong className="text-gray-900 dark:text-white">{req.legal_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{req.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{req.state}, {req.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>DOB: {req.date_of_birth ? format(new Date(req.date_of_birth), 'MMM dd, yyyy') : 'Not Provided'}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Verification & Action */}
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-secondary/15 text-secondary rounded-md">
                        {req.plan?.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base mt-1">Identity Upload Document</h4>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        req.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {req.payment_status === 'paid' ? 'Paid (₦5,000)' : 'Unpaid'}
                      </span>
                      {req.paystack_reference && (
                        <p className="text-[10px] text-gray-400 mt-1 font-mono">Ref: {req.paystack_reference}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-450 leading-relaxed mb-4">
                    Address: {req.address}
                  </p>

                  {req.gov_id_url ? (
                    <a 
                      href={req.gov_id_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-150 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-secondary" />
                      View Uploaded ID Document
                      <ExternalLink className="w-3.5 h-3.5 text-gray-450" />
                    </a>
                  ) : (
                    <p className="text-xs text-red-500 font-semibold italic">No government ID document uploaded.</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 dark:border-gray-700/50 pt-4">
                  <button
                    onClick={() => handleReject(req.user_id)}
                    disabled={actioningId !== null}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold text-xs transition-colors"
                  >
                    {actioningId === req.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    Reject Request
                  </button>
                  <button
                    onClick={() => handleApprove(req.user_id)}
                    disabled={actioningId !== null}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 font-semibold text-xs transition-colors"
                  >
                    {actioningId === req.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve Request
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VerificationsManager;
