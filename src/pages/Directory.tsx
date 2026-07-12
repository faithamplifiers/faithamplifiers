import React, { useState } from 'react';
import {
  Search,
  Star,
  MapPin,
  Mail,
  Phone,
  Globe,
  ArrowLeft,
  Share2,
  Award,
  Zap,
  BookOpen,
  Calendar,
  ShieldCheck,
  User,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import toast from 'react-hot-toast';

interface UnifiedDirectoryEntry {
  id: string;
  type: 'person' | 'service' | 'event' | 'article' | 'business';
  name: string;
  category: string;
  description: string;
  image?: string;
  location?: string;
  rating?: number;
  email?: string;
  phone?: string;
  website?: string;
  slug?: string;
  rawRecord: any;
}

const Directory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'person' | 'service' | 'event' | 'article' | 'business'>('all');
  const [selectedListing, setSelectedListing] = useState<UnifiedDirectoryEntry | null>(null);
  const [showCollab, setShowCollab] = useState(false);

  // 1. Fetch Page Sections Header
  const { data: dbHeader } = useQuery({
    queryKey: ['page-sections-directory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', 'directory')
        .eq('section', 'hero')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const heroData = dbHeader?.content as any || {};
  const heroTitle = heroData.title || 'Gospel Community Directory';
  const heroSubtitle = heroData.subtitle || 'Connect with trusted professionals, creators, events, and services in the gospel community.';

  // 2. Fetch all directory entities in parallel
  const { data: unifiedEntries, error, isLoading, refetch } = useQuery<UnifiedDirectoryEntry[]>({
    queryKey: ['unifiedDirectoryListings'],
    queryFn: async () => {
      // Fetch in parallel
      const [
        { data: listings },
        { data: profiles },
        { data: services },
        { data: events },
        { data: content }
      ] = await Promise.all([
        supabase.from('directory_listings').select('*'),
        supabase.from('profiles').select('*, member_plans(*)').in('role', ['content_creator', 'event_organizer', 'admin']),
        supabase.from('services').select('*, provider:profiles(*, member_plans(*))').eq('status', 'active'),
        supabase.from('events').select('*, organizer:profiles(*, member_plans(*))'),
        supabase.from('content').select('*, author:profiles(*, member_plans(*))').eq('status', 'published')
      ]);

      const entries: UnifiedDirectoryEntry[] = [];

      // Map Directory Listings (Businesses)
      if (listings) {
        listings.forEach(listing => {
          entries.push({
            id: listing.id,
            type: 'business',
            name: listing.name,
            category: listing.category || 'Business',
            description: listing.description || '',
            image: listing.logo || undefined,
            location: listing.address || '',
            rating: listing.rating || 5.0,
            email: listing.email || '',
            phone: listing.phone || '',
            website: listing.website || '',
            slug: listing.slug || listing.id,
            rawRecord: listing
          });
        });
      }

      // Map Profiles (Artists & Authors)
      if (profiles) {
        profiles.forEach(profile => {
          const plan = profile.member_plans?.[0] || profile.member_plans;
          entries.push({
            id: profile.id,
            type: 'person',
            name: profile.full_name || plan?.legal_name || profile.username || 'Gospel Creator',
            category: profile.role === 'content_creator'
              ? 'Content Creator'
              : profile.role === 'event_organizer'
              ? 'Event Organizer'
              : profile.role === 'admin'
              ? 'Administrator'
              : 'Community Leader',
            description: plan?.address ? `Based in ${plan.state || ''}, ${plan.country || ''}.` : 'Dedicated creator in the Faith Amplifiers community.',
            image: profile.avatar_url || undefined,
            location: plan?.state ? `${plan.state}, ${plan.country}` : '',
            rating: 5.0,
            email: plan?.phone ? 'Click Collaborate to contact' : '',
            phone: plan?.phone || '',
            website: plan?.social_links?.website || '',
            slug: profile.username || profile.id,
            rawRecord: { ...profile, plan }
          });
        });
      }

      // Map Services
      if (services) {
        services.forEach(service => {
          entries.push({
            id: service.id,
            type: 'service',
            name: service.title,
            category: service.category || 'Service',
            description: service.description || '',
            image: service.cover_url || undefined,
            location: service.provider?.full_name || 'Faith Amplifiers Provider',
            rating: 5.0,
            email: service.provider?.email || '',
            slug: service.slug || service.id,
            rawRecord: service
          });
        });
      }

      // Map Events
      if (events) {
        events.forEach(event => {
          entries.push({
            id: event.id,
            type: 'event',
            name: event.title,
            category: event.type || 'Event',
            description: event.description || '',
            image: event.cover_image || undefined,
            location: event.location || 'Online',
            rating: 5.0,
            slug: event.slug || event.id,
            rawRecord: event
          });
        });
      }

      // Map Content (Articles / Blog Posts / Resources)
      if (content) {
        content.forEach(item => {
          const isResource = ['videos', 'podcasts', 'devotionals', 'sermon', 'music'].includes(item.category);
          entries.push({
            id: item.id,
            type: 'article',
            name: item.title,
            category: isResource ? `Resource · ${item.category}` : `Article · ${item.category}`,
            description: item.excerpt || item.content?.substring(0, 150) || '',
            image: item.cover_image || item.image_url || undefined,
            location: item.author?.full_name || 'Faith Amplifiers Writer',
            rating: 5.0,
            slug: item.slug || item.id,
            rawRecord: item
          });
        });
      }

      return entries;
    }
  });

  // 3. Fetch Related Insights for the selected detail profile view
  const { data: relatedInsights = [] } = useQuery({
    queryKey: ['relatedInsights', selectedListing?.id, selectedListing?.type],
    queryFn: async () => {
      if (!selectedListing) return [];

      if (selectedListing.type === 'person') {
        // Fetch articles written by this person
        const { data } = await supabase
          .from('content')
          .select('*, author:profiles(*)')
          .eq('author_id', selectedListing.id)
          .eq('status', 'published')
          .limit(3);
        if (data && data.length > 0) return data;
      } else if (selectedListing.type === 'service') {
        // Fetch other services by same provider
        const providerId = selectedListing.rawRecord.provider_id;
        if (providerId) {
          const { data } = await supabase
            .from('services')
            .select('*, provider:profiles(*)')
            .eq('provider_id', providerId)
            .eq('status', 'active')
            .neq('id', selectedListing.id)
            .limit(3);
          if (data && data.length > 0) return data;
        }
      } else if (selectedListing.type === 'event') {
        // Fetch other events
        const { data } = await supabase
          .from('events')
          .select('*, organizer:profiles(*)')
          .neq('id', selectedListing.id)
          .limit(3);
        if (data && data.length > 0) return data;
      }

      // Fallback: Fetch general latest articles
      const { data: fallbackData } = await supabase
        .from('content')
        .select('*, author:profiles(*)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);
      return fallbackData || [];
    },
    enabled: !!selectedListing
  });

  // Client-side search and tag filtering
  const filteredEntries = unifiedEntries?.filter(entry => {
    const matchesSearch =
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.location && entry.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab = selectedTab === 'all' || entry.type === selectedTab;

    return matchesSearch && matchesTab;
  }) || [];

  const handleShare = (entry: UnifiedDirectoryEntry) => {
    if (navigator.share) {
      navigator.share({
        title: entry.name,
        text: entry.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Directory link copied to clipboard!');
    }
  };

  const getPhilosophy = (entry: UnifiedDirectoryEntry) => {
    if (entry.type === 'person') {
      return entry.rawRecord.plan?.legal_name
        ? `${entry.name} is a dedicated leader in our community focused on sharing inspiration, guiding faith journeys, and organizing meaningful events.`
        : 'Focuses on theological frameworks, spiritual discipleship, and community leadership to enrich faith-based collaboration.';
    }
    return entry.description || 'Dedicated to excellence, innovation, and professional stewardship in the gospel ecosystem.';
  };

  const getFocusAreas = (entry: UnifiedDirectoryEntry): string[] => {
    if (entry.type === 'person') {
      return ['Theological Engagement', 'Digital Discipleship', 'Community Outreach'];
    }
    if (entry.type === 'service') {
      return ['Professional Quality', 'Community Rates', 'Flexible Scheduling'];
    }
    if (entry.type === 'event') {
      return ['Worship & Praise', 'Spiritual Growth', 'Fellowship'];
    }
    if (entry.type === 'article') {
      return ['Faith Formation', 'Inspirational Guides', 'Platform Insights'];
    }
    return ['Business Integrity', 'Professional Standards', 'Community Values'];
  };

  const getTagline = (entry: UnifiedDirectoryEntry) => {
    if (entry.type === 'person') {
      return `"${entry.name} is dedicated to utilizing modern tools to build and expand faith communities globally."`;
    }
    if (entry.type === 'service') {
      return `"Excellence is not an option; it is our offering to the community."`;
    }
    if (entry.type === 'event') {
      return `"Gathering in unity to strengthen, connect, and elevate our spiritual foundation."`;
    }
    return `"Faith-based professionalism is a new frontier for stewardship in the modern age."`;
  };

  return (
    <div className="pt-20 bg-light-gray dark:bg-gray-950 transition-colors min-h-screen">
      {/* Header section (shows only when not viewing detail profile) */}
      {!selectedListing && (
        <div className="bg-gradient-to-br from-primary via-primary/95 to-secondary/80 text-white py-20 px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="container-custom relative z-10 text-center space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-secondary" /> Verified Listings
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
              {heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-medium">
              {heroSubtitle}
            </p>
          </div>
        </div>
      )}

      {/* Directory Content Area */}
      <div className="container-custom py-12 px-6">
        {selectedListing ? (
          /* Elena Valerius Detail View Overhaul */
          <div className="space-y-8 animate-fadeIn">
            {/* Back Toolbar */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-6">
              <button
                onClick={() => setSelectedListing(null)}
                className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-secondary dark:hover:text-secondary font-semibold transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Directory
              </button>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedListing.type} Details</span>
            </div>

            {/* Split Columns Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              {/* Left Column - Profile Card */}
              <div className="lg:col-span-1 space-y-8">
                {/* Photo card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800/80 p-5 shadow-xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl"></div>
                  {selectedListing.image ? (
                    <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-inner bg-gray-100 dark:bg-gray-800">
                      <img
                        src={selectedListing.image}
                        alt={selectedListing.name}
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-850 dark:to-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-600 relative overflow-hidden">
                      <User className="w-20 h-20 stroke-[1]" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <span className="inline-block text-xs font-bold text-secondary dark:text-yellow-500 uppercase tracking-widest px-2.5 py-1 rounded bg-secondary/10 dark:bg-yellow-500/10">
                      {selectedListing.category}
                    </span>
                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                      {selectedListing.name}
                    </h2>
                    {selectedListing.type === 'person' && (
                      <p className="text-sm font-semibold italic text-secondary dark:text-yellow-500">
                        Spiritual Creator &amp; Guide
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => setShowCollab(true)}
                      className="flex-1 btn btn-secondary flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl shadow-lg shadow-secondary/20"
                    >
                      <Mail className="w-4 h-4" /> Collaborate
                    </button>
                    <button
                      onClick={() => handleShare(selectedListing)}
                      className="p-3 rounded-xl border border-gray-250 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      title="Share Profile"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Philosophy card */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Philosophy</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {getPhilosophy(selectedListing)}
                  </p>
                </div>

                {/* Focus Areas card */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800/80 p-6 space-y-4 shadow-sm">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-secondary dark:text-yellow-500">Focus Areas</h4>
                  <ul className="space-y-3">
                    {getFocusAreas(selectedListing).map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300 font-medium">
                        <span className="w-2 h-2 rounded-full bg-secondary dark:bg-yellow-500 mt-1.5 flex-shrink-0"></span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Reputation Score card */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <span>Aura Influence Score</span>
                    <span className="text-secondary dark:text-yellow-500 font-extrabold">98%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary dark:bg-yellow-500 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </div>
              </div>

              {/* Right Column - Latest Insights & Blockquote */}
              <div className="lg:col-span-2 space-y-12">
                {/* Insights header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Latest Insights</h3>
                  <a
                    href="/news"
                    className="text-xs font-extrabold text-secondary dark:text-yellow-500 uppercase tracking-widest hover:underline"
                  >
                    View All Insights
                  </a>
                </div>

                {/* Dynamic database articles by listing provider */}
                <div className="space-y-6">
                  {relatedInsights.map((insight: any) => (
                    <div
                      key={insight.id}
                      className="flex flex-col md:flex-row gap-6 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-150 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow group"
                    >
                      {/* Image */}
                      {(insight.cover_image || insight.image_url) && (
                        <div className="w-full md:w-44 aspect-[16/10] md:aspect-square rounded-xl overflow-hidden bg-gray-150 dark:bg-gray-800 flex-shrink-0">
                          <img
                            src={insight.cover_image || insight.image_url}
                            alt={insight.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-secondary dark:text-yellow-500 uppercase tracking-wider">
                            <span>{insight.category || 'Article'}</span>
                            <span>•</span>
                            <span className="text-gray-500 dark:text-gray-400">10 Min Read</span>
                          </div>
                          <h4 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-snug group-hover:text-secondary dark:group-hover:text-yellow-500 transition-colors">
                            {insight.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {insight.excerpt || insight.content?.replace(/<[^>]*>/g, '') || ''}
                          </p>
                        </div>
                        <div>
                          <a
                            href={['videos', 'podcasts', 'devotionals', 'sermon', 'music'].includes(insight.category) ? `/resources` : `/news/${insight.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-secondary dark:text-yellow-500 hover:text-primary transition-colors"
                          >
                            Read Article &rarr;
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                  {relatedInsights.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No posts or services linked to this listing yet.</p>
                  )}
                </div>

                {/* Callout Quote Card */}
                <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl p-10 shadow-lg relative overflow-hidden">
                  <div className="absolute -top-6 -left-6 text-white/5 font-black text-9xl leading-none font-serif select-none pointer-events-none">“</div>
                  <div className="relative z-10 space-y-4">
                    <p className="text-2xl font-serif font-medium italic leading-relaxed text-gray-100">
                      {getTagline(selectedListing)}
                    </p>
                    <p className="text-xs font-bold tracking-widest text-secondary uppercase">
                      — {selectedListing.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Search & Directory Explorer view */
          <div className="space-y-8">
            {/* Search Input & Pills Toolbar */}
            <div className="space-y-6">
              <div className="relative max-w-3xl mx-auto">
                <input
                  type="text"
                  placeholder="Search creators, artists, sound engineers, services, events, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all shadow-md text-base"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>

              {/* Filtering Tabs */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto pb-4">
                {[
                  { id: 'all', label: 'All Listings' },
                  { id: 'person', label: 'Artists & Creators' },
                  { id: 'service', label: 'Services & Vendors' },
                  { id: 'event', label: 'Events & Programs' },
                  { id: 'article', label: 'Insights & Articles' },
                  { id: 'business', label: 'Businesses' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                      selectedTab === tab.id
                        ? 'bg-secondary border-secondary text-white shadow-lg shadow-secondary/15'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size="lg" className="text-secondary" />
              </div>
            )}

            {/* Error state */}
            {error && (
              <ErrorMessage
                message="Failed to load community directory. Please try again."
                onRetry={() => refetch()}
              />
            )}

            {/* Listings Grid */}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEntries.map(entry => (
                  <div
                    key={`${entry.type}-${entry.id}`}
                    onClick={() => setSelectedListing(entry)}
                    className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800/80 overflow-hidden hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="p-6 space-y-4">
                      {/* Logo and Name header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {entry.image ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-150 dark:border-gray-800 flex-shrink-0">
                              <img
                                src={entry.image}
                                alt={entry.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-600 flex-shrink-0">
                              {entry.type === 'person' ? (
                                <User className="w-6 h-6" />
                              ) : entry.type === 'event' ? (
                                <Calendar className="w-6 h-6" />
                              ) : entry.type === 'article' ? (
                                <BookOpen className="w-6 h-6" />
                              ) : (
                                <Award className="w-6 h-6" />
                              )}
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-lg text-primary dark:text-white leading-tight group-hover:text-secondary dark:group-hover:text-yellow-500 transition-colors">
                              {entry.name}
                            </h3>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              {entry.category}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded bg-gray-100 dark:bg-gray-850 text-gray-500 dark:text-gray-400 border border-gray-150 dark:border-gray-800">
                          {entry.type}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-650 dark:text-gray-350 line-clamp-3 leading-relaxed">
                        {entry.description}
                      </p>
                    </div>

                    {/* Metadata Footer */}
                    <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-850/30 border-t border-gray-100 dark:border-gray-850/80 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      {entry.location ? (
                        <div className="flex items-center gap-1.5 font-medium truncate max-w-[70%]">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                          <span className="truncate">{entry.location}</span>
                        </div>
                      ) : (
                        <div></div>
                      )}
                      <div className="flex items-center gap-1 text-secondary dark:text-yellow-500 font-bold flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>5.0</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredEntries.length === 0 && (
              <div className="text-center py-20 max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No directory records found</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  We couldn't find any directory results matching "{searchQuery}" in category "{selectedTab}".
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTab('all');
                  }}
                  className="btn btn-secondary px-5 py-2 font-bold rounded-xl"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Collaborate Modal Popup */}
      {showCollab && selectedListing && (() => {
        // Helper to resolve contact information dynamically for different types
        let email = '';
        let phone = '';
        let socialLinks: any = {};

        if (selectedListing.type === 'business') {
          email = selectedListing.email || '';
          phone = selectedListing.phone || '';
          socialLinks = { website: selectedListing.website || '' };
        } else if (selectedListing.type === 'person') {
          const plan = selectedListing.rawRecord.plan;
          email = selectedListing.rawRecord.email || '';
          phone = plan?.phone || selectedListing.phone || '';
          socialLinks = plan?.social_links || {};
        } else if (selectedListing.type === 'service') {
          const provider = selectedListing.rawRecord.provider;
          const plan = provider?.member_plans?.[0] || provider?.member_plans;
          email = provider?.email || '';
          phone = plan?.phone || '';
          socialLinks = plan?.social_links || {};
        } else if (selectedListing.type === 'event') {
          const organizer = selectedListing.rawRecord.organizer;
          const plan = organizer?.member_plans?.[0] || organizer?.member_plans;
          email = organizer?.email || '';
          phone = plan?.phone || '';
          socialLinks = plan?.social_links || {};
        } else if (selectedListing.type === 'article') {
          const author = selectedListing.rawRecord.author;
          const plan = author?.member_plans?.[0] || author?.member_plans;
          email = author?.email || '';
          phone = plan?.phone || '';
          socialLinks = plan?.social_links || {};
        }

        const cleanPhone = (socialLinks.whatsapp || phone || '').replace(/[^0-9+]/g, '');
        const hasSocials = cleanPhone || email || Object.values(socialLinks).some(v => !!v);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-2xl p-6 space-y-6">
              <button
                onClick={() => setShowCollab(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-secondary/10 dark:bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto text-secondary dark:text-yellow-500">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Collaborate with {selectedListing.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Choose a method to connect and start collaborating.</p>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {(socialLinks.whatsapp || phone) ? (
                  <a
                    href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold text-sm transition-all border border-[#25D366]/20"
                  >
                    <span className="p-2 rounded-xl bg-white/20">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.09-3.931l.34.203c1.727 1.026 3.754 1.567 5.82 1.568 5.761 0 10.448-4.686 10.45-10.45.002-2.793-1.085-5.418-3.064-7.398-1.98-1.98-4.606-3.066-7.399-3.067-5.765 0-10.452 4.686-10.454 10.452-.001 2.133.559 4.218 1.621 6.012l.224.379-.997 3.64 3.722-.976zm11.239-6.02c-.328-.163-1.94-.957-2.24-1.066-.3-.11-.518-.163-.738.163-.22.327-.847 1.066-1.038 1.284-.19.217-.38.244-.708.081-1.123-.563-1.978-1.037-2.754-2.364-.206-.353-.206-.575-.028-.802.161-.203.328-.38.492-.573.164-.19.219-.327.328-.545.11-.217.055-.407-.028-.57-.082-.163-.738-1.777-1.01-2.434-.265-.636-.53-.55-.738-.56-.19-.01-.409-.012-.627-.012-.218 0-.573.082-.873.409-.3.327-1.145 1.116-1.145 2.723s1.173 3.158 1.336 3.376c.164.218 2.308 3.525 5.59 4.95.78.338 1.39.54 1.868.692.784.249 1.497.214 2.061.129.629-.094 1.94-.793 2.213-1.558.272-.764.272-1.417.19-1.557-.083-.14-.308-.222-.636-.385z" />
                      </svg>
                    </span>
                    <div className="text-left">
                      <p className="font-bold">WhatsApp</p>
                      <p className="text-xs opacity-80">{socialLinks.whatsapp || phone}</p>
                    </div>
                  </a>
                ) : null}

                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-secondary/10 text-secondary hover:bg-secondary hover:text-white font-bold text-sm transition-all border border-secondary/20"
                  >
                    <span className="p-2 rounded-xl bg-white/20">
                      <Mail className="w-5 h-5" />
                    </span>
                    <div className="text-left">
                      <p className="font-bold">Email Address</p>
                      <p className="text-xs opacity-80">{email}</p>
                    </div>
                  </a>
                ) : null}

                {socialLinks.facebook ? (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white font-bold text-sm transition-all border border-[#1877F2]/20"
                  >
                    <span className="p-2 rounded-xl bg-white/20">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </span>
                    <div className="text-left">
                      <p className="font-bold">Facebook</p>
                      <p className="text-xs truncate max-w-[240px] opacity-80">{socialLinks.facebook}</p>
                    </div>
                  </a>
                ) : null}

                {socialLinks.instagram ? (
                  <a
                    href={socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-[#E1306C]/10 text-[#E1306C] hover:bg-[#E1306C] hover:text-white font-bold text-sm transition-all border border-[#E1306C]/20"
                  >
                    <span className="p-2 rounded-xl bg-white/20">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </span>
                    <div className="text-left">
                      <p className="font-bold">Instagram</p>
                      <p className="text-xs truncate max-w-[240px] opacity-80">{socialLinks.instagram}</p>
                    </div>
                  </a>
                ) : null}

                {socialLinks.twitter ? (
                  <a
                    href={socialLinks.twitter.startsWith('http') ? socialLinks.twitter : `https://x.com/${socialLinks.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-gray-500/10 text-gray-900 dark:text-white hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black font-bold text-sm transition-all border border-gray-250 dark:border-gray-800"
                  >
                    <span className="p-2 rounded-xl bg-white/20 text-black dark:text-white">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </span>
                    <div className="text-left">
                      <p className="font-bold">Twitter / X</p>
                      <p className="text-xs truncate max-w-[240px] opacity-80">{socialLinks.twitter}</p>
                    </div>
                  </a>
                ) : null}

                {socialLinks.youtube ? (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-[#FF0000]/10 text-[#FF0000] hover:bg-[#FF0000] hover:text-white font-bold text-sm transition-all border border-[#FF0000]/20"
                  >
                    <span className="p-2 rounded-xl bg-white/20">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.553 9.388.553 9.388.553s7.518 0 9.388-.553a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </span>
                    <div className="text-left">
                      <p className="font-bold">YouTube</p>
                      <p className="text-xs truncate max-w-[240px] opacity-80">{socialLinks.youtube}</p>
                    </div>
                  </a>
                ) : null}

                {socialLinks.website ? (
                  <a
                    href={socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white font-bold text-sm transition-all border border-blue-500/20"
                  >
                    <span className="p-2 rounded-xl bg-white/20">
                      <Globe className="w-5 h-5" />
                    </span>
                    <div className="text-left">
                      <p className="font-bold">Visit Website</p>
                      <p className="text-xs truncate max-w-[240px] opacity-80">{socialLinks.website}</p>
                    </div>
                  </a>
                ) : null}

                {!hasSocials ? (
                  <Link
                    to="/contact"
                    onClick={() => setShowCollab(false)}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-gray-500/10 text-gray-700 dark:text-gray-300 hover:bg-gray-500 hover:text-white font-bold text-sm transition-all border border-gray-500/20"
                  >
                    <span className="p-2 rounded-xl bg-white/20">
                      <Globe className="w-5 h-5" />
                    </span>
                    <div className="text-left">
                      <p className="font-bold">General Contact Page</p>
                      <p className="text-xs opacity-80">Send general feedback / inquiry</p>
                    </div>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Directory;