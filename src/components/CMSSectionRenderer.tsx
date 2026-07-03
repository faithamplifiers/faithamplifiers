import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Users, Award, Globe, BookOpen, Target, Handshake, Info, Check, 
  HelpCircle, ArrowRight, Video, Image, Music, Calendar, Mail, Phone, MapPin, Send, Star, Headphones
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { fetchDirectory, fetchResources } from '../lib/api';
import toast from 'react-hot-toast';

// ─── Constants & Icon Mapping ─────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Heart,
  Users,
  Award,
  Globe,
  BookOpen,
  Target,
  Handshake,
  Info,
  Check,
  HelpCircle,
};

interface CMSSectionRendererProps {
  sections: any[];
}

export const CMSSectionRenderer: React.FC<CMSSectionRendererProps> = ({ sections }) => {
  return (
    <div className="w-full">
      {sections.map((section, idx) => {
        switch (section.type) {
          case 'hero':
            return <HeroSection key={section.id || idx} data={section.data} />;
          case 'text':
            return <TextBlockSection key={section.id || idx} data={section.data} />;
          case 'features':
            return <FeaturesSection key={section.id || idx} data={section.data} />;
          case 'team':
            return <TeamSection key={section.id || idx} data={section.data} />;
          case 'cta':
            return <CTASection key={section.id || idx} data={section.data} />;
          case 'contact_form':
            return <ContactFormSection key={section.id || idx} data={section.data} />;
          case 'services_grid':
            return <ServicesGridSection key={section.id || idx} data={section.data} />;
          case 'events_grid':
            return <EventsGridSection key={section.id || idx} data={section.data} />;
          case 'news_grid':
            return <NewsGridSection key={section.id || idx} data={section.data} />;
          case 'directory_grid':
            return <DirectoryGridSection key={section.id || idx} data={section.data} />;
          case 'resources_grid':
            return <ResourcesGridSection key={section.id || idx} data={section.data} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

// ─── Hero Section Component ────────────────────────────────────────
const HeroSection: React.FC<{ data: any }> = ({ data }) => {
  const { title, subtitle, bg_image, cta_label, cta_link, align = 'center' } = data;
  const isCentered = align === 'center';
  const isRight = align === 'right';

  return (
    <div 
      className="relative bg-primary text-white py-24 md:py-32 overflow-hidden flex items-center min-h-[45vh]"
      style={bg_image ? { backgroundImage: `url(${bg_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {bg_image && <div className="absolute inset-0 bg-black/60 z-0" />}
      <div className={`container-custom relative z-10 w-full flex ${
        isCentered ? 'justify-center text-center' : isRight ? 'justify-end text-right' : 'justify-start text-left'
      }`}>
        <div className="max-w-3xl space-y-6">
          {title && <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">{title}</h1>}
          {subtitle && <p className="text-lg md:text-xl text-white/80 max-w-2xl font-medium leading-relaxed">{subtitle}</p>}
          {cta_label && cta_link && (
            <div className="pt-4">
              <Link 
                to={cta_link} 
                className="btn btn-secondary inline-flex items-center gap-2 font-bold shadow-lg shadow-secondary/25 transition-transform hover:-translate-y-0.5"
              >
                {cta_label} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Text Block Section Component ──────────────────────────────────
const TextBlockSection: React.FC<{ data: any }> = ({ data }) => {
  const { title, content } = data;
  return (
    <section className="py-16 bg-white dark:bg-gray-900 border-b border-gray-150 dark:border-gray-800">
      <div className="container-custom max-w-4xl text-left">
        {title && <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 font-primary">{title}</h2>}
        <div 
          className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-secondary hover:prose-a:text-secondary-light leading-relaxed text-sm text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
};

// ─── Features Section Component ────────────────────────────────────
const FeaturesSection: React.FC<{ data: any }> = ({ data }) => {
  const { title, subtitle, items = [] } = data;
  return (
    <section className="py-16 bg-light-gray dark:bg-gray-850 border-b border-gray-150 dark:border-gray-805">
      <div className="container-custom">
        {(title || subtitle) && (
          <div className="text-center mb-12 max-w-2xl mx-auto space-y-2">
            {title && <h2 className="text-3xl font-black text-gray-900 dark:text-white font-primary">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{subtitle}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {items.map((item: any, idx: number) => {
            const IconComponent = ICON_MAP[item.icon] || Heart;
            return (
              <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                <div className="bg-secondary/15 rounded-xl w-12 h-12 flex items-center justify-center mb-4 text-secondary">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-655 dark:text-gray-350 text-sm leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ─── Team Section Component ────────────────────────────────────────
const TeamSection: React.FC<{ data: any }> = ({ data }) => {
  const { title, subtitle, members = [] } = data;
  return (
    <section className="py-16 bg-white dark:bg-gray-900 border-b border-gray-150 dark:border-gray-800">
      <div className="container-custom">
        {(title || subtitle) && (
          <div className="text-center mb-12 max-w-2xl mx-auto space-y-2">
            {title && <h2 className="text-3xl font-black text-gray-900 dark:text-white font-primary">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{subtitle}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {members.map((member: any, idx: number) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-all">
              <div className="h-64 overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                {member.image ? (
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Users className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">{member.name}</h3>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">{member.role}</p>
                  <p className="text-gray-600 dark:text-gray-350 text-sm leading-relaxed">{member.bio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── CTA Section Component ─────────────────────────────────────────
const CTASection: React.FC<{ data: any }> = ({ data }) => {
  const { title, text, primary_cta_label, primary_cta_link, secondary_cta_label, secondary_cta_link } = data;
  return (
    <section className="py-16 bg-gradient-to-br from-primary to-primary-dark text-white border-b border-gray-150 dark:border-gray-800">
      <div className="container-custom max-w-4xl text-center space-y-6">
        {title && <h2 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h2>}
        {text && <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">{text}</p>}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          {primary_cta_label && primary_cta_link && (
            <Link to={primary_cta_link} className="btn bg-secondary text-primary hover:bg-secondary-light font-bold px-8 shadow-lg shadow-secondary/15">
              {primary_cta_label}
            </Link>
          )}
          {secondary_cta_label && secondary_cta_link && (
            <Link to={secondary_cta_link} className="btn bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold px-8">
              {secondary_cta_label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

// ─── Contact Form Section Component ────────────────────────────────
const ContactFormSection: React.FC<{ data: any }> = ({ data }) => {
  const { title, description, recipient_email = 'faithamplifiers@gmail.com' } = data;
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Insert message to Database
      const { error: dbErr } = await supabase.from('contact_messages').insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        status: 'new'
      });
      if (dbErr) throw dbErr;

      // 2. Invoke email dispatch function
      await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          recipient: recipient_email
        }
      });

      toast.success('Your message has been sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formInputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-sm";
  const labelCls = "block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5";

  return (
    <section className="py-16 bg-white dark:bg-gray-900 border-b border-gray-150 dark:border-gray-800 text-left">
      <div className="container-custom max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white font-primary">{title || 'Contact Us'}</h2>
              {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{description}</p>}
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="p-2.5 bg-primary/5 dark:bg-primary/10 rounded-xl text-secondary">
                  <Mail className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</h4>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{recipient_email}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="p-2.5 bg-primary/5 dark:bg-primary/10 rounded-xl text-secondary">
                  <MapPin className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">HQ Location</h4>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">Lagos, Nigeria</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="md:col-span-3 bg-light-gray dark:bg-gray-850 p-6 rounded-2xl border border-gray-150 dark:border-gray-700/70 shadow-sm space-y-4">
            <div>
              <label className={labelCls}>Your Name</label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} 
                className={formInputCls} 
              />
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <input 
                type="email" 
                required 
                value={formData.email} 
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} 
                className={formInputCls} 
              />
            </div>
            <div>
              <label className={labelCls}>Subject</label>
              <input 
                type="text" 
                required 
                value={formData.subject} 
                onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} 
                className={formInputCls} 
              />
            </div>
            <div>
              <label className={labelCls}>Message Details</label>
              <textarea 
                rows={4} 
                required 
                value={formData.message} 
                onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} 
                className={formInputCls} 
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-secondary w-full py-3 flex items-center justify-center gap-2 font-bold text-sm shadow-md shadow-secondary/15 disabled:opacity-60"
            >
              {isSubmitting ? 'Sending Inquiries...' : <><Send className="w-4 h-4" /> Send Message</>}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

// ─── Dynamic Services Grid Component ───────────────────────────────
const ServicesGridSection: React.FC<{ data: any }> = ({ data }) => {
  const { title, limit = 6 } = data;

  const { data: services, isLoading } = useQuery({
    queryKey: ['cms-services-grid', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          provider:profiles(*),
          service_ratings(rating_value)
        `)
        .eq('status', 'active')
        .limit(limit);
      if (error) throw error;
      
      // Calculate rating count and averages
      return (data || []).map((service: any) => {
        const ratings = (service.service_ratings || []) as any[];
        const ratingCount = ratings.length;
        const totalRating = ratings.reduce((sum, r) => sum + (r.rating_value || 0), 0);
        const averageRating = ratingCount > 0 ? totalRating / ratingCount : 5.0;

        return {
          ...service,
          rating: averageRating,
          coverImage: service.cover_url || service.cover_image || (service.portfolio_images && service.portfolio_images[0]) || 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80'
        };
      });
    }
  });

  return (
    <section className="py-16 bg-light-gray dark:bg-gray-850 border-b border-gray-150 dark:border-gray-800 text-left">
      <div className="container-custom">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white font-primary">{title || 'Featured Services'}</h2>
            <p className="text-xs text-gray-500 mt-1">Connect with professional creators in the gospel community</p>
          </div>
          <Link to="/services" className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline">
            View All Services <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading services...</div>
        ) : services?.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">No services listed yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services?.map((service: any) => (
              <div key={service.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full hover:-translate-y-1 transition-all group">
                <div className="relative h-48 overflow-hidden bg-gray-55 dark:bg-gray-900">
                  <img src={service.coverImage} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 bg-secondary text-primary text-[10px] font-black uppercase tracking-wider rounded-full">
                      {(service.category || 'service').replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{service.title}</h3>
                    <p className="text-gray-650 dark:text-gray-355 text-sm line-clamp-2 leading-relaxed">{service.description}</p>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 mt-6 pt-4 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black text-secondary">★</span>
                      <span className="text-xs font-bold text-gray-750 dark:text-gray-300">{(service.rating || 5.0).toFixed(1)}</span>
                    </div>
                    <span className="text-sm font-black text-primary dark:text-secondary">{service.price || 'Contact for price'}</span>
                  </div>
                  <div className="mt-4">
                    <Link to={`/services/${service.slug}`} className="btn btn-outline btn-sm w-full text-center py-2">
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ─── Dynamic Events Grid Component ─────────────────────────────────
const EventsGridSection: React.FC<{ data: any }> = ({ data }) => {
  const { title, limit = 6 } = data;

  const { data: events, isLoading } = useQuery({
    queryKey: ['cms-events-grid', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles(*)
        `)
        .eq('status', 'published')
        .limit(limit);
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <section className="py-16 bg-white dark:bg-gray-900 border-b border-gray-150 dark:border-gray-800 text-left">
      <div className="container-custom">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white font-primary">{title || 'Upcoming Events'}</h2>
            <p className="text-xs text-gray-500 mt-1">Join upcoming events and Christian conferences</p>
          </div>
          <Link to="/events" className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline">
            View All Events <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading events...</div>
        ) : events?.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">No events scheduled.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events?.map((event: any) => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full hover:-translate-y-1 transition-all group">
                <div className="relative h-48 overflow-hidden bg-gray-55">
                  {event.cover_image ? (
                    <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Calendar className="w-12 h-12" />
                    </div>
                  )}
                  {event.price && (
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded">
                        {event.price === '0' || event.price === 'Free' ? 'Free' : `₦${event.price}`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-secondary uppercase tracking-widest">
                      {format(new Date(event.start_date), 'MMM dd, yyyy')}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{event.title}</h3>
                    <p className="text-gray-655 dark:text-gray-355 text-sm line-clamp-2 leading-relaxed">{event.description}</p>
                  </div>
                  <div className="mt-6">
                    <Link to={`/events/${event.slug}`} className="btn btn-outline btn-sm w-full text-center py-2">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ─── Dynamic News Grid Component ──────────────────────────────────
const NewsGridSection: React.FC<{ data: any }> = ({ data }) => {
  const { title, limit = 6 } = data;

  const { data: articles, isLoading } = useQuery({
    queryKey: ['cms-news-grid', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map(article => ({
        ...article,
        coverImage: article.cover_image || article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80'
      }));
    }
  });

  return (
    <section className="py-16 bg-light-gray dark:bg-gray-850 border-b border-gray-150 dark:border-gray-800 text-left">
      <div className="container-custom">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white font-primary">{title || 'Latest Articles'}</h2>
            <p className="text-xs text-gray-500 mt-1">Stay updated with fresh news from the gospel community</p>
          </div>
          <Link to="/news" className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline">
            View All News <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading news...</div>
        ) : articles?.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-850 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">No news articles found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles?.map((article: any) => (
              <div key={article.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full hover:-translate-y-1 transition-all group">
                <div className="relative h-48 overflow-hidden bg-gray-55">
                  <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{article.title}</h3>
                    <p className="text-gray-655 dark:text-gray-355 text-sm line-clamp-2 leading-relaxed">{article.excerpt || article.content}</p>
                  </div>
                  <div className="mt-6">
                    <Link to={`/news/${article.slug || article.id}`} className="btn btn-outline btn-sm w-full text-center py-2">
                      Read Full Article
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ─── Dynamic Directory Grid Component ──────────────────────────────
const DirectoryGridSection: React.FC<{ data: any }> = ({ data }) => {
  const { title, limit = 6 } = data;

  const { data: listings, isLoading } = useQuery({
    queryKey: ['cms-directory-grid', limit],
    queryFn: fetchDirectory
  });

  const displayListings = listings?.slice(0, limit) || [];

  return (
    <section className="py-16 bg-light-gray dark:bg-gray-850 border-b border-gray-150 dark:border-gray-800 text-left">
      <div className="container-custom">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white font-primary">{title || 'Gospel Business Directory'}</h2>
            <p className="text-xs text-gray-500 mt-1">Connect with trusted professionals and businesses in the gospel community</p>
          </div>
          <Link to="/directory" className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline">
            View Full Directory <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading directory...</div>
        ) : displayListings.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">No directory listings found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayListings.map((listing: any) => (
              <div key={listing.id} className="bg-white dark:bg-gray-850 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                <div className="flex items-center mb-4 gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-100 dark:border-gray-700">
                    <img src={listing.logo} alt={listing.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{listing.name}</h3>
                    <span className="text-[10px] text-secondary font-black uppercase tracking-wider block mt-0.5">{listing.category}</span>
                  </div>
                </div>
                <div className="flex items-center mb-3">
                  <div className="flex text-secondary font-black text-sm">★</div>
                  <span className="ml-1 text-xs font-bold text-gray-500">{(listing.rating || 5.0).toFixed(1)}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-350 text-xs line-clamp-2 leading-relaxed mb-4 flex-grow">{listing.description}</p>
                <Link to={`/directory/${listing.slug || listing.id}`} className="text-secondary font-bold hover:underline text-xs block pt-2 mt-auto">
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ─── Dynamic Resources Grid Component ───────────────────────────────
const ResourcesGridSection: React.FC<{ data: any }> = ({ data }) => {
  const { title, limit = 6 } = data;

  const { data: resources, isLoading } = useQuery({
    queryKey: ['cms-resources-grid', limit],
    queryFn: fetchResources
  });

  const displayResources = resources?.slice(0, limit) || [];

  return (
    <section className="py-16 bg-white dark:bg-gray-900 border-b border-gray-150 dark:border-gray-800 text-left">
      <div className="container-custom">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white font-primary">{title || 'Spiritual Growth Resources'}</h2>
            <p className="text-xs text-gray-500 mt-1">Videos, podcasts, and devotionals to strengthen your faith journey</p>
          </div>
          <Link to="/resources" className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline">
            Browse All Resources <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading resources...</div>
        ) : displayResources.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">No resources found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayResources.map((resource: any) => (
              <div key={resource.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full hover:-translate-y-1 transition-all group">
                <div className="relative h-48 overflow-hidden bg-gray-55">
                  <img src={resource.coverImage} alt={resource.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-4 left-4 bg-white dark:bg-gray-850 p-2 rounded-full shadow-sm text-secondary">
                    {resource.type === 'video' && <Video className="w-4 h-4" />}
                    {resource.type === 'podcast' && <Headphones className="w-4 h-4" />}
                    {resource.type === 'devotional' && <BookOpen className="w-4 h-4" />}
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{resource.title}</h3>
                    <p className="text-gray-655 dark:text-gray-355 text-sm line-clamp-2 leading-relaxed">{resource.description}</p>
                  </div>
                  <div className="mt-6">
                    <a href={resource.url} className="btn btn-outline btn-sm w-full text-center py-2" target="_blank" rel="noopener noreferrer">
                      {resource.type === 'video' && 'Watch Now'}
                      {resource.type === 'podcast' && 'Listen Now'}
                      {resource.type === 'devotional' && 'Read Now'}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
