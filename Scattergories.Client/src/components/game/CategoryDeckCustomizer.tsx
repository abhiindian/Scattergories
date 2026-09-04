import { useState, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Category Deck Customizer page — Carbon Design System.
 * Features: Deck metadata (name, tags), access settings, category roster with drag handles,
 * edit/delete, quick add, AI Spark integration.
 */

interface DeckCategory {
  id: number;
  text: string;
  tags: string[];
}

const defaultCategories: DeckCategory[] = [
  { id: 1, text: 'A Movie or TV Show Sequel', tags: ['Media', 'Entertainment'] },
  { id: 2, text: 'Things Found in a Junk Drawer', tags: ['Household'] },
  { id: 3, text: 'Breakfast Foods or Cereals', tags: ['Food & Drink'] },
  { id: 4, text: 'Items on a Camping Trip', tags: ['Outdoor'] },
  { id: 5, text: 'Fictional Villains or Anti-Heroes', tags: ['Pop Culture'] },
  { id: 6, text: 'Words Ending in "-ING"', tags: ['Wordplay'] },
  { id: 7, text: 'Something You Complain About', tags: ['Lifestyle'] },
  { id: 8, text: 'Musical Instruments or Bands', tags: ['Music'] },
  { id: 9, text: 'Websites or Mobile Apps', tags: ['Tech'] },
  { id: 10, text: 'Animals in a Zoo', tags: ['Nature'] },
  { id: 11, text: 'Things That Are Sticky', tags: ['Sensory'] },
  { id: 12, text: 'Excuses for Being Late', tags: ['Humor'] },
];

const availableTags = ['Pop Culture', 'Party', 'Geek & Tech', 'Family-Friendly', 'Hardcore'];

interface CategoryDeckCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deckName: string, categories: DeckCategory[]) => void;
}

