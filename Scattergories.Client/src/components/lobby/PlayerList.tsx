import { GlassAvatar } from '../common/GlassAvatar';
import { GlassBadge } from '../common/GlassBadge';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  totalScore?: number;
  team?: string;
}

interface PlayerListProps {
  players: Player[];
  currentPlayerName?: string;
}

interface PlayerItemProps {
  player: Player;
  index: number;
  isCurrentPlayer: boolean;
}

function PlayerItem({ player, index, isCurrentPlayer }: PlayerItemProps) {
  return (
    <li
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
        isCurrentPlayer
          ? 'bg-amber-500/10 ring-1 ring-amber-400/30'
          : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-white/30 text-xs w-4 text-center font-mono">
          {index + 1}
        </span>
        <GlassAvatar name={player.name} size="sm" />
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm">{player.name}</span>
          {player.isHost && (
            <GlassBadge variant="host" size="sm">HOST</GlassBadge>
          )}
          {isCurrentPlayer && (
            <span className="text-xs text-amber-300 font-medium">(You)</span>
          )}
        </div>
      </div>
      {player.totalScore !== undefined && player.totalScore > 0 && (
        <span className="text-amber-400 font-bold text-sm">{player.totalScore} pts</span>
      )}
    </li>
  );
}

export function PlayerList({ players, currentPlayerName }: PlayerListProps) {
  if (!players?.length) {
    return (
      <div className="text-center py-6">
        <p className="text-white/40 text-sm">No players yet</p>
        <p className="text-white/25 text-xs mt-1">Share the game code to invite friends</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {players.map((player, index) => (
        <PlayerItem
          key={player.id}
          player={player}
          index={index}
          isCurrentPlayer={player.name === currentPlayerName}
        />
      ))}
    </ul>
  );
}
