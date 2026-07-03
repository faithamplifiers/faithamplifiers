import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FileText, ArrowLeft } from 'lucide-react';
import { CMSSectionRenderer } from '../components/CMSSectionRenderer';

const DynamicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ['cms-page', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug specified');
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  useEffect(() => {
    if (page) {
      // Set Document Title
      document.title = `${page.meta_title || page.title} | Faith Amplifiers`;
      
      // Set Meta Description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', page.meta_description || '');
      } else {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        metaDesc.setAttribute('content', page.meta_description || '');
        document.head.appendChild(metaDesc);
      }
    }
  }, [page]);

  if (isLoading) {
    return (
      <div className="pt-32 pb-20 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" className="text-secondary" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="pt-32 pb-20 container-custom min-h-[65vh]">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Page Not Found</h2>
          <p className="text-gray-650 dark:text-gray-400">
            The page you are looking for does not exist or has been removed by the administrator.
          </p>
          <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go back Home
          </Link>
        </div>
      </div>
    );
  }

  // Determine if content is sectional JSON or legacy HTML content
  let sections: any[] | null = null;
  try {
    const parsed = JSON.parse(page.content);
    if (Array.isArray(parsed)) {
      sections = parsed;
    }
  } catch (e) {
    // Content is legacy plain HTML/text
    sections = null;
  }

  return (
    <div className="pt-20 bg-light-gray dark:bg-gray-900 min-h-screen">
      {sections ? (
        // Render dynamic CMS sections sequentially
        <CMSSectionRenderer sections={sections} />
      ) : (
        // Fallback for legacy plain HTML pages
        <>
          {/* Title block */}
          <div className="bg-primary py-12 md:py-16 text-white text-left">
            <div className="container-custom max-w-4xl">
              <h1 className="text-3xl md:text-5xl font-black">{page.title}</h1>
            </div>
          </div>

          {/* Main body */}
          <div className="container-custom max-w-4xl py-12 px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-10 border border-gray-150 dark:border-gray-700 shadow-sm text-left">
              <div 
                className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-secondary hover:prose-a:text-secondary-light leading-relaxed"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DynamicPage;
