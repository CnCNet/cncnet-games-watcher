import irc from 'irc';
import { GameTracker } from './GameTracker';
import { ClassicClientCounter } from './ClassicClientCounter';
import { DatabaseManager } from './DatabaseManager';
import { XNAGame } from './XNAGame';

export class IRCBot
{
    private client: irc.Client;
    private gameTracker: GameTracker;
    private databaseManager: DatabaseManager;
    private classicClientCounter: ClassicClientCounter;
    private static readonly CHECK_INTERVAL_SECONDS: number = 30;

    constructor(databaseFileName: string, channels: string[], botName: string)
    {
        this.databaseManager = new DatabaseManager(databaseFileName);
        this.gameTracker = new GameTracker();
        this.classicClientCounter = new ClassicClientCounter();

        this.client = new irc.Client('irc.gamesurge.net', botName, { channels: channels });
        this.client.addListener('ctcp', (from: string, to: string, text: string, type: string) => this.onCTCPMessageReceived(from, to, text, type));
        this.client.addListener('registered', () =>
        {
            this.requestChannelList();
            setInterval(() => this.requestChannelList(), IRCBot.CHECK_INTERVAL_SECONDS * 1000);
        });

        this.client.addListener('channellist', (channels) => this.onListMessageReceived(channels));
        setInterval(() => this.onRemoveInactiveGames(), IRCBot.CHECK_INTERVAL_SECONDS * 1000);
    }

    private requestChannelList(): void
    {
        this.client.list("#cncnet_*");
    }

    private onListMessageReceived(channels: { name: string, users: string, topic: string }[]): void
    {
        this.classicClientCounter.resetCounts();
        channels.forEach((v) =>
        {
            this.classicClientCounter.updateCount(v.name, 1);
        });

        const counts = this.classicClientCounter.getCounts();
        Object.keys(counts).forEach((channel) =>
        {
            this.databaseManager.insertOrUpdateClassicClientGameCount(counts[channel as keyof typeof counts], channel);
        });
    }

    private onCTCPMessageReceived(from: string, to: string, text: string, type: string): void
    {
        if (!text.startsWith("GAME ")) return;

        const gameData = this.parseGameData(from, to, text.substring(5));
        if (gameData)
        {
            this.gameTracker.updateOrCreateGame(gameData);
            this.databaseManager.getGame(gameData.gameRoom, gameData.host, gameData.channel, (err, row) =>
            {
                if (err)
                {
                    console.error(err.message);
                }
                else if (!row)
                {
                    this.databaseManager.insertGame(gameData);
                }
                else
                {
                    this.databaseManager.updateGame(gameData);
                }
            });
        }
    }

    private parseGameData(from: string, to: string, data: string): XNAGame | null
    {
        const splitMessage = data.split(';');
        if (splitMessage.length !== 11) return null;

        const gameRoomDisplayName = splitMessage[4];
        const flags = splitMessage[5];
        const players = splitMessage[6].split(',');
        const tunnelData = splitMessage[9].split(':');

        return {
            gameRoom: gameRoomDisplayName,
            host: from,
            channel: to,
            mapName: splitMessage[7],
            maxPlayers: parseInt(splitMessage[2], 10),
            gameVersion: splitMessage[1],
            locked: flags[0] === '1',
            isCustomPassword: flags[1] === '1',
            isClosed: flags[2] === '1',
            isLoadedGame: flags[3] === '1',
            isLadder: flags[4] === '1',
            players: players,
            gameMode: splitMessage[8],
            tunnelAddress: tunnelData[0],
            tunnelPort: parseInt(tunnelData[1], 10)
        };
    }

    private onRemoveInactiveGames(): void
    {
        const removedGames = this.gameTracker.removeInactiveGames();
        removedGames.forEach((game) =>
        {
            this.databaseManager.deleteGame(game.gameRoom, game.host, game.channel);
        });
    }
}
