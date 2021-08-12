import { Client, Collection, Intents } from 'discord.js';
import 'dotenv/config';

import { loadCommands, loadListeners } from './functions';

const client = new Client({
  intents: new Intents(13827),
  partials: ['GUILD_MEMBER']
});

client.commands = new Collection();
client.events = new Collection();

const main = async (): Promise<boolean> => {
  try {
    await loadListeners(client);
    await loadCommands(client);
    await client.login();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

main();

process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection', err);
});
