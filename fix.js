const fs = require('fs');
const file = '/Users/abhishek/projects/Scattergories/Scattergories.Client/src/api/hubConnection.ts';
let c = fs.readFileSync(file, 'utf8');
c = c.replace("    gameCode: string,\n    playerId?: string,\n    token?: string,\n    token?: string,", "    gameCode: string,\n    playerId?: string,\n    token?: string,");
fs.writeFileSync(file, c);
