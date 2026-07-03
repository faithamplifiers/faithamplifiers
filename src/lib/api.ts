import { supabase } from './supabase';
import { Article, Event, Service, DirectoryListing, Resource, User } from '../types';

const TIMEOUT_MS = 10000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });
  return Promise.race([promise, timeout]);
}

export async function fetchServices(): Promise<Service[]> {
  try {
    const { data, error } = await withTimeout(supabase
      .from('services')
      .select(`
        *,
        provider:profiles(*),
        service_ratings(rating_value)
      `)
      .eq('status', 'active'));
      
    if (error) {
      console.error('Error fetching services:', error);
      return [];
    }
    
    return data.map(service => {
      const ratings = (service.service_ratings || []) as any[];
      const ratingCount = ratings.length;
      const totalRating = ratings.reduce((sum, r) => sum + (r.rating_value || 0), 0);
      const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

      return {
        id: service.id,
        title: service.title || 'Untitled Service',
        slug: service.slug || service.id,
        description: service.description || '',
        category: (service.category || 'other') as Service['category'],
        price: service.price,
        currency: service.currency as Service['currency'],
        provider: {
          id: service.provider?.id || '',
          name: service.provider?.full_name || service.provider?.username || 'Unknown',
          email: '',
          role: service.provider?.role as User['role'] || 'member',
        },
        coverImage: service.cover_url || service.cover_image || (service.portfolio_images && service.portfolio_images[0]) || 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80',
        rating: averageRating,
        ratingCount: ratingCount
      };
    });
  } catch (err) {
    console.error('Services fetch timed out or failed:', err);
    return [];
  }
}

export async function fetchNews() {
  const { data, error } = await supabase
    .from('content')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching news:', error);
    return [];
  }
  
  return data.map(article => ({
    id: article.id,
    slug: article.slug || article.id,
    title: article.title,
    excerpt: article.excerpt || '',
    content: article.content,
    author: {
      id: article.author?.id || '',
      name: article.author?.full_name || article.author?.username || 'Unknown',
      avatar: article.author?.avatar_url || '',
    },
    category: article.category || 'News',
    publishedAt: article.published_at || article.created_at,
    coverImage: article.cover_image || article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80',
    videoUrl: article.video_url,
    audioUrl: article.audio_url,
    imageUrl: article.image_url,
  }));
}

export async function fetchEvents() {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organizer:profiles(*)
    `)
    .order('start_date', { ascending: true });
    
  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  
  return data.map(event => ({
    id: event.id,
    title: event.title || 'Untitled Event',
    slug: event.slug || event.id,
    description: event.description || '',
    type: event.type || 'general',
    startDate: event.start_date || new Date().toISOString(),
    endDate: event.end_date || new Date().toISOString(),
    location: event.location || '',
    category: event.type || 'general',
    organizer: {
      id: event.organizer?.id || '',
      name: event.organizer?.full_name || event.organizer?.username || 'Unknown',
    },
    coverImage: event.cover_image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80',
    capacity: event.capacity,
    price: event.price || '0.00',
    currency: (event.currency || 'USD') as 'USD' | 'NGN' | 'EUR' | 'GBP',
    ticketUrl: event.ticket_url,
    livestreamUrl: event.livestream_url,
    status: event.status || 'upcoming',
  }));
}

export async function fetchDirectory() {
  const { data, error } = await supabase
    .from('directory_listings')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching directory:', error);
    return [];
  }
  
  return data.map(listing => ({
    id: listing.id,
    name: listing.name,
    slug: listing.slug,
    category: listing.category,
    description: listing.description || '',
    logo: listing.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80',
    rating: listing.rating || 5,
    location: listing.address || '',
    website: listing.website || '',
    owner: {
      email: listing.email || '',
      phone: listing.phone || '',
    }
  }));
}

export async function fetchResources() {
  const { data, error } = await supabase
    .from('content')
    .select(`
      *,
      author:profiles(*)
    `)
    .in('category', ['videos', 'podcasts', 'devotionals', 'sermon', 'music'])
    .eq('status', 'published')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching resources:', error);
    return [];
  }
  
  return data.map(item => {
    let mappedType = 'devotional';
    if (item.category === 'videos' || item.category === 'sermon') mappedType = 'video';
    if (item.category === 'podcasts' || item.category === 'music') mappedType = 'podcast';
    
    return {
      id: item.id,
      title: item.title,
      description: item.excerpt || '',
      type: mappedType,
      category: item.category,
      url: item.video_url || item.audio_url || item.image_url || '',
      coverImage: item.cover_image || item.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80',
      author: {
        id: item.author?.id || '',
        name: item.author?.full_name || item.author?.username || 'Unknown',
        avatar: item.author?.avatar_url || '',
      },
      publishedAt: item.published_at || item.created_at
    };
  });
}

export async function fetchDashboardStats() {
  try {
    const stats = await withTimeout(Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('content').select('*', { count: 'exact', head: true }),
      supabase.from('services').select('*', { count: 'exact', head: true })
    ]));

    const [u, e, c, s] = stats;
    return {
      users: u.count || 0,
      events: e.count || 0,
      content: c.count || 0,
      services: s.count || 0
    };
  } catch (err) {
    console.error('Stats fetch timed out or failed:', err);
    return { users: 0, events: 0, content: 0, services: 0 };
  }
}

export async function fetchRecentActivity() {
  try {
    const [contentRes, eventsRes] = await withTimeout(Promise.all([
      supabase.from('content').select('id, title, created_at, status').order('created_at', { ascending: false }).limit(3),
      supabase.from('events').select('id, title, created_at, status:type').order('created_at', { ascending: false }).limit(3)
    ]));
    const acts = [
      ...(contentRes.data || []).map(c => ({ id: `c-${c.id}`, type: 'content', title: c.title, time: c.created_at, status: 'Published' })),
      ...(eventsRes.data || []).map(e => ({ id: `e-${e.id}`, type: 'event', title: e.title, time: e.created_at, status: 'upcoming' }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return acts.slice(0, 5);
  } catch (e) {
    console.error('Activity fetch timed out or failed:', e);
    return [];
  }
}

export async function fetchServiceRatings(serviceId: string) {
  const { data, error } = await supabase
    .from('service_ratings')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching service ratings:', error);
    return [];
  }

  return data.map(rating => ({
    id: rating.id,
    serviceId: rating.service_id,
    userId: rating.user_id,
    ratingValue: rating.rating_value,
    reviewText: rating.review_text || '',
    createdAt: rating.created_at,
    user: {
      id: rating.user?.id || '',
      name: rating.user?.full_name || rating.user?.username || 'Gospel Partner',
      avatar: rating.user?.avatar_url || ''
    }
  }));
}

export async function getUserServiceRating(serviceId: string, userId: string) {
  const { data, error } = await supabase
    .from('service_ratings')
    .select('*')
    .eq('service_id', serviceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user service rating:', error);
    return null;
  }

  return data;
}

export async function submitServiceRating(serviceId: string, userId: string, ratingValue: number, reviewText: string) {
  const { data, error } = await supabase
    .from('service_ratings')
    .upsert({
      service_id: serviceId,
      user_id: userId,
      rating_value: ratingValue,
      review_text: reviewText,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'service_id,user_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}