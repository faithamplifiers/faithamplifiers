import React, { useState, useEffect } from 'react';
import { Cloud, Check, X, Shield, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface IntegrationsSettingsProps {
  onNavigateToGuide?: () => void;
}

const IntegrationsSettings: React.FC<IntegrationsSettingsProps> = ({ onNavigateToGuide }) => {
  const { user } = useAuthStore();
  const [cloudName, setCloudName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [uploadPreset, setUploadPreset] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('user_integrations table may not exist yet:', error);
        } else if (data) {
          setCloudName(data.cloudinary_cloud_name || '');
          setApiKey(data.cloudinary_api_key || '');
          setUploadPreset(data.cloudinary_upload_preset || '');
          setEnabled(data.cloudinary_enabled || false);
        }
      } catch (err) {
        console.error('Error fetching integrations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [user]);

  const handleTestConnection = async () => {
    if (!cloudName || !uploadPreset) {
      toast.error('Cloud Name and Upload Preset are required to test.');
      return;
    }

    setTesting(true);
    try {
      // Test by uploading a 1x1 pixel PNG blob
      const base64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const resBlob = await fetch(base64Png);
      const blob = await resBlob.blob();
      const file = new File([blob], 'test.png', { type: 'image/png' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      if (apiKey) formData.append('api_key', apiKey);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Verification failed');
      }

      toast.success('Connection successful! Cloudinary is configured correctly.');
    } catch (err: any) {
      toast.error('Connection failed: ' + (err.message || 'Please check your credentials.'));
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('user_integrations').upsert({
        user_id: user.id,
        cloudinary_cloud_name: cloudName,
        cloudinary_api_key: apiKey,
        cloudinary_upload_preset: uploadPreset,
        cloudinary_enabled: enabled,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Integrations updated successfully!');
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-550">Loading configurations...</div>;
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all outline-none text-sm';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden text-left">
      <div className="p-8 border-b border-gray-50 dark:border-gray-700/50 flex items-center gap-4">
        <div className="p-3 bg-secondary/10 rounded-2xl">
          <Cloud className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cloudinary BYOK</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Connect your Cloudinary storage account for rich media hosting.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-8 space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-550 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            <span className="font-bold">Security Note:</span> We use Cloudinary's Unsigned Upload Preset pattern. Your account secret keys are never collected, making client-side uploading safe. Need help setting it up?{' '}
            <button
              type="button"
              onClick={onNavigateToGuide}
              className="text-secondary hover:underline font-bold"
            >
              Read our Cloudinary Setup Guide.
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Cloud Name *</label>
            <input
              type="text"
              required
              value={cloudName}
              onChange={(e) => setCloudName(e.target.value)}
              placeholder="e.g. dxyz1234"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Upload Preset Name *</label>
            <input
              type="text"
              required
              value={uploadPreset}
              onChange={(e) => setUploadPreset(e.target.value)}
              placeholder="e.g. ml_default"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">API Key (Optional)</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="e.g. 123456789012345"
            className={inputClass}
          />
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-gray-700/50">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Enable Cloudinary BYOK</p>
            <p className="text-xs text-gray-500 mt-0.5">When checked, uploads will be sent to your Cloudinary storage.</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none ${
              enabled ? 'bg-secondary' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !cloudName || !uploadPreset}
            className="btn btn-outline text-sm font-bold flex items-center gap-2 py-3 px-5"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
            Test Connection
          </button>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary text-sm font-bold flex items-center gap-2 py-3 px-6"
          >
            {saving ? 'Saving Configurations...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IntegrationsSettings;
