import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  CreditCard, Search, Calendar, Download, 
  TrendingUp, Users, DollarSign, ArrowUpRight 
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';

const FinanceManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['admin-finance-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_plans')
        .select(`
          *,
          user:profiles(*)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const handlePrintInvoice = (record: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = record.updated_at ? format(new Date(record.updated_at), 'MMMM dd, yyyy') : format(new Date(), 'MMMM dd, yyyy');
    const invoiceNum = `INV-${record.paystack_reference?.slice(-6).toUpperCase() || 'TEMP'}`;

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
              <h2 style="margin: 0; font-weight: 800;">INVOICE RECEIPT</h2>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">No: ${invoiceNum}</p>
            </div>
          </div>

          <div class="details">
            <div>
              <p style="margin: 0 0 5px 0; color: #888;">BILLED TO:</p>
              <strong>${record.legal_name || record.user?.full_name || 'Member'}</strong><br />
              Email: ${record.user?.email || 'N/A'}<br />
              Phone: ${record.phone || 'N/A'}<br />
              ${record.address || ''}
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 5px 0; color: #888;">INVOICE DETAILS:</p>
              Date: ${dateStr}<br />
              Payment Status: <strong>${record.payment_status?.toUpperCase()}</strong><br />
              Method: Paystack Checkout
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

  const filtered = records.filter((r: any) => {
    const matchesSearch = 
      (r.user?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.paystack_reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.legal_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ? true : r.payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPaidCount = records.filter((r: any) => r.payment_status === 'paid').length;
  const totalPaidRevenue = totalPaidCount * 5000;
  const totalUnpaidCount = records.filter((r: any) => r.payment_status === 'unpaid').length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" className="text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance & Billing Records</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor platform revenue, upgrade checkout stats, and retrieve transactional print invoices.
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-550 dark:text-gray-400 font-bold uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">₦{totalPaidRevenue.toLocaleString()}.00</h3>
            <p className="text-[11px] text-green-500 mt-1.5 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              100% verified upgrades
            </p>
          </div>
          <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-550 dark:text-gray-400 font-bold uppercase tracking-wider">Paid Upgrades</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{totalPaidCount}</h3>
            <p className="text-[11px] text-gray-400 mt-1.5">Members verified or review-pending</p>
          </div>
          <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-550 dark:text-gray-400 font-bold uppercase tracking-wider">Unpaid checkouts</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{totalUnpaidCount}</h3>
            <p className="text-[11px] text-red-400 mt-1.5">Checkout modal initiated, unpaid</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user name, email, or ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-150 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent outline-none text-gray-850 dark:text-white"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-150 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none w-full sm:w-auto"
          >
            <option value="all">All Checkout States</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Finance Ledger Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">User / Account</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Plan Tier</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Paystack Reference</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fee Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Checkout Date</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-550 dark:text-gray-450">
                    No finance or payment transactions match search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((record: any) => (
                  <tr key={record.user_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img 
                          src={record.user?.avatar_url || `https://ui-avatars.com/api/?name=${record.user?.full_name || 'User'}&background=random`} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <strong className="text-gray-900 dark:text-white font-semibold">{record.legal_name || record.user?.full_name || 'N/A'}</strong>
                          <p className="text-[10px] text-gray-450">{record.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-700 dark:text-gray-300">
                      {record.plan?.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[10px] text-gray-500 dark:text-gray-400">
                      {record.paystack_reference || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                      ₦5,000.00
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full ${
                        record.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {record.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {record.updated_at ? format(new Date(record.updated_at), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {record.payment_status === 'paid' ? (
                        <button
                          onClick={() => handlePrintInvoice(record)}
                          className="inline-flex items-center gap-1 text-secondary hover:text-purple-700 hover:underline font-bold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Receipt
                        </button>
                      ) : (
                        <span className="text-gray-400 italic font-medium">-</span>
                      )}
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

export default FinanceManager;
