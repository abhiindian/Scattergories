interface GameSettings {
  roundCount: number;
  timerSeconds: number;
  pointsPerAnswer: number;
  allowPlurals: boolean;
  allowProperNouns: boolean;
  allowOffensiveWords: boolean;
}

interface SettingTileProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

function SettingTile({ label, value, icon }: SettingTileProps) {
  return (
    <div className="bg-white/5 rounded-lg px-3 py-2.5 hover:bg-white/10 transition-all duration-200">
      <p className="text-white/40 text-xs mb-0.5">{label}</p>
      <p className="text-white font-medium text-sm flex items-center gap-1.5">
        {icon}
        {value}
      </p>
    </div>
  );
}

interface SettingsGridProps {
  settings: GameSettings;
  editable?: boolean;
  onEdit?: () => void;
}

export function SettingsGrid({ settings }: SettingsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <SettingTile label="Rounds" value={settings.roundCount} />
      <SettingTile label="Timer" value={`${settings.timerSeconds}s`} />
      <SettingTile label="Points" value={settings.pointsPerAnswer} />
      <SettingTile
        label="Plurals"
        value={settings.allowPlurals ? 'Allowed' : 'Not allowed'}
      />
      <SettingTile
        label="Proper Nouns"
        value={settings.allowProperNouns ? 'Allowed' : 'Not allowed'}
      />
      <SettingTile
        label="Offensive"
        value={settings.allowOffensiveWords ? 'Allowed' : 'Blocked'}
      />
    </div>
  );
}
