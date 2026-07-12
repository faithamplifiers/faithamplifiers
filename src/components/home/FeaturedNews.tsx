import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchNews } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';

const FeaturedNews: React.FC = () => {
  // 1. Fetch news articles
  const { data: articles } = useQuery({ queryKey: ['articles'], queryFn: fetchNews });

  // 2. Fetch pinning section configuration from page_sections
  const { data: newsSection } = useQuery({
    queryKey: ['home-news-section'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', 'home')
        .eq('section', 'featured_news')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const sectionConfig = newsSection?.content as any || {};
  const sectionTitle = sectionConfig.title || 'Latest Gospel News';
  const sectionSubtitle = sectionConfig.subtitle || 'Stay informed with the latest happenings in the gospel community.';
  const pinnedArticleId = sectionConfig.pinned_article_id;

  // 3. Fetch pinned article if configured
  const { data: pinnedArticle } = useQuery({
    queryKey: ['pinned-article', pinnedArticleId],
    queryFn: async () => {
      if (!pinnedArticleId) return null;
      const { data, error } = await supabase
        .from('content')
        .select('*, author:profiles(*)')
        .eq('id', pinnedArticleId)
        .eq('status', 'published')
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        slug: data.slug || data.id,
        title: data.title,
        excerpt: data.excerpt || '',
        content: data.content,
        author: {
          id: data.author?.id || '',
          name: data.author?.full_name || data.author?.username || 'Unknown',
          avatar: data.author?.avatar_url || '',
        },
        category: data.category || 'News',
        publishedAt: data.published_at || data.created_at,
        coverImage: data.cover_image || data.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80',
        videoUrl: data.video_url,
        audioUrl: data.audio_url,
        imageUrl: data.image_url,
      };
    },
    enabled: !!pinnedArticleId
  });

  const featuredArticles = articles?.filter(article => article.featured) || [];
  
  // Resolve main (left) card article
  const mainArticle = pinnedArticle || featuredArticles[0] || articles?.[0] || null;
  
  // Resolve right list articles (filter out main article to prevent duplicate entries)
  const sidebarArticles = articles
    ?.filter(article => article.id !== mainArticle?.id)
    .slice(0, 3) || [];

  return (
    <section className="py-24 bg-[#0a0a0a] text-white border-b border-gray-900">
      <div className="container-custom px-6">
        {/* News Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Left Column (2/3 width) - Large Featured / Breaking News Card */}
          <div className="lg:col-span-2 space-y-6">
            {mainArticle ? (
              <div className="group block space-y-5">
                {/* Big full-bleed image container with hover zooming */}
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
                  <img
                    src={mainArticle.coverImage}
                    alt={mainArticle.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  {/* Breaking / Featured Badge */}
                  <div className="absolute top-5 left-5">
                    <span className="inline-block px-3 py-1 bg-secondary text-primary text-xs font-extrabold uppercase tracking-widest rounded-md">
                      {pinnedArticleId ? 'FEATURED SPOTLIGHT' : 'BREAKING NEWS'}
                    </span>
                  </div>
                </div>

                {/* Article Info */}
                <div className="space-y-3">
                  <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight group-hover:text-secondary transition-colors">
                    <Link to={`/news/${mainArticle.slug}`}>{mainArticle.title}</Link>
                  </h3>
                  
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed line-clamp-3">
                    {mainArticle.excerpt}
                  </p>

                  <div className="pt-2 flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <span>{mainArticle.category.replace('-', ' ')}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span>
                    <span>
                      {format(new Date(mainArticle.publishedAt), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  <div className="pt-2">
                    <Link
                      to={`/news/${mainArticle.slug}`}
                      className="inline-flex items-center gap-2 text-secondary hover:text-white font-extrabold text-sm uppercase tracking-widest transition-colors"
                    >
                      Read Full Story <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-gray-850 rounded-2xl text-gray-500 text-sm">
                No gospel news articles currently published.
              </div>
            )}
          </div>

          {/* Right Column (1/3 width) - Stacked Recent News list */}
          <div className="lg:col-span-1 space-y-6 lg:border-l lg:border-gray-900 lg:pl-10">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-gray-900 pb-3">
              <span className="w-1 h-5 bg-secondary rounded-full"></span>
              <h4 className="text-sm font-black uppercase tracking-widest text-secondary">
                Recent News
              </h4>
            </div>

            {/* Stacked list of articles */}
            <div className="space-y-8">
              {sidebarArticles.map(article => (
                <Link
                  key={article.id}
                  to={`/news/${article.slug}`}
                  className="flex gap-4 group items-start hover:bg-white/[0.02] p-2 -m-2 rounded-xl transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 flex-shrink-0">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Title & Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider text-secondary">
                      {article.category.replace('-', ' ')}
                    </span>
                    <h5 className="font-extrabold text-sm text-gray-150 group-hover:text-white leading-snug line-clamp-2 transition-colors">
                      {article.title}
                    </h5>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      <span>
                        {format(new Date(article.publishedAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {sidebarArticles.length === 0 && (
                <div className="text-center py-6 text-gray-600 text-xs">
                  No additional recent news.
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="pt-4">
              <Link
                to="/news"
                className="block text-center border border-gray-800 hover:border-secondary text-gray-300 hover:text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all bg-transparent"
              >
                Show More News
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FeaturedNews;