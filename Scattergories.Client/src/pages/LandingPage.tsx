import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handlePlayNow = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  if (isAuthenticated) {
    return null; // Or a loading spinner while redirecting
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-border-subtle bg-surface/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {/* Logo Glyph */}
          <div className="w-8 h-8 flex-shrink-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5 bg-primary rounded-lg transform rotate-2">
            <div className="w-full h-full rounded-sm bg-white"></div>
            <div className="w-full h-full rounded-sm bg-primary-container"></div>
            <div className="w-full h-full rounded-sm bg-carbon-cyan"></div>
            <div className="w-full h-full rounded-sm bg-white"></div>
          </div>
          <span className="font-headline-sm text-xl text-text-primary tracking-tight">Scattergories!</span>
        </div>
        <div>
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg bg-surface-container-high text-text-primary font-label-sm font-semibold hover:bg-surface-container-highest transition-colors"
            >
              Go to Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-lg bg-surface-container-high text-text-primary font-label-sm font-semibold hover:bg-surface-container-highest transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-24 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed mb-6">
          <span className="material-symbols-outlined text-[16px]">bolt</span>
          <span className="font-label-caps text-xs tracking-wider font-bold">WORD RUSH LIVE</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-text-primary tracking-tight mb-6 max-w-4xl mx-auto">
          The quick-thinking multiplayer category game
        </h1>
        
        <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
          Name a Place, Animal, and Thing starting with the letter 'R'. Sounds easy? Try doing it before the timer runs out!
        </p>

        <button
          onClick={handlePlayNow}
          className="h-14 px-8 rounded-full bg-primary-fixed text-on-primary-fixed font-headline-sm text-lg font-bold flex items-center gap-2 shadow-[0_8px_24px_rgba(15,98,254,0.3)] hover:scale-105 active:scale-95 transition-all"
        >
          <span>Play Now for Free</span>
          <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
        </button>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto mt-20">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-border-subtle">
            <div className="w-14 h-14 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[28px]">group</span>
            </div>
            <h3 className="font-headline-sm text-lg text-text-primary mb-2">Play with Friends</h3>
            <p className="text-text-secondary text-sm">Create private rooms and invite your friends with a simple 5-letter code. Live real-time gameplay.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-border-subtle">
            <div className="w-14 h-14 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[28px]">timer</span>
            </div>
            <h3 className="font-headline-sm text-lg text-text-primary mb-2">Fast-Paced Action</h3>
            <p className="text-text-secondary text-sm">Choose between Classic 2-minute rounds or speedrun with 60-second lightning rounds.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-border-subtle">
            <div className="w-14 h-14 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[28px]">emoji_events</span>
            </div>
            <h3 className="font-headline-sm text-lg text-text-primary mb-2">Climb the Ranks</h3>
            <p className="text-text-secondary text-sm">Sign in with Google to sync your stats, level up your profile, and see how you rank.</p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full py-6 text-center text-text-secondary text-sm border-t border-border-subtle mt-auto">
        <p>&copy; {new Date().getFullYear()} Scattergories. All rights reserved.</p>
      </footer>
    </div>
  );
}
