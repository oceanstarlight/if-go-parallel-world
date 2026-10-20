export type StatKey = 'vit' | 'mana' | 'int' | 'cha' | 'fame' | 'luck';
export type Stats = Record<StatKey, number>;

export type Focus = 'train' | 'study' | 'social' | 'explore' | 'rest';
/** 기분: 방침별 성장 배율과 초상화 표정에 반영된다 */
export type MoodKey = 'calm' | 'joy' | 'gloom' | 'anger' | 'fear';
export type RelKey = 'friend' | 'rival' | 'mentor' | 'spouse';

export interface Relation {
  name: string;
  affection: number;
  /** 'm' | 'f' (예전 저장 데이터에는 없을 수 있다) */
  gender?: 'm' | 'f';
}

export type Tone = 'normal' | 'good' | 'bad' | 'milestone' | 'death';

export interface LogEntry {
  age: number;
  /** 몇 월의 일인가 (1~12). 예전 기록에는 없다 */
  m?: number;
  text: string;
  tone: Tone;
}

/** 한 생의 기록 (사망 화면에서 보여준다) */
export interface LifeRecord {
  /** 사건 전투 횟수 · 승리 횟수 */
  battles: number;
  wins: number;
  /** 사건 전투 상대별 횟수 */
  foes: Record<string, number>;
  /** 던전에서 쓰러뜨린 마물 · 보스 */
  slain: Record<string, number>;
  bosses: Record<string, number>;
  dives: number;
  /** 가장 깊이 내려간 계층 */
  maxFloor: number;
  /** 번 돈 · 쓴 돈 */
  earned: number;
  spent: number;
  /** 겪은 사건 수 */
  events: number;
  /** 죽을 뻔한 일 (사인 id) */
  nearDeaths: string[];
  /** 거쳐 간 직업 */
  jobs: string[];
  /** 던전에서 주운 물건 수 */
  loot: number;
}

export interface Death {
  causeId: string;
  age: number;
}

/** 한 번의 삶. 순수 JSON 이어야 한다 (localStorage 저장). */
export interface LifeState {
  name: string;
  /** 성별 'm' | 'f' (예전 저장 데이터에는 없을 수 있다 → 이름으로 짐작) */
  gender?: 'm' | 'f';
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
  /** 이번 생에 만난 고정 캐릭터 */
  npcMet?: string[];
  /** 지난 생들에서 고정 캐릭터를 만난 횟수 (생성 시 메타에서 복사) */
  npcPast?: Record<string, number>;
  /** 몇 번째 삶인지 (1부터) */
  lifeNo?: number;
  /** 운명에 맡겨 태어났는가 */
  fated?: boolean;
  /** 타고난 특성 id (0~2개) */
  traits?: string[];
  /** 스트레스 0~100. 높으면 성장이 떨어지고 과로로 쓰러진다 */
  stress?: number;
  /** 기분 */
  mood?: MoodKey;
  /** 의지력 0~100. 숙명을 거스르는 선택에 쓴다 */
  will?: number;
  /** 방침 고정: 켜면 매년 방침을 묻지 않고 같은 방침으로 넘어간다 */
  focusLocked?: boolean;
  /** 직전 해의 방침 (같은 방침을 반복하면 스트레스가 더 쌓인다) */
  prevFocus?: Focus;
  /** 전설이 된 전생들 (생성 시 메타에서 복사) */
  legends?: Legend[];

  // ── 경제 · 던전 (v0.7) ──
  /** 골드. 마이너스면 빚 */
  gold?: number;
  /** 작년 순수입 (UI 표시용) */
  lastIncome?: number;
  /** 가방 */
  bag?: Item[];
  /** 장착 중인 장비 */
  equip?: { weapon?: Item | null; armor?: Item | null; trinkets?: Item[] };
  /** 상점에서 산 영구 소유물 (집, 농지, 말 …) */
  owned?: string[];
  /** 던전 HP (한 해가 지나면 가득 찬다) */
  hp?: number;
  /** 이번 생에 클리어한 가장 깊은 5층 단위 지점 */
  dgBest?: number;
  /** 진행 중인 던전 원정 (던전 화면에서만) */
  dive?: Dive | null;
  /** 도둑질로 붙잡힌 횟수 */
  caught?: number;

  // ── 시간 · 중상 · 기록 (v1.0) ──
  /** 올해 지난 달 수 (0~11). 0이면 새해를 시작할 차례 */
  month?: number;
  /** 한 해 기록(YEAR_NOTES)별로 마지막에 남긴 나이 */
  notesAt?: Record<string, number>;
  /** 사건별로 마지막에 겪은 나이 (반복 쿨다운) */
  seenAt?: Record<string, number>;
  /** 올해 일어난 사건 수 */
  yearEvents?: number;
  /** 올해 수입 (해가 끝나면 lastIncome 으로) */
  yearIncome?: number;
  /** 이번 달 들어온 돈 (UI 팝업용) */
  lastPay?: number;
  /** 중상 횟수. 3번째에는 죽는다 */
  injuries?: number;
  /** 요양 남은 달 수 */
  recover?: number;
  /** 던전에서 한 번 쓰러진 적이 있다 (다음에 쓰러지면 진짜 죽음) */
  dgFallen?: boolean;
  /** 이 나이부터 던전에 다시 들어갈 수 있다 */
  dgBanUntil?: number;
  /** 이 나이부터 던전에 다시 들어갈 수 있다 (2년에 한 번) */
  dgNextAge?: number;
  /** 던전에 다시 들어갈 수 있다고 알렸다 */
  dgNotified?: boolean;
  /** UI 에 한 번 띄울 알림 */
  toast?: string | null;
  /** 던전의 악몽: 남은 달 동안 스트레스가 100으로 묶인다 */
  trauma?: number;
  /** 방금 입은 중상 (사건 결과 문장 뒤에 알린다) */
  pendingInjury?: string | null;
  record?: LifeRecord;
}

