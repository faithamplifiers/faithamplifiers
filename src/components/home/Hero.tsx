import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  buttonText: string;
}

const defaultSlides: Slide[] = [
  {
    id: 1,
    title: 'Amplify Your Faith Journey',
    subtitle: 'Discover the latest gospel news, events, and resources to strengthen your spiritual walk.',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1170&q=80',
    link: '/news',
    buttonText: 'Explore News',
  },
  {
    id: 2,
    title: 'Professional Services for Ministry',
    subtitle: 'From livestreaming to event production, we provide the tools you need to share your message.',
    image: 'https://images.unsplash.com/photo-1603731125896-1e4ce9d4b6b5?auto=format&fit=crop&w=1170&q=80',
    link: '/services',
    buttonText: 'View Services',
  },
  {
    id: 3,
    title: 'Connect with Gospel Events',
    subtitle: 'Find and promote concerts, workshops, and faith-based gatherings in your community.',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1170&q=80',
    link: '/events',
    buttonText: 'Discover Events',
  },
];

const Hero: React.FC = () => {
  const { data: dbSlides } = useQuery({
    queryKey: ['home-hero-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', 'home')
        .in('section', ['hero_slide_1', 'hero_slide_2', 'hero_slide_3']);
      if (error) throw error;
      return data || [];
    }
  });

  const getSlideData = (slideKey: string, defaultSlide: Slide): Slide => {
    const dbSlide = dbSlides?.find(s => s.section === slideKey);
    if (!dbSlide?.content) return defaultSlide;
    const content = dbSlide.content as any;
    return {
      id: defaultSlide.id,
      title: content.title || defaultSlide.title,
      subtitle: content.subtitle || defaultSlide.subtitle,
      image: content.image || defaultSlide.image,
      link: content.link || defaultSlide.link,
      buttonText: content.buttonText || defaultSlide.buttonText,
    };
  };

  const slides: Slide[] = [
    getSlideData('hero_slide_1', defaultSlides[0]),
    getSlideData('hero_slide_2', defaultSlides[1]),
    getSlideData('hero_slide_3', defaultSlides[2]),
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const toggleAutoplay = () => {
    setIsPlaying(!isPlaying);
  };

  // Auto-advance slides
  useEffect(() => {
    let slideInterval: number;
    
    if (isPlaying) {
      slideInterval = window.setInterval(() => {
        nextSlide();
      }, 5000);
    }
    
    return () => {
      if (slideInterval) clearInterval(slideInterval);
    };
  }, [isPlaying, currentSlide]);

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Background image with overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          </div>
          
          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className="container-custom">
              <div className="max-w-3xl text-white">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
                  {slide.title}
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-gray-200">
                  {slide.subtitle}
                </p>
                <Link to={slide.link} className="btn btn-secondary text-lg px-8 py-3">
                  {slide.buttonText}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots and controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center space-x-6 z-10">
        <div className="flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-secondary w-6'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Play/Pause button */}
        <button
          onClick={toggleAutoplay}
          className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Hero;