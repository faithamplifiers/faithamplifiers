import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { fetchServiceRatings } from '../lib/api';
import { ArrowLeft, Star, Tag, User, Share2, Mail, Award, MessageSquare } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import RatingModal from '../components/services/RatingModal';
import BookingModal from '../components/services/BookingModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ServiceDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { data: service, error, isLoading } = useQuery({
    queryKey: ['service', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');

      // Try by slug first, fallback to id
      let { data, error } = await supabase
        .from('services')
        .select(`
          *,
          provider:profiles(*),
          service_ratings(rating_value)
        `)
        .eq('slug', slug)
        .single();

      if (error || !data) {
        const res = await supabase
          .from('services')
          .select(`
            *,
            provider:profiles(*),
            service_ratings(rating_value)
          `)
          .eq('id', slug)
          .single();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ['service-reviews', service?.id],
    queryFn: () => fetchServiceRatings(service!.id),
    enabled: !!service?.id
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: service?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleRateClick = () => {
    if (!user) {
      toast.error('Please log in to submit a rating');
      navigate('/login', { state: { from: window.location } });
      return;
    }
    setIsRatingModalOpen(true);
  };

  const handleRatingSubmitted = () => {
    queryClient.invalidateQueries({ queryKey: ['service', slug] });
    refetchReviews();
  };

  if (isLoading) {
    return (
      <div className="pt-32 pb-20 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" className="text-secondary" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="pt-32 pb-20 container-custom min-h-[60vh]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Service Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The service you\'re looking for doesn\'t exist or has been removed.
          </p>
          <button onClick={() => navigate('/services')} className="btn btn-primary">
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  const coverImage = service.cover_url || service.cover_image ||
    'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80';

  const currencySymbol =
    service.currency === 'NGN' ? '₦' :
    service.currency === 'EUR' ? '€' :
    service.currency === 'GBP' ? '£' : '$';

  const providerName = service.provider?.full_name || service.provider?.username || 'Unknown Provider';

  const ratingsList = (service.service_ratings || []) as any[];
  const ratingCount = ratingsList.length;
  const averageRating = ratingCount > 0 
    ? ratingsList.reduce((sum, r) => sum + (r.rating_value || 0), 0) / ratingCount
    : 0;

  return (
    <div className="pt-20 bg-light-gray dark:bg-gray-900 min-h-screen">
      {/* Hero */}
      <div className="relative h-[45vh] min-h-[320px] w-full bg-black overflow-hidden flex justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
        <img
          src={coverImage}
          alt={service.title}
          className="relative z-10 max-w-full max-h-full object-contain"
        />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 text-white z-30">
          <div className="container-custom max-w-5xl mx-auto">
            <Link to="/services" className="inline-flex items-center text-sm font-medium hover:text-secondary mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Link>
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-secondary text-primary text-sm font-bold rounded-full capitalize">
                {service.category?.replace(/_/g, ' ') || 'Service'}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">{service.title}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom max-w-5xl mx-auto py-10 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">About This Service</h2>
              <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {service.description || 'No description available.'}
              </div>
            </div>

            {/* Portfolio Images */}
            {service.portfolio_images && service.portfolio_images.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Portfolio</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {service.portfolio_images.map((img: string, i: number) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden">
                      <img src={img} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-left">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-secondary" />
                  Client Reviews ({ratingCount})
                </h2>
                <button
                  onClick={handleRateClick}
                  className="btn btn-outline btn-sm text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-current text-secondary" /> Write a Review
                </button>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-505 dark:text-gray-400">
                  <p className="font-semibold text-sm">No reviews yet for this service.</p>
                  <p className="text-xs text-gray-400 mt-1">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-6 divide-y divide-gray-100 dark:divide-gray-750">
                  {reviews.map((review, i) => (
                    <div key={review.id} className={`${i > 0 ? 'pt-6' : ''} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-xs text-primary dark:text-white overflow-hidden">
                            {review.user?.avatar ? (
                              <img src={review.user.avatar} alt={review.user.name} className="w-full h-full object-cover" />
                            ) : (
                              review.user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{review.user.name}</p>
                            <p className="text-[10px] text-gray-400">
                              {format(new Date(review.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, starIndex) => (
                            <Star
                              key={starIndex}
                              className={`w-3.5 h-3.5 ${
                                starIndex < review.ratingValue
                                  ? 'text-secondary fill-secondary'
                                  : 'text-gray-250 dark:text-gray-650'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.reviewText && (
                        <p className="text-sm text-gray-650 dark:text-gray-300 pl-11 leading-relaxed">
                          {review.reviewText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
              {/* Price */}
              <div className="text-center mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <span className="text-3xl font-black text-primary dark:text-white">
                  {currencySymbol}{service.price || '0.00'}
                </span>
                <p className="text-sm text-gray-500 mt-1">Starting price</p>
              </div>

              {/* Rating Summary */}
              <div 
                onClick={handleRateClick}
                className="flex items-center justify-center gap-2 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700 cursor-pointer group"
                title="Click to rate"
              >
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                        i < Math.round(averageRating)
                          ? 'text-secondary fill-secondary'
                          : 'text-gray-300 dark:text-gray-650'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {averageRating > 0 ? `${averageRating.toFixed(1)} (${ratingCount})` : '0.0 (0)'}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 text-left">
                  <Tag className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Category</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {service.category?.replace(/_/g, ' ') || 'General'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <User className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Provider</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{providerName}</p>
                    {service.provider?.email && (
                      <p className="text-xs text-gray-500">{service.provider.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="btn btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Book This Service
                </button>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-secondary hover:text-secondary transition-colors text-sm font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  Share Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {service && user && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          serviceId={service.id}
          userId={user.id}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}

      {/* Booking Modal */}
      {service && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          serviceId={service.id}
          serviceTitle={service.title}
        />
      )}
    </div>
  );
};

export default ServiceDetail;
