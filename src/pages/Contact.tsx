import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { CMSSectionRenderer } from '../components/CMSSectionRenderer';
import toast from 'react-hot-toast';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('faithamplifiers@gmail.com');

  // 1. Fetch from the CMS pages table
  const { data: page, isLoading: isCmsLoading } = useQuery({
    queryKey: ['cms-contact-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', 'contact')
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // 2. Fetch page_sections configs
  const { data: sectionRows } = useQuery({
    queryKey: ['page-sections-contact'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', 'contact');
      if (error) throw error;
      return data || [];
    }
  });

  const getSectionContent = (sectionKey: string, defaults: any) => {
    const row = sectionRows?.find(r => r.section === sectionKey);
    return row?.content ? { ...defaults, ...row.content } : defaults;
  };

  const heroData = getSectionContent('hero', {
    title: 'Contact Us',
    subtitle: "Have questions or need assistance? We're here to help you amplify your faith journey."
  });

  const infoData = getSectionContent('info', {
    email: recipientEmail,
    phone: '+234 80 123 4567',
    address: 'Lagos, Nigeria',
    hours: 'Mon - Fri: 9:00 AM - 5:00 PM'
  });

  useEffect(() => {
    const fetchRecipientEmail = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'contact_recipient_email')
          .single();
        if (data?.value) {
          setRecipientEmail(data.value);
        }
      } catch (err) {
        console.error('Error fetching recipient email setting:', err);
      }
    };
    fetchRecipientEmail();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // 1. Save submission to the database table contact_messages
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          status: 'new'
        });

      if (dbError) throw dbError;

      // 2. Call Edge Function to send email notification to configured recipient
      const { error: funcError } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          recipient: recipientEmail
        }
      });

      if (funcError) {
        console.error('Edge Function email dispatch warning:', funcError);
      }

      setSubmitStatus('success');
      toast.success('Message sent successfully!');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Contact submit error:', error);
      setSubmitStatus('error');
      toast.error('Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCmsLoading) {
    return (
      <div className="pt-32 flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" className="text-secondary" />
      </div>
    );
  }

  // Parse CMS page sections if present
  let cmsSections: any[] | null = null;
  if (page?.content) {
    try {
      const parsed = JSON.parse(page.content);
      if (Array.isArray(parsed)) {
        cmsSections = parsed;
      }
    } catch (e) {
      cmsSections = null;
    }
  }

  // If page content exists in CMS, render it
  if (cmsSections) {
    return (
      <div className="pt-20 bg-light-gray dark:bg-gray-900 min-h-screen">
        <CMSSectionRenderer sections={cmsSections} />
      </div>
    );
  }

  // Fallback to legacy layout
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <div className="bg-primary py-16">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 !text-white">{heroData.title}</h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            {heroData.subtitle}
          </p>
        </div>
      </div>

      {/* Contact Content */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="space-y-8 text-left">
              <div>
                <h2 className="text-2xl font-bold mb-4 font-primary">Get in Touch</h2>
                <p className="text-gray-655 dark:text-gray-400">
                  Feel free to contact us with any inquiries, suggestions, or partnership proposals.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center text-secondary shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-300">Email Address</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{infoData.email || recipientEmail}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center text-secondary shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-300">Phone Support</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{infoData.phone}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center text-secondary shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-300">Location</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{infoData.address}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center text-secondary shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-300">Business Hours</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{infoData.hours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2 text-left bg-light-gray dark:bg-gray-800 p-8 rounded-2xl border border-gray-150 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>

              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm">
                  Thank you! Your message has been sent successfully. We will get back to you shortly.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-red-755 dark:text-red-400 text-sm">
                  Failed to send message. Please try again.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-655 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message Details</label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-sm leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-secondary w-full py-3 flex items-center justify-center gap-2 font-bold text-sm shadow-md shadow-secondary/15 disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending...' : <><Send className="w-4 h-4" /> Send Message</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;