export type StatKey = 'vit' | 'mana' | 'int' | 'cha' | 'fame' | 'luck';
export type Stats = Record<StatKey, number>;

export type Focus = 'train' | 'study' | 'social' | 'explore';
export type RelKey = 'friend' | 'rival' | 'mentor' | 'spouse';

export interface Relation {
  name: string;
  affection: number;
}

export type Tone = 'normal' | 'good' | 'bad' | 'milestone' | 'death';

export interface LogEntry {
  age: number;
  text: string;
  tone: Tone;
}

export interface Death {
  causeId: string;
  age: number;
}

/** 한 번의 삶. 순수 JSON 이어야 한다 (localStorage 저장). */
export interface LifeState {
  name: string;
  age: number;
  houseId: string;
  cheatId: string;
  stats: Stats;
  karma: number;
  flags: string[];
  seen: string[];
  rels: Partial<Record<RelKey, Relation>>;
  jobId: string | null;
  jobRank: number;
  focus: Focus;
  log: LogEntry[];
  pendingEventId: string | null;
  /** 올해 일어난 사건 (장면 연출용). 예전 저장 데이터에는 없을 수 있다 */
  lastEventId?: string | null;
  extraLives: number;
  death: Death | null;
  /** 이번 생의 목표 id (예전 저장에는 없을 수 있다) */
  goals?: string[];
  /** 남은 판정 되돌리기 횟수 */
  rerolls?: number;
  /** 이번 생에 만난 고정 캐릭터 */
  npcMet?: string[];
  /** 지난 생들에서 고정 캐릭터를 만난 횟수 (생성 시 메타에서 복사) */
  npcPast?: Record<string, number>;
  /** 몇 번째 삶인지 (1부터) */
  lifeNo?: number;
  /** 운명에 맡겨 태어났는가 */
  fated?: boolean;
}

/** 사건/선택지가 나타나기 위한 조건. 명시된 항목은 모두 만족해야 한다. */
export interface Cond {
  minAge?: number;
  maxAge?: number;
  houses?: string[];
  notHouses?: string[];
  cheats?: string[];
  jobs?: (string | null)[];
  notJobs?: (string | null)[];
  flags?: string[];
  notFlags?: string[];
  /** 능력치 최소값 */
  stats?: Partial<Stats>;
  /** 능력치 최대값 */
  maxStats?: Partial<Stats>;
  karmaMin?: number;
  karmaMax?: number;
  hasRel?: RelKey[];
  notRel?: RelKey[];
  relMin?: Partial<Record<RelKey, number>>;
  relMax?: Partial<Record<RelKey, number>>;
  minJobRank?: number;
  maxJobRank?: number;
  test?: (s: LifeState) => boolean;
}

export interface Effect {
  stats?: Partial<Stats>;
  karma?: number;
  /** 호감도 변화 */
  rel?: Partial<Record<RelKey, number>>;
  /** 새 인연 생성 (이름은 무작위) */
  addRel?: RelKey;
  /** 기존 인연을 반려로 (예: 소꿉친구와 결혼) */
  promoteToSpouse?: RelKey;
  removeRel?: RelKey[];
  flags?: string[];
  unflags?: string[];
  job?: string;
  jobRank?: number;
  death?: string;
  /** 고정 캐릭터를 만났다고 기록 */
  meet?: string;
  /** 이 효과로 체력이 0이 되었을 때의 사인 (기본: illness) */
  zeroCause?: string;
}

export interface Outcome {
  /** 효과 적용 후에 렌더링된다 */
  text: Text;
  effect?: Effect;
  tone?: Tone;
}

export interface Check {
  stat: StatKey;
  dc: number;
}

export interface Resolution {
  check?: Check;
  success: Outcome;
  /** check 실패 시. check 가 있으면 필수 */
  fail?: Outcome;
}

export interface Choice extends Resolution {
  label: string;
  cond?: Cond;
}

export type Text = string | ((s: LifeState) => string);

export interface GameEvent {
  id: string;
  title: string;
  cond: Cond;
  text: Text;
  /** 이정표: 조건이 맞으면 무작위 사건보다 우선하여 반드시 발생 (1회) */
  milestone?: boolean;
  /** 한 삶에서 한 번만 */
  once?: boolean;
  weight?: number;
  /** 해당 방침일 때 가중치 ×3 */
  focus?: Focus;
  choices?: Choice[];
  /** 선택지 없는 자동 사건 */
  auto?: Resolution;
}

export interface House {
  id: string;
  name: string;
  desc: string;
  stats: Partial<Stats>;
  karma?: number;
  flags?: string[];
  /** 매년 성장 보너스 */
  growth?: Partial<Stats>;
  /** 운명 모드에서 이 출신으로 태어날 상대 확률 (인구 비중) */
  weight: number;
  /** 노화 속도 배율 (엘프는 느리다) */
  agingMul?: number;
}

export interface Cheat {
  id: string;
  name: string;
  desc: string;
  stats?: Partial<Stats>;
  /** 성장 배율 (능력치별) */
  growthMul?: Partial<Stats>;
  /** 판정 보너스 (능력치별) */
  checkBonus?: Partial<Stats>;
  relMul?: number;
  extraLives?: number;
  showAffection?: boolean;
  /** 선택지 성공률을 보여준다 */
  showChance?: boolean;
  /** 실패한 판정을 다시 굴릴 수 있는 횟수 (한 생에) */
  rerolls?: number;
  /** 노화 속도 배율 */
  agingMul?: number;
  /** 운명 모드에서 뽑힐 상대 확률 */
  weight: number;
}

export interface Job {
  id: string;
  name: string;
  /** 직급별 칭호 (index 1~5) */
  ranks: string[];
  /** 승진 판정에 쓰는 주 능력치 */
  primary: StatKey;
  passive: Partial<Stats>;
  desc: string;
}

export interface DeathDef {
  id: string;
  name: string;
  hint: string;
  epitaph: string;
}

export interface MetaSave {
  version: 1;
  soulStones: number;
  unlocked: string[];
  upgrades: Record<string, number>;
  codex: Record<string, number>;
  lives: PastLife[];
  totalLives: number;
  /** 고정 캐릭터를 만난 생의 수 */
  npcMet?: Record<string, number>;
}

export interface PastLife {
  name: string;
  age: number;
  houseId: string;
  title: string;
  causeId: string;
  stones: number;
  goalsDone?: number;
}
