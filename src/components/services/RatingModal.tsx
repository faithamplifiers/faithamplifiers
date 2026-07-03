import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { submitServiceRating, getUserServiceRating } from '../../lib/api';
import toast from 'react-hot-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  userId: string;
  onRatingSubmitted: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  serviceId,
  userId,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && serviceId && userId) {
      // Check if user has already rated this service
      const checkExisting = async () => {
        try {
          const existing = await getUserServiceRating(serviceId, userId);
          if (existing) {
            setRating(existing.rating_value);
            setReviewText(existing.review_text || '');
            setExistingRatingId(existing.id);
          } else {
            setRating(0);
            setReviewText('');
            setExistingRatingId(null);
          }
        } catch (err) {
          console.error('Error fetching existing rating:', err);
        }
      };
      checkExisting();
    }
  }, [isOpen, serviceId, userId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating (1 to 5)');
      return;
    }

    setSubmitting(true);
    try {
      await submitServiceRating(serviceId, userId, rating, reviewText);
      toast.success(existingRatingId ? 'Rating updated successfully!' : 'Thank you for your rating!');
      onRatingSubmitted();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-gray-150 dark:border-gray-700 animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 pr-6">
          {existingRatingId ? 'Update Your Rating' : 'Rate This Service'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Share your feedback to help the community discover the best gospel services.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating Selector */}
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Your Rating</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-all duration-150 hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-secondary fill-secondary'
                        : 'text-gray-300 dark:text-gray-650'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-3 animate-in fade-in duration-200">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Review Content (Optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us about your experience with this service..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all leading-relaxed"
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-250 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-secondary text-primary font-black hover:bg-secondary-light transition-all shadow-md shadow-secondary/15 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-primary border-t-transparent" />
              ) : (
                existingRatingId ? 'Update Rating' : 'Submit Rating'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
