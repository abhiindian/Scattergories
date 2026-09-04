import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  teamScore: number;
}

interface TeamCardProps {
  team: Team;
  index: number;
  totalTeams: number;
}

const teamColors = [
  'bg-amber-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-orange-500',
];

const medalColors = [
  'bg-gradient-to-r from-amber-400 to-amber-600',
  'bg-gradient-to-r from-gray-300 to-gray-400',
  'bg-gradient-to-r from-amber-700 to-amber-800',
];

export function TeamCard({ team, index, totalTeams }: TeamCardProps) {
  const colorIndex = index % teamColors.length;
  const isRanked = index < 3 && totalTeams > 1;

  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200">
      <div className="flex items-center gap-2.5">
        {isRanked ? (
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white',
            medalColors[index]
          )}>
            {index + 1}
          </div>
        ) : (
          <div className={cn(
            'w-3 h-3 rounded-full',
            teamColors[colorIndex]
          )} />
        )}
        <span className="text-white text-sm font-medium">{team.name}</span>
      </div>
      <span className="text-amber-400 font-bold text-sm">{team.teamScore} pts</span>
    </div>
  );
}
