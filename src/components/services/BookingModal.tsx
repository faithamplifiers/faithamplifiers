import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Mail, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceTitle: string;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  serviceId,
  serviceTitle
}) => {
  const { user, profile } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setBookingSuccess(false);
      setBookingRef('');
      
      // Pre-fill fields for logged-in user
      if (user) {
        setFormData({
          name: profile?.full_name || profile?.username || '',
          email: user.email || '',
          phone: (profile as any)?.phone || '',
          message: ''
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: ''
        });
      }
    }
  }, [isOpen, user, profile]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Please fill in your name and email address');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save booking to database
      const { data: booking, error: dbError } = await supabase
        .from('service_bookings')
        .insert({
          service_id: serviceId,
          user_id: user?.id || null,
          client_name: formData.name,
          client_email: formData.email,
          client_phone: formData.phone || null,
          message: formData.message || null,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Fetch service provider details to send email notification
      const { data: serviceDetails, error: serviceError } = await supabase
        .from('services')
        .select('booking_notifications_enabled, provider:profiles(*)')
        .eq('id', serviceId)
        .single();

      if (!serviceError && serviceDetails) {
        const providerEmail = serviceDetails.provider?.email || (await supabase.auth.getUser()).data.user?.email;
        const notificationsEnabled = serviceDetails.booking_notifications_enabled;

        // 3. Trigger email if provider has notification enabled and we found their email
        if (notificationsEnabled && providerEmail) {
          const { error: funcError } = await supabase.functions.invoke('send-booking-notification', {
            body: {
              serviceTitle,
              clientName: formData.name,
              clientEmail: formData.email,
              clientPhone: formData.phone,
              message: formData.message,
              providerEmail
            }
          });
          
          if (funcError) {
            console.error('Email dispatch warning:', funcError);
          }
        }
      }

      setBookingRef(booking.id.slice(0, 8).toUpperCase());
      setBookingSuccess(true);
      toast.success('Service booked successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit booking');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-gray-150 dark:border-gray-700 animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!bookingSuccess ? (
          <>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-left">
              <Calendar className="w-5 h-5 text-secondary" /> Book Service
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-left">
              Submit your details to request a booking for <span className="font-bold text-gray-700 dark:text-gray-200">{serviceTitle}</span>.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <User className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-sm"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <Phone className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-sm"
                    placeholder="e.g. +234 80 1234 5678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                  Instructions / Requirements (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 pointer-events-none text-gray-400">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </span>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-sm"
                    placeholder="Describe your needs, budget, or preferred dates..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-250 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-75 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-secondary text-primary font-black hover:bg-secondary-light transition-all shadow-md shadow-secondary/15 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-primary border-t-transparent" />
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Request Submitted!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              Your booking request for <span className="font-semibold text-gray-800 dark:text-gray-250">{serviceTitle}</span> has been received. The service provider will contact you shortly.
            </p>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 max-w-xs mx-auto">
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Booking Reference</p>
              <p className="text-lg font-black text-secondary tracking-widest mt-0.5">#{bookingRef}</p>
            </div>

            <button
              onClick={onClose}
              className="btn btn-primary w-full mt-4 py-2.5"
            >
              Back to Services
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
