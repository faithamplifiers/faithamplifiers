export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'content_creator' | 'event_organizer' | 'member';
  avatar?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  videoUrl?: string;
  audioUrl?: string;
  imageUrl?: string;
  author: User;
  publishedAt: string;
  featured?: boolean;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  organizer: User;
  featured?: boolean;
  ticketUrl?: string;
  livestreamUrl?: string;
  price?: string;
  currency?: 'USD' | 'NGN' | 'EUR' | 'GBP';
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  currency: 'USD' | 'NGN' | 'EUR' | 'GBP';
  provider: User;
  rating: number;
  ratingCount?: number;
  featured?: boolean;
  coverImage: string;
}

export interface DirectoryListing {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  logo: string;
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
    address?: string;
  };
  rating: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'podcast' | 'devotional';
  url: string;
  coverImage: string;
  description: string;
  publishedAt: string;
}