# 주밥 (Jubabi)

> 한국 주식 공시 실시간 알림 앱 — DART 공시를 쉽고 빠르게

<div align="center">

<img src="docs/screenshots/home.jpg" width="200" />
<img src="docs/screenshots/favorite.jpg" width="200" />
<img src="docs/screenshots/alert.jpg" width="200" />
<img src="docs/screenshots/profile.jpg" width="200" />

</div>

---

## 개요

주밥이는 한국 금융감독원 전자공시시스템(DART)의 공시를 주기적으로 수집해, 관심 종목과 키워드에 맞는 공시만 골라 푸시로 알려주는 Android 앱입니다. 복잡한 공시 원문은 AI 요약으로 읽을 수 있습니다.

**규모**

- 기업 코드 **116,445건** 메모리 캐싱
- DART RSS 폴링 주기 **5초**
- 중복 저장 방지 — 접수번호 기준 인메모리 캐시(24시간 보관) + DB `onConflictDoNothing`

---

## 주요 기능

- **실시간 공시 알림** — DART RSS 폴링으로 새 공시 발생 시 푸시 알림
- **관심 종목 등록** — 특정 기업의 공시만 골라 수신
- **키워드 알림** — "유상증자", "자사주" 등 원하는 키워드 등록
- **AI 공시 요약** — Claude로 복잡한 공시를 쉬운 말로 요약 (프리미엄)
- **카테고리 필터** — 자본구조 변화, 주주환원, 지분구조 등 분류별 탐색
- **북마크** — 중요 공시 저장 및 관리
- **카카오 로그인** — 간편 소셜 로그인
- **멤버십** — 무료 / 프리미엄 / 평생회원, Google Play 인앱결제

## 기술 스택

### Frontend

| 기술                          | 용도                    |
| ----------------------------- | ----------------------- |
| React Native + Expo (SDK 53)  | 크로스플랫폼 앱         |
| Expo Router                   | 파일 기반 내비게이션    |
| NativeWind (Tailwind CSS)     | 스타일링                |
| Expo Notifications            | 푸시 알림 수신          |
| Expo SecureStore              | JWT 토큰 보관           |
| react-native-iap              | Google Play 인앱결제    |
| react-native-markdown-display | AI 요약 마크다운 렌더링 |

### Backend

| 기술                            | 용도                 |
| ------------------------------- | -------------------- |
| Node.js 24 + Express 5          | REST API 서버        |
| TypeScript                      | 타입 안전성          |
| Drizzle ORM + Neon (PostgreSQL) | 데이터베이스         |
| Anthropic Claude                | AI 공시 요약         |
| Expo Server SDK                 | 푸시 알림 발송       |
| setInterval (5초 주기)          | DART RSS 폴링        |
| node-cron                       | 기업 목록 일일 동기화 |
| JWT                             | 인증                 |

### Infrastructure

| 기술                        | 용도                                            |
| --------------------------- | ----------------------------------------------- |
| AWS EC2 (Amazon Linux 2023) | 상주 백엔드 프로세스                            |
| systemd                     | 프로세스 관리, 크래시·재부팅 자동 복구          |
| AWS SSM Parameter Store     | 프로덕션 설정·시크릿 (SecureString)             |
| IAM 역할                    | EC2에서 Parameter Store 접근 (액세스 키 미사용) |

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Android App (Expo)                       │
│  홈(공시 목록) · 검색 · 관심종목 · 알림 · 프로필            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / JWT   ※ TLS 적용 예정
┌──────────────────────▼──────────────────────────────────────┐
│              AWS EC2 · systemd (Node.js)                    │
│  ┌────────────────────────┐  ┌───────────────────────────┐  │
│  │   Express REST API     │  │  RSS 폴러 (5초 주기)      │  │
│  │  /auth /api/disclosures│  │  DART RSS → 신규 선별     │  │
│  │  /api/alerts /favorites│  │  → 푸시 발송              │  │
│  └────────────────────────┘  └───────────────────────────┘  │
│                              ┌───────────────────────────┐  │
│                              │  node-cron (평일 07:00)   │  │
│                              │  기업 목록 동기화         │  │
│                              └───────────────────────────┘  │
└──────┬──────────────────┬───────────────────┬───────────────┘
       │                  │                   │
