import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { CheckCircle, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

const EmailVerified: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuthStore();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait briefly for Supabase to process URL hash (implicit session set)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        // Check if we have an active session
        if (session?.user) {
          await refreshProfile();
          setVerifying(false);
          return;
        }

        // If there's an error in query params (e.g. from Supabase redirection error)
        const errorCode = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (errorCode) {
          throw new Error(errorDescription || 'Authentication callback failed.');
        }

        // Fallback: If no session but no error, maybe they opened it on a different browser,
        // or the session expired. Let's show success anyway but prompt to login.
        setVerifying(false);
      } catch (err: any) {
        console.error('Email verification callback error:', err);
        setError(err.message || 'Failed to process email verification.');
        setVerifying(false);
      }
    };

    handleCallback();
  }, [searchParams, refreshProfile]);

  return (
    <div className="auth-container min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="auth-card w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 text-center relative overflow-hidden">
        
        {/* Decorative background gradients */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {verifying ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="w-12 h-12 text-secondary animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verifying Account</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs">
              Confirming your email address. Please hold on for a moment...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Issue</h2>
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg w-full">
              {error}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
              The link might be expired or already used. Try signing in or request a new password link if needed.
            </p>
            <div className="pt-4 w-full">
              <Link to="/login" className="w-full btn btn-primary flex items-center justify-center gap-2">
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Confirmed!</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-xs">
              {user 
                ? "Your email address has been successfully verified! You are now logged in." 
                : "Your email address has been successfully verified! You can now log in."}
            </p>

            <div className="pt-6 w-full space-y-3">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  Proceed to Sign In <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerified;
