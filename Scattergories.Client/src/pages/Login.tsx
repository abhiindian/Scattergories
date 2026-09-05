import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


/**
 * Login page for Google authentication only.
 * Guest mode has been removed — players must sign in with Google.
 */
export function Login() {
  const { isAuthenticated, handleGoogleLogin } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated — must be in useEffect, not during render
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative">
      {/* Back to Home button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Scattergories</h1>
            <p className="text-sm text-gray-500 mt-1">Name, Place, Animal, Thing</p>
          </div>

          {/* Sign in heading */}
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">
            Sign in to play
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Use your Google account to join games
          </p>

          {/* Google Logo */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex flex-col items-center justify-center gap-3 py-4 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
          >
            {/* Google "G" logo */}
            <svg className="w-16 h-16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Sign in with Google</span>
          </button>

        </div>
      </div>
    </div>
  );
}