┌──────▼────────┐  ┌──────▼──────────┐  ┌─────▼──────────────┐
│ Neon Postgres │  │ SSM Parameter   │  │  외부 API          │
│ (Drizzle ORM) │  │ Store (IAM 역할)│  │  DART OpenAPI      │
└───────────────┘  └─────────────────┘  │  Kakao OAuth       │
                                        │  Claude API        │
                                        │  Expo Push Service │
                                        └────────────────────┘
```

---

## 설계 결정

### 왜 Lambda가 아니라 EC2인가

공시 알림은 지연이 곧 서비스 가치라 짧은 주기의 폴링이 필요했습니다. 그런데 EventBridge Scheduler의 최소 주기는 1분이라, Lambda로 초 단위 폴링을 하려면 함수 안에서 루프를 돌아야 합니다. 계산해보니:

| 방식                             | 지연      | 월 비용                   |
| -------------------------------- | --------- | ------------------------- |
| Lambda, 1분마다 1회 실행         | 최대 60초 | $0                        |
| Lambda, 1분마다 호출 + 60초 루프 | 1초       | 약 $15                    |
| EC2 t3.micro 상주 프로세스       | 1초       | 약 $14 (퍼블릭 IPv4 포함) |

루프를 도는 순간 Lambda는 "실행한 만큼 과금"이 아니라 사실상 상주 서버가 되고, 무료 한도(월 40만 GB-초)를 넘습니다. 상주 프로세스가 맞는 워크로드라고 판단했습니다. 부수적으로 DB 커넥션 풀을 유지할 수 있는 이점도 있었습니다.

### 왜 pm2가 아니라 systemd인가

pm2 데몬이 30~50MB를 상주로 씁니다. 인스턴스 메모리가 작고 프로세스도 하나뿐이라 pm2의 강점(클러스터 모드, 무중단 리로드)을 쓸 일이 없었습니다. `pm2 startup`이 하는 일도 결국 pm2를 systemd 서비스로 등록하는 것이라, 한 겹 더 얹는 셈이었습니다.

### 왜 설정을 `.env`가 아니라 Parameter Store에 두는가

프로덕션 서버 디스크에 시크릿 파일을 두지 않기 위해서입니다. 앱 시작 시 SSM에서 SecureString을 복호화해 `process.env`에 주입하고, EC2에는 액세스 키 대신 IAM 역할만 부여했습니다. 서버에는 자격증명 파일이 존재하지 않습니다.

로컬 개발(`NODE_ENV=development`)에서는 SSM을 건너뛰고 `.env`를 씁니다.

## 프로젝트 구조

```
jubabi/
├── frontend/                  # Expo React Native 앱
│   ├── app/
│   │   └── (tabs)/
│   │       ├── index.tsx      # 홈 — 최근 공시 목록
│   │       ├── search/        # 기업 검색
│   │       ├── favorite/      # 관심 종목
│   │       ├── alert/         # 알림 목록 & 알림 설정
│   │       └── profile/       # 프로필, 멤버십 관리
│   ├── components/
│   │   └── lists/
│   │       └── DisclosureList.tsx  # 공시 카드 + AI 요약 모달
│   ├── context/
│   │   └── NotificationContext.tsx
│   └── lib/
│       ├── apiFetch.ts        # 인증 포함 중앙 fetch 래퍼
│       └── myApi.ts
│
└── backend/                   # Express API 서버
    └── src/
        ├── config/
        │   └── loadConfig.ts           # SSM Parameter Store 로딩
        ├── jobs/
        │   ├── rssPoller.ts            # DART RSS 폴링 → 신규 선별 → 푸시
        │   └── scheduler.ts            # node-cron 기업 목록 동기화
        ├── cache/
        │   └── companiesCache.ts       # 기업 코드 인메모리 캐시
        ├── routes/                     # auth, disclosures, alerts, favorites …
        ├── middleware/
        ├── services/
        │   ├── disclosures.service.ts  # 공시 조회
        │   └── summarize.ts            # Claude AI 요약 + DB 캐시
        ├── utils/
        │   ├── parseDisclosure.ts      # DART 문서 파싱
        │   └── parseDisclosureTitle.ts # RSS 제목 → 기업·유형 분리
        └── db/
            └── schema.ts               # Drizzle 스키마
