# 사건 카드 작성 가이드

사건(이벤트) 카드를 추가하는 사람(또는 AI 세션)을 위한 규칙이다. 이 문서만 보고 사건을 쓸 수 있도록 정리했다.

## 0. 세계관 (v1.6 개편) — 먼저 읽는다

- **관점**: 전지적 1인칭. 주인공은 「나」다. `당신`은 쓰지 않는다. (예: 「나는 검을 뽑았다.」, 주어 생략도 된다)
- **한 생의 흐름** (수명은 50 남짓)

  | 나이 | 단계 | 사건이 하는 일 |
  |---|---|---|
  | 0~12 | 유년기 | 선택이 **재능**으로 쌓인다. 고른 능력치의 `stats` 보상이 그대로 재능 점수가 된다 → 12세 끝에 상위 1~2개 각성 |
  | 13~17 | 소년기 | 각성한 재능이 크게 자란다. 진로를 고민하는 사건 |
  | 18 | 성인식 | 에르시아 대마검사협회(엘프·슬라임은 숲의 정령)에서 등급 판정. 이후로는 +2등급까지만 오른다 |
  | 18~47 | 성인 | 직업을 중심으로 의뢰·모험·생활 |
  | 47~52 | 멸망 | 1년 전부터 하늘이 물들고, 멸망의 날이 온다 (엔진이 처리) |

- **능력치** (0~280, 40점마다 등급 F·E·D·C·B·A·S, 평균 C)
  - 등급 5개: `atk` 공격력 · `def` 방어력 · `mana` 마력 · `vit` 체력(최대 체력) · `int` 지능(치명타·피해 계수)
  - 숨은 3개: `cha` 매력 · `fame` 명성 · `luck` 행운
  - 특수 직업은 해당 능력치 D(81) 이상: 기사·용사 `atk`, 궁정 마법사·성직자 `mana`, 궁정 문관·상인 `int`, 마왕군 `mana` 또는 `atk`
- **멸망·진실 사건**(`src/data/events/world.ts`, `w_` 접두사)은 건드리지 않는다.

## 1. 지금 할 일 (우선순위)

1. **직업별 사건 묶음** — 직업이 생기면 그 직업의 사건이 4배 자주 나온다(`JOB_EVENT_MUL`). 그런데 직업마다 사건이 0~4개뿐이다.
   - 파일: `src/data/events/jobs/<직업 id>.ts` (예: `jobs/merchant.ts` → `export const MERCHANT_EVENTS`), `index.ts`의 `ALL_EVENTS`에 추가
   - 직업마다 **15개**, 모두 `cond: { jobs: ['<id>'] }`. 직급별로 나눠도 좋다 (`minJobRank`)
   - 주제

     | 직업 | 주제 |
     |---|---|
     | `merchant` 상인 | 돈: 거래·투자·흥정·상단·빚·사기 |
     | `adventurer` 모험가 | 전투: 의뢰·토벌·호위·파티·던전 소문 |
     | `mage` 궁정 마법사 | 왕실·마탑: 연구·궁정 의뢰·왕족·금지된 마법 |
     | `knight` 기사 | 전쟁·충성: 출정·결투·서임·호위 |
     | `court` 궁정 문관 | 정치: 암투·외교·세금·재판 |
     | `priest` 성직자 | 신앙: 치유·이단·순례·기적 |
     | `thief` 도둑 | 한탕: 잠입·장물·길드·추격 |
     | `farmer` 농부 | 땅: 수확·가뭄·장터·가축 |
     | `demon_officer` 마왕군 | 어둠: 작전·배신·용사와의 악연 |
     | `hero` 용사 | 여정: 마왕군·성검·민심 |

2. **공격력·방어력 사건** — 새 능력치라 키우는 사건이 없다. `atk` `def` 보상 사건을 유년·소년기에 각 6개 이상.
3. **1인칭 전환** — 기존 사건의 `당신`(133곳)을 「나」로 바꾸거나 주어를 생략한다. 조사도 맞춘다 (`당신을` → `나를`, `당신의` → `내`).

## 2. 어디에 쓰나

| 파일 | 내용 |
|---|---|
| `src/data/events/childhood.ts` | 0~12세 (`CHILDHOOD`) |
| `src/data/events/youth.ts` | 13~17세, 아카데미 (`YOUTH`) |
| `src/data/events/adult.ts` | 성인 일반 (`ADULT`) |
| `src/data/events/career.ts` | 직업별 (`CAREER`, `cond.jobs`) |
| `src/data/events/chains.ts` | 플래그로 이어지는 사슬 (`CHAIN_EVENTS`) |

