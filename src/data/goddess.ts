import type { LifeState } from '../types';

/**
 * 환생의 여신이 방금 끝난 삶에 건네는 한마디 (Hades 의 사망 리액션).
 * 사인별 대사 + 나이·전생 횟수·같은 죽음 반복에 따른 대사를 섞는다.
 */
const BY_CAUSE: Record<string, string[]> = {
  old_age: ['수고했어. 정말 오래 살았네! 주름살도 귀여웠어♪', '천수를 누렸구나. 이런 엔딩, 여신으로서 제일 좋아해.'],
  illness: ['아팠지? 다음 생엔 튼튼한 몸으로 보내줄게… 아마도.', '이세계에도 감기약이 있으면 좋을 텐데. 내가 건의해 볼게.'],
  plague: ['손 씻으라고 했잖아! …아, 그건 전전생 얘기였나?'],
  famine: ['배고팠지… 여기 여신 특제 쿠키 하나 먹고 가.'],
  mana_overload: ['펑! 하늘에서 불꽃놀이가 보였어. 너였구나? 예쁘긴 했어.', '치트를 너무 세게 줬나… 미안미안, 조절이 어려워서.'],
  carriage: ['또 마차야?! 이세계 트럭의 전통은 대체 누가 만든 거야?', '길 건널 땐 좌우를 보자. 여신과의 약속~'],
  assassination: ['독이 든 와인… 귀족 식탁은 진짜 하드 모드라니까.'],
  duel: ['라이벌한테 졌어? 괜찮아, 다음 생에서 리벤지하면 돼!'],
  war: ['용감했어. 훈장은 내가 대신 받아둘게.'],
  dungeon: ['보스 방 앞에선 세이브! 몇 번을 말해야 알아들을래~?', '던전 최하층은 아직 무리였나 봐. 레벨 업 하고 다시 와.'],
  bandits: ['도적 A한테 당하다니… 여신 체면이 안 서잖아!'],
  dragon: ['드래곤이랑 맞짱을 떴다고?! 바삭하게 구워졌지만, 멋있었어.', '탄 냄새가 여기까지 났어. 다음엔 방화 망토 챙겨.'],
  betrayal_party: ['동료를 너무 믿었구나. 착한 게 죄는 아니야.'],
  hero_framed: ['추방당하고 누명까지… 그런 장르, 요즘 유행이긴 해.'],
  yandere: ['그 아이의 사랑은… 음, 무거웠지. 다음엔 마음을 잘 살펴봐.'],
  heresy: ['시대를 너무 앞서갔어. 백 년만 늦게 태어났으면 위인이었을 텐데.'],
  experiment: ['그 문 너머 봤어? 나도 아직 못 봤는데! 뭐가 있었어?'],
  pact: ['계약서 약관은 끝까지 읽으라고 했지! 영혼 회수하느라 고생했어.'],
  demon_purge: ['정체가 들통났구나. 좋은 마족도 있다는 거, 나는 알아.'],
  demon_lord_slain: ['마왕다운 최후였어. 솔직히 망토 휘날리는 거 좀 멋있었어.'],
  hero_sacrifice: ['세계를 구했잖아…! 여신 업무 중 오늘이 제일 자랑스러워.'],
  overwork: ['쉬라고, 좀! 이세계까지 와서 과로사가 뭐야, 과로사가!', '다음 생엔 휴식도 좀 눌러줘. 여신의 진심 어린 부탁이야.'],
  abyss: ['그렇게 깊이까지 내려갔어? 무섭지도 않았어? …대단하다, 진짜.', '심연에서 건져오느라 혼났어. 다음엔 회복약 좀 챙겨!'],
  debt: ['빚은 이세계에서도 무서워… 다음 생엔 가계부 쓰는 법부터 알려줄게.'],
  gallows: ['훔치는 건 나빠! …근데 그 솜씨는 좀 아깝긴 했어.'],
  sacrifice: ['…멋있었어. 네가 지킨 그 사람, 오래오래 잘 살 거야.', '그 순간 망설이지 않았지. 그래서 너를 계속 다시 태어나게 하는 거야.'],
};

export interface GoddessContext {
  /** 방금 끝난 삶이 몇 번째인지 */
  lifeNo: number;
  /** 직전 생의 사인 (첫 생이면 없음) */
  prevCause?: string;
  /** 이 사인으로 죽은 횟수 (이번 포함) */
  causeCount: number;
}

export function goddessLines(s: LifeState, ctx: GoddessContext, rng: () => number = Math.random): string[] {
  const cause = s.death?.causeId ?? 'old_age';
  const pool = BY_CAUSE[cause] ?? BY_CAUSE.illness;
  const out = [pool[Math.floor(rng() * pool.length)]];
  if (ctx.prevCause === cause && cause !== 'old_age') out.unshift('…또 그걸로 죽었어? 진짜 두 번 연속이야?');
  else if (ctx.causeCount >= 3 && cause !== 'old_age') out.unshift(`이걸로 ${ctx.causeCount}번째야. 혹시 일부러 그러는 거 아니지?`);
  if (s.age < 10) out.push('그나저나 너무 빨리 왔잖아! 다음엔 좀 더 놀다 와.');
  else if (s.age >= 100) out.push('백 살 넘게 살다니, 여신 기록 갱신이야!');
  if (s.flags.includes('defied_fate')) out.push('정해진 운명을 거슬렀더라? 후후, 그런 영혼 좋아해.');
  if (ctx.lifeNo === 1) out.push('첫 번째 이세계 인생, 어땠어? 이제 시작이야!');
  else if (ctx.lifeNo % 10 === 0) out.push(`벌써 ${ctx.lifeNo}번째 인생이 끝났네. 우리 꽤 오래 알고 지냈다?`);
  return out;
}
