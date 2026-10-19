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

## 조작

- `Space`: 한 해 보내기
- `1~9`: 사건의 선택지 고르기
