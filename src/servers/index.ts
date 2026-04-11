import { Server } from '@/services';
import { Snowflake } from 'discord.js';

export const servers = new Map<Snowflake, Server>();
