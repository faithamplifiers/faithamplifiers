import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { 
  CreditCard, CheckCircle2, AlertCircle, 
  Download, Calendar, Receipt, Sparkles 
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';

const PaymentsHistory: React.FC = () => {
  const { user } = useAuthStore();

  const { data: memberPlan, isLoading } = useQuery({
    queryKey: ['user-billing-info', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('member_plans')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const handlePrintInvoice = (plan: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = plan.updated_at ? format(new Date(plan.updated_at), 'MMMM dd, yyyy') : format(new Date(), 'MMMM dd, yyyy');
    const invoiceNum = `INV-${plan.paystack_reference?.slice(-6).toUpperCase() || 'TEMP'}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoiceNum}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; margin: 40px; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eaeaea; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: 800; color: #7c3aed; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 14px; }
            .details strong { color: #111; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #f9f9f9; text-align: left; padding: 12px; border-bottom: 2px solid #eaeaea; font-size: 13px; text-transform: uppercase; color: #666; }
            td { padding: 12px; border-bottom: 1px solid #eaeaea; font-size: 14px; }
            .total { text-align: right; font-size: 18px; font-weight: 800; color: #111; }
            .footer { text-align: center; font-size: 12px; color: #999; margin-top: 60px; border-top: 1px solid #eaeaea; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Faith Amplifiers</div>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">https://faithamplifiers.vercel.app</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-weight: 800;">INVOICE</h2>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">No: ${invoiceNum}</p>
            </div>
          </div>

          <div class="details">
            <div>
              <p style="margin: 0 0 5px 0; color: #888;">BILLED TO:</p>
              <strong>${plan.legal_name || user?.email?.split('@')[0]}</strong><br />
              Email: ${user?.email}<br />
              Phone: ${plan.phone || 'N/A'}<br />
              ${plan.address || ''}
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 5px 0; color: #888;">INVOICE DETAILS:</p>
              Date: ${dateStr}<br />
              Payment Status: <strong>PAID</strong><br />
              Method: Paystack Card/Bank
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Gospel Event Organizer & Business Services Plan Upgrade</strong><br />
                  <span style="font-size: 12px; color: #666;">Unlocks premium events creation, directory submission, and scheduling. Includes identity validation review.</span>
                </td>
                <td>1</td>
                <td style="text-align: right;">&#8358;5,000.00</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total Paid: &#8358;5,000.00
          </div>

          <div class="footer">
            Thank you for being a part of Faith Amplifiers!<br />
            This is a computer generated invoice and requires no signature.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" className="text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Payments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review your subscription invoices, payment status, and verification history.
        </p>
      </div>

      {!memberPlan ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 p-10 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-900 dark:text-white">No Upgrade Payments Found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
            You are currently on the free **Blog Basics** tier. Upgrade your account to create events and offer directory services.
          </p>
          <a href="/dashboard/upgrade" className="btn btn-primary py-2.5 px-6 font-bold text-sm">
            Upgrade Plan Now
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Card */}
          <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between shadow-sm">
            <div>
              <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-primary/10 text-primary dark:text-secondary rounded">
                Active Tier
              </span>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mt-2 capitalize">
                {memberPlan.plan?.replace('_', ' ')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Verified access, directory management and premium tools.
              </p>
            </div>

            <div className="mt-8 border-t border-gray-50 dark:border-gray-700/50 pt-4 space-y-3 text-xs text-gray-650 dark:text-gray-350">
              <div className="flex justify-between">
                <span>Verification:</span>
                <span className={`font-bold capitalize ${
                  memberPlan.verification_status === 'verified' 
                    ? 'text-green-500' 
                    : memberPlan.verification_status === 'rejected' 
                    ? 'text-red-500' 
                    : 'text-amber-500'
                }`}>
                  {memberPlan.verification_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className={`font-bold capitalize ${memberPlan.payment_status === 'paid' ? 'text-green-500' : 'text-red-500'}`}>
                  {memberPlan.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-gray-700/50">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-secondary" />
                Transaction History
              </h3>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              <div className="p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-850 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    memberPlan.payment_status === 'paid' 
                      ? 'bg-green-50 dark:bg-green-950/20 text-green-500' 
                      : 'bg-red-50 dark:bg-red-950/20 text-red-500'
                  }`}>
                    {memberPlan.payment_status === 'paid' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                      Gospel Organizer Plan Upgrade
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {memberPlan.updated_at ? format(new Date(memberPlan.updated_at), 'MMM dd, yyyy') : 'N/A'}
                      • Paystack Ref: <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{memberPlan.paystack_reference || 'N/A'}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <span className="font-extrabold text-gray-900 dark:text-white text-sm">
                    ₦5,000.00
                  </span>
                  {memberPlan.payment_status === 'paid' && (
                    <button
                      onClick={() => handlePrintInvoice(memberPlan)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-secondary hover:underline"
                    >
                      <Download className="w-3 h-3" />
                      Invoice
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsHistory;
