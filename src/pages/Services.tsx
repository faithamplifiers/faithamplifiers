import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { fetchServices } from '../lib/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';

const Services: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: services, error, isLoading, refetch: mutate } = useQuery({ 
    queryKey: ['services'], 
    queryFn: fetchServices,
    staleTime: 30000,
  });

  const { data: dbHeader } = useQuery({
    queryKey: ['page-sections-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', 'services')
        .eq('section', 'hero')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const heroData = dbHeader?.content as any || {};
  const heroTitle = heroData.title || 'Professional Services';
  const heroSubtitle = heroData.subtitle || 'Elevate your ministry with our comprehensive range of professional services designed to amplify your message and reach.';

  // Filter services safely
  const filteredServices = (services || [])?.filter(service => {
    if (!service) return false;
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    const title = service.title?.toLowerCase() || '';
    const desc = service.description?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch = title.includes(q) || desc.includes(q);
    return matchesCategory && matchesSearch;
  });

  const { data: dynamicCategories } = useQuery({
    queryKey: ['service_categories_public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const categories = [
    { id: 'all', name: 'All Services' },
    ...(dynamicCategories || []).map((cat: any) => ({ id: cat.slug, name: cat.name }))
  ];

  return (
    <div className="pt-20">
      {/* Page header */}
      <div className="bg-primary py-16">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 !text-white">{heroTitle}</h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            {heroSubtitle}
          </p>
        </div>
      </div>

      {/* Services overview */}
      <div className="bg-white dark:bg-gray-900 py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Why Choose Our Services?</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Faith Amplifiers provides top-quality professional services tailored specifically for churches, ministries, and faith-based organizations. Our team of experts understands the unique needs of gospel events and content.
              </p>
              <ul className="space-y-3">
                {[
                  'Experienced professionals with ministry background',
                  'Customized solutions for faith-based contexts',
                  'Competitive pricing with ministry discounts',
                  'End-to-end project management',
                  'Cutting-edge technology and equipment',
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="bg-secondary/20 rounded-full p-1 mr-3 mt-1">
                      <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to="/contact" className="btn btn-primary">
                  Request a Quote
                </Link>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1603731125896-1e4ce9d4b6b5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                alt="Professional services"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Services listing */}
      <div className="bg-light-gray dark:bg-gray-800 py-16">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex overflow-x-auto pb-2 md:pb-0 w-full md:w-auto space-x-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    activeCategory === category.id
                      ? 'bg-secondary text-primary'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search services..."
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
              message="Failed to load services. Please try again."
              onRetry={() => mutate()}
            />
          )}

          {/* Services grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices?.map(service => (
                <div key={service.id} className="card group h-full bg-white dark:bg-gray-900 hover:shadow-xl transition-shadow duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.coverImage}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-3 py-1 bg-secondary text-primary text-sm font-medium rounded-full">
                        {service.category?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Service'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(service.rating || 0)
                                  ? 'text-secondary fill-secondary'
                                  : 'text-gray-350 dark:text-gray-655'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {service.rating > 0 
                            ? `${service.rating.toFixed(1)} (${service.ratingCount})`
                            : 'No reviews'}
                        </span>
                      </div>
                      <span className="text-primary dark:text-secondary font-bold">
                        {service.currency === 'USD' ? '$' : 
                         service.currency === 'NGN' ? '₦' : 
                         service.currency === 'EUR' ? '€' : 
                         service.currency === 'GBP' ? '£' : '$'}
                        {service.price || '0.00'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-primary dark:text-white">
                      <Link to={`/services/${service.slug}`} className="hover:text-secondary transition-colors">
                        {service.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
                      {service.description}
                    </p>
                    <div className="flex space-x-3 mt-auto">
                      <Link
                        to={`/services/${service.slug}`}
                        className="btn btn-outline flex-1 text-center"
                      >
                        View Details
                      </Link>
                      <Link
                        to="/contact"
                        className="btn btn-secondary flex-1 text-center"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && filteredServices?.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg">
              <h3 className="text-xl font-bold mb-2">No services found</h3>
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

      {/* Call to action */}
      <div className="bg-primary text-white py-16">
        <div className="container-custom text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 !text-white">Need a Custom Solution?</h2>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8">
            Contact us to discuss your specific requirements and get a personalized quote for your ministry or event.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/contact" className="btn bg-secondary text-primary hover:bg-secondary-light">
              Contact Us
            </Link>
            <Link to="/services/request-quote" className="btn bg-transparent border-2 border-white text-white hover:bg-white/10">
              Request a Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;