export function CategoryDeckCustomizer({ isOpen, onClose, onSave }: CategoryDeckCustomizerProps) {
  const [deckName, setDeckName] = useState('Ultimate 90s Trivia & Movie Night');
  const [activeTags, setActiveTags] = useState<string[]>(['Pop Culture', 'Party']);
  const [categories, setCategories] = useState<DeckCategory[]>(defaultCategories);
  const [newCategoryText, setNewCategoryText] = useState('');
  const [newCategoryTags, setNewCategoryTags] = useState('');
  const [diceBanner, setDiceBanner] = useState(false);
  const [diceLetter, setDiceLetter] = useState('M');
  const [permMode, setPermMode] = useState<'private' | 'public'>('private');
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleDeleteCategory = (id: number) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    toast.success('Category removed');
  };

  const handleEditCategory = (id: number, newText: string) => {
    if (newText.trim()) {
      setCategories(prev => prev.map(c => (c.id === id ? { ...c, text: newText } : c)));
      toast.success('Category updated');
    }
  };

  const handleQuickAdd = () => {
    if (!newCategoryText.trim()) return;
    const tags = newCategoryTags.split(',').map(t => t.trim()).filter(Boolean);
    const newCat: DeckCategory = {
      id: Date.now(),
      text: newCategoryText.trim(),
      tags,
    };
    setCategories(prev => [...prev, newCat]);
    setNewCategoryText('');
    setNewCategoryTags('');
    toast.success('Category added!');
  };

  const handleDiceRoll = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = letters[Math.floor(Math.random() * letters.length)];
    setDiceLetter(letter);
    setDiceBanner(true);
    toast.success(`Simulated roll: ${letter}`);
  };

  const handleSave = () => {
    onSave(deckName, categories);
    onClose();
    toast.success('Deck saved successfully!');
  };

  const handleReset = () => {
    setDeckName('');
    setActiveTags([]);
    setCategories(defaultCategories);
    toast.success('Deck reset to defaults');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Sheet */}
      <div className="relative z-10 w-full max-w-lg bg-surface shadow-surface-container-lowest shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-slide-up sm:rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[20px] text-primary">collections_bookmark</span>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-[14px] text-on-surface truncate leading-tight">Scattergories</span>
              <span className="font-label-caps text-[10px] text-on-surface-variant truncate uppercase tracking-wider">Deck Customizer</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed">
              <span className="w-2 h-2 rounded-full bg-carbon-green" />
              <span className="font-label-caps text-[10px] font-semibold">CODE: W9X4</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {/* Sub-Header Controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0 ml-1">
              <h1 className="font-headline-sm text-[14px] text-on-surface truncate leading-snug">Category Deck Customizer</h1>
              <p className="font-label-sm text-[12px] text-on-surface-variant truncate">Create & manage custom 12-category decks</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleReset}
                className="px-2.5 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex items-center gap-1 transition-all active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                <span className="font-label-caps text-[10px] uppercase hidden sm:inline">Reset</span>
              </button>
              <button
                onClick={handleDiceRoll}
                className="px-3 h-9 rounded-lg bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">casino</span>
                <span className="font-label-caps text-[10px] uppercase">Test Roll</span>
              </button>
            </div>
          </div>

          {/* Die Roll Preview Banner */}
          {diceBanner && (
            <div className="w-full p-3 rounded-xl bg-secondary-fixed text-on-secondary-fixed shadow-sm flex items-center justify-between transition-all">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-secondary text-on-secondary flex items-center justify-center font-bold text-[24px] shadow-sm">
                  {diceLetter}
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] uppercase font-bold text-on-secondary-fixed-variant">Simulated Letter Roll</span>
                  <span className="font-body-md text-[14px] text-on-secondary-fixed">Target Starting Letter: <strong className="font-semibold">{diceLetter}</strong> (20-sided Scattergories Die)</span>
                </div>
              </div>
              <button
                onClick={() => setDiceBanner(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-secondary-fixed hover:bg-secondary-fixed-dim/60"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Deck Metadata Card */}
          <section className="w-full rounded-xl bg-surface-container-lowest p-4 shadow-sm space-y-3">
            {/* Deck Name Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold" htmlFor="deck-name-input">
                  Deck Name
                </label>
                <span className="font-label-sm text-[12px] text-on-surface-variant">
                  {deckName.length} / 50
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="deck-name-input"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value.slice(0, 50))}
                  maxLength={50}
                  className="w-full h-10 px-3.5 pr-10 rounded-lg bg-surface-container-low text-on-surface font-headline-sm text-[14px] focus:outline-none focus:bg-surface-container-lowest shadow-inner transition-colors"
                  type="text"
                />
                <span className="material-symbols-outlined absolute right-3 text-on-surface-variant pointer-events-none text-[20px]">edit</span>
              </div>
            </div>

            {/* Theme Tags */}
            <div className="space-y-1.5">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold block">Theme Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full font-label-sm text-[12px] font-semibold transition-all shadow-sm ${
                      activeTags.includes(tag)
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Access & Status Grid */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Public / Private Switcher */}
              <div className="flex items-center gap-1 bg-surface-container-low p-1.5 rounded-lg flex-1">
                <button
                  onClick={() => setPermMode('private')}
                  className={`flex-1 py-1.5 px-2 rounded-md font-label-sm text-[12px] font-semibold text-center transition-all ${
                    permMode === 'private'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Private Room Only
                </button>
                <button
                  onClick={() => setPermMode('public')}
                  className={`flex-1 py-1.5 px-2 rounded-md font-label-sm text-[12px] font-semibold text-center transition-all ${
                    permMode === 'public'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Public Community
                </button>
              </div>

              {/* Tournament Readiness Badge */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 px-3 py-2 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-carbon-green animate-pulse" />
                  <span className="font-label-caps text-[10px] font-bold text-on-surface">
                    {categories.length} / 12 Categories
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-carbon-green/15 text-carbon-green font-label-caps text-[10px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Match Ready
                </div>
              </div>
            </div>
          </section>

          {/* Quick Action Bar */}
          <div className="grid grid-cols-3 gap-2">
            <button
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-on-surface shadow-sm transition-all text-center active:scale-95 min-h-[56px]"
              type="button"
            >
              <span className="material-symbols-outlined text-primary text-[20px] mb-0.5">dataset</span>
              <span className="font-label-caps text-[10px] font-bold truncate w-full">+ Pool (250+)</span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-on-surface shadow-sm transition-all text-center active:scale-95 min-h-[56px]"
              type="button"
            >
              <span className="material-symbols-outlined text-secondary text-[20px] mb-0.5">shuffle</span>
              <span className="font-label-caps text-[10px] font-bold truncate w-full">Shuffle Deck</span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-on-surface shadow-sm transition-all text-center active:scale-95 min-h-[56px]"
              type="button"
            >
              <span className="material-symbols-outlined text-carbon-magenta text-[20px] mb-0.5">auto_awesome</span>
              <span className="font-label-caps text-[10px] font-bold truncate w-full">AI Spark</span>
            </button>
          </div>

          {/* Category Roster Header */}
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="font-label-caps text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Active {categories.length}-Prompt Roster
            </span>
            <span className="font-label-sm text-[12px] text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">drag_indicator</span> Drag handle to reorder
            </span>
          </div>

          {/* 12-Category List */}
          <div className="flex flex-col gap-2 mb-3">
            {categories.map((cat, index) => (
              <CategoryItemCard
                key={cat.id}
                index={index + 1}
                category={cat}
                onDelete={() => handleDeleteCategory(cat.id)}
                onEdit={(newText) => handleEditCategory(cat.id, newText)}
              />
            ))}
          </div>

          {/* Quick Add Input */}
          <section className="w-full rounded-xl bg-surface-container-lowest p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase" htmlFor="new-category-input">
                Quick Add Custom Prompt
              </label>
              <span className="font-label-sm text-[12px] text-on-surface-variant">Tap suggestion or type</span>
            </div>
            <div className="relative flex items-start">
              <input
                ref={inputRef}
                id="new-category-input"
                value={newCategoryText}
                onChange={(e) => setNewCategoryText(e.target.value)}
                placeholder="e.g., Things You Find in a Car..."
                className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-[14px] placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest resize-none transition-all shadow-sm"
                type="text"
              />
            </div>
            <div className="space-y-1.5">
              <span className="font-label-sm text-[12px] text-on-surface-variant">Tags (comma-separated)</span>
              <input
                value={newCategoryTags}
                onChange={(e) => setNewCategoryTags(e.target.value)}
                placeholder="e.g., Travel, Household, Everyday"
                className="w-full p-2.5 rounded-lg bg-surface-container-low text-on-surface font-label-sm text-[12px] placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-all"
                type="text"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickAdd}
                disabled={!newCategoryText.trim()}
                className="flex-1 h-10 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-[14px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add to Deck
              </button>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="h-12 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-headline-sm text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 h-12 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-[14px] font-semibold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            type="button"
          >
            <span>Save Deck</span>
            <span className="material-symbols-outlined text-[20px]">check</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Individual category item card */
function CategoryItemCard({
  index,
  category,
  onDelete,
  onEdit,
}: {
  index: number;
  category: DeckCategory;
  onDelete: () => void;
  onEdit: (newText: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(category.text);

  const handleSaveEdit = () => {
    onEdit(editText);
    setIsEditing(false);
  };

  return (
    <div className="category-item flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest shadow-sm transition-all">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Drag Handle */}
        <button
          className="drag-handle touch-none cursor-grab active:cursor-grabbing text-outline p-1 rounded hover:bg-surface-container-low"
          type="button"
          aria-label="Reorder prompt"
        >
          <span className="material-symbols-outlined text-[20px] block">drag_indicator</span>
        </button>
        <span className="category-num px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-caps text-[10px] font-bold flex-shrink-0">
          #{index}
        </span>
        <div className="flex flex-col min-w-0 pr-2">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-body-md text-[14px] focus:outline-none"
                type="text"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <button onClick={handleSaveEdit} className="text-carbon-green" type="button">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </button>
            </div>
          ) : (
            <>
              <span className="category-text font-body-lg text-[16px] font-medium text-on-surface truncate">{category.text}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {category.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.2 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-[10px]">
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => { setIsEditing(true); setEditText(category.text); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
          type="button"
          aria-label="Edit item title"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-carbon-red/80 hover:text-carbon-red hover:bg-error-container/40 transition-colors"
          type="button"
          aria-label="Delete category"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
}
