import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchNews } from '../lib/api';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';

const News: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: articles, error, isLoading, refetch } = useQuery({ queryKey: ['articles'], queryFn: fetchNews });

  const { data: dbHeader } = useQuery({
    queryKey: ['page-sections-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', 'news')
        .eq('section', 'hero')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const heroData = dbHeader?.content as any || {};
  const heroTitle = heroData.title || 'Gospel News & Articles';
  const heroSubtitle = heroData.subtitle || 'Stay informed with the latest happenings in the gospel community, inspiring stories, and spiritual insights.';

  // Filter articles based on category and search query
  const filteredArticles = articles?.filter(article => {
    const matchesCategory = activeCategory === 'all' || article.category === activeCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['content_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('content_categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const categories = [
    { slug: 'all', name: 'All' },
    ...dbCategories
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
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex overflow-x-auto pb-2 md:pb-0 w-full md:w-auto space-x-2">
            {categories.map((category: any) => (
              <button
                key={category.slug}
                onClick={() => setActiveCategory(category.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  activeCategory === category.slug
                    ? 'bg-secondary text-primary'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search articles..."
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
            message="Failed to load articles. Please try again."
            onRetry={() => refetch()}
          />
        )}

        {/* Articles grid */}
        {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles?.map(article => (
            <div key={article.id} className="card group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className="inline-block px-3 py-1 bg-secondary text-primary text-sm font-medium rounded-full">
                    {(article.category || 'news').charAt(0).toUpperCase() + (article.category || 'news').slice(1)}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center mr-4">
                    <img
                      src={article.author.avatar}
                      alt={article.author.name}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span>{article.author.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>
                      {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  <Link to={`/news/${article.slug}`} className="hover:text-secondary transition-colors">
                    {article.title}
                  </Link>
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {article.excerpt}
                </p>
                <Link
                  to={`/news/${article.slug}`}
                  className="text-secondary font-medium hover:underline"
                >
                  Read More →
                </Link>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredArticles?.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-2">No articles found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search or filter to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
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

export default News;