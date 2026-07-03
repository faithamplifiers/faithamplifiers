import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showNewsletterPrompt, setShowNewsletterPrompt] = React.useState(false);
  const [registeredUserId, setRegisteredUserId] = React.useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: name
        }
      }
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success('Welcome to Faith Amplifiers! 🎉 You can now sign in.', {
      duration: 5000,
    });

    if (data.user) {
      setRegisteredUserId(data.user.id);
      setShowNewsletterPrompt(true);
    } else {
      navigate('/login');
    }
    setLoading(false);
  };

  const handleNewsletterResponse = async (subscribe: boolean) => {
    if (subscribe && registeredUserId) {
      try {
        await supabase
          .from('profiles')
          .update({ newsletter_subscribed: true })
          .eq('id', registeredUserId);
        toast.success('Successfully subscribed to newsletter!');
      } catch (err) {
        console.error('Newsletter error:', err);
      }
    }
    setShowNewsletterPrompt(false);
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center mb-8">
          <h2 className="auth-title">Create an Account</h2>
          <p className="auth-subtitle">
            Join our community and access exclusive features
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="form-label" htmlFor="name">Full Name</label>
            <input 
              id="name"
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="password">Password</label>
            <div className="relative">
              <input 
                id="password"
                type={showPassword ? "text" : "password"} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-transparent dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
                placeholder="Create a password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn btn-primary mt-4 py-3"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-secondary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {showNewsletterPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Stay Inspired!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-8 leading-relaxed">
              Would you like to receive our newsletter? Stay updated with the latest gospel news, upcoming events, and community stories. You can unsubscribe anytime.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleNewsletterResponse(true)}
                className="w-full btn btn-primary py-3 text-lg"
              >
                Yes, Subscribe Me
              </button>
              <button 
                onClick={() => handleNewsletterResponse(false)}
                className="w-full py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
              >
                No thanks, skip for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;