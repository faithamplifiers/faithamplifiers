import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, AlertTriangle } from 'lucide-react';
import { useCloudinaryUpload } from '../../lib/useCloudinaryUpload';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface ImageUploadInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  bucket?: string;
}

const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  value,
  onChange,
  label = 'Image',
  bucket = 'content'
}) => {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const { uploadFile, isCloudinaryEnabled } = useCloudinaryUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (!isAdmin && !isCloudinaryEnabled) {
        toast.error('You must configure your Cloudinary account in Settings before uploading files.');
        setUploading(false);
        return;
      }

      // Upload file via smart hook
      let url = '';
      try {
        url = await uploadFile(file, bucket);
        onChange(url);
        toast.success('Image uploaded successfully');
      } catch (err: any) {
        if (err.message === 'CLOUDINARY_QUOTA_EXHAUSTED') {
          if (isAdmin) {
            toast.loading('Cloudinary quota exhausted. Falling back to Supabase storage...', { id: 'admin-fallback' });
            // Admin fallback to Supabase
            // We temporarily force standard Supabase upload by bypassing config
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${bucket}-media/${fileName}`;
            
            const { supabase } = await import('../../lib/supabase');
            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filePath, file);

            if (uploadError) throw uploadError;
            
            url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
            onChange(url);
            toast.dismiss('admin-fallback');
            toast.success('Uploaded to Supabase (Admin Fallback)');
          } else {
            toast.error('Cloudinary quota exhausted. Please upgrade your Cloudinary tier.');
          }
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to upload image: ' + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
          {label}
        </label>
        
        {/* Toggle Mode */}
        <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
              mode === 'upload'
                ? 'bg-white dark:bg-gray-650 text-gray-800 dark:text-white shadow-sm font-black'
                : 'text-gray-400 hover:text-gray-650 dark:hover:text-gray-200'
            }`}
          >
            <Upload className="w-3 h-3" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
              mode === 'url'
                ? 'bg-white dark:bg-gray-650 text-gray-800 dark:text-white shadow-sm font-black'
                : 'text-gray-400 hover:text-gray-650 dark:hover:text-gray-200'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            Paste URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-secondary transition-all bg-gray-50/50 dark:bg-gray-900/10">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-secondary border-t-transparent" />
              <span className="text-xs font-bold text-gray-500">Uploading file...</span>
            </div>
          ) : value ? (
            <div className="flex items-center gap-4">
              <img
                src={value}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active File</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-semibold mt-0.5">{value}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                  }}
                  className="text-[10px] font-bold text-red-500 hover:underline mt-1 block"
                >
                  Remove File
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-xs font-semibold text-gray-500">Drag & drop or click to upload</p>
              <p className="text-[9px] text-gray-400 mt-0.5">PNG, JPG, JPEG or GIF</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all outline-none text-xs"
          />
          {value && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-950/20 rounded-xl border border-gray-100 dark:border-gray-700">
              <img
                src={value}
                alt="URL Preview"
                className="w-12 h-12 object-cover rounded-lg shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-[10px] text-gray-400 font-semibold truncate flex-1">{value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploadInput;
