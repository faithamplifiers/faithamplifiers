-- Migration: Production Features for Faith Amplifiers
-- Date: 2026-07-01
-- Description: Creates tables for ratings, messages, bookings, dynamic pages, settings, and member plans.

-- 1. Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Seed default settings
INSERT INTO app_settings (key, value, description)
VALUES ('contact_recipient_email', 'faithamplifiers@gmail.com', 'Recipient email for contact submissions')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text CHECK (status IN ('new', 'read', 'replied', 'archived')) DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- 3. Create service_ratings table
CREATE TABLE IF NOT EXISTS service_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  rating_value integer CHECK (rating_value >= 1 AND rating_value <= 5) NOT NULL,
  review_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (service_id, user_id)
);

-- 4. Create service_bookings table
CREATE TABLE IF NOT EXISTS service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  message text,
  status text CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Create pages table for CMS
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  status text CHECK (status IN ('published', 'draft')) DEFAULT 'published',
  meta_title text,
  meta_description text,
  is_system_page boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed default pages
INSERT INTO pages (title, slug, content, status, is_system_page)
VALUES 
  ('Home', 'home', 'Welcome to Faith Amplifiers. We amplify your faith journey through content, events, and community.', 'published', true),
  ('News', 'news', 'Stay updated with the latest news, updates, and articles from the Faith Amplifiers community.', 'published', true),
  ('Events', 'events', 'Browse upcoming and past community events, services, and live streams.', 'published', true),
  ('Services', 'services', 'Connect with professionals and vendors offering gospel-focused services.', 'published', true),
  ('Directory', 'directory', 'Find churches, organizations, and creators in the gospel community.', 'published', true),
  ('Resources', 'resources', 'Access sermonic content, music, devotionals, and podcasts.', 'published', true),
  ('Contact', 'contact', 'Get in touch with us for inquiries, support, or feedback.', 'published', true),
  ('About', 'about', 'Learn more about Faith Amplifiers, our mission, vision, and team.', 'published', true)
ON CONFLICT (slug) DO NOTHING;

-- 6. Create member_plans table for verification & billing
CREATE TABLE IF NOT EXISTS member_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan text CHECK (plan IN ('blog_basics', 'event_services', 'enterprise')) DEFAULT 'blog_basics',
  username_choice text,
  social_links jsonb DEFAULT '{}'::jsonb,
  legal_name text,
  phone text,
  address text,
  country text,
  state text,
  date_of_birth date,
  gov_id_url text,
  verification_status text CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected')) DEFAULT 'none',
  paystack_reference text,
  payment_status text CHECK (payment_status IN ('unpaid', 'paid')) DEFAULT 'unpaid',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Add new columns to existing tables
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='services' AND column_name='booking_notifications_enabled'
  ) THEN
    ALTER TABLE services ADD COLUMN booking_notifications_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='plan'
  ) THEN
    ALTER TABLE profiles ADD COLUMN plan text CHECK (plan IN ('blog_basics', 'event_services', 'enterprise')) DEFAULT 'blog_basics';
  END IF;
END $$;

-- 8. Enable Row Level Security (RLS) on new tables
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_plans ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies

-- app_settings policies
CREATE POLICY "Public read app_settings" ON app_settings 
  FOR SELECT USING (true);

CREATE POLICY "Admin write app_settings" ON app_settings 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- contact_messages policies
CREATE POLICY "Anyone can submit contact message" ON contact_messages 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view and manage contact messages" ON contact_messages 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- service_ratings policies
CREATE POLICY "Anyone can view ratings" ON service_ratings 
  FOR SELECT USING (true);

CREATE POLICY "Logged in users can rate" ON service_ratings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON service_ratings 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON service_ratings 
  FOR DELETE USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  ));

-- service_bookings policies
CREATE POLICY "Anyone can submit a booking" ON service_bookings 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own bookings" ON service_bookings 
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM services 
      WHERE services.id = service_bookings.service_id 
      AND services.provider_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Providers and Admins can update bookings" ON service_bookings 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM services 
      WHERE services.id = service_bookings.service_id 
      AND services.provider_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- pages policies
CREATE POLICY "Anyone can view published pages" ON pages 
  FOR SELECT USING (status = 'published' OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage pages" ON pages 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- member_plans policies
CREATE POLICY "Users can view own member plan" ON member_plans 
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can manage own member plan" ON member_plans 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own member plan" ON member_plans 
  FOR UPDATE USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  ));

-- 10. Triggers for updated_at
CREATE TRIGGER update_service_ratings_updated_at
  BEFORE UPDATE ON service_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_bookings_updated_at
  BEFORE UPDATE ON service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_plans_updated_at
  BEFORE UPDATE ON member_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
