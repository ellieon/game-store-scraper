require('dotenv').config();
import { Client } from "discord.js";
import scraperCreate from "./event-listeners/cexScraper";
import { getRequiredEnvVar } from "./util/getRequiredEnvVar";

console.log("Bot is starting...");

const client = new Client({
    intents: []
});

client.login(getRequiredEnvVar('DISCORD_BOT_TOKEN'));

scraperCreate(client);