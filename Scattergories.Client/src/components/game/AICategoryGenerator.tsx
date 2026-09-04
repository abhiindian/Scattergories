import { useState } from 'react';
import { toast } from 'sonner';

/**
 * AI Category Generator dialog — Carbon Design System modal.
 * Features: Vibe seed input, quick inspiration chips, tone selection,
 * generation count, category results with checkboxes & reroll, apply to deck.
 */

interface GeneratedCategory {
  id: string;
  text: string;
  example: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  selected: boolean;
  tags: string[];
  icon: string;
  matchScore: number;
}

const defaultCategories: GeneratedCategory[] = [
  {
    id: '1',
    text: '8-Bit Video Game Bosses or Villains',
    example: 'e.g., Bowser, Ganon, Dr. Wily',
    difficulty: 'Easy',
    selected: true,
    tags: ['Pop Culture', 'Gaming'],
    icon: 'stadium',
    matchScore: 98,
  },
  {
    id: '2',
    text: 'Things Found in an Old Arcade Cabinet',
    example: 'e.g., Joysticks, Quarters, High Scores',
    difficulty: 'Medium',
    selected: true,
    tags: ['Retro', 'Hardware'],
    icon: 'devices',
    matchScore: 95,
  },
  {
    id: '3',
    text: 'Catchphrases Said by 90s Characters',
    example: 'e.g., "Cowabunga", "Pikachu", "Toasty!"',
    difficulty: 'Easy',
    selected: true,
    tags: ['TV', 'Nostalgia'],
    icon: 'record_voice_over',
    matchScore: 92,
  },
  {
    id: '4',
    text: 'Cheat Codes or Controller Buttons',
    example: 'e.g., Konami Code, Turbo Trigger, D-Pad',
    difficulty: 'Hard',
    selected: true,
    tags: ['Gaming', 'Tech'],
    icon: 'keyboard',
    matchScore: 89,
  },
  {
    id: '5',
    text: 'Consoles or Handheld Gaming Systems',
    example: 'e.g., Game Boy, Sega Genesis, Dreamcast',
    difficulty: 'Easy',
    selected: true,
    tags: ['Hardware', 'Retro'],
    icon: 'tv',
    matchScore: 96,
  },
  {
    id: '6',
    text: 'Snacks Eaten During LAN Parties',
    example: 'e.g., Mountain Dew, Pizza Rolls, Nachos',
    difficulty: 'Medium',
    selected: true,
    tags: ['Food', 'Gaming'],
    icon: 'local_pizza',
    matchScore: 87,
  },
];

const inspirationChips = [
  { icon: 'sports_esports', color: 'text-carbon-magenta', label: '90s Nostalgia' },
  { icon: 'terminal', color: 'text-primary', label: 'Tech & Coding' },
  { icon: 'skull', color: 'text-carbon-red', label: 'Spooky Horror' },
  { icon: 'bakery_dining', color: 'text-carbon-amber', label: 'Culinary Arts' },
  { icon: 'toys', color: 'text-carbon-teal', label: 'Cartoon Chaos' },
];

const toneOptions = [
  { id: 'family', label: 'Family & Kids', icon: 'child_care', desc: 'Accessible, simple terms' },
  { id: 'balanced', label: 'Balanced / Casual', icon: 'check_circle', desc: 'Party-ready sweet spot', active: true },
  { id: 'brainy', label: 'Brainy & Obscure', icon: 'psychology', desc: 'Trivia-buff challenge' },
  { id: 'adult', label: 'Late Night (18+)', icon: 'local_bar', desc: 'Spicy & party humor', color: 'text-carbon-magenta' },
];

const difficultyColors: Record<string, string> = {
  Easy: 'bg-carbon-green/10 text-carbon-green',
  Medium: 'bg-carbon-amber/10 text-carbon-amber',
  Hard: 'bg-carbon-red/10 text-carbon-red',
};

interface AICategoryGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (categories: GeneratedCategory[]) => void;
}

