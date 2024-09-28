/**
 * Funkys client that supported RA, TD, TS, D2
 */
export interface ClassicGameCount 
{
    td: number;
    ra: number;
    ts: number;
    d2: number;
}

export class ClassicClientCounter
{
    private gameCounts: ClassicGameCount = {
        td: 0,
        ra: 0,
        ts: 0,
        d2: 0
    };

    public resetCounts(): void
    {
        this.gameCounts = { td: 0, ra: 0, ts: 0, d2: 0 };
    }

    public updateCount(channel: string, count: number): void
    {
        if (channel.startsWith("#cncnet_ra"))
        {
            this.gameCounts.ra += count;
        }
        else if (channel.startsWith("#cncnet_td"))
        {
            this.gameCounts.td += count;
        }
        else if (channel.startsWith("#cncnet_ts"))
        {
            this.gameCounts.ts += count;
        }
        else if (channel.startsWith("#cncnet_d2"))
        {
            this.gameCounts.d2 += count;
        }
    }

    public getCounts(): ClassicGameCount
    {
        return this.gameCounts;
    }
}
