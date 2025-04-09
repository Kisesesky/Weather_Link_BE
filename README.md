# 🌤️ WeatherLink

친구의 날씨까지 함께 확인하는 소셜 기반 맞춤형 날씨 서비스

---

## 🧭 프로젝트 소개

**WeatherMate**는 사용자의 현재 위치 및 등록한 관심 지역의 날씨를 실시간으로 제공하며,  
친구의 동네 날씨까지 확인할 수 있는 소셜 기능이 결합된 날씨 기반 웹 애플리케이션입니다.

- 실시간 기상 데이터 및 대기질 수집 (기상청 API, 에어코리아 API 연동)
- 사용자 맞춤형 알림 (폭염, 비, 미세먼지 등)
- 친구 추가 및 친구 동네 날씨 보기
- 다양한 시각화를 통한 날씨 트렌드 확인
- WebSocket 기반 실시간 알림 시스템
- 같은 지역내 실시간 채팅 시스템

---

## 🏗️ 기술 스택

| 영역        | 기술                                                                 |
|-------------|----------------------------------------------------------------------|
| Backend     | [NestJS](https://nestjs.com/), TypeORM, PostgreSQL, Swagger          |
| 실시간 통신 | WebSocket (Gateway)                                                   |
| API 연동    | 기상청 날씨 API, AirKorea 대기질 API                                  |
| 인증        | 이메일 로그인 + OAuth 소셜 로그인 (Google, Kakao 등)                  |
| 배포 환경   | Docker, CI/CD                                                        |

---

## 📁 폴더 구조
```
src/
├── common/                      # 전역에서 재사용 가능한 공통 코드
│   ├── decorators/              # 커스텀 데코레이터 모음 (예: @Public, @Roles 등)
│   ├── dto/                     # 공통 DTO (예: Pagination DTO)
│   └── entities/
│       └── base.entity.ts       # 모든 엔티티에서 상속받는 기본 필드 정의

├── config/                      # 환경설정 모듈
│   ├── app/                     # App 설정 (PORT, HOST 등)
│   ├── aws/                     # S3 등 AWS 관련 설정
│   ├── db/                      # DB 연결 및 TypeORM 설정
│   └── social/                  # Google, Kakao 등의 OAuth 설정

├── database/
│   └── migrations/              # 마이그레이션 파일 모음

├── modules/                     # 주요 도메인 모듈들
│   ├── auth/                    # 로그인, OAuth, JWT, 가드 등 인증 관련
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── guards/
│   │   └── strategies/
│
│   ├── users/                   # 사용자 정보, 위치, 설정 등
│   │   ├── dto/
│   │   ├── entities/
│   │   └── subscribers/         # 사용자 이벤트 구독 처리
│
│   ├── locations/               # 위치 저장, 조회, 즐겨찾기
│   │   ├── dto/
│   │   └── entities/
│
│   ├── chat/                    # 채팅, 채팅룸, 메세지
│   │   ├── dto/
│   │   ├── service/
│   │   └── entities/
|
│   ├── weather/                 # 날씨 수집, 저장, 조회
│   │   ├── dto/
│   │   └── entities/
│
│   ├── alerts/                  # 임계값 알림, 사용자 알림 설정
│   │   ├── dto/
│   │   └── entities/
│
│   ├── friends/                 # 친구 요청/수락/거절, 친구 목록
│   │   ├── dto/
│   │   └── entities/
│
│   └── s3/                      # S3 이미지 업로드 등
│       ├── dto/
│       └── entities/

├── utils/                       # 유틸 함수 모음

├── app.module.ts                # 앱 최상단 모듈
├── ormconfig.ts                 # TypeORM 설정 파일 (고려 중)
└── main.ts                      # 앱 실행 진입점
```



---

## 🧪 주요 기능 요약
|기능	      |설명                                    |
|---------- |----------------------------------------|
|사용자 관리|회원가입, 로그인, OAuth, 사용자 정보 수정 |
|위치 등록	|사용자 위치 추가/삭제, 즐겨찾기           |
|날씨 수집	|실시간 날씨/미세먼지 수집, 기상청 특보 반영|
|친구 기능	|친구 요청/수락/거절, 친구 날씨 확인       |
|알림	      |사용자 지정 임계값에 따른 푸시 알림       |


---

## 📖 API 문서

- Swagger URL: `http://localhost:3000/api`
- API 문서는 `@nestjs/swagger`를 통해 자동 생성됩니다.
- 로그인 및 인증 테스트를 위한 토큰 발급 지원 예정

---

## 🛠️ 실행 방법

```bash
# 1. 환경 변수 설정
cp .env.example .env

# 2. 의존성 설치
npm install

# 3. 데이터베이스 마이그레이션 적용
npm run typeorm migration:run

# 4. 앱 실행
npm run start:dev