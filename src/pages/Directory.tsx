import React, { useState } from 'react';
import { Search, Star, MapPin, Mail, Phone, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchDirectory } from '../lib/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';

const Directory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: directoryListings, error, isLoading, refetch } = useQuery({ queryKey: ['directoryListings'], queryFn: fetchDirectory });

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
  const heroTitle = heroData.title || 'Gospel Business Directory';
  const heroSubtitle = heroData.subtitle || 'Connect with trusted professionals and businesses in the gospel community.';

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'Audio Equipment', name: 'Audio Equipment' },
    { id: 'Gospel Artists', name: 'Gospel Artists' },
    { id: 'Caterers', name: 'Caterers' },
    { id: 'Sound Engineers', name: 'Sound Engineers' },
    { id: 'Event Planners', name: 'Event Planners' },
    { id: 'Videographers', name: 'Videographers' },
  ];

  const filteredListings = directoryListings?.filter(listing => {
    const matchesSearch = listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-20">
      {/* Header */}
      <div className="bg-primary text-white py-16">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{heroTitle}</h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            {heroSubtitle}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="container-custom py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search businesses, services, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="flex-shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-48 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-secondary focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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
            message="Failed to load directory listings. Please try again."
            onRetry={() => refetch()}
          />
        )}

        {/* Listings Grid */}
        {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings?.map(listing => (
            <div key={listing.id} className="directory-card">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                    <img
                      src={listing.logo}
                      alt={listing.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary dark:text-white">
                      {listing.name}
                    </h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {listing.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(listing.rating || 5)
                            ? 'text-secondary fill-current dark:text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {(listing.rating || 5).toFixed(1)}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {listing.description}
                </p>

                <div className="space-y-2 text-sm">
                  {listing.location && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{listing.location}</span>
                    </div>
                  )}
                  {listing.owner?.email && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4 mr-2" />
                      <a href={`mailto:${listing.owner.email}`} className="hover:text-secondary">
                        {listing.owner.email}
                      </a>
                    </div>
                  )}
                  {listing.owner?.phone && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4 mr-2" />
                      <a href={`tel:${listing.owner.phone}`} className="hover:text-secondary">
                        {listing.owner.phone}
                      </a>
                    </div>
                  )}
                  {listing.website && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Globe className="w-4 h-4 mr-2" />
                      <a
                        href={listing.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-secondary"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredListings?.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-2">No listings found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search or filter to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
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

export default Directory;