새 파일을 만들면 `src/data/events/index.ts`의 `ALL_EVENTS`에 추가한다.

## 3. 형식

```ts
{
  id: 'c_lost_kitten',           // 유일. 접두사: c_ 유년 · y_ 소년 · a_ 성인 · e_ 직업 · 사슬은 주제명_
  title: '길 잃은 아기 고양이',
  weight: 1,                     // 기본 1. 흔한 일 1~2, 드문 일 0.3~0.6
  cond: { minAge: 4, maxAge: 12 },
  text: '비 오는 골목에서 작은 울음소리가 들린다. 상자 안에 젖은 아기 고양이가 떨고 있다.',
  choices: [
    { label: '품에 안고 집에 간다',
      success: { text: '엄마가 한숨을 쉬었지만, 결국 우유 한 접시를 내주었다.', effect: { karma: 4, stats: { cha: 2 } }, tone: 'good' } },
    { label: '이름을 지어 주고 매일 밥을 준다', check: { stat: 'luck', dc: 44 },
      success: { text: '「코코」는 동네 고양이 대장이 되었다!', effect: { stats: { luck: 4 }, own: 'cat' }, tone: 'good' },
      fail: { text: '사흘째 되던 날, 상자는 비어 있었다. 누군가 데려갔겠지…', effect: { mood: 'gloom' } } },
  ],
},
```

- `once: true`: 한 생에 한 번만 일어난다. 범용 반복 사건을 늘리는 게 목적이면 **빼고** 쓴다.
- `milestone: true`: 조건이 맞으면 반드시 일어난다. 함부로 쓰지 않는다.
- `focus: 'train' | 'study' | 'social' | 'explore'`: 그 성장일 때 가중치 ×3.
- `auto`: 선택지 없는 자동 사건. 형식은 `{ check?, success, fail? }`.
- `will: 25`: 숙명을 거스르는 선택지에만 쓴다(의지력 비용).

### 판정 `check`
- `{ stat, dc }`. 능력치는 **0~280**이다. 성공률은 `50 + (능력치 − dc) × 1.07 + 행운 보정`이고, 5~95%로 제한된다.
- dc 기준

  | 나이대 | 쉬움 | 보통 | 어려움 |
  |---|---|---|---|
  | 유년 | 50 | 67 | 84 |
  | 성인 | 78 | 98 | 126 |

- `check`가 있으면 `fail`도 꼭 쓴다.

### 효과 `effect`

| 필드 | 쓰임 |
|---|---|
| `stats` | 능력치 증감 (0~280). 한 번에 ±3~11. 큰 사건은 ±22까지. 성인식(18세) 뒤로는 등급 한계에서 멈춘다 |
| `karma` | 업보 ±3~10 |
| `rel` / `addRel` / `removeRel` / `promoteToSpouse` | 인연. 키는 `friend` `rival` `mentor` `spouse` |
| `flags` / `unflags` | 플래그 세우기·지우기 (6장 참고) |
| `gold` / `goldPct` + `goldCap` / `goldSet` | 돈. `goldPct`로 늘릴 때는 **반드시 `goldCap`** |
| `mood` | 기분. `calm` `joy` `gloom` `anger` `fear` |
| `stress` / `will` | 스트레스, 의지력 증감 |
| `job` / `jobRank` | 직업 얻기, 직급 증감 |
| `own` | 상점 소유물 얻기 (`cat` `horse` `house` 등) |
| `trinket` | 장신구 보상. `{ stat: 'luck', rarity: 'rare' }`(그 능력치 장신구 무작위) 또는 `{ base: 't_fairy', rarity: 'epic' }`(이야기 장신구, `src/data/trinkets.ts`). 희귀도: `common` `rare` `epic` `legend` |
| `item` | 장비·물약을 가방에 넣는다. `{ base: 'w1', rarity: 'rare', name: '반짝이는 지팡이' }` (base: `src/data/items.ts`의 `w1~w8` 무기, `a1~` 방어구, `p1~p3` 회복약. `name`으로 이름만 바꿀 수 있다) |
| `debt` | `gold`가 음수일 때 가진 돈보다 많이 잃어 **빚이 될 수 있게** 한다. 빚 투자 같은 사건에만 쓴다 (없으면 가진 돈까지만 잃는다) |
| `death` | 사인 id. 판정 실패 쪽에만 쓴다. 대부분 중상으로 바뀐다 |
| `zeroCause` | 이 효과로 체력이 0이 될 때의 사인 |

