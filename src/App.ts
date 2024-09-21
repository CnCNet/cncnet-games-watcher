
import { APIServer } from './APIServer';
import { IRCBot } from './IRCBot';

export class App 
{
    constructor()
    {
        const databaseFileName: string = "games.db";
        const channels: string[] = [
            '#cncnet-yr-games',
            '#cncnet-dta-games',
            '#cncnet-mo-games',
            '#cncnet-rote-games',
            '#projectphantom-games',
            '#cncreloaded-games',
            '#cncnet-d2k-games',
            '#cncnet-ts-games',
            '#cncnet-ss-games'
        ];

        new IRCBot(databaseFileName, channels, "WhoLetTheBotsOut");
        new APIServer(databaseFileName, 4000);
    }
}

new App();