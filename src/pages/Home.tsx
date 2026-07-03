import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { CMSSectionRenderer } from '../components/CMSSectionRenderer';

// Legacy Home components (fallback)
import Hero from '../components/home/Hero';
import FeaturedServices from '../components/home/FeaturedServices';
import FeaturedNews from '../components/home/FeaturedNews';
import UpcomingEvents from '../components/home/UpcomingEvents';
import DirectorySection from '../components/home/DirectorySection';
import ResourcesSection from '../components/home/ResourcesSection';
import Testimonials from '../components/home/Testimonials';
import CallToAction from '../components/home/CallToAction';

const Home: React.FC = () => {
  // 1. Fetch from the CMS pages table where slug = 'home'
  const { data: page, isLoading } = useQuery({
    queryKey: ['cms-home-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', 'home')
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
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

  // If page content exists in CMS, render it dynamically
  if (cmsSections && cmsSections.length > 0) {
    return (
      <div className="pt-20 bg-light-gray dark:bg-gray-900 min-h-screen">
        <CMSSectionRenderer sections={cmsSections} />
      </div>
    );
  }

  // Otherwise, fall back to the default hardcoded landing layout
  return (
    <div>
      <Hero />
      <FeaturedServices />
      <FeaturedNews />
      <UpcomingEvents />
      <DirectorySection />
      <ResourcesSection />
      <Testimonials />
      <CallToAction />
    </div>
  );
};

export default Home;