import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Home from '../../pages/Home';
import News from '../../pages/News';
import ArticleDetail from '../../pages/ArticleDetail';
import Events from '../../pages/Events';
import EventDetail from '../../pages/EventDetail';
import Services from '../../pages/Services';
import ServiceDetail from '../../pages/ServiceDetail';
import Directory from '../../pages/Directory';
import Resources from '../../pages/Resources';
import About from '../../pages/About';
import Contact from '../../pages/Contact';
import DynamicPage from '../../pages/DynamicPage';
import Login from '../../pages/auth/Login';
import Register from '../../pages/auth/Register';
import ForgotPassword from '../../pages/auth/ForgotPassword';
import ResetPassword from '../../pages/auth/ResetPassword';
import EmailVerified from '../../pages/auth/EmailVerified';

import ScrollToTop from './ScrollToTop';

const PublicLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-light-gray dark:bg-gray-900">
      <ScrollToTop />
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<ArticleDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:slug" element={<EventDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/p/:slug" element={<DynamicPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<EmailVerified />} />
          <Route path="/verify-email" element={<EmailVerified />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
