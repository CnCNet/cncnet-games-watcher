import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';

export class APIServer 
{
    constructor(databaseFileName: string, port: number = 4000)
    {
        // Create Express app
        const app = express();

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
                res.json({ games: rows });
            });
        });

        // Start the server
        app.listen(port, () =>
        {
            console.log(`Server running on http://localhost:${port}`);
        });
    }
}