import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useGameStore } from '../state/gameStore';


/**
 * Home page - redesigned with Carbon Design System.
 * Features: Welcome & Identity Strip, Segmented Controller (Join/Create),
 * 5-char PIN input, How To Play, Daily Sprint, Popular Decks.
 */
export function Dashboard() {
  const navigate = useNavigate();
  const { handleGoogleLogin, isAuthenticated, user } = useAuth();
  const { playerName } = useGameStore();

  const displayPlayerName = playerName || user?.name;
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [pinCode, setPinCode] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'classic' | 'speed'>('classic');
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCreate = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!displayPlayerName?.trim()) {
      setError('Enter your name first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const timerSeconds = selectedPreset === 'speed' ? 60 : 180;
      const code = await apiClient.createGame({ timerSeconds });
      const joinResult = await apiClient.joinGameAuth(code, displayPlayerName || '');
      localStorage.setItem('playerId', joinResult.playerId);
      navigate(`/lobby/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const code = pinCode.join('');
    if (!displayPlayerName?.trim()) {
      setError('Enter your name first');
      return;
    }
    if (code.length < 6) {
      setError('Enter a game code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.joinGameAuth(code.toUpperCase(), displayPlayerName || '');
      localStorage.setItem('playerId', result.playerId);
      navigate(`/lobby/${code.toUpperCase()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!upper) return;
    
    const newPin = [...pinCode];
    newPin[index] = upper.charAt(0);
    setPinCode(newPin);
    
    if (index < 5 && pinRefs.current[index! + 1]) {
      pinRefs.current[index! + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pinCode[index] && index > 0) {
      pinRefs.current[index! - 1]?.focus();
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const chars = text.toUpperCase().replace(/[^A-Z0-9]/g, '').split('').slice(0, 6);
      const newPin = ['', '', '', '', '', ''];
      chars.forEach((char, i) => { newPin[i] = char; });
      setPinCode(newPin);
      if (chars.length > 0 && pinRefs.current[chars.length - 1]) {
        pinRefs.current[chars.length - 1]?.focus();
      }
    } catch {
      // Clipboard access denied
    }
  };

  const handlePasteEvent = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const chars = text.toUpperCase().replace(/[^A-Z0-9]/g, '').split('').slice(0, 6);
    const newPin = ['', '', '', '', '', ''];
    chars.forEach((char, i) => { newPin[i] = char; });
    setPinCode(newPin);
    if (chars.length > 0 && pinRefs.current[chars.length - 1]) {
      pinRefs.current[chars.length - 1]?.focus();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <div className="mx-auto max-w-md md:max-w-4xl lg:max-w-[1120px] px-4 md:px-8 pt-4 md:pt-8 pb-2">
        <div className="md:grid md:grid-cols-12 md:gap-8 lg:gap-12">
          
          {/* Left Column (Identity & Action Panels) */}
          <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-4">
            {/* Welcome & Identity Strip */}
            <div className="rounded-xl bg-surface-container-lowest p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed w-fit mb-1">
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                    <span className="font-label-caps text-[10px] tracking-wider font-semibold">WORD RUSH LIVE</span>
                  </div>
                  <h1 className="font-headline-sm md:text-[24px] text-[20px] text-text-primary tracking-tight">
                    Scattergories<span className="text-primary-container">!</span>
                  </h1>
                  <p className="font-body-md text-[14px] text-text-secondary">
                    The quick-thinking multiplayer category game.
                  </p>
                </div>
                {/* 4-Tile Brand Glyph */}
                <div className="w-12 h-12 flex-shrink-0 grid grid-cols-2 grid-rows-2 gap-1 p-1 bg-primary rounded-xl shadow-md transform rotate-2">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="font-headline-sm text-[11px] font-bold text-primary leading-none">S</span>
                  </div>
                  <div className="w-full h-full rounded-md bg-primary-container flex items-center justify-center">
                    <span className="font-headline-sm text-[11px] font-bold text-white leading-none">A</span>
                  </div>
                  <div className="w-full h-full rounded-md bg-carbon-cyan flex items-center justify-center">
                    <span className="font-headline-sm text-[11px] font-bold text-white leading-none">Z</span>
                  </div>
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="font-headline-sm text-[11px] font-bold text-primary leading-none">!</span>
                  </div>
                </div>
              </div>

              {/* Player Identity & Auth Bar */}
              <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-headline-sm text-sm font-bold flex-shrink-0 shadow-sm">
                    <span>{getInitials(displayPlayerName || 'G')}</span>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-carbon-green rounded-full shadow-[0_0_0_2px_#ffffff]"></span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-sm text-[14px] text-text-primary truncate" id="playerNicknameDisplay">
                        {displayPlayerName}
                      </span>

                    </div>
                    <span className="font-label-sm text-[11px] text-text-secondary">
                      Signed In
                    </span>
                  </div>
                </div>
                {!isAuthenticated && (
                  <button
                    onClick={handleGoogleLogin}
                    className="flex-shrink-0 h-8 px-2.5 rounded-lg bg-surface-container-lowest text-text-primary text-label-caps font-label-caps flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                    type="button"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>SYNC STATS</span>
                  </button>
                )}
              </div>
            </div>

            {/* Segmented Controller */}
            <div className="flex flex-col gap-3">
              <div className="bg-surface-container-high p-1 rounded-xl flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 font-headline-sm text-[14px] transition-all duration-200 ${
                    activeTab === 'join'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-text-primary'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  <span>Join Room</span>
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 font-headline-sm text-[14px] transition-all duration-200 ${
                    activeTab === 'create'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-text-primary'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Create Room</span>
                </button>
              </div>

              {/* PANEL 1: JOIN GAME ROOM */}
              {activeTab === 'join' && (
                <div className="flex flex-col gap-3 bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-headline-sm text-[14px] text-text-primary">Enter Room Passcode</h2>
                      <p className="font-body-md text-[14px] text-text-secondary">Ask your party host for their code</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-caps text-[10px] font-semibold">
                      LIVE SYNC
                    </span>
                  </div>

                  {/* 6-Character PIN Input */}
                  <div className="flex items-center justify-between gap-2 my-1">
                    {pinCode.map((char, index) => (
                      <input
                        key={index}
                        ref={el => { pinRefs.current[index] = el; }}
                        className="w-12 md:w-14 h-14 md:h-16 rounded-lg bg-surface-container-low text-center font-display-letter text-[28px] md:text-[32px] font-bold text-primary uppercase focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                        data-index={index}
                        maxLength={1}
                        placeholder="•"
                        type="text"
                        value={char}
                        onChange={(e) => handlePinChange(index, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(index, e)}
                        onPaste={handlePasteEvent}
                      />
                    ))}
                  </div>

                  {/* Helper Actions */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setPinCode(['', '', '', '', '', '']);
                          pinRefs.current[0]?.focus();
                        }}
                        className="inline-flex items-center gap-1 font-label-caps text-[10px] text-error hover:text-error/80 transition-colors"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">backspace</span>
                        <span>CLEAR</span>
                      </button>
                      <button
                        onClick={handlePaste}
                        className="inline-flex items-center gap-1 font-label-caps text-[10px] text-primary hover:text-on-primary-fixed-variant transition-colors"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_paste</span>
                        <span>PASTE</span>
                      </button>
                    </div>
                  </div>

                  {/* Join CTA */}
                  <button
                    onClick={handleJoin}
                    disabled={loading || pinCode.some(c => !c) || !displayPlayerName?.trim()}
                    className="w-full h-12 md:h-14 rounded-lg bg-primary text-on-primary font-headline-sm text-[14px] md:text-[16px] font-semibold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(15,98,254,0.3)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    <span>Enter Room Lobby</span>
                    <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                  </button>

                  {/* Recent Room Shortcut */}
                  <div className="pt-2 flex items-center justify-between border-t border-surface-container-highest">
                    <span className="font-label-sm text-[12px] text-text-secondary">Recent Room:</span>
                    <button className="px-2.5 py-1 rounded bg-surface-container text-text-primary font-label-caps text-[10px] flex items-center gap-1 hover:bg-surface-container-high transition-colors" type="button">
                      <span className="font-bold text-primary">#G7X9P</span>
                      <span className="text-text-secondary">(Sunday Crew)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL 2: CREATE NEW GAME */}
              {activeTab === 'create' && (
                <div className="flex flex-col gap-3 bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div>
                    <h2 className="font-headline-sm text-[14px] text-text-primary">Match Configuration</h2>
                    <p className="font-body-md text-[14px] text-text-secondary">Select an instant preset or tweak game pacing</p>
                  </div>

                  {/* Presets Selector Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedPreset('classic')}
                      className={`p-3 rounded-lg text-left flex flex-col gap-1 transition-all ${
                        selectedPreset === 'classic'
                          ? 'bg-primary-fixed ring-2 ring-primary'
                          : 'bg-surface-container hover:bg-surface-container-high'
                      }`}
                      type="button"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-label-caps text-[10px] font-bold ${
                          selectedPreset === 'classic' ? 'text-on-primary-fixed' : 'text-text-secondary'
                        }`}>CLASSIC PARTY</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          selectedPreset === 'classic' ? 'bg-primary' : 'bg-outline-variant'
                        }`}></span>
                      </div>
                      <span className={`font-headline-sm text-[13px] leading-snug ${
                        selectedPreset === 'classic' ? 'text-on-primary-fixed' : 'text-text-primary'
                      }`}>6 Rounds • 120s</span>
                      <span className={`font-label-sm text-[11px] ${
                        selectedPreset === 'classic' ? 'text-on-primary-fixed-variant' : 'text-text-secondary'
                      }`}>12 Categories / Round</span>
                    </button>
                    <button
                      onClick={() => setSelectedPreset('speed')}
                      className={`p-3 rounded-lg text-left flex flex-col gap-1 transition-all ${
                        selectedPreset === 'speed'
                          ? 'bg-primary-fixed ring-2 ring-primary'
                          : 'bg-surface-container hover:bg-surface-container-high'
                      }`}
                      type="button"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-label-caps text-[10px] font-bold ${
                          selectedPreset === 'speed' ? 'text-on-primary-fixed' : 'text-text-secondary'
                        }`}>SPEED CLASH</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          selectedPreset === 'speed' ? 'bg-primary' : 'bg-outline-variant'
                        }`}></span>
                      </div>
                      <span className={`font-headline-sm text-[13px] leading-snug ${
                        selectedPreset === 'speed' ? 'text-on-primary-fixed' : 'text-text-primary'
                      }`}>4 Rounds • 60s</span>
                      <span className={`font-label-sm text-[11px] ${
                        selectedPreset === 'speed' ? 'text-on-primary-fixed-variant' : 'text-text-secondary'
                      }`}>6 Fast-Fire Cards</span>
                    </button>
                  </div>

                  {/* Referee Strictness */}
                  <div className="flex flex-col gap-1">
                    <span className="font-label-caps text-[10px] text-text-secondary font-semibold uppercase">Referee Strictness</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg bg-surface-container-low flex flex-col items-center text-center">
                        <span className="font-label-sm text-[11px] font-semibold text-text-primary">Plurals</span>
                        <span className="text-[11px] text-carbon-green font-bold">Allowed</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface-container-low flex flex-col items-center text-center">
                        <span className="font-label-sm text-[11px] font-semibold text-text-primary">Proper Nouns</span>
                        <span className="text-[11px] text-carbon-green font-bold">Allowed</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface-container-low flex flex-col items-center text-center">
                        <span className="font-label-sm text-[11px] font-semibold text-text-primary">Consensus</span>
                        <span className="text-[11px] text-primary font-bold">Peer Vote</span>
                      </div>
                    </div>
                  </div>

                  {/* Create CTA */}
                  <button
                    onClick={handleCreate}
                    disabled={loading || !displayPlayerName?.trim()}
                    className="w-full h-12 md:h-14 rounded-lg bg-primary-container text-white font-headline-sm text-[14px] md:text-[16px] font-semibold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(15,98,254,0.3)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
                    <span>Host New Game Lobby</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Info & Extras) */}
          <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-4 mt-4 md:mt-0">
            {/* How It Works */}
            <div className="rounded-xl bg-surface-container-lowest p-4 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] md:text-[12px] text-text-secondary font-bold">HOW TO PLAY</span>
                  <Link to="/rules" className="font-label-sm text-[12px] md:text-[14px] text-primary flex items-center gap-0.5 font-semibold hover:underline">
                    View Rules <span className="material-symbols-outlined text-[14px] md:text-[16px]">arrow_forward</span>
                  </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="flex flex-col items-center text-center gap-1.5 p-3 rounded-lg bg-surface-container-low">
                  <div className="w-10 md:w-12 h-10 md:h-12 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-sm md:text-lg">
                    A
                  </div>
                  <span className="font-label-caps text-[11px] md:text-[12px] font-bold text-text-primary leading-tight mt-1">1. ROLL LETTER</span>
                  <span className="font-label-sm text-[11px] md:text-[12px] text-text-secondary leading-tight">20-sided die sets the round key</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5 p-3 rounded-lg bg-surface-container-low">
                  <div className="w-10 md:w-12 h-10 md:h-12 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold text-sm md:text-lg">
                    <span className="material-symbols-outlined text-[20px] md:text-[24px]">timer</span>
                  </div>
                  <span className="font-label-caps text-[11px] md:text-[12px] font-bold text-text-primary leading-tight mt-1">2. FILL LIST</span>
                  <span className="font-label-sm text-[11px] md:text-[12px] text-text-secondary leading-tight">Quick typed answers before buzz</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5 p-3 rounded-lg bg-surface-container-low">
                  <div className="w-10 md:w-12 h-10 md:h-12 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm md:text-lg">
                    +1
                  </div>
                  <span className="font-label-caps text-[11px] md:text-[12px] font-bold text-text-primary leading-tight mt-1">3. SCORE UNIQUE</span>
                  <span className="font-label-sm text-[11px] md:text-[12px] text-text-secondary leading-tight">Duplicates cancel! Unique words win</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-error-container text-error rounded-xl text-sm border border-error/20">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
