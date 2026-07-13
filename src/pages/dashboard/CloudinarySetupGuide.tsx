import React from 'react';
import { BookOpen, ExternalLink, HelpCircle, Key, Settings, Image as ImageIcon } from 'lucide-react';

const CloudinarySetupGuide: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden text-left p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-secondary" />
          Cloudinary Setup Guide
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Follow these clear instructions to configure your own Cloudinary storage for posting content, events, and services.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Step 1 */}
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
            1
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-gray-900 dark:text-white text-base">Create a Free Cloudinary Account</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              If you don't already have one, register for a free account on the{' '}
              <a
                href="https://cloudinary.com/signup"
                target="_blank"
                rel="noreferrer"
                className="text-secondary hover:underline inline-flex items-center gap-1 font-bold"
              >
                Cloudinary Website <ExternalLink className="w-3 h-3" />
              </a>.
              The free tier is generous and provides plenty of bandwidth and storage.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
            2
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-gray-900 dark:text-white text-base">Retrieve your Cloud Name</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Log in to the{' '}
              <a
                href="https://console.cloudinary.com/"
                target="_blank"
                rel="noreferrer"
                className="text-secondary hover:underline inline-flex items-center gap-1 font-bold"
              >
                Cloudinary Dashboard <ExternalLink className="w-3 h-3" />
              </a>. Under the Dashboard tab, copy your <span className="font-bold text-gray-800 dark:text-gray-200">Cloud Name</span> and <span className="font-bold text-gray-800 dark:text-gray-200">API Key</span>. Paste them into the Integrations Settings page.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
            3
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-gray-900 dark:text-white text-base">Create an Unsigned Upload Preset</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              We require an <span className="font-semibold text-secondary">Unsigned Upload Preset</span> so you can upload images securely from your browser.
            </p>
            <ul className="list-disc list-inside text-xs text-gray-500 dark:text-gray-400 pl-2 space-y-2 mt-2 leading-relaxed">
              <li>Click the <span className="font-bold">Settings Cog (icon)</span> at the bottom left of your Cloudinary console.</li>
              <li>Select the <span className="font-bold">"Upload"</span> tab in the Settings sidebar.</li>
              <li>Scroll down to the <span className="font-bold">"Upload presets"</span> section and click <span className="text-secondary font-bold">"Add upload preset"</span>.</li>
              <li>Provide a name for the preset (or copy the generated one).</li>
              <li>Change the <span className="font-bold text-red-500">Signing Mode</span> dropdown from <span className="line-through">Signed</span> to <span className="font-bold text-green-500 text-sm">Unsigned</span>.</li>
              <li>(Optional) In the left panel, click "Folder" and set a folder name to organize your uploads.</li>
              <li>Click <span className="font-bold">"Save"</span> at the top right.</li>
            </ul>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
            4
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-gray-900 dark:text-white text-base">Configure in Faith Amplifiers</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Copy the name of your new unsigned preset, and head to settings tab. Toggle <span className="font-bold text-green-500">"Enable Cloudinary BYOK"</span>, click <span className="font-bold">"Test Connection"</span> to confirm it works, and save!
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-6 space-y-2">
        <h4 className="font-bold text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2">
          <HelpCircle className="w-4 h-4" /> Why is this required?
        </h4>
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          By bringing your own keys (BYOK), you maintain total ownership of your ministry assets and digital content. It allows us to keep the platform free of hosting charge limits and ensures you have direct access to your media files at all times.
        </p>
      </div>
    </div>
  );
};

export default CloudinarySetupGuide;
