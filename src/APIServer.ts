import { Profanity } from '@2toad/profanity';
import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';

interface Game
{
    game_room: string;
    host: string;
    map_name: string;
    max_players: number;
    game_version: string;
    locked: boolean;
    is_custom_password: boolean;
    is_closed: boolean;
    is_loadedGame: boolean;
    is_ladder: boolean;
    players: string;
    game_mode: string;
    tunnel_address: string;
    tunnel_port: number;
    channel: string;
}

export class APIServer 
{
    constructor(databaseFileName: string, port: number = 4000)
    {
        // Create Express app
        const app = express();

        const profanity = new Profanity({
            languages: ["en", "de", "es", "fr"],
        });

        profanity.addWords(["hitler", "h1tler", "adolf-hitler", "adolfhitler", "nigguh", "negro"]);

        // Open SQLite database
        const db = new sqlite3.Database(databaseFileName, (err: Error | null) =>
        {
            if (err)
            {
                console.error(err.message);
            }
            else
            {
                console.log('Connected to the SQLite database.');
            }
        });

        // Endpoint to return all games or filter by channel
        app.get('/games', (req: Request, res: Response) =>
        {
            const channel = req.query.channel as string;

            // Basic validation to ensure the channel is in an acceptable format
            if (channel && !/^#?\w+(-\w+)*$/.test(channel))
            {
                return res.status(400).json({ error: "Invalid channel format" });
            }

            if (channel && channel.length > 100)
            {
                return res.status(400).json({ error: "Channel name is too long" });
            }

            let sql = 'SELECT * FROM games';
            const params: string[] = [];

            if (channel)
            {
                sql += ' WHERE channel = ?';
                params.push("#" + channel);
            }

            db.all(sql, params, (err: Error | null, rows: any[]) =>
            {
                if (err)
                {
                    res.status(500).json({ error: err.message });
                    return;
                }

                // Filter rows for profanity in gameRoom and host fields
                const sanitizedRows = rows.map((game: Game) =>
                {
                    return {
                        ...game,
                        game_room: profanity.censor(game.game_room),
                        host: profanity.censor(game.host),
                        map_name: profanity.censor(game.map_name),
                        players: profanity.censor(game.players)
                    };
                });

                res.json({ games: sanitizedRows });
            });
        });

        app.get('/classic', (req: Request, res: Response) =>
        {
            const channel = req.query.channel as string;

            // Basic validation to ensure the channel is in an acceptable format
            if (channel && !/^#?\w+(-\w+)*$/.test(channel))
            {
                return res.status(400).json({ error: "Invalid channel format" });
            }

            if (channel && channel.length > 100)
            {
                return res.status(400).json({ error: "Channel name is too long" });
            }

            let sql = 'SELECT * FROM classic_client_game_counts';
            const params: string[] = [];

            if (channel)
            {
                sql += ' WHERE channel = ?';
                params.push(channel);
            }

            db.all(sql, params, (err: Error | null, rows: any[]) =>
            {
                if (err)
                {
                    res.status(500).json({ error: err.message });
                    return;
                }

                res.json(rows);
            });
        });

        // Start the server
        app.listen(port, () =>
        {
            console.log(`Server running on http://localhost:${port}`);
        });
    }
}