import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import PlanCard from '../../components/upgrade/PlanCard';
import VerificationForm, { VerificationData } from '../../components/upgrade/VerificationForm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const PLANS = {
  blog_basics: {
    name: 'Blog Basics',
    price: 'Free',
    priceNote: 'forever',
    features: [
      'Create and publish articles',
      'Custom username & avatar',
      'Social media links on profile',
      'Community engagement',
      'Basic analytics dashboard',
    ],
    ctaLabel: 'Get Started',
  },
  event_services: {
    name: 'Event & Services Privilege',
    price: '₦5,000',
    priceNote: '/one-time',
    features: [
      'All Blog Basics features',
      'Create & manage events',
      'List professional services',
      'Receive service bookings',
      'Email booking notifications',
      'Priority community support',
      'Verified badge on profile',
    ],
    ctaLabel: 'Upgrade & Verify',
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    priceNote: 'contact us',
    features: [
      'All Event & Services features',
      'White-label solutions',
      'Custom integrations',
      'Dedicated account manager',
      'API access',
      'Advanced analytics & reports',
      'Custom branding',
    ],
    ctaLabel: 'Contact Us',
  },
};

const UpgradePlan: React.FC = () => {
  const { user, profile } = useAuthStore();
  const queryClient = useQueryClient();
  const [showVerification, setShowVerification] = useState(false);
  // PaystackPop is loaded globally via index.html — no dynamic loading needed

  // Fetch existing member plan
  const { data: memberPlan, isLoading } = useQuery({
    queryKey: ['member_plan', user?.id],
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
    enabled: !!user,
  });

  const currentPlan = memberPlan?.plan || 'blog_basics';
  const isHigherPlanActiveOrPending = !!memberPlan && memberPlan.plan !== 'blog_basics';

  const handleBlogBasicsActivate = async () => {
    if (!user) return;
    if (isHigherPlanActiveOrPending) {
      toast.error('You cannot downgrade to Blog Basics while you have an active or pending higher plan.');
      return;
    }
    try {
      const { error } = await supabase.from('member_plans').upsert({
        user_id: user.id,
        plan: 'blog_basics',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Blog Basics plan activated!');
      queryClient.invalidateQueries({ queryKey: ['member_plan'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate plan');
    }
  };

  const handleVerificationComplete = (verificationData: VerificationData) => {
    if (!user) return;

    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_4799a5fb98fbb27e8fc6ac9fad9374327466d28e';

    if (!paystackKey || !window.PaystackPop) {
      toast.error('Payment SDK is not loaded. Please refresh the page and try again.');
      return;
    }

    // PaystackPop.setup() requires plain function() — not async arrows
    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: user.email || '',
      amount: 500000, // ₦5,000 in kobo
      currency: 'NGN',
      ref: 'fa_upgrade_' + user.id + '_' + Date.now(),
      metadata: {
        custom_fields: [
          { display_name: 'User ID', variable_name: 'user_id', value: user.id },
          { display_name: 'Plan', variable_name: 'plan', value: 'event_services' },
        ],
      },
      callback: function (response: any) {
        saveVerificationAndUpgrade(verificationData, response.reference);
      },
      onClose: function () {
        toast('Payment window closed. You can try again anytime.');
      },
    });

    handler.openIframe();
  };

  const handleCompletePaymentOnly = () => {
    if (!user || !memberPlan) return;

    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_4799a5fb98fbb27e8fc6ac9fad9374327466d28e';

    if (!paystackKey || !window.PaystackPop) {
      toast.error('Paystack SDK is not loaded. Please refresh the page and try again.');
      return;
    }

    const verificationData: VerificationData = {
      legalName: memberPlan.legal_name || '',
      phone: memberPlan.phone || '',
      address: memberPlan.address || '',
      country: memberPlan.country || '',
      state: memberPlan.state || '',
      dateOfBirth: memberPlan.date_of_birth || '',
      govIdUrl: memberPlan.gov_id_url || '',
      whatsapp: memberPlan.social_links?.whatsapp || '',
      facebook: memberPlan.social_links?.facebook || '',
      instagram: memberPlan.social_links?.instagram || '',
      twitter: memberPlan.social_links?.twitter || '',
      youtube: memberPlan.social_links?.youtube || '',
      website: memberPlan.social_links?.website || '',
    };

    // PaystackPop.setup() requires plain function() — not async arrows
    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: user.email || '',
      amount: 500000, // ₦5,000 in kobo
      currency: 'NGN',
      ref: 'fa_upgrade_' + user.id + '_' + Date.now(),
      metadata: {
        custom_fields: [
          { display_name: 'User ID', variable_name: 'user_id', value: user.id },
          { display_name: 'Plan', variable_name: 'plan', value: 'event_services' },
        ],
      },
      callback: function (response: any) {
        saveVerificationAndUpgrade(verificationData, response.reference);
      },
      onClose: function () {
        toast('Payment window closed. You can try again anytime.');
      },
    });

    handler.openIframe();
  };

  const saveVerificationAndUpgrade = async (verificationData: VerificationData, paystackRef: string | null) => {
    if (!user) return;

    try {
      // 1. Save member plan with verification data
      const { error: planError } = await supabase.from('member_plans').upsert({
        user_id: user.id,
        plan: 'event_services',
        legal_name: verificationData.legalName,
        phone: verificationData.phone,
        address: verificationData.address,
        country: verificationData.country,
        state: verificationData.state,
        date_of_birth: verificationData.dateOfBirth || null,
        gov_id_url: verificationData.govIdUrl,
        social_links: {
          whatsapp: verificationData.whatsapp || '',
          facebook: verificationData.facebook || '',
          instagram: verificationData.instagram || '',
          twitter: verificationData.twitter || '',
          youtube: verificationData.youtube || '',
          website: verificationData.website || '',
        },
        verification_status: 'pending',
        paystack_reference: paystackRef,
        payment_status: paystackRef ? 'paid' : 'unpaid',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (planError) throw planError;

      if (paystackRef) {
        toast.success('Payment successful! Your verification is pending admin review.');
      } else {
        toast.success('Verification details saved! Complete your payment to activate review.');
      }

      setShowVerification(false);
      queryClient.invalidateQueries({ queryKey: ['member_plan'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete upgrade');
    }
  };

  const handleEnterpriseCTA = () => {
    window.location.href = '/contact';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" className="text-secondary" />
      </div>
    );
  }

  if (showVerification) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => setShowVerification(false)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-secondary transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to plans
        </button>
        <VerificationForm
          onComplete={handleVerificationComplete}
          onCancel={() => setShowVerification(false)}
        />
      </div>
    );
  }

  const isEventServicesPaid = currentPlan === 'event_services' && memberPlan?.payment_status === 'paid';
  const isEventServicesUnpaid = currentPlan === 'event_services' && memberPlan?.payment_status === 'unpaid';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-secondary/15 rounded-2xl flex items-center justify-center mx-auto">
          <Crown className="w-7 h-7 text-secondary" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          Choose Your Plan
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm">
          Unlock the full potential of Faith Amplifiers. Whether you're a blogger, event organizer, or enterprise — we've got a plan for you.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
        <PlanCard
          {...PLANS.blog_basics}
          isCurrentPlan={currentPlan === 'blog_basics'}
          ctaLabel={isHigherPlanActiveOrPending ? 'Downgrade Locked' : 'Get Started'}
          disabled={isHigherPlanActiveOrPending}
          onCTAClick={handleBlogBasicsActivate}
        />
        <PlanCard
          {...PLANS.event_services}
          highlighted
          badge="Most Popular"
          isCurrentPlan={isEventServicesPaid}
          ctaLabel={isEventServicesUnpaid ? "Complete Payment" : "Upgrade & Verify"}
          onCTAClick={isEventServicesUnpaid ? handleCompletePaymentOnly : () => setShowVerification(true)}
        />
        <PlanCard
          {...PLANS.enterprise}
          isCurrentPlan={currentPlan === 'enterprise'}
          onCTAClick={handleEnterpriseCTA}
        />
      </div>

      {/* Current Plan Info */}
      {memberPlan && (
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-150 dark:border-gray-700 shadow-sm text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Your Current Plan</p>
          <p className="text-lg font-black text-primary dark:text-secondary mt-1 capitalize">
            {memberPlan.plan?.replace(/_/g, ' ') || 'Blog Basics'}
          </p>
          {memberPlan.payment_status === 'unpaid' && memberPlan.plan === 'event_services' && (
            <p className="text-xs text-red-500 mt-1 font-semibold">
              ⚠️ Unpaid — please complete your payment of ₦5,000 to initiate verification.
            </p>
          )}
          {memberPlan.payment_status === 'paid' && memberPlan.verification_status === 'pending' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-semibold">
              ⏳ Verification in progress — our team will review your submission shortly.
            </p>
          )}
          {memberPlan.payment_status === 'paid' && memberPlan.verification_status === 'verified' && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
              ✅ Verified account
            </p>
          )}
          {memberPlan.verification_status === 'rejected' && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
              ❌ Verification rejected. Please update details or contact support.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UpgradePlan;
