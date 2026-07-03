import React, { useState, useEffect } from 'react';
import { Bell, Lock, User, Globe, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const inputClass =
  'w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors';

const Settings: React.FC = () => {
  const { user, profile, refreshProfile } = useAuthStore();

  // Profile tab state
  const [username, setUsername] = useState(profile?.username || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password tab state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [emailNotifs, setEmailNotifs] = useState(profile?.newsletter_subscribed ?? true);
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Site Configuration state
  const [contactEmail, setContactEmail] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'site_config'>('profile');

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'contact_recipient_email')
          .single();
        if (data?.value) {
          setContactEmail(data.value);
        }
      } catch (err) {
        console.error('Error loading setting:', err);
      }
    };
    if (activeTab === 'site_config') {
      fetchSiteSettings();
    }
  }, [activeTab]);

  const handleSaveSiteConfig = async () => {
    if (!contactEmail) {
      toast.error('Recipient email cannot be empty');
      return;
    }
    setSavingConfig(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'contact_recipient_email',
          value: contactEmail,
          description: 'Recipient email for contact submissions',
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      toast.success('Site settings saved!');
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
      console.error(err);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);
      if (error) {
        toast.error('Failed to update profile: ' + error.message);
      } else {
        toast.success('Profile updated!');
        await refreshProfile();
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error('Failed to update password: ' + error.message);
      } else {
        toast.success('Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
      console.error(err);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    setSavingNotifs(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ newsletter_subscribed: emailNotifs })
        .eq('id', user.id);
      if (error) {
        toast.error('Failed to save notification settings: ' + error.message);
      } else {
        toast.success('Notification preferences saved!');
        await refreshProfile(); // Ensure UI catches the fresh data
      }
    } catch (err) {
      toast.error('An unexpected error occurred connecting to database.');
      console.error(err);
    } finally {
      setSavingNotifs(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'site_config', label: 'Site Config', icon: Globe },
  ] as const;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account, security, and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Profile Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              placeholder="Your display name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className={`${inputClass} opacity-60 cursor-not-allowed`}
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed here. Contact support if needed.</p>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {savingProfile ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Change Password</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Repeat your new password"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !newPassword}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {savingPassword ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <h3 className="font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Newsletter Emails</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive faith news, events, and community updates</p>
            </div>
            <button
              onClick={() => setEmailNotifs(!emailNotifs)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                emailNotifs ? 'bg-secondary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  emailNotifs ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <button
            onClick={handleSaveNotifications}
            disabled={savingNotifs}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {savingNotifs ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {savingNotifs ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* Site Config Tab */}
      {activeTab === 'site_config' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <h3 className="font-semibold text-gray-900 dark:text-white">Site Configuration</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Contact Form Recipient Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className={inputClass}
              placeholder="e.g. faithamplifiers@gmail.com"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              All messages submitted through the contact form will be delivered to this email address.
            </p>
          </div>
          <button
            onClick={handleSaveSiteConfig}
            disabled={savingConfig}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {savingConfig ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {savingConfig ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;