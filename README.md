# Media Board MVP

`Next.js + Vercel` 기반으로 만든 16:9 키오스크/사이니지용 실시간 미디어 보드 MVP입니다.

## 포함 기능

- 뉴스 속보 패널
- 현재 시각 / 날짜
- 현재 날씨 + 5일 예보
- 시장 정보 카드 + 스파크라인
- 데이터 소스 장애 시 섹션별 폴백 처리
- `/api/board` 집계 API 제공

## 데이터 프로바이더 조사 요약

### 1. 날씨

- 기본 적용: `Open-Meteo`
- 방식: 무인증 REST JSON
- 장점: 현재값, 시간별, 일별 예보를 바로 제공하고 배포 직후 바로 동작
- 적용 이유: MVP에서 가장 낮은 운영 비용

### 2. 뉴스

- 기본 적용: `RSS`
- 확장 옵션: `NewsAPI`
- 방식:
  - RSS: XML 피드 파싱
  - NewsAPI: REST JSON + API Key
- 판단:
  - RSS는 키 없이 붙일 수 있어 MVP에 적합
  - NewsAPI는 구조화가 편하지만 무료 플랜은 개발 전용이라 운영 시 유료 전환 검토 필요

### 3. 시장 정보

- 기본 적용: `Twelve Data`
- 폴백: `Frankfurter`
- 방식:
  - Twelve Data: REST JSON + API Key
  - Frankfurter: REST JSON, 무인증 FX 기준환율
- 판단:
  - Twelve Data는 미국 주식/ETF, 환율, 글로벌 심볼 체계를 한 API에서 처리하기 쉬움
  - KRX 심볼과 미국 대표 ETF를 같은 구조로 가져올 수 있어 보드형 화면에 적합
  - 주식 피드가 실패하면 Frankfurter 환율만 남겨서 패널 전체가 비지 않게 처리

## 참고한 공식 문서

- Next.js 설치 문서: https://nextjs.org/docs/app/getting-started/installation
- Vercel Next.js 배포 문서: https://vercel.com/docs/frameworks/nextjs
- Open-Meteo Docs: https://open-meteo.com/en/docs
- Twelve Data Quote/Docs: https://twelvedata.com/docs/price-transform/div
- Twelve Data Bulk Requests: https://support.twelvedata.com/en/articles/5203360-bulk-requests
- Twelve Data Pricing: https://twelvedata.com/pricing
- Twelve Data KRX support note: https://support.twelvedata.com/en/articles/5749829-korea-exchange-krx
- NewsAPI Docs: https://newsapi.org/docs
- NewsAPI Pricing: https://newsapi.org/pricing
- Frankfurter Docs: https://frankfurter.dev/docs
- SBS RSS 안내: https://news.sbs.co.kr/news/rss.do

## 환경 변수

`.env.example`를 기준으로 설정합니다.

### 바로 동작하는 기본값

- 날씨: 서울 기준 `Open-Meteo`
- 뉴스: SBS RSS 예시 피드
- 시장 정보: Twelve Data 시도 후 실패 시 Frankfurter 환율 폴백

### 운영 전 검토 사항

- 뉴스 RSS는 각 언론사 이용 약관 및 상업적 사용 조건을 확인해야 합니다.
- `NewsAPI` 무료 플랜은 개발 전용입니다.
- Twelve Data의 KRX 데이터는 플랜 조건에 따라 접근 범위가 달라질 수 있습니다.
- 상업 환경에서는 라이선스가 명확한 뉴스 공급원 또는 자체 계약 RSS/API 사용을 권장합니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## Vercel 배포

1. 저장소를 GitHub 등에 푸시합니다.
2. Vercel에서 저장소를 Import 합니다.
3. `.env.example` 항목을 기준으로 환경 변수를 등록합니다.
4. Framework Preset은 `Next.js`를 그대로 사용합니다.
5. 배포 후 `/api/board`와 메인 화면을 확인합니다.

## 구조

```text
src/
  app/
    api/board/route.ts
    globals.css
    layout.tsx
    page.tsx
  components/
    board-client.tsx
    clock-panel.tsx
  lib/
    board-data.ts
    env.ts
    format.ts
```