- **문장과 효과를 맞춘다**: 결과 문장에 「금화를 주웠다」, 「지팡이를 받았다」, 「부적이 굴러떨어졌다」처럼 무언가를 얻었다고 쓰면 반드시 `gold` · `item` · `trinket` · `own` 중 맞는 효과를 넣는다. 문장만 있고 효과가 없으면 버그다.
- 사인 id: `illness plague famine mana_overload carriage assassination duel war bandits dragon yandere heresy experiment pact overwork debt` 등. 전체 목록은 `src/data/deaths.ts`.
- `tone`: `good` `bad` `milestone`. 생략하면 판정 결과에 따라 정해진다.

### 조건 `cond`
`minAge` `maxAge` `houses` `notHouses` `jobs` `notJobs` `flags` `notFlags` `stats` `maxStats` `karmaMin` `karmaMax` `hasRel` `notRel` `relMin` `traits` `goldMin` `goldMax` `owns`

- 선택지에도 `cond`를 걸 수 있다. 예: 돈이 있을 때만 보이는 선택지.
- 출신 id: `farm merchant noble demon hero elf dwarf beastkin eastern mermaid sky witch slime`
- 직업 id: `farmer knight mage court merchant adventurer thief priest demon_officer hero`

## 4. 문장 규칙

- **톤**: 밝은 이세계 애니·라노벨을 바탕으로, 세계의 끝을 향해 가는 쓸쓸함을 가끔 섞는다. 잔인한 묘사는 하지 않는다.
- **관점**: 전지적 1인칭. 「나」로 쓰거나 주어를 생략한다. `당신`은 쓰지 않는다.
- **문체**: 반말 서술체 (`~했다`, `~이다`). 대사는 큰따옴표로.
- **나이**: 수명이 50 남짓이다. `minAge`는 47 이하로 쓴다.
- **길이**: 본문 1~2문장(60자 안팎). 결과 1~2문장. 선택지 라벨 15자 이내.
- **선택지 수**: 2~3개. 2개면 모바일에서 좌우 스와이프 카드가 된다.
- **토큰**: 실제 이름과 호칭으로 바뀐다. 조사는 `{friend:이}`처럼 쓰면 받침에 맞게 붙는다.

  | 토큰 | 바뀌는 말 |
  |---|---|
  | `{name}` | 주인공(나) 이름 |
  | `{friend}` `{rival}` `{mentor}` `{spouse}` | 인연 이름. **그 인연이 있을 때만** 쓴다 (`cond.hasRel` 필수) |
  | `{house}` | 출신 이름 |
  | `{title}` | 직함 |
  | `{sir}` | 형님 / 누님 (주인공 성별에 따라) |
  | `{elder}` | 아저씨 / 누나 |
  | `{royal}` | 공주 / 왕자 |
  | `{royalChild}` | 딸 / 아들 |
  | `{inlaw}` | 사위 / 며느리 |

- **성별**: 주인공 성별은 무작위다. "그녀", "그"처럼 성별이 정해진 표현을 쓰지 않는다.

## 5. 전투 사건

- 체력·마력 판정 선택지를 턴제 전투로 만들려면 `src/engine/combat.ts`의 `BATTLE_ENEMY`에 `사건id: '적종류'`를 추가한다.
- 적 종류: `bandit soldier rival bully stalker hero demon_lord traitor wolf shadow dragon wyvern`
- dc가 적 전투력이 된다: `20 + dc × 1.1`.

## 6. 플래그와 사슬

- 새 플래그를 세우면 **그 플래그를 읽는 사건**(`cond.flags`)도 함께 만든다. 반대로, 읽는 플래그는 세우는 곳이 있어야 한다.
  - `tests/chains.test.ts`가 둘 다 검사한다.
- 사슬은 `줄기 → 가지 → 결과` 구조로 만든다. 예: 첫 만남(`met_x`) → 재회(`x_friend`) → 결말.

## 7. 끝내기 전에

```bash
npm test        # 치환 안 된 {토큰}, 끊긴 플래그, 타입 오류를 잡는다
npm run build
```

- `Current.md`에 추가한 사건 수를 적는다.
- 커밋 메시지 예: `사건 추가: 유년기 범용 30개`
