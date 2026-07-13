import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuthStore } from '../store/authStore';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  uploadPreset: string;
  enabled: boolean;
}

export function useCloudinaryUpload() {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<CloudinaryConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('user_integrations')
          .select('cloudinary_cloud_name, cloudinary_api_key, cloudinary_upload_preset, cloudinary_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('user_integrations table may not exist yet:', error);
          setConfig(null);
        } else if (data) {
          setConfig({
            cloudName: data.cloudinary_cloud_name || '',
            apiKey: data.cloudinary_api_key || '',
            uploadPreset: data.cloudinary_upload_preset || '',
            enabled: data.cloudinary_enabled || false,
          });
        }
      } catch (err) {
        console.error('Error fetching integrations config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [user]);

  const uploadFile = async (file: File, bucket = 'content'): Promise<string> => {
    // If Cloudinary is configured and enabled, upload to Cloudinary
    if (config && config.enabled && config.cloudName && config.uploadPreset) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', config.uploadPreset);
        formData.append('api_key', config.apiKey);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          const errorMsg = errData.error?.message || 'Upload to Cloudinary failed';
          if (res.status === 400 && (errorMsg.toLowerCase().includes('limit') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('exhausted'))) {
            throw new Error('CLOUDINARY_QUOTA_EXHAUSTED');
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();
        return data.secure_url || data.url;
      } catch (err: any) {
        console.error('Cloudinary upload failed, error:', err);
        throw err;
      }
    }

    // Fallback/Default: Upload to Supabase storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${bucket}-media/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
  };

  return {
    uploadFile,
    isCloudinaryEnabled: !!(config && config.enabled && config.cloudName && config.uploadPreset),
    config,
    loading
  };
}
