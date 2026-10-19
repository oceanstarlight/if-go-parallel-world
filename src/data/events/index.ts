import type { GameEvent } from '../../types';
import { CHILDHOOD } from './childhood';
import { YOUTH } from './youth';
import { ADULT } from './adult';
import { CAREER } from './career';

/** 이정표는 배열 순서대로 우선 판정된다 */
export const ALL_EVENTS: GameEvent[] = [...CHILDHOOD, ...YOUTH, ...CAREER, ...ADULT];

const BY_ID = new Map(ALL_EVENTS.map((e) => [e.id, e]));
export const eventById = (id: string) => BY_ID.get(id);
