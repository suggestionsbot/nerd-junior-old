import { Client, GuildMember, Intents, TextChannel } from 'discord.js';
import { inspect } from 'util';
import { createClient } from 'redis';
import { oneLine, stripIndents } from 'common-tags';

import dotenv from 'dotenv-flow';
dotenv.config();

import {
  asyncRedisFunctions,
  boosterExpirationJob,
  clean,
  errorMessage,
  queueAllPendingRemovals,
  successMessage
} from './functions';
import { MemberData } from './types';
import {
  BOOSTER_ROLE, BOOSTERS_CHANNEL,
  COLORS,
  DA_NERDS_DEV, DEFAULT_TIME, DEV_GUILD,
  MAIN_GUILD,
  MAIN_GUILD_INVITE, MINIMUM_PERMISSIONS, NO_LONGER_SUPPORTER, OWNER, PERMISSIONS,
  REDIS_KEY, SUPPORTER_ROLE,
  TRUSTED_ROLES_MAIN
} from './config';

const redis = createClient({
  host: process.env.REDIS_HOSTNAME,
  password: process.env.REDIS_PASSWORD,
  port: parseInt(process.env.REDIS_PORT)
});

const client = new Client({ disableMentions: 'everyone', ws: { intents: Intents.ALL} });

client.on('ready', async () => {
  try {
    console.log(`Logged in as ${client.user.tag} (${client.user.id})!`);
    await client.user.setActivity('the boosters', { type: 'WATCHING' });
    client.pendingRemovals = new Map<string, MemberData>();
    await queueAllPendingRemovals(redis, client);
    boosterExpirationJob(redis, client).start();
  } catch (e) {
    console.error(e);
  }
});

