import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Category Manager Panel — Carbon Design System slideout.
 * Allows users to add, remove, and update categories for their game.
 */

interface CategoryItem {
  id: string;
  name: string;
  displayOrder: number;
}

interface CategoryManagerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategories: string[];
  availableCategories: CategoryItem[];
  onSave: (selectedNames: string[]) => void;
}

export function CategoryManagerPanel({
  isOpen,
  onClose,
  initialCategories,
  availableCategories,
  onSave,
}: CategoryManagerPanelProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newCategoryText, setNewCategoryText] = useState('');
  const [newCategoryTags, setNewCategoryTags] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when initialCategories changes
  useEffect(() => {
    setSelectedCategories(initialCategories);
    setEditingId(null);
  }, [initialCategories, isOpen]);


  const handleAddFromPool = (name: string) => {
    if (selectedCategories.includes(name)) {
      toast.error('Category already selected');
      return;
    }
    setSelectedCategories(prev => [...prev, name]);
    toast.success(`Added "${name}"`);
  };

  const handleRemove = (name: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== name));
  };

  const handleInlineEdit = (name: string) => {
    setEditingId(name);
    setEditText(name);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editText.trim()) {
      setEditingId(null);
      return;
    }
    const newName = editText.trim();
    if (newName === editingId) {
      setEditingId(null);
      return;
    }
    if (selectedCategories.includes(newName) && newName !== editingId) {
      toast.error('Category with this name already exists');
      return;
    }
    setSelectedCategories(prev =>
      prev.map(c => (c === editingId ? newName : c))
    );
    setEditingId(null);
    toast.success('Category updated');
  };

  const handleAddNew = () => {
    const name = newCategoryText.trim();
    if (!name) return;
    if (selectedCategories.includes(name)) {
      toast.error('Category already selected');
      return;
    }
    setSelectedCategories(prev => [...prev, name]);
    setNewCategoryText('');
    setNewCategoryTags('');
    toast.success(`Added "${name}"`);
  };

  const handleReset = () => {
    setSelectedCategories(initialCategories);
    toast.info('Reset to current selections');
  };

  const handleSave = () => {
    if (selectedCategories.length === 0) {
      toast.error('Add at least one category');
      return;
    }
    onSave(selectedCategories);
    onClose();
    toast.success('Categories saved');
  };

  const isInPool = (name: string) =>
    availableCategories.some(c => c.name === name);

  // Get available categories not yet selected
  const availablePool = availableCategories.filter(
    c => !selectedCategories.includes(c.name)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md h-full bg-surface shadow-2xl overflow-hidden flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[20px] text-primary">collections_bookmark</span>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-[14px] text-on-surface truncate leading-tight">
                Manage Categories
              </span>
              <span className="font-label-caps text-[10px] text-on-surface-variant truncate uppercase tracking-wider">
                {selectedCategories.length} selected
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface shrink-0"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* Selected Categories List */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-label-caps text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Active Categories
              </span>
              <span className="font-label-sm text-[12px] text-on-surface-variant">
                {selectedCategories.length} / 12 max
              </span>
            </div>

            {selectedCategories.length === 0 && (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant opacity-40 mb-1 block">
                  inbox
                </span>
                <span className="font-label-sm text-[12px] text-on-surface-variant">
                  No categories selected yet. Add one below.
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {selectedCategories.map((cat, index) => (
                <CategoryItemRow
                  key={cat}
                  index={index + 1}
                  name={cat}
                  isInPool={isInPool(cat)}
                  isEditing={editingId === cat}
                  editText={editText}
                  onEdit={() => handleInlineEdit(cat)}
                  onEditChange={setEditText}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={() => { setEditingId(null); }}
                  onRemove={() => handleRemove(cat)}
                />
              ))}
            </div>
          </section>

          {/* Quick Add New Category */}
          <section className="w-full rounded-xl bg-surface-container-lowest p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase" htmlFor="new-category-input">
                Quick Add Custom Prompt
              </label>
              <span className="font-label-sm text-[12px] text-on-surface-variant">Type to add</span>
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
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddNew(); }}
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
                onClick={handleAddNew}
                disabled={!newCategoryText.trim()}
                className="flex-1 h-10 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-[14px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add to Deck
              </button>
            </div>
          </section>

          {/* Available Pool */}
          {availablePool.length > 0 && (
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="font-label-caps text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Available from Library
                </span>
                <span className="font-label-sm text-[12px] text-on-surface-variant">
                  {availablePool.length} remaining
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availablePool.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleAddFromPool(cat.name)}
                    className="px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-[12px] hover:bg-surface-container-lowest hover:text-on-surface transition-all shadow-sm active:scale-95 flex items-center gap-1"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border-subtle shrink-0">
          <button
            onClick={handleReset}
            className="h-12 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-headline-sm text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span className="hidden sm:inline">Reset</span>
          </button>
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
            <span>Save {selectedCategories.length} Categories</span>
            <span className="material-symbols-outlined text-[20px]">check</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Individual category item row */
function CategoryItemRow({
  index,
  name,
  isInPool,
  isEditing,
  editText,
  onEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onRemove,
}: {
  index: number;
  name: string;
  isInPool: boolean;
  isEditing: boolean;
  editText: string;
  onEdit: () => void;
  onEditChange: (text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest shadow-sm transition-all">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Index Badge */}
        <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-caps text-[10px] font-bold shrink-0">
          #{index}
        </span>

        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              value={editText}
              onChange={(e) => onEditChange(e.target.value)}
              className="flex-1 px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-body-md text-[14px] focus:outline-none focus:bg-surface-container-lowest shadow-inner transition-colors"
              type="text"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <button
              onClick={onSaveEdit}
              className="text-carbon-green shrink-0"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
            </button>
            <button
              onClick={onCancelEdit}
              className="text-on-surface-variant shrink-0"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="flex flex-col min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
              type="button"
            >
              <span className="font-body-lg text-[16px] font-medium text-on-surface truncate block">
                {name}
              </span>
              {isInPool && (
                <span className="font-label-sm text-[10px] text-on-surface-variant mt-0.5">
                  From library
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {!isEditing && (
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
            type="button"
            aria-label="Edit category"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-carbon-red/80 hover:text-carbon-red hover:bg-error-container/40 transition-colors"
            type="button"
            aria-label="Remove category"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
