const fs = require('fs');
let file = '/Users/abhishek/projects/Scattergories/Scattergories.Client/src/pages/Lobby.tsx';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/hubConnection.start\(code,\s*playerName\s*\?\?\s*"",\s*playerId\s*\|\|\s*undefined,\s*token\s*\|\|\s*undefined\)/, 'hubConnection.start(code, playerId || undefined, token || undefined)');
fs.writeFileSync(file, c);

file = '/Users/abhishek/projects/Scattergories/Scattergories.Client/src/pages/GamePage.tsx';
c = fs.readFileSync(file, 'utf8');
c = c.replace(/hubConnection.start\(code!,\s*playerName\s*\?\?\s*'',\s*playerId\s*\?\?\s*undefined,\s*token\s*\?\?\s*undefined\)/, 'hubConnection.start(code!, playerId ?? undefined, token ?? undefined)');
fs.writeFileSync(file, c);
