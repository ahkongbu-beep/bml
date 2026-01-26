# 인증 시스템 구현 완료

## 구조

```
backend/
├── app/
│   ├── routes/
│   │   ├── auth_router.py          # 인증 라우터 (로그인/로그아웃)
│   │   └── users_router.py         # 사용자 관리 라우터
│   ├── services/
│   │   ├── auth_service.py         # 인증 서비스 로직
│   │   └── users_service.py        # 사용자 서비스 로직
│   └── schemas/
│       ├── auth_schemas.py         # 인증 스키마
│       └── users_schemas.py        # 사용자 스키마
```

## API 엔드포인트

### 인증 API (`/auth`)
- `POST /auth/login` - 이메일 로그인
- `POST /auth/google` - 구글 소셜 로그인
- `POST /auth/kakao` - 카카오 소셜 로그인
- `POST /auth/naver` - 네이버 소셜 로그인
- `POST /auth/logout` - 로그아웃

### 사용자 API (`/users`)
- `POST /users/create` - 회원가입
- `GET /users/profile` - 프로필 조회
- `PUT /users/update` - 프로필 수정
- 기타 사용자 관리 기능...

## 설치 및 실행

### 1. 패키지 설치
```bash
cd backend
pip install -r requirements.txt
```

새로 추가된 패키지:
- `httpx==0.26.0` - 비동기 HTTP 클라이언트 (카카오/네이버 API 호출용)
- `google-auth==2.27.0` - 구글 ID 토큰 검증용

### 2. 환경 변수 설정
`backend/.env` 파일에 추가:
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. 서버 실행
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 프론트엔드 변경사항

### API 경로 변경
- ~~`POST /users/login`~~ → `POST /auth/login`
- ~~`POST /users/google-login`~~ → `POST /auth/google`
- ~~`POST /users/logout`~~ → `POST /auth/logout`

`frontend/libs/api/authApi.ts`가 자동으로 업데이트되었습니다.

## 구글 로그인 플로우

```
프론트엔드                        백엔드
    │                              │
    ├─ 구글 OAuth 팝업              │
    ├─ 사용자 승인                  │
    ├─ idToken 받기                │
    │                              │
    ├─ POST /auth/google ─────────>│
    │   { idToken: "..." }         │
    │                              ├─ 구글 토큰 검증
    │                              ├─ 사용자 검색/생성
    │                              ├─ JWT 토큰 발급
    │<─────────────────── 응답      │
    │   { user: {...}, token: "JWT" }
    │                              │
    ├─ 로컬 스토리지 저장
    ├─ AuthContext 업데이트
    └─ 홈 화면 이동
```

## 소셜 로그인 구현 상태

| Provider | Router | Service | 프론트엔드 | 상태 |
|----------|--------|---------|------------|------|
| 구글     | ✅     | ✅      | ✅         | 완료 |
| 카카오   | ✅     | ✅      | ⏳         | 대기 |
| 네이버   | ✅     | ✅      | ⏳         | 대기 |

## 테스트 방법

### 1. API 문서 확인
```
http://localhost:8000/docs
```

### 2. 구글 로그인 테스트
프론트엔드 앱에서 "Google로 계속하기" 버튼 클릭

### 3. 로그 확인
백엔드 터미널에서 로그인 성공 여부 확인

## 주의사항

1. **구글 클라이언트 ID 설정 필수**
   - Google Cloud Console에서 발급
   - `.env` 파일에 `GOOGLE_CLIENT_ID` 추가

2. **CORS 설정**
   - main.py에 이미 설정되어 있음 (`allow_origins=["*"]`)

3. **JWT 미들웨어**
   - `/auth/*` 엔드포인트는 인증 불필요
   - `/users/*`, `/feeds/*` 등은 JWT 토큰 필요

## 다음 단계

1. ✅ 구글 로그인 구현 완료
2. ⏳ 카카오 로그인 프론트엔드 구현
3. ⏳ 네이버 로그인 프론트엔드 구현
4. ⏳ Apple 로그인 추가 (선택)
