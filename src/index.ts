import { Client } from 'discord.js';
import * as dotenv from 'dotenv-flow';
dotenv.config();

const client = new Client({ disableMentions: 'everyone' });

client.on('ready', () => console.log('Ready to go!'));

const main = async (): Promise<boolean> => {
  try {
    await client.login();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

main();
