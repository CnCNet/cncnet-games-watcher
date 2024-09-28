import sqlite3 from 'sqlite3';
import irc from 'irc';
import { XNAGame } from './XNAGame';

export class DatabaseManager
{
    private database: sqlite3.Database;

    constructor(databaseFileName: string)
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
                this.createTables();
            }
        });
    }

    private createTables(): void
    {
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

        this.database.run(`CREATE TABLE IF NOT EXISTS classic_client_game_counts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            count INTEGER,
            channel TEXT
        )`);
    }

    public insertGame(game: XNAGame): void
    {
        this.database.run(
            `INSERT INTO games (game_room, host, map_name, max_players, game_version, locked, is_custom_password, is_closed, is_loaded_game, is_ladder, players, game_mode, tunnel_address, tunnel_port, channel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                game.gameRoom, game.host, game.mapName, game.maxPlayers, game.gameVersion, game.locked,
                game.isCustomPassword, game.isClosed, game.isLoadedGame, game.isLadder, game.players.join(','),
                game.gameMode, game.tunnelAddress, game.tunnelPort, game.channel
            ],
            (err: Error | null) =>
            {
                if (err)
                {
                    console.error('Error inserting game:', err.message);
                }
                else
                {
                    console.log(`Game inserted: ${game.gameRoom}, Host: ${game.host}`);
                }
            }
        );
    }

    public updateGame(game: XNAGame): void
    {
        this.database.run(
            `UPDATE games SET map_name = ?, max_players = ?, game_version = ?, locked = ?, is_custom_password = ?, is_closed = ?, is_loaded_game = ?, is_ladder = ?, players = ?, game_mode = ?, tunnel_address = ?, tunnel_port = ?
            WHERE game_room = ? AND host = ? AND channel = ?`,
            [
                game.mapName, game.maxPlayers, game.gameVersion, game.locked, game.isCustomPassword, game.isClosed,
                game.isLoadedGame, game.isLadder, game.players.join(','), game.gameMode, game.tunnelAddress,
                game.tunnelPort, game.gameRoom, game.host, game.channel
            ],
            (err: Error | null) =>
            {
                if (err)
                {
                    console.error('Error updating game:', err.message);
                }
            }
        );
    }

    public deleteGame(gameRoom: string, host: string, channel: string): void
    {
        this.database.run(
            `DELETE FROM games WHERE game_room = ? AND host = ? AND channel = ?`,
            [gameRoom, host, channel],
            (err: Error | null) =>
            {
                if (err)
                {
                    console.error('Error deleting game:', err.message);
                }
            }
        );
    }

    public insertOrUpdateClassicClientGameCount(count: number, channel: string): void
    {
        this.database.get(
            `SELECT 1 FROM classic_client_game_counts WHERE channel = ?`,
            [channel],
            (err: Error | null, row: any) =>
            {
                if (err)
                {
                    console.error('Error checking game count:', err.message);
                    return;
                }

                if (!row)
                {
                    this.database.run(
                        `INSERT INTO classic_client_game_counts (count, channel) VALUES (?, ?)`,
                        [count, channel],
                        (err: Error | null) =>
                        {
                            if (err)
                            {
                                console.error('Error inserting game count:', err.message);
                            } else
                            {
                                console.log(`Game count inserted for channel: ${channel}`);
                            }
                        }
                    );
                }
                else
                {
                    this.database.run(
                        `UPDATE classic_client_game_counts SET count = ? WHERE channel = ?`,
                        [count, channel],
                        (err: Error | null) =>
                        {
                            if (err)
                            {
                                console.error('Error updating game count:', err.message);
                            }
                        }
                    );
                }
            }
        );
    }

    public getGame(gameRoom: string, host: string, channel: string, callback: (err: Error | null, row: any) => void): void
    {
        this.database.get(
            `SELECT * FROM games WHERE game_room = ? AND host = ? AND channel = ?`,
            [gameRoom, host, channel],
            (err: Error | null, row: any) =>
            {
                if (err)
                {
                    console.error('Error retrieving game:', err.message);
                }
                callback(err, row);
            }
        );
    }
}