```

## 실행 방법

### 사전 요구사항

- Node.js 24+
- Expo CLI
- Android 기기 또는 에뮬레이터

### Backend (로컬 개발)

```bash
cd backend
cp .env.example .env
npm install
npm run dev            # NODE_ENV=development → SSM 건너뛰고 .env 사용
```

필요한 환경변수:

```
# 시크릿 — 프로덕션에서는 SSM Parameter Store에서 주입
NEON_DATABASE_URL=
JWT_SECRET=
DART_API_KEY=
KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=
KAKAO_ADMIN_KEY=
ANTHROPIC_API_KEY=

# 런타임 설정 — 프로덕션에서는 systemd 유닛의 Environment= 로 주입
NODE_ENV=development
PORT=5001
BACKEND_BASE_URL=
```

> 프로덕션에서는 위쪽 시크릿 7개만 SSM Parameter Store의 `/jubabi/prod/` 경로에 같은 이름의 SecureString으로 저장합니다. 앱 시작 시 [`loadConfig.ts`](backend/src/config/loadConfig.ts)가 이들을 읽어 `process.env`에 주입하고, 하나라도 없으면 즉시 종료합니다.
>
> `PORT`·`BACKEND_BASE_URL`·`NODE_ENV`는 시크릿이 아니고 환경마다 달라지는 값이라 SSM에 넣지 않고 systemd 유닛에서 지정합니다. `PORT`가 없으면 코드 기본값 3000으로 뜹니다.

### Frontend

```bash
cd frontend
npm install
npm run dev            # APP_VARIANT=development
```

---

## 배포

EC2에서 systemd 서비스로 실행합니다.

```bash
git pull
npm ci
npm run build
sudo systemctl restart jubabi
sudo systemctl status jubabi
```

**systemd 유닛** (`/etc/systemd/system/jubabi.service`)

```ini
[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/jubabi/backend
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=5001
Environment=TZ=Asia/Seoul
```

`Restart=always`로 프로세스가 죽으면 5초 뒤 자동 재시작하고, `systemctl enable`로 재부팅 후에도 자동 기동합니다. SIGKILL 강제 종료와 재부팅 양쪽에서 복구를 확인했습니다.

로그는 `/var/log/jubabi/`에 파일로 남기고 logrotate로 7일 보관합니다. CloudWatch Logs는 수집량 과금이 있어 쓰지 않습니다.

---

## 멤버십 구조

| 기능             | 무료 | 프리미엄 | 평생회원 |
| ---------------- | :--: | :------: | :------: |
| 관심 종목        | 5개  |   30개   |  무제한  |
| 키워드 알림      | 2개  |   10개   |  무제한  |
| 실시간 공시 알림 |  ✓   |    ✓     |    ✓     |
| 카테고리 필터    |  ✓   |    ✓     |    ✓     |
| AI 공시 요약     |  —   |    ✓     |    ✓     |
| 우선 고객 지원   |  —   |    —     |    ✓     |

---

## 알려진 한계와 개선 계획

- **평문 HTTP 통신** — 현재 앱이 EC2 퍼블릭 IP로 직접 붙습니다. 스토어 배포 시 iOS/Android가 평문 통신을 차단하므로, 도메인 연결 후 TLS를 적용할 예정입니다.
- **단일 인스턴스** — 인스턴스 장애 시 서비스가 중단됩니다. 개인 프로젝트 규모에서는 systemd 자동 복구로 충분하다고 판단했습니다.
- **폴링 방식** — DART가 웹훅을 제공하지 않아 폴링이 불가피합니다. 주기를 줄이면 지연은 줄지만 API 호출 한도에 걸립니다. 시간대별 공시 분포를 반영해 야간에는 주기를 늘리는 방식을 검토 중입니다.
- **AI 요약 비용** — 공시당 Claude API 호출이 발생해 사용자가 늘면 비용이 선형 증가합니다. 동일 공시는 DB에 캐싱해 재호출을 막고 있습니다.
