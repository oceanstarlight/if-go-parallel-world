import type { GameEvent } from '../../types';
import { CHILDHOOD } from './childhood';
import { YOUTH } from './youth';
import { ADULT } from './adult';
import { CAREER } from './career';
import { NPC_EVENTS } from './npc';
import { BLOW_EVENTS, DESTINY_EVENTS } from './destiny';
import { LEGEND_EVENTS } from './legend';
import { ARC_EVENTS } from './arcs';
import { BRANCH_EVENTS } from './branch';
import { CHAIN_EVENTS } from './chains';
import { STAT_EVENTS } from './stats';
import { WORLD_EVENTS } from './world';

/** 이정표는 배열 순서대로 우선 판정된다 */
export const ALL_EVENTS: GameEvent[] = [...WORLD_EVENTS, ...CHILDHOOD, ...YOUTH, ...CAREER, ...ADULT, ...NPC_EVENTS, ...DESTINY_EVENTS, ...BLOW_EVENTS, ...LEGEND_EVENTS, ...ARC_EVENTS, ...BRANCH_EVENTS, ...CHAIN_EVENTS, ...STAT_EVENTS];

const BY_ID = new Map(ALL_EVENTS.map((e) => [e.id, e]));
export const eventById = (id: string) => BY_ID.get(id);
