import {  Client, bold, italic, underscore, } from "discord.js";
import { CexFetchService } from "../services/cexFetchService";
import { DatabaseService } from "../services/databaseService";
import { StoreEntry } from "../types/storeEntry";

export default (client: Client): void => {
    client.on('ready', async () => {
        console.log('Bot is ready!');
        const databaseService = new DatabaseService();
        setInterval(async () => {
            const scanDate = await databaseService.getNextScanDate();
            if(scanDate > new Date()){
            } else {
                try {
                    console.log("Starting next scan");
                    await databaseService.setNextScanDate();
                    await getGamesAndMessage(client, databaseService);
                    console.log("Scan complete");
                } catch (error) {
                    console.log(error);
                }
            }
        }, 30000);
      });
};

async function getGamesAndMessage(client: Client, databaseService: DatabaseService) {
    const service = new CexFetchService()
    const userId = await databaseService.getUserId();
    const user = await client.users.fetch(userId);
    const stores = await databaseService.getStores();

    for (var store of stores) {
        console.log("Getting data for " + store);
        const games = await service.getDiffForStore(store);
        console.log("Sending message for " + store)
        const message = buildMessage(games);
        const chunks = splitString(message);

        await Promise.all(chunks.map(chunk => user.send(chunk)));
    }
}

function buildMessage(store: StoreEntry) {
    let message = `-----\n${underscore(italic(bold('Here are the new games from ' + store.name)))}\n`
    for(var category of store.stock) {
        message += `${underscore(italic(bold(category.category.name)))}\n`
        for(var game of category.games) {
            message += '* ' + game.name + ' - ' + game.subCategory + ' - £' + game.price + '\n'
        }
    }
    return message;
}
function splitString(str: string, length = 1999) {
    var chunks = [];
    var index = 0;
    while (index < str.length) {
        let end = index + length < str.length ? index + length : str.length;
        // Find the last newline character
        end = str.lastIndexOf('\n', end);
        if (end == -1 || end <= index) {
            end = index + length < str.length ? index + length : str.length;
        } else {
            // Include the newline character at the end of the chunk
            end += 1;
        }
        chunks.push(str.substring(index, end));
        index = end;
    }
    return chunks;
}