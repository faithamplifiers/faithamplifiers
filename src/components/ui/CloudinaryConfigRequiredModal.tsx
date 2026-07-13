import React from 'react';
import { X, Cloud, ExternalLink, HelpCircle, AlertTriangle } from 'lucide-react';

interface CloudinaryConfigRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings: () => void;
}

const CloudinaryConfigRequiredModal: React.FC<CloudinaryConfigRequiredModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full border border-gray-100 dark:border-gray-700 shadow-2xl relative overflow-hidden text-left p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Cloudinary Required</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Free/Basic Plan Requirement</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-gray-655 dark:text-gray-300 leading-relaxed font-medium">
            To publish articles, events, or services on the platform, you must connect your own <span className="font-bold text-gray-900 dark:text-white">Cloudinary account</span>.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            This ensures your media assets are stored securely within your own storage quota, keeping our platform completely free and offloading hosting shortages from our servers.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl p-4 flex gap-2">
            <HelpCircle className="w-4 h-4 text-blue-550 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed font-semibold">
              Setting it up takes less than 2 minutes. You just need to create a free Cloudinary account and create an Unsigned Upload Preset.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <a
            href="https://cloudinary.com/signup"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline text-xs font-bold py-3 flex items-center justify-center gap-1.5"
          >
            Create Account <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => {
              onClose();
              onNavigateToSettings();
            }}
            className="btn btn-primary text-xs font-bold py-3"
          >
            Configure Setup
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloudinaryConfigRequiredModal;
