require('dotenv').config();
import { Client, GatewayIntentBits, Partials } from "discord.js";
import scraperCreate from "./event-listeners/cexScraper";
import { getRequiredEnvVar } from "./util/getRequiredEnvVar";

console.log("Bot is starting...");

const client = new Client({
    intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel,
    Partials.Message
  ]
});

client.login(getRequiredEnvVar('DISCORD_BOT_TOKEN'));

scraperCreate(client);