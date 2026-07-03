import React from 'react';
import { Check, Star, Zap } from 'lucide-react';

interface PlanCardProps {
  name: string;
  price: string;
  priceNote?: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel: string;
  onCTAClick: () => void;
  badge?: string;
  disabled?: boolean;
  isCurrentPlan?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  priceNote,
  features,
  highlighted = false,
  ctaLabel,
  onCTAClick,
  badge,
  disabled = false,
  isCurrentPlan = false,
}) => {
  return (
    <div
      className={`relative rounded-2xl p-6 border transition-all duration-300 flex flex-col h-full ${
        highlighted
          ? 'bg-gradient-to-br from-primary via-primary to-primary/90 text-white border-secondary shadow-2xl shadow-primary/30 scale-[1.03]'
          : 'bg-white dark:bg-gray-800 border-gray-150 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-secondary/40'
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="px-4 py-1 bg-secondary text-primary text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-secondary/30 flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" /> {badge}
          </span>
        </div>
      )}

      <div className="mb-6 text-left">
        <h3 className={`text-lg font-black mb-1 ${highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          {name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-black ${highlighted ? 'text-secondary' : 'text-primary dark:text-secondary'}`}>
            {price}
          </span>
          {priceNote && (
            <span className={`text-xs font-medium ${highlighted ? 'text-white/70' : 'text-gray-500'}`}>
              {priceNote}
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-3 mb-8 flex-grow text-left">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlighted ? 'text-secondary' : 'text-green-500'}`} />
            <span className={`text-sm ${highlighted ? 'text-white/90' : 'text-gray-600 dark:text-gray-350'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCTAClick}
        disabled={disabled || isCurrentPlan}
        className={`w-full py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
          isCurrentPlan
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default border border-green-200 dark:border-green-800'
            : highlighted
              ? 'bg-secondary text-primary hover:bg-secondary-light shadow-lg shadow-secondary/30'
              : 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20'
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {isCurrentPlan ? (
          <><Check className="w-4 h-4" /> Current Plan</>
        ) : (
          <><Zap className="w-4 h-4" /> {ctaLabel}</>
        )}
      </button>
    </div>
  );
};

export default PlanCard;