export function AICategoryGenerator({ isOpen, onClose, onApply }: AICategoryGeneratorProps) {
  const [vibeInput, setVibeInput] = useState('90s Retro Pixel Gaming & Arcade Culture');
  const [selectedTone, setSelectedTone] = useState('balanced');
  const [categories, setCategories] = useState<GeneratedCategory[]>(defaultCategories);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const selectedCount = categories.filter(c => c.selected).length;

  const handleClearVibe = () => setVibeInput('');

  const handleInspirationChip = (label: string) => {
    setVibeInput(`${label} themed word lists`);
    toast.success(`Prompt set: "${label}"`);
  };

  const handleToneChange = (toneId: string) => {
    setSelectedTone(toneId);
    toast.success('Tone calibrated for AI model');
  };

  const handleCheckboxChange = (id: string) => {
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleSelectAll = () => {
    const anyChecked = categories.some(c => c.selected);
    setCategories(prev => prev.map(c => ({ ...c, selected: !anyChecked })));
  };

  const handleRerollSingle = (id: string) => {
    const row = categories.find(c => c.id === id);
    if (!row) return;
    setCategories(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, text: `New ${c.text.toLowerCase()} variant`, example: 'e.g., Updated example' }
          : c
      )
    );
    toast.success('Category rerolled!');
  };

  const handleRerollAll = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setCategories(prev =>
        prev.map(c => ({
          ...c,
          text: `Rerolled ${c.text.toLowerCase()} suggestion`,
          example: 'e.g., Fresh AI-generated example',
          matchScore: Math.floor(Math.random() * 20) + 80,
        }))
      );
      setIsGenerating(false);
      toast.success('All categories regenerated!');
    }, 800);
  };

  const handleApplyDeck = () => {
    const selected = categories.filter(c => c.selected);
    onApply(selected);
    onClose();
    toast.success(`Inserted ${selected.length} categories to deck!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Sheet */}
      <div className="relative z-10 w-full max-w-lg bg-surface-container-lowest shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up sm:rounded-xl">
        {/* Specular Accent Top Border */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-carbon-cyan to-secondary-container" />

        {/* Header */}
        <div className="pt-3 px-4 pb-2 flex flex-col gap-1.5">
          {/* Drag Handle */}
          <div className="w-10 h-1 rounded-full bg-surface-container-highest mx-auto mb-1" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-caps text-[10px]">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                  AI Deck Spark
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[12px]">
                  Beta 2.4
                </span>
              </div>
              <h2 className="font-headline-md text-[16px] text-on-surface tracking-tight">AI Category Generator</h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors flex-shrink-0"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3 pb-4">
          {/* Theme & Vibe Input Card */}
          <div className="flex flex-col gap-1.5 bg-surface-container-low p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase" htmlFor="ai-vibe-input">
                Prompt / Vibe Seed
              </label>
              <span className="font-label-sm text-[12px] text-on-surface-variant">Tap suggestion or type</span>
            </div>
            <div className="relative flex items-start">
              <textarea
                id="ai-vibe-input"
                value={vibeInput}
                onChange={(e) => setVibeInput(e.target.value)}
                placeholder="e.g., Sci-Fi 80s Movies, Office Inside Jokes, Thanksgiving Family Dinner..."
                rows={2}
                className="w-full p-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-[14px] placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest resize-none transition-all shadow-sm"
              />
              {vibeInput && (
                <button
                  onClick={handleClearVibe}
                  className="absolute right-2.5 top-2.5 w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* Quick Inspiration Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 -mx-1 px-1 no-scrollbar">
              {inspirationChips.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => handleInspirationChip(chip.label)}
                  className="prompt-chip px-2.5 py-1 rounded-full bg-surface-container-lowest hover:bg-primary-fixed text-on-surface hover:text-on-primary-fixed font-label-caps text-[10px] flex-shrink-0 transition-colors shadow-sm flex items-center gap-1"
                  type="button"
                >
                  <span className={`material-symbols-outlined text-[14px] ${chip.color}`}>{chip.icon}</span>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls: Difficulty + Generation Count */}
          <div className="flex flex-col gap-3">
            {/* Tone & Challenge */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Tone & Challenge</span>
                <span className="font-label-sm text-[12px] text-carbon-teal flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-carbon-teal" />
                  All Ages Friendly
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {toneOptions.map(tone => (
                  <button
                    key={tone.id}
                    onClick={() => handleToneChange(tone.id)}
                    className={`p-2 rounded-lg text-left flex flex-col transition-all active:scale-[0.99] ${
                      selectedTone === tone.id
                        ? 'bg-primary-fixed text-on-primary-fixed shadow-sm'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                    type="button"
                  >
                    <span className="font-label-caps text-[10px] font-semibold flex items-center justify-between">
                      {tone.label}
                      <span className={`material-symbols-outlined text-[16px] ${
                        selectedTone === tone.id
                          ? 'text-primary'
                          : tone.color || 'text-on-surface-variant'
                      }`} style={{ fontVariationSettings: selectedTone === tone.id ? "'FILL' 1" : "'FILL' 0" }}>
                        {tone.icon}
                      </span>
                    </span>
                    <span className="font-label-sm text-[12px] text-on-surface-variant truncate">{tone.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generation Count */}
            <div className="flex flex-col gap-1.5">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Generation Count</span>
              <div className="p-1 rounded-lg bg-surface-container flex items-center gap-1">
                <button
                  className="flex-1 py-2 rounded-md bg-surface-container-lowest text-primary font-label-caps text-[10px] font-semibold shadow-sm text-center transition-all"
                  type="button"
                >
                  Fill Slots ({6 - selectedCount} Prompts)
                </button>
                <button
                  className="flex-1 py-2 rounded-md text-on-surface-variant font-label-caps text-[10px] hover:text-on-surface text-center transition-all"
                  type="button"
                >
                  New Deck (12 Prompts)
                </button>
              </div>
            </div>
          </div>

          {/* Generated Suggestions Panel */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="font-label-caps text-[10px] text-on-surface uppercase font-bold">Suggested Deck Results</span>
                <span className="px-1.5 py-0.2 rounded-full bg-primary text-on-primary font-label-caps text-[10px]">
                  {selectedCount}/6 Selected
                </span>
              </div>
              <button
                onClick={handleSelectAll}
                className="font-label-caps text-[10px] text-primary hover:text-surface-tight"
                type="button"
              >
                {selectedCount === 0 ? 'Select All' : 'Deselect All'}
              </button>
            </div>

            {/* Generated Metadata Deck Card */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-surface-container via-surface-container-low to-surface-container flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px]">videogame_asset</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-sm text-[14px] text-on-surface truncate leading-snug">Retro Arcade & 90s Pixel Gaming</span>
                  <div className="flex items-center gap-1 truncate">
                    {['Pop Culture', 'Geek', 'Retro'].map(tag => (
                      <span key={tag} className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-[12px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 pl-2">
                <span className="font-label-caps text-[10px] text-carbon-green font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">verified</span> 98%
                </span>
                <span className="font-label-sm text-[12px] text-on-surface-variant">Word Match</span>
              </div>
            </div>

            {/* Category Item Cards */}
            <div className="flex flex-col gap-1.5 mt-1">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="category-row p-3 rounded-lg bg-surface-container-low flex items-center justify-between gap-2 transition-all"
                >
                  <label className="flex items-center gap-3 min-w-0 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={category.selected}
                      onChange={() => handleCheckboxChange(category.id)}
                      className="category-checkbox w-5 h-5 rounded text-primary focus:ring-0 accent-primary cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-[14px] font-medium text-on-surface truncate">{category.text}</span>
                      <span className="font-label-sm text-[12px] text-on-surface-variant">{category.example}</span>
                    </div>
                  </label>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full font-label-caps text-[10px] ${difficultyColors[category.difficulty]}`}>
                      {category.difficulty}
                    </span>
                    <button
                      onClick={() => handleRerollSingle(category.id)}
                      className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-transform active:rotate-180"
                      type="button"
                      aria-label="Reroll category"
                    >
                      <span className="material-symbols-outlined text-[16px]">autorenew</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col gap-2 px-4 py-3 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            {/* Regenerate Button */}
            <button
              onClick={handleRerollAll}
              disabled={isGenerating}
              className="h-12 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-headline-sm text-[14px] font-semibold flex items-center justify-center gap-2 flex-shrink-0 active:scale-[0.98] transition-all disabled:opacity-50"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span>{isGenerating ? 'Generating...' : 'Reroll All'}</span>
            </button>

            {/* Apply Button */}
            <button
              onClick={handleApplyDeck}
              className="flex-1 h-12 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-[14px] font-semibold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              type="button"
            >
              <span>Insert to Deck</span>
              <span className="px-2 py-0.5 rounded-full bg-on-primary/20 text-on-primary font-label-caps text-[10px] font-bold">
                (+{selectedCount})
              </span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>

          {/* AI Compliance Note */}
          <div className="flex items-center justify-center gap-1.5 text-center text-on-surface-variant pt-1">
            <span className="material-symbols-outlined text-[15px] text-carbon-green" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
            <span className="font-label-sm text-[12px]">Safe for family play • Standard English dictionary validation checks applied</span>
          </div>
        </div>
      </div>
    </div>
  );
}