client.on('message', async message => {
  if (!message.guild) return;
  if (message.author.id !== OWNER) return;

  const PREFIXES = ['\\%', `^<@!?${client.user.id}> `];
  const prefixRegex = new RegExp(`(${PREFIXES.join('|')})`);
  const prefix = message.content.match(prefixRegex);

  if (message.author.bot) return;
  if (!prefix) return;
  if (message.content.indexOf(prefix[0]) !== 0) return;

  const args = message.content.slice(prefix[0].length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  if (!command) return;

  const missingPermissions = (message.channel as TextChannel).permissionsFor(client.user).missing(MINIMUM_PERMISSIONS);
  if (missingPermissions.length > 0) {
    return message.channel.send(stripIndents`I am missing these permissions in the ${message.channel} channel! Make sure I have them: 
      ${missingPermissions.length > 1 ? missingPermissions.map(p => `\`${PERMISSIONS[p]}\``).join(', ') : 
    `\`${PERMISSIONS[missingPermissions[0]]}\``}
    `);
  }

  switch (command) {
    // This command is pretty self explanatory
    case 'ping': {
      try {
        const msg = await message.channel.send('🏓 Ping!');
        msg.edit(`Pong! Round trip took \`${msg.createdTimestamp - message.createdTimestamp}ms\`.`);
      } catch (e) {
        console.error(e);
        return errorMessage(message.channel as TextChannel, `An error has occurred: **${e.message}**`);
      }

      break;
    }
    // This command is pretty self explanatory
    case 'eval': {
      try {
        const code = args.join(' ');
        if (!code)
          return errorMessage(message.channel as TextChannel, 'Missing the string to evaluate.');

        let evaled = eval(code);
        if (typeof evaled !== 'string') evaled = inspect(evaled);
        const cleaned = await clean(client, evaled);

        await message.channel.send(cleaned, { code: 'xl' });
      } catch (err) {
        return errorMessage(message.channel as TextChannel, `\`ERROR\` \`\`\`xl\n${err}\n\`\`\``);
      }

      break;
    }
    // In the event of a bot restart or crash, this command allows to force update the status of a user
    case 'forceupdate': {
      const updateUser = message.mentions.users.first() || (client.users.cache.get(args[0]?.trim() ?? null) ??
          await client.users.fetch(args[0]?.trim() ?? null)
            .catch(e => {
              errorMessage(message.channel as TextChannel, e.message);
              return;
            }));

      if (!updateUser && !args[0]?.trim())
        return errorMessage(message.channel as TextChannel, 'Please provide a user to forcefully update.');

      if (!updateUser)
        return errorMessage(message.channel as TextChannel, `\`${args[0]}\` is not a valid user!`);

      const [devGuild, boosterGuild] = [DEV_GUILD, MAIN_GUILD].map(g => client.guilds.cache.get(g));
      const devGuildMemberRole = devGuild.roles.cache.get(DA_NERDS_DEV);

      try {
        const boosterMember = await boosterGuild.members.fetch(updateUser.id);
        const devGuildMember = await devGuild.members.fetch(updateUser.id);
        const [hasBoosterRole, hasSupporterRole] = [BOOSTER_ROLE, SUPPORTER_ROLE].map(id => boosterMember.roles.cache.has(id));
        const hasDevGuildMemberRole = devGuildMember.roles.cache.has(devGuildMemberRole.id);
        const isInATrustedRole = boosterMember.roles.cache.some(r => TRUSTED_ROLES_MAIN.includes(r.id));

        // This is for if the member is no longer a supporter, but checks if they have the member role or not in the dev server
        if (
          (!hasBoosterRole && !isInATrustedRole && !hasSupporterRole) ||
            (!hasBoosterRole && !isInATrustedRole && !hasSupporterRole && !hasDevGuildMemberRole)
        ) {
          await boosterMember.send({ embed: NO_LONGER_SUPPORTER(boosterMember, boosterGuild, devGuild) });
          await devGuildMember.kick(`Removed from the Supporter role in ${boosterGuild}`);
          console.log(`Successfully kicked ${boosterMember.user.tag} (${boosterMember.id}) from ${devGuild} (${devGuild.id})`);
          return successMessage(message.channel as TextChannel,
            `Successfully kicked **${boosterMember.user.tag}** (\`${boosterMember.id}\`) from **${devGuild}** (\`${devGuild.id}\`)`);
        }

        // This is for if the member is no longer a booster, but checks if they have the member role or not in the dev server
        if (
          (!hasBoosterRole && !isInATrustedRole && hasDevGuildMemberRole) ||
            (!hasBoosterRole && !isInATrustedRole && !hasDevGuildMemberRole)
        ) {
          const ifMemberExistsInCache = await asyncRedisFunctions(redis).getAsync(REDIS_KEY(boosterMember)).then(d => JSON.parse(d));
          if (ifMemberExistsInCache) {
            await asyncRedisFunctions(redis).delAsync(REDIS_KEY(boosterMember));
            console.log(`Cleared ${updateUser.tag} (${updateUser.id}) from the cache.`);
          }

          await boosterMember.send({
            embed: {
              author: {
                name: boosterMember.user.tag,
                url: boosterMember.user.avatarURL()
              },
              description: stripIndents`
              You no longer have the Nitro Booster role in **${boosterGuild}**. You will now be removed from **${devGuild}**.
              
              You are free to renew your boost in **${boosterGuild}** at anytime to regain access to your benefits including access to the **${devGuild}** guild!
              
              Invite: ${MAIN_GUILD_INVITE}
              
              (If you believe this is a mistake, please contact a member of the support team)
              `,
              color: COLORS.MAIN,
              footer: { text: `This was a force-update by ${message.author.tag}` },
              timestamp: new Date()
            }
          });

          await devGuildMember.kick(`Force update by ${message.author.tag} [${message.author.id}]`);
          console.log(`${updateUser.tag} (${updateUser.id}) removed from ${devGuild} by ${message.author.tag}`);

          return successMessage(message.channel as TextChannel,
            oneLine`**${updateUser.tag}** has been successfully removed from **${devGuild.name}** by 
                **${message.author.tag}** \`[${message.author.id}]\``);
        }

        // This is for if the member is a booster or supporter, but doesn't have the member role in the dev server
        if ((hasBoosterRole || hasSupporterRole || isInATrustedRole) && !hasDevGuildMemberRole) {
          await devGuildMember.roles.add(devGuildMemberRole,
            `Force-update by ${message.author.tag} [${message.author.id}]`);
          return successMessage(message.channel as TextChannel,
            oneLine`**${updateUser.tag}** has been added to the **${devGuildMemberRole.name}** role in **${devGuild}** 
                by **${message.author.tag}** \`[(${message.author.id})]\``);
        }

        // This is for if the member is a booster or supporter and has the member role in the dev server
        if ((hasBoosterRole || hasSupporterRole || isInATrustedRole) && hasDevGuildMemberRole)
          return errorMessage(message.channel as TextChannel,
            `**${updateUser.tag}** is already authorized in **${devGuild.name}**.`);
      } catch (error) {
        if (error.message === 'Unknown Member')
          return errorMessage(message.channel as TextChannel,
            `**${updateUser.tag}** is not a member of **${devGuild.name}**.`);

        if (error.message === 'Missing Permissions') return errorMessage(message.channel as TextChannel,
          `Could not kick **${updateUser.tag}** as I am lacking the permissions to do so!`);

        if (error.message === 'Cannot send messages to this user') return;

        console.error(error.stack);
        return errorMessage(message.channel as TextChannel, `An error occurred: **${error.message}**`);
      }
    }
  }
});

