import { Client, Collection, CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
    events: Collection<string, Listener>;
  }
}

export interface Listener {
  name: string;
  type?: 'on' | 'once';
  execute(client: Client, ...args: Array<any>): any;
}

export interface Command {
  data: SlashCommandBuilder;
  execute(interaction: CommandInteraction): any;
}
