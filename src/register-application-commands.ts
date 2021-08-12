import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { loadCommands } from './functions';
import 'dotenv/config';

import { DEV_BOT_ID, MAIN_BOT_ID, DEV_GUILD, MAIN_GUILD } from './config';

const commands = [];
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

const [guildId, clientId] = process.env.NODE_ENV === 'production'
  ? [MAIN_GUILD, MAIN_BOT_ID]
  : [DEV_GUILD, DEV_BOT_ID];

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await loadCommands(null, commands);

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log(`Successfully reloaded ${commands.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();

