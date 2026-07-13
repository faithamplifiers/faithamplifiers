import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Heart, Globe, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { CMSSectionRenderer } from '../components/CMSSectionRenderer';

const ICON_MAP: Record<string, React.ReactNode> = {
  Heart: <Heart className="w-8 h-8 text-secondary" />,
  Users: <Users className="w-8 h-8 text-secondary" />,
  Award: <Award className="w-8 h-8 text-secondary" />,
  Globe: <Globe className="w-8 h-8 text-secondary" />,
};

const defaultData = {
  hero: { title: 'About Faith Amplifiers', subtitle: 'Empowering Christians worldwide with innovative solutions for ministry and community building.' },
  mission: { title: 'Our Mission', text: 'To amplify the reach and impact of Christian ministry through innovative technology and professional services.' },
  vision: { title: 'Our Vision', text: 'To be the leading platform that connects and empowers the global Christian community.' },
  values: {
    title: 'Our Core Values',
    items: [
      { icon: 'Heart', title: 'Faith-Centered', description: 'Everything we do is rooted in our commitment to spreading the Gospel.' },
      { icon: 'Users', title: 'Community-Driven', description: 'We believe in the power of connection and foster meaningful relationships.' },
      { icon: 'Award', title: 'Excellence', description: 'We strive for excellence in all our services.' },
      { icon: 'Globe', title: 'Global Impact', description: 'Our mission extends beyond borders.' },
    ]
  },
  team: {
    title: 'Meet Our Team',
    members: [
      { name: 'Pastor Michael Johnson', role: 'Founder & CEO', bio: 'With over 20 years of ministry experience.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
      { name: 'Sarah Williams', role: 'Head of Content', bio: 'Sarah leads our content strategy.', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
      { name: 'David Thompson', role: 'Technical Director', bio: 'David oversees all technical aspects.', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' },
    ]
  },
  join_mission: { title: 'Join Our Mission', text: 'Be part of our growing community and help us amplify the message of faith across the globe.' }
};

const About: React.FC = () => {
  // 1. Fetch from the CMS pages table
  const { data: page, isLoading: isCmsLoading } = useQuery({
    queryKey: ['cms-about-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', 'about')
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // 2. Fetch from legacy about_page table (fallback if CMS page slug='about' is not present or configured with sections)
  const { data: rows, isLoading: isLegacyLoading } = useQuery({
    queryKey: ['about_page'],
    queryFn: async () => {
      const { data, error } = await supabase.from('about_page').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !page || !page.content
  });

  const getSection = (key: string) => {
    const row = rows?.find(r => r.section === key);
    return row?.content || (defaultData as any)[key];
  };

  if (isCmsLoading || (isLegacyLoading && (!page || !page.content))) {
    return (
      <div className="pt-32 flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" className="text-secondary" />
      </div>
    );
  }

  // Parse CMS page sections if present
  let cmsSections: any[] | null = null;
  if (page?.content) {
    try {
      const parsed = JSON.parse(page.content);
      if (Array.isArray(parsed)) {
        cmsSections = parsed;
      }
    } catch (e) {
      cmsSections = null;
    }
  }

  // If page content exists in CMS, render it
  if (cmsSections) {
    return (
      <div className="pt-20 bg-light-gray dark:bg-gray-900 min-h-screen">
        <CMSSectionRenderer sections={cmsSections} />
      </div>
    );
  }

  // Otherwise, fall back to legacy About grid layout
  const hero = getSection('hero');
  const mission = getSection('mission');
  const vision = getSection('vision');
  const values = getSection('values');
  const team = getSection('team');
  const joinMission = getSection('join_mission');

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <div className="bg-primary py-16">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 !text-white">{hero?.title}</h1>
          <p className="text-xl text-gray-200 max-w-3xl">{hero?.subtitle}</p>
        </div>
      </div>

      {/* Mission & Vision */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">{mission?.title}</h2>
              <p className="text-gray-600 dark:text-gray-300">{mission?.text}</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">{vision?.title}</h2>
              <p className="text-gray-600 dark:text-gray-300">{vision?.text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-light-gray dark:bg-gray-800">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-12">{values?.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(values?.items || []).map((value: any, index: number) => (
              <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                <div className="mb-4">{ICON_MAP[value.icon] || <Heart className="w-8 h-8 text-secondary" />}</div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-12">{team?.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(team?.members || []).map((member: any, index: number) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
                <div className="h-64 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-secondary mb-3">{member.role}</p>
                  <p className="text-gray-600 dark:text-gray-300">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4 !text-white">{joinMission?.title}</h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">{joinMission?.text}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="btn bg-secondary text-primary hover:bg-secondary-light">
              Join Us
            </Link>
            <Link to="/contact" className="btn bg-transparent border-2 border-white text-white hover:bg-white/10">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;