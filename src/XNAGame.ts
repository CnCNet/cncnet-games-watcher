export interface XNAGame
{
    gameRoom: string;            // The name or ID of the game room
    host: string;                // The host or player who created the game
    mapName: string;             // The name of the map being played
    maxPlayers: number;          // The maximum number of players allowed in the game
    gameVersion: string;         // The version of the game being played
    locked: boolean;             // Whether the game is locked (password protected)
    isCustomPassword: boolean;   // Whether the game uses a custom password
    isClosed: boolean;           // Whether the game is closed to new players
    isLoadedGame: boolean;       // Whether this is a loaded (saved) game
    isLadder: boolean;           // Whether the game is a ranked ladder game
    players: string[];           // List of players currently in the game
    gameMode: string;            // The game mode (e.g., deathmatch, cooperative)
    tunnelAddress: string;       // The IP address of the game tunnel (if applicable)
    tunnelPort: number;          // The port of the game tunnel
    channel: string;             // The IRC channel where the game was announced
}
