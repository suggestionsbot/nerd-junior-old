import { Message, TextChannel } from 'discord.js';

declare module 'discord.js' {
  interface Client {
    pendingRemovals: Map<string, MemberData|undefined>;
  }
}

export interface RedisFunctions {
  getAsync(key: string):  Promise<string|null>;
  delAsync(key: string): Promise<number>;
  setAsync(key: string, value: string): Promise<unknown>;
  keysAsync(pattern: string): Promise<Array<string>>;
}

export interface MemberData {
  expires: number;
}

export type StatusMessage = (channel: TextChannel, message: string) => Promise<Message>;
