import { Client } from 'discord.js';
import { APIApplicationCommandOption } from 'discord-api-types';
import path from 'path';
import { lstatSync, readdirSync } from 'fs';

import { Command, Listener } from '../types';

export const walk = (directory: string, extensions: Array<string>): Array<string> => {
  const read = (dir: string, files: Array<string> = []): Array<string> => {
    for (const file of readdirSync(dir)) {
      const filePath = path.join(dir, file), stats = lstatSync(filePath);
      if (stats.isFile() && extensions.some(ext => filePath.endsWith(ext))) files.push(filePath);
      else if (stats.isDirectory()) files = files.concat(read(filePath));
    }

    return files;
  };

  return read(directory);
};

export const loadListeners = async (client: Client): Promise<void> => {
  const files = walk(`${path.join(path.dirname(require.main.filename), 'listeners')}`, ['.js', '.ts']);
  if (!files.length) throw 'Could not load listener files!';

  for (const file of files) {
    const listener = await import(file).then(({ listener }) => listener as Listener);
    client[listener?.type ?? 'on'](listener.name, (...args: Array<any>) => listener.execute(client, ...args));
    delete require.cache[require.resolve(file)];
  }
};

export const loadCommands = async (
  client?: Client,
  commands?: Array<{name: string, description: string, options: Array<APIApplicationCommandOption>}>
): Promise<void> => {
  const files = walk(`${path.join(path.dirname(require.main.filename), 'commands')}`, ['.js', '.ts']);
  if (!files.length) throw 'Could not load command files!';

  for (const file of files) {
    const command = await import(file).then(({ command }) => command as Command);
    if (client) client.commands.set(command.data.name, command);
    else commands.push(command.data.toJSON());
    delete require.cache[require.resolve(file)];
  }
};
