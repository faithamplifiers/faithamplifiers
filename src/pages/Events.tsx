import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Search, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { fetchEvents } from '../lib/api';
import { format } from 'date-fns';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';

const Events: React.FC = () => {
  const [activeType, setActiveType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: events, error, isLoading, refetch } = useQuery({ queryKey: ['events'], queryFn: fetchEvents });

  const { data: dbHeader } = useQuery({
    queryKey: ['page-sections-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', 'events')
        .eq('section', 'hero')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const heroData = dbHeader?.content as any || {};
  const heroTitle = heroData.title || 'Gospel Events';
  const heroSubtitle = heroData.subtitle || 'Discover and connect with faith-based events happening in your community and beyond.';

  // Filter events based on type and search query
  const filteredEvents = events?.filter(event => {
    const matchesType = activeType === 'all' || event.type === activeType;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const { data: dynamicEventTypes } = useQuery({
    queryKey: ['event_categories_public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const eventTypes = [
    { id: 'all', name: 'All Events' },
    ...(dynamicEventTypes || []).map((cat: any) => ({ id: cat.slug, name: cat.name }))
  ];

  return (
    <div className="pt-20">
      {/* Page header */}
      <div className="bg-primary text-white py-16">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{heroTitle}</h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            {heroSubtitle}
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* Search and filter */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div className="w-full md:w-64 order-2 md:order-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 order-1 md:order-2 w-full md:w-auto">
            <div className="hidden md:flex overflow-x-auto pb-2 md:pb-0 space-x-2">
              {eventTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setActiveType(type.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    activeType === type.id
                      ? 'bg-secondary text-primary'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
            
            {/* Mobile filter button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-200 w-full justify-between"
            >
              <span>Filter: {eventTypes.find(t => t.id === activeType)?.name || 'All Events'}</span>
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Mobile filter dropdown */}
        {isFilterOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 mb-6">
            <div className="flex flex-col space-y-2">
              {eventTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setActiveType(type.id);
                    setIsFilterOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-left ${
                    activeType === type.id
                      ? 'bg-secondary text-primary'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" className="text-secondary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <ErrorMessage
            message="Failed to load events. Please try again."
            onRetry={() => refetch()}
          />
        )}

        {/* Events grid */}
        {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents?.map(event => (
            <div key={event.id} className="card group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className="inline-block px-3 py-1 bg-secondary text-primary text-sm font-medium rounded-full">
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                </div>
                {/* Date badge */}
                <div className="absolute top-4 right-4 bg-white text-primary rounded-lg overflow-hidden shadow-lg">
                  <div className="bg-secondary px-3 py-1 text-center">
                    <span className="text-xs font-bold uppercase">
                      {format(new Date(event.startDate), 'MMM')}
                    </span>
                  </div>
                  <div className="px-3 py-2 text-center">
                    <span className="text-xl font-bold">
                      {format(new Date(event.startDate), 'd')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">
                  <Link to={`/events/${event.slug}`} className="hover:text-secondary transition-colors">
                    {event.title}
                  </Link>
                </h3>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-secondary font-bold text-sm">
                    {event.price === '0.00' ? 'FREE' : (
                      <>
                        {event.currency === 'USD' ? '$' : 
                         event.currency === 'NGN' ? '₦' : 
                         event.currency === 'EUR' ? '€' : 
                         event.currency === 'GBP' ? '£' : '$'}
                        {event.price}
                      </>
                    )}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-2 text-secondary" />
                    <span>
                      {format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-2 text-secondary" />
                    <span>
                      {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2 text-secondary" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Link
                    to={`/events/${event.slug}`}
                    className="btn btn-outline flex-1 text-center"
                  >
                    Details
                  </Link>
                  {event.ticketUrl && (
                    <a
                      href={event.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary flex-1 text-center"
                    >
                      Get Tickets
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredEvents?.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-2">No events found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search or filter to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setActiveType('all');
                setSearchQuery('');
              }}
              className="btn btn-outline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;