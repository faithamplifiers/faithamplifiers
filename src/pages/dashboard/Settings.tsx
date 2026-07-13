import React, { useState } from 'react';
import { 
  Bell, 
  Lock, 
  User, 
  Globe, 
  Check, 
  Shield, 
  Mail, 
  Smartphone, 
  Eye, 
  EyeOff,
  Cloud,
  Zap,
  CreditCard,
  LifeBuoy,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import IntegrationsSettings from './IntegrationsSettings';
import CloudinarySetupGuide from './CloudinarySetupGuide';

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all outline-none';

import { useLocation } from 'react-router-dom';

const Settings: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuthStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'integrations' | 'cloudinary-guide'>(
    (location.state as any)?.activeTab || 'profile'
  );

  // Profile tab state
  const [username, setUsername] = useState(profile?.username || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password tab state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification state
  const [emailNotifs, setEmailNotifs] = useState(profile?.newsletter_subscribed ?? true);
  const [savingNotifs, setSavingNotifs] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Profile identities updated!');
      await refreshProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Security settings hardened!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Security update failed');
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
      if (error) throw error;
      toast.success('Communication preferences saved!');
      await refreshProfile();
    } catch (error) {
      toast.error('Preference update failed');
    } finally {
      setSavingNotifs(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Portal Configuration</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Customize your experience and secure your account across the Faith Amplifiers platform.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Navigation Column */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
            <nav className="flex flex-col gap-2">
              <SettingsNavLink 
                active={activeTab === 'profile'} 
                onClick={() => setActiveTab('profile')}
                icon={User}
                label="Profile Identity"
              />
              <SettingsNavLink 
                active={activeTab === 'security'} 
                onClick={() => setActiveTab('security')}
                icon={Shield}
                label="Security & Access"
              />
              <SettingsNavLink 
                active={activeTab === 'notifications'} 
                onClick={() => setActiveTab('notifications')}
                icon={Bell}
                label="Communication"
              />
              <SettingsNavLink 
                active={activeTab === 'integrations'} 
                onClick={() => setActiveTab('integrations')}
                icon={Cloud}
                label="Cloudinary BYOK"
              />
              <SettingsNavLink 
                active={activeTab === 'cloudinary-guide'} 
                onClick={() => setActiveTab('cloudinary-guide')}
                icon={LifeBuoy}
                label="Cloudinary Guide"
              />
            </nav>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-gradient-to-br from-primary to-primary-light p-6 rounded-3xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-secondary" />
              <span className="text-sm font-bold uppercase tracking-widest opacity-80">Account Health</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black">94%</p>
                  <p className="text-[10px] font-bold uppercase opacity-60">Security Score</p>
                </div>
                <div className="h-10 w-1 flex bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-full"></div>
                </div>
              </div>
              <p className="text-xs opacity-70 leading-relaxed">Your account is well-secured. Enable 2FA for 100% score.</p>
            </div>
          </div>
        </div>

        {/* Content Column */}
        <div className="xl:col-span-6 space-y-8">
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
               <div className="p-8 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-secondary/10 rounded-2xl">
                        <User className="w-6 h-6 text-secondary" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white">Profile Identity</h3>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">UID: {user?.id.slice(0, 12)}</span>
               </div>
               
               <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Username / Public Name</label>
                       <input 
                          type="text" 
                          value={username} 
                          onChange={(e) => setUsername(e.target.value)}
                          className={inputClass}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Account Email</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                              type="email" 
                              value={user?.email || ''} 
                              disabled 
                              className={`${inputClass} pl-12 bg-gray-50 dark:bg-gray-900/30 border-dashed opacity-70 cursor-not-allowed`}
                          />
                       </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50 dark:border-gray-700/50 flex justify-end">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="btn btn-primary flex items-center gap-2 group"
                    >
                      {savingProfile ? 'Persisting...' : 'Save Identity'}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
               <div className="p-8 border-b border-gray-50 dark:border-gray-700/50 flex items-center gap-4">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                    <Shield className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Security & Access Control</h3>
               </div>
               
               <div className="p-8 space-y-6">
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                      Updating your password will invalidate all other active sessions for your protection. Please ensure you remember your new credentials.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">New Password</label>
                       <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className={`${inputClass} pl-12`}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Confirm New Password</label>
                       <div className="relative">
                          <Check className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`${inputClass} pl-12`}
                          />
                       </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50 dark:border-gray-700/50 flex justify-end">
                    <button 
                      onClick={handleChangePassword}
                      disabled={savingPassword || !newPassword}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      {savingPassword ? 'Updating...' : 'Harden Security'}
                    </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
               <div className="p-8 border-b border-gray-50 dark:border-gray-700/50 flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                    <Bell className="w-6 h-6 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Communication Preferences</h3>
               </div>
               
               <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <NotificationToggle 
                      icon={Mail}
                      color="indigo"
                      title="Newsletter & Updates"
                      description="Weekly announcements, new events, and ministry news."
                      enabled={emailNotifs}
                      onToggle={() => setEmailNotifs(!emailNotifs)}
                    />
                    <NotificationToggle 
                      icon={Smartphone}
                      color="secondary"
                      title="Push Alerts"
                      description="Instant mobile notifications for urgent gospel updates."
                      enabled={false}
                      disabled
                      onToggle={() => {}}
                    />
                    <NotificationToggle 
                      icon={Cloud}
                      color="primary"
                      title="System Status"
                      description="Alerts regarding platform maintenance and uptime."
                      enabled={true}
                      disabled
                      onToggle={() => {}}
                    />
                  </div>

                  <div className="pt-6 border-t border-gray-50 dark:border-gray-700/50 flex justify-end">
                    <button 
                      onClick={handleSaveNotifications}
                      disabled={savingNotifs}
                      className="btn btn-primary"
                    >
                      {savingNotifs ? 'Saving...' : 'Sync Preferences'}
                    </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <IntegrationsSettings onNavigateToGuide={() => setActiveTab('cloudinary-guide')} />
          )}

          {activeTab === 'cloudinary-guide' && (
            <CloudinarySetupGuide />
          )}
        </div>

        {/* Info Column (The previously empty space) */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6">Subscription</h4>
            <div className="mb-6">
               <div className="flex items-center justify-between mb-4">
                  <p className="text-2xl font-black text-secondary">Free</p>
                  <CreditCard className="w-5 h-5 text-gray-300" />
               </div>
               <p className="text-sm font-bold text-gray-900 dark:text-white">Community Tier</p>
               <p className="text-xs text-gray-500 mt-1">Limited to 10 events / month</p>
            </div>
            <button className="w-full btn btn-secondary text-sm font-bold">Upgrade to Pro</button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Session Info</h4>
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lagos, NG • 102.4.1.0</span>
               </div>
               <div className="flex items-center gap-3">
                  <LifeBuoy className="w-4 h-4 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">v1.2.4-Production</span>
               </div>
            </div>
          </div>

          <button 
            onClick={() => signOut()}
            className="w-full group flex items-center justify-between p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
          >
            <div className="flex items-center gap-3">
               <LogOut className="w-5 h-5" />
               <span>Terminate Session</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsNavLink: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string;
}> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
      active 
        ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
  </button>
);

const NotificationToggle: React.FC<{
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}> = ({ icon: Icon, color, title, description, enabled, disabled, onToggle }) => (
  <div className={`p-4 rounded-3xl border border-gray-50 dark:border-gray-700 flex items-center justify-between transition-all ${disabled ? 'opacity-50' : 'hover:border-secondary/30 hover:bg-gray-50 dark:hover:bg-gray-900/20'}`}>
    <div className="flex items-center gap-4">
      <div className={`p-3 bg-${color}-50 dark:bg-${color}-900/20 rounded-2xl`}>
        <Icon className={`w-5 h-5 text-${color}-500`} />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none ${
        enabled ? 'bg-secondary' : 'bg-gray-200 dark:bg-gray-700'
      } ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition duration-300 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export default Settings;