export type ItemKind = 'weapon' | 'armor' | 'loot' | 'potion' | 'trinket';
export type Rarity = 'common' | 'rare' | 'epic' | 'legend';

/** 가방에 들어가는 물건. 순수 JSON */
export interface Item {
  /** 고유 번호 (같은 물건 여러 개 구분) */
  uid: number;
  /** 원형 id (상점 품목 또는 루트 테이블) */
  base: string;
  name: string;
  kind: ItemKind;
  rarity: Rarity;
  /** 무기 공격력 / 방어구 방어력 / 회복량 */
  power: number;
  /** 상점에 팔 때 받는 값 */
  value: number;
  /** 장신구가 올려 주는 능력치 */
  stats?: Partial<Stats>;
}

/** 던전 원정 한 번의 상태 */
export interface Dive {
  /** 지금 서 있는 계층 (5의 배수 지점) */
  floor: number;
  /** 이번 원정에서 주운 것 (귀환해야 가방에 들어간다) */
  loot: Item[];
  /** 이번 원정 기록 */
  log: { text: string; tone: Tone }[];
  /** 이번 원정에서 얻은 골드 */
  gold: number;
  /** 방금 끝난 구간 결과 */
  last?: 'cleared' | 'fled' | null;
  /** 쓰러져서 모든 것을 잃었다 (지상으로 돌아갈 일만 남았다) */
  fallen?: boolean;
  /** 이번 구간에서 지나온 마지막 층 (마물과 싸우느라 멈췄던 곳) */
  cursor?: number;
  /** 길을 막은 마물 (턴제 전투 대기) */
  mob?: { floor: number; name: string; ep: number } | null;
  /** 보스 방 앞에 섰다 (가방을 점검하고 도전) */
  atBoss?: boolean;
}

/** 다음 생에 전해지는 전생의 이야기 */
export interface Legend {
  name: string;
  deed: string;
  kind: 'hero' | 'villain' | 'ghost' | 'sage';
  houseId: string;
  age: number;
  lifeNo: number;
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
  traits?: string[];
  notTraits?: string[];
  goldMin?: number;
  goldMax?: number;
  /** 상점 소유물 */
  owns?: string[];
  /** 주인공 성별 */
  gender?: 'm' | 'f';
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
  mood?: MoodKey;
  stress?: number;
  will?: number;
  /** 불굴 목숨 증감 */
  extraLives?: number;
  /** 골드 증감 */
  gold?: number;
  /** 가진 골드(양수일 때)의 비율만큼 증감. 0.5 = +50%, -1 = 전부 잃음 */
  goldPct?: number;
  /** goldPct 로 늘어나는 돈의 상한 (복리로 끝없이 불어나지 않게) */
  goldCap?: number;
  /** 골드를 이 값으로 (파산 등) */
  goldSet?: number;
  /** 도둑질로 붙잡힘: 재산 몰수, 세 번째면 교수대 */
  caught?: boolean;
  /** 상점 소유물을 얻는다 */
  own?: string;
  /** 장신구를 얻는다: 원형 id(TRINKETS) 또는 주 능력치, 희귀도 */
  trinket?: { base?: string; stat?: StatKey; rarity?: Rarity };
  /** 장비·물약을 가방에 넣는다 (base: src/data/items.ts, name 으로 이름만 바꿀 수 있다) */
  item?: { base: string; rarity?: Rarity; name?: string };
  /** gold 가 음수일 때 가진 돈보다 많이 잃어 빚이 될 수 있다 (빚 투자 같은 사건만) */
  debt?: boolean;
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
  /** 의지력 비용. 모자라면 선택지가 잠긴다 */
  will?: number;
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
  /** 인생 트리의 가지 노드. 그 가지에 있을 때만 일어난다 */
  branch?: string;
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
  /** 시작 골드 */
  gold?: number;
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
  /** 직급별 연간 수입 (index 1~5) */
  income: number[];
  /** 전투력 보너스 (직급당) */
  combat?: number;
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
  /** 전설이 된 전생들 (최근 순) */
  legends?: Legend[];
}

export interface PastLife {
  name: string;
  age: number;
  houseId: string;
  title: string;
  causeId: string;
  stones: number;
  goalsDone?: number;
  /** 전설로 남은 업적 */
  deed?: string;
}

/** 타고난 특성 (Rogue Legacy 의 유전 특성) */
export interface Trait {
  id: string;
  name: string;
  desc: string;
  /** 1 흔함 · 2 드묾 · 3 희귀 */
  rarity: 1 | 2 | 3;
  stats?: Partial<Stats>;
  checkBonus?: Partial<Stats>;
  growthMul?: Partial<Stats>;
  /** 방침별 성장 배율 */
  focusMul?: Partial<Record<Focus, number>>;
  stressMul?: number;
  will?: number;
  agingMul?: number;
  extraLives?: number;
  /** 사건 발생률 배율 */
  eventRate?: number;
  /** 함께 가질 수 없는 특성 */
  conflicts?: string[];
}
