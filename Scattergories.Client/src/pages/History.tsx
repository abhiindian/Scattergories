export function History() {
  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <div className="mx-auto max-w-md md:max-w-4xl lg:max-w-[1120px] px-4 md:px-8 pt-4 md:pt-8 pb-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
              </div>
              <div>
                <h1 className="font-headline-sm md:text-[24px] text-[20px] text-text-primary tracking-tight">Match History</h1>
                <p className="font-body-md text-[14px] text-text-secondary">Review your past games and scores.</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">history_toggle_off</span>
              <p className="font-headline-sm text-lg">No History Yet</p>
              <p className="text-sm mt-2">Play some games to see your history here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

