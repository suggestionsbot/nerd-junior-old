import { CronJob } from 'cron';
import { inspect, promisify } from 'util';
import { Client, Message, TextChannel } from 'discord.js';
import { stripIndents } from 'common-tags';

import { COLORS, CRON_TIMER, DEV_GUILD, MAIN_GUILD, MAIN_GUILD_INVITE, REDIS_KEY } from '../config';
import { MemberData, RedisFunctions, StatusMessage } from '../types';

export const asyncRedisFunctions = (redis: any): RedisFunctions => {
  return {
    getAsync: promisify(redis.get).bind(redis),
    delAsync: promisify(redis.del).bind(redis),
    setAsync: promisify(redis.set).bind(redis),
    keysAsync: promisify(redis.keys).bind(redis)
  };
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const clean = async (client: Client, text: any): Promise<any> => {
  if (text && text.constructor.name === 'Promise') text = await text;
  if (typeof text !== 'string') {
    text = inspect(text, {
      depth: 1
    });
  }

  text = text
    .replace(/`/g, '`' + String.fromCharCode(8203))
    .replace(/@/g, '@' + String.fromCharCode(8203))
    .replace(client.token, '-REDACTED-')
    .replace(process.env.DISCORD_TOKEN, '-REDACTED-')
    .replace(process.env.REDIS_HOSTNAME, '-REDACTED-')
    .replace(process.env.REDIS_PASSWORD, '-REDACTED-')
    .replace(process.env.REDIS_PORT, '-REDACTED-');

  return text;
};

export const errorMessage: StatusMessage = (channel: TextChannel, message: string): Promise<Message> => {
  return channel.send({
    embeds: [{
      description: stripIndents`<:nerdError:605265598343020545> ${message}`,
      color: COLORS.ERROR
    }]
  });
};

export const successMessage: StatusMessage = (channel: TextChannel, message: string): Promise<Message> => {
  return channel.send({
    embeds: [{
      description: stripIndents`<:nerdSuccess:605265580416565269> ${message}`,
      color: COLORS.SUCCESS
    }]
  });
};

export const boosterExpirationJob = (redis: any, client: Client): CronJob => {
  console.log('Starting booster expiration job...');
  return new CronJob(CRON_TIMER, async () => {
    const [mainGuild, devGuild] = [MAIN_GUILD, DEV_GUILD].map(g => client.guilds.cache.get(g));
    if (client.pendingRemovals.size > 0) {
      for (const id of client.pendingRemovals.keys()) {
        try {
          const member = await devGuild.members.fetch(id);
          await member.send({
            embeds: [{
              author: {
                name: member.user.tag,
                url: member.user.avatarURL()
              },
              description: stripIndents`
              You have been kicked from **${devGuild}** \`[${devGuild.id}]\` due to your Nitro Boost expiring in **${mainGuild}** \`[${mainGuild.id}]\`.
              
              You are free to renew your boost in **${mainGuild}** at anytime to regain access to your benefits including access to the **${devGuild}** guild!
              **Invite:** ${MAIN_GUILD_INVITE}
              
              (If you believe this is a mistake, please contact a member of the support team)
            `,
              color: COLORS.MAIN,
              footer: { text: `ID: ${member.id}` },
              timestamp: new Date()
            }]
          });
          await member.kick(`Nitro Boost expired in ${mainGuild}`);
          await asyncRedisFunctions(redis).delAsync(REDIS_KEY(member));
          console.log(`Successfully kicked ${member.user.tag} (${member.id}) from ${devGuild} (${devGuild.id})`);
        } catch (e) {
          if (e.message === 'Unknown Member') {
            await asyncRedisFunctions(redis).delAsync(REDIS_KEY(id));
            return;
          }
          return console.error(e);
        }
      }
    }
  }, null, true, 'America/New_York');
};

export const queueAllPendingRemovals = async (redis: any, client: Client): Promise<void> => {
  try {
    console.log('Queueing all pending member removals from cache...');
    const allCachedRemovals = await asyncRedisFunctions(redis).keysAsync('boosters:*');
    if (allCachedRemovals.length > 0) {
      const members = allCachedRemovals.map(key => key.split(':')[1]);
      for (const key of members) {
        const data = await asyncRedisFunctions(redis).getAsync(REDIS_KEY(key)).then(d => {
          if (d) return JSON.parse(d) as MemberData;
        });
        client.pendingRemovals.set(key, data);
      }
      console.log(`"${client.pendingRemovals.size}" member(s) set to be kicked from the development server...`);
    } else {
      console.log('No pending removals in the cache...');
    }
  } catch (e) {
    return console.error(e);
  }
};
