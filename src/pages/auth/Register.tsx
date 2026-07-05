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
  const [isEmailSent, setIsEmailSent] = React.useState(false);

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

    toast.success('Registration request sent successfully! 📧 Please check your inbox.', {
      duration: 6000,
    });

    if (data.user) {
      setIsEmailSent(true);
    } else {
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      {isEmailSent ? (
        <div className="auth-card max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 text-center animate-in zoom-in-95 duration-300">
          <div className="mx-auto flex items-center justify-center h-16 h-16 w-16 w-16 rounded-full bg-secondary/10 dark:bg-secondary/20 text-secondary">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
            </svg>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Confirm Your Signup</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              We have sent a verification link to the email address:
            </p>
            <p className="text-sm font-bold text-secondary">{email}</p>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Please check your mailbox (and spam folder) and click the link in the email to activate your account and complete registration.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="w-full btn btn-primary flex items-center justify-center py-3 text-base shadow-lg shadow-primary/20"
            >
              Continue to Sign In
            </Link>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default Register;