# CnCNet Games Watcher

This IRC Bot will join the supported games and mods of the XNA CnCNet client, saving the latest set of games into a database.


- CTCP updates received will update the game listings. 
- Games are checked every 30 seconds to ensure there are no stale results. If they don't give a CTCP update they are deemed inactive and are removed from the list. 
- A simple API is available under `localhost:port`, which is localhost:4000/games. Filtering is available via `http://localhost:4000/games?channel=<games-channel-name>`
    - The api will return an array of games, example response:
    ```json
        {
            "games": [
                {
                    "id": 1995,
                    "game_room": "Ryan's Game",
                    "host": "Ryan_",
                    "map_name": "[6] Cool Down",
                    "max_players": 8,
                    "game_version": "13.0.0",
                    "locked": 1,
                    "is_custom_password": 1,
                    "is_closed": 0,
                    "is_loaded_game": 0,
                    "is_ladder": 0,
                    "players": "Ryan_,NotRyan",
                    "game_mode": "Deathmatch",
                    "tunnel_address": "51.89.149.152",
                    "tunnel_port": 50000,
                    "channel": "#cncnet-dta-games"
                },
                {
                    "id": 2029,
                    "game_room": "gocte's Game",
                    "host": "gocte",
                    "map_name": "[2] Double Team",
                    "max_players": 8,
                    "game_version": "13.0.0",
                    "locked": 1,
                    "is_custom_password": 1,
                    "is_closed": 0,
                    "is_loaded_game": 0,
                    "is_ladder": 0,
                    "players": "gocte,Lightning",
                    "game_mode": "Co-Op (Hard)",
                    "tunnel_address": "198.244.177.26",
                    "tunnel_port": 50000,
                    "channel": "#cncnet-dta-games"
                }
            ]
        }
    ```
