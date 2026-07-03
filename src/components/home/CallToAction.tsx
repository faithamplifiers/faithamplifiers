import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

const CallToAction: React.FC = () => {
  const { data: dbCta } = useQuery({
    queryKey: ['home-cta-section'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', 'home')
        .eq('section', 'cta')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const ctaContent = dbCta?.content as any || {};
  const title = ctaContent.title || 'Ready to Amplify Your Faith Journey?';
  const text = ctaContent.text || 'Join our community today to access exclusive content, connect with like-minded believers, and discover professional services to enhance your ministry.';
  const primaryLabel = ctaContent.primary_label || 'Join Now';
  const primaryLink = ctaContent.primary_link || '/register';
  const secondaryLabel = ctaContent.secondary_label || 'Explore Services';
  const secondaryLink = ctaContent.secondary_link || '/services';

  return (
    <section className="py-20 bg-gradient-to-r from-primary to-primary-dark text-white">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {title}
          </h2>
          <p className="text-xl text-gray-200 mb-10">
            {text}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to={primaryLink} className="btn bg-secondary text-primary hover:bg-secondary-light text-lg px-8 py-3">
              {primaryLabel}
            </Link>
            <Link to={secondaryLink} className="btn bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-3">
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;