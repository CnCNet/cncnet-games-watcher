import sqlite3 from 'sqlite3';
import irc from 'irc';

interface Game
{
    gameRoom: string;
    host: string;
    mapName: string;
    maxPlayers: number;
    gameVersion: string;
    locked: boolean;
    isCustomPassword: boolean;
    isClosed: boolean;
    isLoadedGame: boolean;
    isLadder: boolean;
    players: string[];
    gameMode: string;
    tunnelAddress: string;
    tunnelPort: number;
    channel: string;
}

export class IRCBot 
{
    private client: irc.Client;
    private activeGames: { [key: string]: Game & { lastSeen: number } } = {};
    private database: sqlite3.Database;

    constructor(databaseFileName: string, channels: string[], botName: string)
    {
        this.database = new sqlite3.Database(databaseFileName, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err: Error | null) =>
        {
            if (err)
            {
                console.error(err.message);
            }
            else
            {
                console.log('Connected to SQLite database.');
                this.database.run(`CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_room TEXT,
                host TEXT,
                map_name TEXT,
                max_players INTEGER,
                game_version TEXT,
                locked BOOLEAN,
                is_custom_password BOOLEAN,
                is_closed BOOLEAN,
                is_loaded_game BOOLEAN,
                is_ladder BOOLEAN,
                players TEXT,
                game_mode TEXT,
                tunnel_address TEXT,
                tunnel_port INTEGER,
                channel TEXT
                )`);
            }
        });

        // IRC client configuration with multiple channels
        this.client = new irc.Client('irc.gamesurge.net', botName, { channels: channels });

        // Listen for CTCP messages
        this.client.addListener('ctcp', (from: string, to: string, text: string, type: string) => this.onCTCPMessageReceived(from, to, text, type));

        // Periodic cleanup of games that haven't been seen in the last 30 seconds
        setInterval(() => this.onRemoveInactiveGames(), 30000);
    }

    private onCTCPMessageReceived(from: string, to: string, text: string, type: string): void 
    {
        if (!text.startsWith("GAME ")) return;

        const msg = text.substring(5);
        const splitMessage = msg.split(';');
        if (splitMessage.length !== 11) return;

        const gameRoomDisplayName = splitMessage[4];
        const host = from;
        const channel = to;
        const uniqueKey = `${gameRoomDisplayName}-${host}-${channel}`;

        // Extract game data
        const gameVersion = splitMessage[1];
        const maxPlayers = parseInt(splitMessage[2], 10);
        const flags = splitMessage[5];
        const locked = flags[0] === '1';
        const isCustomPassword = flags[1] === '1';
        const isClosed = flags[2] === '1';
        const isLoadedGame = flags[3] === '1';
        const isLadder = flags[4] === '1';
        const players = splitMessage[6].split(',');
        const mapName = splitMessage[7];
        const gameMode = splitMessage[8];
        const tunnelData = splitMessage[9].split(':');
        const tunnelAddress = tunnelData[0];
        const tunnelPort = parseInt(tunnelData[1], 10);

        // Update the active games list with a timestamp
        this.activeGames[uniqueKey] = {
            gameRoom: gameRoomDisplayName,
            host: host,
            mapName: mapName,
            maxPlayers: maxPlayers,
            gameVersion: gameVersion,
            locked: locked,
            isCustomPassword: isCustomPassword,
            isClosed: isClosed,
            isLoadedGame: isLoadedGame,
            isLadder: isLadder,
            players: players,
            gameMode: gameMode,
            tunnelAddress: tunnelAddress,
            tunnelPort: tunnelPort,
            channel: channel,
            lastSeen: Date.now()
        };

        // Check if the game already exists in the database
        this.database.get(`SELECT 1 FROM games WHERE game_room = ? AND host = ? AND channel = ?`, [gameRoomDisplayName, host, channel], (err: Error | null, row: any) =>
        {
            if (err)
            {
                console.error(err.message);
                return;
            }

            if (!row)
            {
                // Insert new game
                this.database.run(`INSERT INTO games (game_room, host, map_name, max_players, game_version, locked, is_custom_password, is_closed, is_loaded_game, is_ladder, players, game_mode, tunnel_address, tunnel_port, channel)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [gameRoomDisplayName, host, mapName, maxPlayers, gameVersion, locked, isCustomPassword, isClosed, isLoadedGame, isLadder, players.join(','), gameMode, tunnelAddress, tunnelPort, channel],
                    function (err: Error | null)
                    {
                        if (err)
                        {
                            console.error(err.message);
                            return;
                        }
                        console.log(`Game stored: ${gameRoomDisplayName}, Host: ${host}, Map: ${mapName}`);
                    });
            } else
            {
                // Update existing game
                this.database.run(`UPDATE games SET map_name = ?, max_players = ?, game_version = ?, locked = ?, is_custom_password = ?, is_closed = ?, is_loaded_game = ?, is_ladder = ?, players = ?, game_mode = ?, tunnel_address = ?, tunnel_port = ?
                    WHERE game_room = ? AND host = ? AND channel = ?`,
                    [mapName, maxPlayers, gameVersion, locked, isCustomPassword, isClosed, isLoadedGame, isLadder, players.join(','), gameMode, tunnelAddress, tunnelPort, gameRoomDisplayName, host, channel],
                    function (err: Error | null)
                    {
                        if (err)
                        {
                            console.error(err.message);
                            return;
                        }
                        // console.log(`Game updated: ${gameRoomDisplayName}, Host: ${host}, Map: ${mapName}`);
                    });
            }
        });
    }

    private onRemoveInactiveGames(): void 
    {
        const now = Date.now();
        for (const key in this.activeGames)
        {
            if (this.activeGames.hasOwnProperty(key))
            {
                const game = this.activeGames[key];
                if (now - game.lastSeen > 30000)
                {
                    console.log(`Removing inactive game: ${game.gameRoom}, Host: ${game.host}`);

                    // Remove from activeGames list
                    delete this.activeGames[key];

                    // Remove from database
                    this.database.run(`DELETE FROM games WHERE game_room = ? AND host = ? AND channel = ?`, [game.gameRoom, game.host, game.channel], function (err: Error | null)
                    {
                        if (err)
                        {
                            console.error(err.message);
                            return;
                        }
                        console.log(`Game room ${game.gameRoom} hosted by ${game.host} removed from database.`);
                    });
                }
            }
        }
    }
}
