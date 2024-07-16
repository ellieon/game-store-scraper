require('dotenv').config();
import { Client } from "discord.js";
import scraperCreate from "./event-listeners/cexScraper";

console.log("Bot is starting...");

const client = new Client({
    intents: []
});

client.login(process.env.DISCORD_BOT_TOKEN);

scraperCreate(client);