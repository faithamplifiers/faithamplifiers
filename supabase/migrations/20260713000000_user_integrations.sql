-- Migration: User Integrations for Cloudinary BYOK
-- Date: 2026-07-13

CREATE TABLE IF NOT EXISTS user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  cloudinary_cloud_name text,
  cloudinary_api_key text,
  cloudinary_upload_preset text,
  cloudinary_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own integrations" 
  ON user_integrations 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
