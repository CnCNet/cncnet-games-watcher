import { XNAGame } from "./XNAGame";

export class GameTracker
{
    private activeGames: { [key: string]: XNAGame & { lastSeen: number } } = {};

    public updateOrCreateGame(game: XNAGame): void
    {
        const uniqueKey = `${game.gameRoom}-${game.host}-${game.channel}`;
        this.activeGames[uniqueKey] = {
            ...game,
            lastSeen: Date.now()
        };
    }

    public removeInactiveGames(): XNAGame[]
    {
        const now = Date.now();
        const removedGames: XNAGame[] = [];

        for (const key in this.activeGames)
        {
            if (this.activeGames.hasOwnProperty(key))
            {
                const game = this.activeGames[key];
                if (now - game.lastSeen > 30000)
                {
                    delete this.activeGames[key];
                    removedGames.push(game);
                }
            }
        }

        return removedGames;
    }
}