client.on('guildMemberAdd', async member => {
  try {
    const boosterGuild = client.guilds.cache.get(MAIN_GUILD);
    const boosterMember = boosterGuild.members.cache.get(member.id) ?? await boosterGuild.members.fetch(member.id);
    const [hasBoosterRole, hasSupporterRole] = [BOOSTER_ROLE, SUPPORTER_ROLE].map(id => boosterMember.roles.cache.has(id));
    const isInATrustedRole = boosterMember.roles.cache.some(r => TRUSTED_ROLES_MAIN.includes(r.id));

    // We only want the code below to apply in Suggestions Development
    if (member.guild.id === MAIN_GUILD) return;
    if (member.user.bot) return;
    if (isInATrustedRole) return await member.roles.add(DA_NERDS_DEV).catch(console.error);

    if (!hasBoosterRole && !hasSupporterRole) {
      if (member.kickable) {
        await member.send({
          embed: {
            author: {
              name: member.user.tag,
              url: member.user.avatarURL()
            },
            description: stripIndents`
              You do not have the Nitro Booster role or Supporter role in **${boosterGuild}** or you're not in a trusted role.
              
              To gain access to this server, you must be a booster in **${boosterGuild}** \`[${boosterGuild.id}]\`.
              **Invite:** ${MAIN_GUILD_INVITE}
              (If you believe this is a mistake, please contact a member of the support team)
            `,
            color: COLORS.MAIN,
            footer: { text: `ID: ${member.id}` },
            timestamp: new Date()
          }
        });
        await member.kick(`Not a Nitro Booster, Supporter or trusted member in ${boosterGuild}`);
        return;
      }
    }

  } catch (error) {
    console.error(error);
  }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const [boosterGuild, devGuild] = [MAIN_GUILD, DEV_GUILD].map(id => client.guilds.cache.get(id));
  const oldBoosterMember = oldMember.partial ? await boosterGuild.members.fetch(oldMember.id) : <GuildMember>oldMember;
  const newBoosterMember = newMember.partial ? await boosterGuild.members.fetch(newMember.id) : <GuildMember>newMember;
  const [newHasBoosterRole, newHasSupporterRole] = [BOOSTER_ROLE, SUPPORTER_ROLE]
    .map(id => newBoosterMember.roles.cache.has(id));
  const [oldHasBoosterRole, oldHasSupporterRole] = [BOOSTER_ROLE, SUPPORTER_ROLE]
    .map(id => oldBoosterMember.roles.cache.has(id));
  const isInATrustedRole = newBoosterMember.roles.cache.some(r => TRUSTED_ROLES_MAIN.includes(r.id));

  if (isInATrustedRole) return;
  // Delays the code below from executing when a new member joins because it'll try to execute the rest of the code
  if (newBoosterMember.joinedTimestamp > (newBoosterMember.joinedTimestamp + (10 * 1000))) return;
  if (newBoosterMember.user.bot) return;

  if (oldHasBoosterRole && !newHasBoosterRole) {
    try {
      await newBoosterMember.send({
        embed: {
          author: {
            name: newBoosterMember.user.tag,
            url: newBoosterMember.user.avatarURL()
          },
          description: stripIndents`
            You no longer have the Nitro Booster role in **${boosterGuild}**. ${await devGuild.members.cache.has(oldMember.id) ? `You will be removed from **${devGuild}**` : 'You will lose your benefits'} in **24 hours** if you don't re-boost in **${boosterGuild}**.
          
            (If you believe this is a mistake, please contact a member of the support team)
          `,
          color: COLORS.MAIN,
          footer: { text: `ID: ${newBoosterMember.id}` },
          timestamp: new Date()
        }
      });

      const data: MemberData = { expires: Date.now() + DEFAULT_TIME };
      await asyncRedisFunctions(redis).setAsync(REDIS_KEY(newBoosterMember), JSON.stringify(data));
      client.pendingRemovals.set(newBoosterMember.id, data);
    } catch (error) {
      if (error.message === 'Unknown Member') return;
    }
  }

  if (!oldHasBoosterRole && newHasBoosterRole) {
    await newBoosterMember.send({
      embed: {
        author: {
          name: newBoosterMember.user.tag,
          url: newBoosterMember.user.avatarURL()
        },
        description: stripIndents`
            Thank you for boosting in **${boosterGuild}**! You have been granted various perks that are described in <#${BOOSTERS_CHANNEL}>! Please make sure to read it to also get information on joining the boosters only development server.
          
            (If you believe this is a mistake, please contact a member of the support team)
          `,
        color: COLORS.MAIN,
        footer: { text: `ID: ${newBoosterMember.id}` },
        timestamp: new Date()
      }
    });

    await asyncRedisFunctions(redis).delAsync(REDIS_KEY(newBoosterMember));
    client.pendingRemovals.delete(newBoosterMember.id);
  }

  if (oldHasSupporterRole && !newHasSupporterRole && !oldHasBoosterRole && !newHasBoosterRole) {
    try {
      await newBoosterMember.send({ embed: NO_LONGER_SUPPORTER(newBoosterMember, boosterGuild, devGuild) });
      await newBoosterMember.kick(`Removed from the Supporter role in ${boosterGuild}`);
      console.log(`Successfully kicked ${newBoosterMember.user.tag} (${newBoosterMember.id}) from ${devGuild} (${devGuild.id})`);
    } catch (error) {
      if (error.message === 'Unknown Member') return;
    }
  }
});

const main = async (): Promise<boolean> => {
  try {
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
