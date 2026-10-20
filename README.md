<div align="center">

<img src="docs/screenshots/hero.png" alt="환생록 타이틀 화면" width="720">

# 환생록 (if-go-parallel-world)

**눈을 뜨니 이세계. 그리고 나는, 또 죽었다.**

몇 번이고 죽고, 몇 번이고 다시 태어나는 이세계 판타지 인생 시뮬레이터.<br>
설치 없이 브라우저에서 바로, PC와 모바일 모두 플레이할 수 있어요.

[▶ 지금 플레이하기](https://oceanstarlight.github.io/if-go-parallel-world/)

</div>

---

## 이런 게임이에요

가문과 권능을 고르는 것도 운명에 맡기고, 한 해 한 해를 살아가다 보면 사건이 터져요.
소꿉친구가 생기고, 숙적이 나타나고, 용사가 되거나 마왕이 되기도 하죠.
그리고 언젠가 반드시 **기상천외하게 죽어요.**

> 노환으로 편히 가는 건 26가지 죽음 중 하나일 뿐이에요.<br>
> 이세계 트럭(마차)에 치이고, 독이 든 와인을 마시고, 얀데레 소꿉친구에게…

죽으면 끝이 아니에요. 환생석을 들고 윤회의 문으로 돌아가 **더 강한(혹은 더 이상한) 모습으로 다시 태어나요.**

## 한 판은 이렇게 흘러가요

```
 태어난다 ─► 매년 선택하며 산다 ─► 죽는다 ─► 환생석을 받는다
    ▲                                              │
    └──────── 제단에서 가문·권능 해금 ◄────────────┘
```

1. **환생** — 여신의 질문 3개에 답하면 출신과 권능이 정해져요. 운명에 맡기면 환생석 +20%!
2. **인생** — 수련·학업·교류·탐험 중 성장 방향을 고르고, 해마다 터지는 사건에서 선택해요. 시간은 저절로 흘러가요.
3. **죽음** — 어떻게 죽을지는 아무도 몰라요. 묘비에 한 줄 묘비명이 남아요.
4. **윤회** — 환생석으로 새 출신과 권능을 열어요. 사인 도감을 채우는 것도 목표예요.

## 볼거리

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/life.png" alt="인생 화면"><br><b>한 해 한 해를 살아가요</b><br>연대기에 내 삶이 한 줄씩 쌓여요.</td>
    <td width="50%"><img src="docs/screenshots/event.png" alt="사건 선택"><br><b>선택이 곧 운명</b><br>성공률은 능력치와 행운에 달렸어요. 모바일에서는 카드를 좌우로 밀어서 골라요.</td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/dungeon.png" alt="던전 전투"><br><b>던전과 턴제 전투</b><br>보스를 쓰러뜨리거나, 장비를 전부 잃고 쓰러지거나.</td>
    <td width="50%"><img src="docs/screenshots/grave.png" alt="묘비 화면"><br><b>그리고 묘비</b><br>사인, 묘비명, 같은 해에 환생한 네 사람의 인생까지.</td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/altar.png" alt="윤회의 제단"><br><b>윤회의 제단</b><br>환생석으로 용사, 마왕군, 인어, 슬라임…으로 태어날 수 있어요.</td>
    <td width="50%"><img src="docs/screenshots/codex.png" alt="사인 도감"><br><b>사인 도감</b><br>아직 못 겪은 죽음은 <code>???</code>로 남아 있어요. 전부 모아 볼래요?</td>
  </tr>
</table>

## 이런 점이 재밌어요

- **13가지 출신** — 변경의 농가부터 대공가, 용사, 마왕군, 엘프, 드워프, 인어, 천공국, 마녀, 그리고 **슬라임**까지.
- **26가지 죽음과 도감** — 처음 겪는 죽음일수록 환생석을 더 받아요.
- **전설이 되는 전생** — 업적을 남긴 전생은 다음 생에 동상, 노래, 위인전, 유령으로 등장해요.
- **나를 기억하는 NPC** — 떠돌이 마녀 루루, 체스를 두자는 사신 그림, 뽑기 상인 모모. 여러 생에 걸쳐 다시 만나요.
- **80억분의 1** — 같은 해에 환생한 네 사람의 인생이 자동으로 펼쳐져서 묘비에 나란히 보여요.
- **공유 카드** — 초상화, 사인, 묘비명, 목표가 담긴 결과 카드를 이미지로 저장하거나 공유할 수 있어요.
- **도트 그래픽과 BGM** — 밝은 이세계 애니풍 도트 장면과 초상화, 직접 합성한 배경음악.
- **로그인하면 어느 기기에서나** — Google·GitHub로 로그인하면 PC에서 하던 인생을 폰에서 이어갈 수 있어요. (게스트도 OK)

## 조작

| 입력 | 동작 |
|---|---|
| `Space` | 일시 정지 / 재생 |
| `1`~`9` | 사건의 선택지 · 성장 방향 고르기 |
| `←` `→` | 선택지가 두 개인 사건에서 고르기 (모바일은 카드 스와이프) |

## 직접 돌려보기

```bash
npm install
npm run dev     # 개발 서버
npm test        # 엔진 테스트 + 무작위 인생 3000회 시뮬레이션
npm run build   # dist/ 에 정적 파일 생성 (어디에 올려도 동작)
```

`main` 브랜치에 push 하면 GitHub Actions 가 테스트와 빌드를 거쳐 GitHub Pages 에 자동 배포해요.

### 로그인 · 클라우드 저장 (선택)

Google / GitHub 로그인과 기기 간 저장은 Firebase (Auth + Firestore) 를 써요. 설정이 없어도 로그인 화면은 보이지만, 로그인 버튼은 "준비 중" 안내만 하고 게스트(localStorage)로만 동작해요.

1. Firebase 프로젝트 생성 → **Authentication** 에서 Google, GitHub 제공업체 켜기 (GitHub 는 OAuth 앱의 Client ID/Secret 필요, 콜백 URL 은 Firebase 가 알려줘요)
2. Authentication > 설정 > **승인된 도메인** 에 배포 주소(`<user>.github.io`)와 `localhost` 추가
3. **Firestore** 생성 후 `firestore.rules` 를 규칙에 붙여 넣기 (계정 주인만 자기 문서 읽기·쓰기)
4. 웹 앱 등록 후 나온 구성 값을 `.env.local` (`.env.example` 참고) 과 GitHub 저장소 Variables 에 넣기 (`VITE_FIREBASE_*` 4개)

저장 구조: `users/{uid}` 문서 하나에 `meta`·`run` (JSON 문자열), `rev` (낙관적 잠금). 로그인했는데 이 기기와 계정에 서로 다른 기록이 있으면 어느 쪽을 쓸지 고르게 해요.

## 기술 스택

TypeScript · Vite · PixiJS(도트 그래픽) · GSAP · morphdom · Firebase(선택) · Vitest

서버 없이 정적 파일만으로 동작하는 게임 엔진이라, 사건 데이터(약 260개)와 규칙은 모두 `src/data`, `src/engine` 에 있어요.

## 문서

- 기획: [`docs/DESIGN.md`](docs/DESIGN.md)
- 사건 작성 가이드: [`docs/EVENTS_GUIDE.md`](docs/EVENTS_GUIDE.md)
- 레퍼런스 조사: [`docs/RESEARCH.md`](docs/RESEARCH.md)
- 진행 현황: [`Current.md`](Current.md)

## 영감

Reigns, Sir Brante, Princess Maker 2, Rogue Legacy, Hades, Wildermyth 등에서 시스템을 빌려와, 이세계 환생물의 분위기로 다시 엮었어요. 자세한 내용은 `docs/RESEARCH.md` 에 있어요.
