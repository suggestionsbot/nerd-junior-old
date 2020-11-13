import { GuildMember, PartialGuildMember } from 'discord.js';

export const PERMISSIONS = {
  'ADMINISTRATOR': 'Administrator',
  'CREATE_INSTANT_INVITE': 'Create Instant Invite',
  'KICK_MEMBERS': 'Kick Members',
  'BAN_MEMBERS': 'Ban Members',
  'MANAGE_CHANNELS': 'Manage Channels',
  'MANAGE_GUILD': 'Manage Server',
  'ADD_REACTIONS': 'Add Reactions',
  'VIEW_AUDIT_LOG': 'View Audit Log',
  'PRIORITY_SPEAKER': 'Priority Speaker',
  'STREAM': 'Video',
  'VIEW_CHANNEL': 'View Channels',
  'SEND_MESSAGES': 'Send Messages',
  'SEND_TTS_MESSAGES': 'Send TTS Messages',
  'MANAGE_MESSAGES': 'Manage Messages',
  'EMBED_LINKS': 'Embed Links',
  'ATTACH_FILES': 'Attach Files',
  'READ_MESSAGE_HISTORY': 'Read Message History',
  'MENTION_EVERYONE': 'Mention Everyone',
  'USE_EXTERNAL_EMOJIS': 'Use External Emojis',
  'VIEW_GUILD_INSIGHTS': 'View Guild Insights',
  'CONNECT': 'Connect',
  'SPEAK': 'Speak',
  'MUTE_MEMBERS': 'Mute Members',
  'DEAFEN_MEMBERS': 'Deafen Members',
  'MOVE_MEMBERS': 'Use (Move) Members',
  'USE_VAD': 'Use Voice Activity',
  'CHANGE_NICKNAME': 'Change Nickname',
  'MANAGE_NICKNAMES': 'Manage Nicknames',
  'MANAGE_ROLES': 'Manage Roles',
  'MANAGE_WEBHOOKS': 'Manage Webhooks',
  'MANAGE_EMOJIS': 'Mange Emojis'
};

export const COLORS = {
  MAIN: '#dd9323',
  SUCCESS: '#00e640',
  ERROR: '#cf000f'
};

export const OWNER = process.env.OWNER;
export const MAIN_GUILD_INVITE = 'https://discord.gg/ntXkRan';
export const REDIS_KEY = (member: GuildMember|PartialGuildMember|string): string => {
  return `boosters:${typeof member === 'object' ? member.id : member}`;
};
export const MINIMUM_PERMISSIONS = 268520450;

export const MAIN_GUILD = '601219766258106399'; // Suggestions
export const DEV_GUILD = '737166408525283348'; // Suggestions Development

export const BOOSTERS_CHANNEL = '737546937884213299';

export const BOOSTER_ROLE = '703785795483336766';
export const DA_NERDS_DEV = '737533643353751616';
// Developer, Staff Team, Support Team, Trusted
export const TRUSTED_ROLES_MAIN = ['601235098012090378', '602552757634859008', '605266299345698846', '629883041946533893'];
export const DEFAULT_TIME = '24h';
export const CRON_TIMER = '*/1 * * * *';
