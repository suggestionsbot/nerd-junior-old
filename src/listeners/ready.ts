import { Client } from 'discord.js';
import { Listener } from '../types';

export const listener: Listener = {
  name: 'ready',
  type: 'once',
  async execute(client: Client): Promise<any> {
    try {
      console.log(`Logged in as ${client.user.tag} (${client.user.id})!`);
      await client.user.setActivity('da nerds', { type: 'WATCHING' });
    } catch (e) {
      console.error(e);
    }
  }
};
