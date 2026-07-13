import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

const UpcomingEvents: React.FC = () => {
  // 1. Fetch all events
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: fetchEvents });

  // 2. Fetch page section info for events section
  const { data: eventsSection } = useQuery({
    queryKey: ['home-events-section'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', 'home')
        .eq('section', 'featured_events')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const sectionConfig = eventsSection?.content as any || {};
  const sectionTitle = sectionConfig.title || 'Upcoming Events';
  const sectionSubtitle = sectionConfig.subtitle || 'Join us for transformative spiritual experiences.';
  const pinnedEventId = sectionConfig.pinned_event_id;

  // 3. Fetch pinned event specifically if configured
  const { data: pinnedEvent } = useQuery({
    queryKey: ['pinned-event', pinnedEventId],
    queryFn: async () => {
      if (!pinnedEventId) return null;
      const { data, error } = await supabase
        .from('events')
        .select('*, organizer:profiles(*)')
        .eq('id', pinnedEventId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        title: data.title || 'Untitled Event',
        slug: data.slug || data.id,
        description: data.description || '',
        type: data.type || 'general',
        startDate: data.start_date || new Date().toISOString(),
        endDate: data.end_date || new Date().toISOString(),
        location: data.location || '',
        category: data.type || 'general',
        organizer: {
          id: data.organizer?.id || '',
          name: data.organizer?.full_name || data.organizer?.username || 'Unknown',
        },
        coverImage: data.cover_image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1170&q=80',
        capacity: data.capacity,
        price: data.price || '0.00',
        currency: (data.currency || 'USD') as 'USD' | 'NGN' | 'EUR' | 'GBP',
        ticketUrl: data.ticket_url,
        livestreamUrl: data.livestream_url,
        status: data.status || 'upcoming',
      };
    },
    enabled: !!pinnedEventId
  });

  // Sort events by date (closest first)
  const sortedUpcomingEvents = (events ? [...events] : [])
    .sort((a, b) => new Date(a.startDate || Date.now()).getTime() - new Date(b.startDate || Date.now()).getTime());

  // Resolve main (left) card event
  const mainEvent = pinnedEvent || sortedUpcomingEvents[0] || null;

  // Resolve right list events (exclude main to prevent duplication)
  const sidebarEvents = sortedUpcomingEvents
    .filter(event => event.id !== mainEvent?.id)
    .slice(0, 2);

  return (
    <section className="py-24 bg-white dark:bg-[#0d0d0d] text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-900">
      <div className="container-custom px-6 space-y-12">
        
        {/* Header Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 dark:border-gray-900 pb-6 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight !text-gray-900 dark:!text-white">
              {sectionTitle}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              {sectionSubtitle}
            </p>
          </div>
          <Link
            to="/events"
            className="text-secondary hover:text-primary dark:hover:text-white font-extrabold text-sm uppercase tracking-widest inline-flex items-center gap-2 transition-colors"
          >
            View All Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-stretch">
          
          {/* Left Column (2/3 width) - Big Featured Event Card */}
          <div className="lg:col-span-2">
            {mainEvent ? (
              <div className="bg-white dark:bg-black/45 rounded-3xl border border-gray-200 dark:border-gray-900 overflow-hidden flex flex-col h-full group hover:border-secondary/40 dark:hover:border-gray-850 transition-all duration-300">
                {/* Event Image Banner with Zoom */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-950">
                  <img
                    src={mainEvent.coverImage}
                    alt={mainEvent.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                  
                  {/* LIVE / FEATURED Badges top-left */}
                  <div className="absolute top-5 left-5 flex gap-2">
                    {mainEvent.status === 'ongoing' ? (
                      <span className="inline-block px-2.5 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md animate-pulse">
                        LIVE
                      </span>
                    ) : null}
                    <span className="inline-block px-2.5 py-1 bg-secondary text-primary text-[10px] font-black uppercase tracking-wider rounded-md">
                      FEATURED
                    </span>
                  </div>
                </div>

                {/* Event details */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-2xl md:text-3xl font-extrabold !text-gray-900 dark:!text-white leading-snug group-hover:!text-secondary transition-colors">
                      <Link to={`/events/${mainEvent.slug}`}>{mainEvent.title}</Link>
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                      {mainEvent.description}
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-secondary flex-shrink-0" />
                        <span>{format(new Date(mainEvent.startDate), 'EEEE, MMM dd')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-secondary flex-shrink-0" />
                        <span>{format(new Date(mainEvent.startDate), 'hh:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-secondary flex-shrink-0" />
                        <span className="truncate">{mainEvent.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-900/60">
                    {mainEvent.ticketUrl ? (
                      <a
                        href={mainEvent.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-secondary hover:bg-secondary-light text-primary font-black px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-secondary/15 text-xs uppercase tracking-widest"
                      >
                        Get Tickets
                      </a>
                    ) : (
                      <Link
                        to={`/events/${mainEvent.slug}`}
                        className="inline-block bg-secondary hover:bg-secondary-light text-primary font-black px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-secondary/15 text-xs uppercase tracking-widest"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-24 text-center border border-dashed border-gray-300 dark:border-gray-850 rounded-3xl text-gray-400 dark:text-gray-500 text-sm flex items-center justify-center">
                No events currently scheduled.
              </div>
            )}
          </div>

          {/* Right Column (1/3 width) - Stacked Events List */}
          <div className="lg:col-span-1 flex flex-col justify-between gap-6">
            
            <div className="space-y-6">
              {sidebarEvents.map(event => (
                <div
                  key={event.id}
                  className="bg-white dark:bg-black/35 rounded-2xl border border-gray-200 dark:border-gray-900 p-4 flex gap-4 items-center group hover:border-secondary/40 dark:hover:border-gray-850 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-850 flex-shrink-0">
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1.5 text-left">
                    <span className="inline-block text-[9px] font-black uppercase tracking-widest text-secondary">
                      {`[${(event.type || 'EVENT').toUpperCase()}]`}
                    </span>
                    <h4 className="font-extrabold text-sm !text-gray-700 dark:!text-gray-200 group-hover:!text-secondary leading-snug line-clamp-2 transition-colors">
                      <Link to={`/events/${event.slug}`}>{event.title}</Link>
                    </h4>
                    
                    <div className="space-y-0.5 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>{format(new Date(event.startDate), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{format(new Date(event.startDate), 'h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {sidebarEvents.length === 0 && (
                <div className="text-center py-12 text-gray-400 dark:text-gray-600 text-xs">
                  No additional upcoming events.
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="pt-4 lg:pt-0">
              <Link
                to="/events"
                className="block text-center border border-gray-300 dark:border-gray-800 hover:border-secondary text-gray-600 dark:text-gray-300 hover:text-secondary py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all bg-transparent"
              >
                Explore All Events
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default UpcomingEvents;