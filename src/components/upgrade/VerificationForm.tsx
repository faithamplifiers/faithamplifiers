import React, { useState } from 'react';
import { Upload, User, Phone, MapPin, Calendar, Shield, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import ImageUploadInput from '../ui/ImageUploadInput';

interface VerificationFormProps {
  onComplete: (formData: VerificationData) => void;
  onCancel: () => void;
}

export interface VerificationData {
  legalName: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  dateOfBirth: string;
  govIdUrl: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<VerificationData>({
    legalName: '',
    phone: '',
    address: '',
    country: '',
    state: '',
    dateOfBirth: '',
    govIdUrl: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    website: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `verification/${user.id}/gov-id-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/services/${fileName}`;
      setFormData(prev => ({ ...prev, govIdUrl: url }));
      toast.success('ID document uploaded');
    } catch (err: any) {
      toast.error('Failed to upload document: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.legalName || !formData.phone || !formData.country) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.govIdUrl) {
      toast.error('Please upload a government-issued ID document');
      return;
    }
    onComplete(formData);
  };

  const inputClasses = "w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all text-sm";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-secondary" />
          <h3 className="text-lg font-black">Identity Verification</h3>
        </div>
        <p className="text-white/70 text-sm">
          We verify identities to protect our community and ensure trust. Your data is encrypted and never shared publicly.
        </p>
        {/* Step Indicator */}
        <div className="flex gap-2 mt-4">
          <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-secondary' : 'bg-white/20'}`} />
          <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-secondary' : 'bg-white/20'}`} />
        </div>
      </div>

      <div className="p-6">
        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Step 1 — Personal Information</h4>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" name="legalName" required value={formData.legalName} onChange={handleChange} placeholder="As it appears on your ID" className={`${inputClasses} pl-10`} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="+234 80 123 4567" className={`${inputClasses} pl-10`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={`${inputClasses} pl-10`} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Street address" className={`${inputClasses} pl-10`} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                  Country <span className="text-red-500">*</span>
                </label>
                <input type="text" name="country" required value={formData.country} onChange={handleChange} placeholder="e.g. Nigeria" className={inputClasses} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                  State / Province
                </label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Lagos" className={inputClasses} />
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700/50 my-4 pt-4">
              <h5 className="text-xs font-black text-secondary dark:text-yellow-500 uppercase tracking-widest mb-3">Social & Contact Links (Optional)</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-widest mb-1">WhatsApp Number</label>
                  <input type="text" name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} placeholder="e.g. +234801234567" className={inputClasses} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-widest mb-1">Facebook Link</label>
                  <input type="url" name="facebook" value={formData.facebook || ''} onChange={handleChange} placeholder="https://facebook.com/username" className={inputClasses} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-widest mb-1">Instagram Link</label>
                  <input type="text" name="instagram" value={formData.instagram || ''} onChange={handleChange} placeholder="https://instagram.com/username" className={inputClasses} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-widest mb-1">Twitter/X Link</label>
                  <input type="text" name="twitter" value={formData.twitter || ''} onChange={handleChange} placeholder="https://x.com/username" className={inputClasses} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-widest mb-1">YouTube Link</label>
                  <input type="url" name="youtube" value={formData.youtube || ''} onChange={handleChange} placeholder="https://youtube.com/@channel" className={inputClasses} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 uppercase tracking-widest mb-1">Website Link</label>
                  <input type="url" name="website" value={formData.website || ''} onChange={handleChange} placeholder="https://yourwebsite.com" className={inputClasses} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-250 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-secondary text-primary font-black text-sm flex items-center justify-center gap-2 hover:bg-secondary-light transition-all shadow-md shadow-secondary/15">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="space-y-5">
            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Step 2 — Document Upload</h4>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <p className="font-bold">Accepted documents:</p>
              <p>Government-issued ID (National ID, International Passport, Driver's License)</p>
            </div>

            <div>
              <ImageUploadInput
                value={formData.govIdUrl}
                onChange={url => setFormData(prev => ({ ...prev, govIdUrl: url }))}
                label="Upload ID Document"
                bucket="services"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-gray-250 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button type="submit" disabled={!formData.govIdUrl} className="flex-1 py-2.5 rounded-xl bg-secondary text-primary font-black text-sm flex items-center justify-center gap-2 hover:bg-secondary-light transition-all shadow-md shadow-secondary/15 disabled:opacity-60">
                Submit & Pay <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerificationForm;
