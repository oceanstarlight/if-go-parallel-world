# 환생록 (if-go-parallel-world)

이세계 판타지 인생 시뮬레이터다.

1. 가문과 권능을 골라 태어난다.
2. 매년 선택하며 살아간다.
3. 기상천외하게 죽는다.
4. 환생석을 모아 다시 태어난다.

참고 문서:
- 기획: [`docs/DESIGN.md`](docs/DESIGN.md)
- 진행 현황: [`Current.md`](Current.md)

## 실행

```bash
npm install
npm run dev     # 개발 서버
npm test        # 엔진 테스트 + 무작위 인생 3000회 시뮬레이션
npm run build   # dist/ 에 정적 파일 생성 (어디에 올려도 동작)
```

## 로그인 · 클라우드 저장 (선택)

Google / GitHub 로그인과 기기 간 저장은 Firebase (Auth + Firestore) 를 쓴다. 설정이 없으면 로그인 UI 가 꺼지고 게스트(localStorage)로만 동작한다.

1. Firebase 프로젝트 생성 → **Authentication** 에서 Google, GitHub 제공업체 켜기 (GitHub 는 OAuth 앱의 Client ID/Secret 필요, 콜백 URL 은 Firebase 가 알려 준다)
2. Authentication > 설정 > **승인된 도메인** 에 배포 주소(`<user>.github.io`)와 `localhost` 추가
3. **Firestore** 생성 후 `firestore.rules` 를 규칙에 붙여 넣기 (계정 주인만 자기 문서 읽기·쓰기)
4. 웹 앱 등록 후 나온 구성 값을 `.env.local` (`.env.example` 참고) 과 GitHub 저장소 Variables 에 넣기 (`VITE_FIREBASE_*` 4개)

저장 구조: `users/{uid}` 문서 하나에 `meta`·`run` (JSON 문자열), `rev` (낙관적 잠금). 로그인했는데 이 기기와 계정에 서로 다른 기록이 있으면 어느 쪽을 쓸지 고르게 한다.

## 조작

- `Space`: 한 해 보내기
- `1~9`: 사건의 선택지 고르기
