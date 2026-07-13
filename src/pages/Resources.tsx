import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, Headphones, BookOpen, Search, Download, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchResources } from '../lib/api';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';

const Resources: React.FC = () => {
  const [activeType, setActiveType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: resources, error, isLoading, refetch } = useQuery({ queryKey: ['resources'], queryFn: fetchResources });

  const { data: dbHeader } = useQuery({
    queryKey: ['page-sections-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', 'resources')
        .eq('section', 'hero')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const heroData = dbHeader?.content as any || {};
  const heroTitle = heroData.title || 'Faith Resources';
  const heroSubtitle = heroData.subtitle || 'Discover a wealth of spiritual content to strengthen your faith journey and ministry.';

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['content_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('content_categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Filter resources based on category and search query
  const filteredResources = resources?.filter(resource => {
    const matchesType = activeType === 'all' || resource.category === activeType;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const resourceCategories = dbCategories.filter((cat: any) => 
    ['videos', 'podcasts', 'devotionals', 'sermon', 'music'].includes(cat.slug)
  );

  const getIconForCategory = (slug: string) => {
    if (slug === 'videos' || slug === 'sermon') return Video;
    if (slug === 'podcasts' || slug === 'music') return Headphones;
    return BookOpen;
  };

  const types = [
    { id: 'all', name: 'All Resources', icon: BookOpen },
    ...resourceCategories.map((cat: any) => ({
      id: cat.slug,
      name: cat.name,
      icon: getIconForCategory(cat.slug)
    }))
  ];

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-secondary" />;
      case 'podcast':
        return <Headphones className="w-5 h-5 text-secondary" />;
      case 'devotional':
        return <BookOpen className="w-5 h-5 text-secondary" />;
      default:
        return null;
    }
  };

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <div className="bg-primary py-16">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 !text-white">{heroTitle}</h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            {heroSubtitle}
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* Search and filter */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex overflow-x-auto pb-2 md:pb-0 w-full md:w-auto space-x-2">
            {types.map((type: any) => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  activeType === type.id
                    ? 'bg-secondary text-primary'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <type.icon className="w-4 h-4 mr-2" />
                {type.name}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
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
            message="Failed to load resources. Please try again."
            onRetry={() => refetch()}
          />
        )}

        {/* Resources grid */}
        {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredResources?.map(resource => (
            <div key={resource.id} className="card group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={resource.coverImage}
                  alt={resource.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                
                {/* Resource type icon */}
                <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-2 rounded-full">
                  {getResourceIcon(resource.type)}
                </div>
                
                {/* Published date */}
                <div className="absolute bottom-4 left-4 text-white text-sm">
                  <span>
                    {formatDistanceToNow(new Date(resource.publishedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-secondary transition-colors"
                  >
                    {resource.title}
                  </a>
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {resource.description}
                </p>
                <div className="flex space-x-3">
                  <a
                    href={resource.url}
                    className="btn btn-primary flex-1 flex items-center justify-center"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {resource.type === 'video' && <Video className="w-4 h-4 mr-2" />}
                    {resource.type === 'podcast' && <Headphones className="w-4 h-4 mr-2" />}
                    {resource.type === 'devotional' && <BookOpen className="w-4 h-4 mr-2" />}
                    {resource.type === 'video' && 'Watch Now'}
                    {resource.type === 'podcast' && 'Listen Now'}
                    {resource.type === 'devotional' && 'Read Now'}
                  </a>
                  {resource.type === 'devotional' && (
                    <button className="btn btn-outline flex items-center px-4">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button className="btn btn-outline flex items-center px-4">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredResources?.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-2">No resources found</h3>
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

export default Resources;