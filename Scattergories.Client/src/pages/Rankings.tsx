export function Rankings() {
  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <div className="mx-auto max-w-md md:max-w-4xl lg:max-w-[1120px] px-4 md:px-8 pt-4 md:pt-8 pb-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-carbon-amber/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-carbon-amber text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              </div>
              <div>
                <h1 className="font-headline-sm md:text-[24px] text-[20px] text-text-primary tracking-tight">Global Rankings</h1>
                <p className="font-body-md text-[14px] text-text-secondary">See who's leading the vocabulary warfare.</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">leaderboard</span>
              <p className="font-headline-sm text-lg">Rankings Coming Soon</p>
              <p className="text-sm mt-2">We are gathering the best wordsmiths.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

