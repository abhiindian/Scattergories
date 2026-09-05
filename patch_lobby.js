const fs = require('fs');
const file = '/Users/abhishek/projects/Scattergories/Scattergories.Client/src/pages/Lobby.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Import hubConnection
content = content.replace("import { useGameStore } from '../state/gameStore';", "import { useGameStore } from '../state/gameStore';\nimport { hubConnection } from '../api/hubConnection';");

// 2. Fix isHost
content = content.replace("const isHost = game?.players[0]?.name === playerName;", "const isHost = game?.players?.find(p => p.name === playerName)?.isHost || false;");

// 3. Add hubConnection to useEffect
const oldUseEffect = `  useEffect(() => {
    fetchGame();
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchGame, 3000);
    return () => clearInterval(interval);
  }, [fetchGame]);`;

const newUseEffect = `  useEffect(() => {
    fetchGame();
    
    // Connect to SignalR for real-time updates
    const token = localStorage.getItem('token');
    const playerId = localStorage.getItem('playerId');
    if (code && playerName) {
      hubConnection.start(code, playerName, playerId || undefined, token || undefined)
        .catch(console.error);
        
      hubConnection.onGameUpdated((state) => {
        setGame(state);
      });
      
      hubConnection.onRoundStarted(() => {
        navigate(\`/game/\${code}\`);
      });
    }

    return () => {
      // We don't stop the connection here because GamePage needs it, 
      // but we could if we wanted to be strict about cleanup.
    };
  }, [fetchGame, code, playerName, navigate, setGame]);`;

content = content.replace(oldUseEffect, newUseEffect);

// 4. Remove empty slots
const emptySlotsRegex = /\{\/\* Empty Slot \*\/\}.*?\)\)\}/s;
content = content.replace(emptySlotsRegex, '');

// 5. Hide Start button for non-hosts
const startButtonRegex = /<button\s+onClick=\{handleStart\}[\s\S]*?<\/button>/;
const startButtonMatch = content.match(startButtonRegex);
if (startButtonMatch) {
  content = content.replace(startButtonRegex, `{isHost ? (
              ${startButtonMatch[0]}
              ) : (
                <div className="w-full min-h-[52px] md:min-h-[64px] rounded-xl md:rounded-2xl bg-surface-container-high text-on-surface-variant font-headline-sm text-[14px] md:text-[18px] font-semibold flex items-center justify-center shadow-inner">
                  Waiting for host to start...
                </div>
              )}`);
}

fs.writeFileSync(file, content);
console.log('Patched');
