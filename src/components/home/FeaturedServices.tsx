import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchServices } from '../../lib/api';
import { supabase } from '../../lib/supabase';

const FeaturedServices: React.FC = () => {
  // 1. Fetch services
  const { data: services } = useQuery({ queryKey: ['services'], queryFn: fetchServices });

  // 2. Fetch page section info for services section
  const { data: servicesSection } = useQuery({
    queryKey: ['home-services-section'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', 'home')
        .eq('section', 'featured_services')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const sectionConfig = servicesSection?.content as any || {};
  const sectionTitle = sectionConfig.title || 'Our Professional Services';
  const sectionSubtitle = sectionConfig.subtitle || 'Elevate your ministry with production and creative services designed to amplify your global impact.';
  const pinnedServiceId = sectionConfig.pinned_service_id;

  // 3. Fetch pinned service specifically if configured
  const { data: pinnedService } = useQuery({
    queryKey: ['pinned-service', pinnedServiceId],
    queryFn: async () => {
      if (!pinnedServiceId) return null;
      const { data, error } = await supabase
        .from('services')
        .select('*, provider:profiles(*)')
        .eq('id', pinnedServiceId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        title: data.title || 'Untitled Service',
        slug: data.slug || data.id,
        description: data.description || '',
        category: data.category || 'other',
        price: data.price,
        coverImage: data.cover_url || data.cover_image || (data.portfolio_images && data.portfolio_images[0]) || 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80',
        rating: 5.0,
        ratingCount: 0
      };
    },
    enabled: !!pinnedServiceId
  });

  // Resolve featured services grid (up to 4 items)
  const defaultFeatured = services?.filter(s => s.featured) || [];
  let gridServices = [...defaultFeatured];

  if (pinnedService) {
    gridServices = [pinnedService, ...gridServices.filter(s => s.id !== pinnedService.id)];
  }

  // Fallback to active services if featured list is empty
  if (gridServices.length === 0 && services && services.length > 0) {
    gridServices = services.slice(0, 4);
  } else {
    gridServices = gridServices.slice(0, 4);
  }

  return (
    <section className="py-24 bg-[#111111] text-white border-b border-gray-900">
      <div className="container-custom px-6 text-center space-y-16">
        
        {/* Centered Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-secondary">
            WHAT WE OFFER
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {sectionTitle}
          </h2>
          <div className="w-12 h-1 bg-secondary mx-auto rounded-full"></div>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            {sectionSubtitle}
          </p>
        </div>

        {/* 4 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {gridServices.map((service) => (
            <div
              key={service.id}
              className="bg-black/45 rounded-2xl border border-gray-900 overflow-hidden flex flex-col justify-between group hover:border-gray-850 hover:shadow-xl transition-all duration-350"
            >
              {/* Image & category badge */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-900 border-b border-gray-950">
                <img
                  src={service.coverImage}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Category Badge bottom-left */}
                <div className="absolute bottom-3 left-3">
                  <span className="inline-block px-2.5 py-1 bg-secondary text-primary text-[10px] font-black uppercase tracking-wider rounded-md shadow-md">
                    {(service.category || 'service').replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Service details */}
              <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-4">
                <div className="space-y-2">
                  <h4 className="font-extrabold text-base text-gray-150 leading-snug group-hover:text-white transition-colors line-clamp-2">
                    {service.title}
                  </h4>
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                    {service.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-gray-900/60">
                  <Link
                    to={`/services/${service.slug}`}
                    className="inline-flex items-center gap-1 text-secondary hover:text-white font-extrabold text-xs uppercase tracking-widest transition-colors"
                  >
                    Learn More →
                  </Link>
                  {service.price && (
                    <span className="text-xs font-black text-gray-450 tracking-wider">
                      {service.price}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {gridServices.length === 0 && (
          <div className="py-12 border border-dashed border-gray-850 rounded-2xl text-gray-500 text-sm">
            No active professional services registered.
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4">
          <Link
            to="/services"
            className="inline-block border border-gray-800 hover:border-secondary text-gray-300 hover:text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all bg-transparent"
          >
            Show More Services
          </Link>
        </div>

      </div>
    </section>
  );
};

export default FeaturedServices;