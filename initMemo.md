# 가상머신 실행
& C:/monorepo/bml/backend/venv/Scripts/Activate.ps1

# fastapi 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 안드로이드 preview 만들기
eas build -p android --profile preview

# 개발모드 build 하기
eas build --profile development --platform android

# 개발시
{
  "cli": {
    "version": ">= 16.28.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}

# 배포시
# esa.json 설정
"""
{
  "cli": {
    "version": ">= 16.28.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://bml-e3uz.onrender.com",
        "EXPO_PUBLIC_STATIC_BASE_URL": "https://bml-e3uz.onrender.com",
        "EXPO_PUBLIC_APP_NAME": "BML",
        "EXPO_PUBLIC_APP_SUBTITLE": "건강한 식단 관리",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "404204939819-m035fj512uv6uvrs7b925kg52ofjvdkn.apps.googleusercontent.com",
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "404204939819-75t03ftkcbrd44m2hfh5spg4agb5nsi6.apps.googleusercontent.com"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://bml-e3uz.onrender.com",
        "EXPO_PUBLIC_STATIC_BASE_URL": "https://bml-e3uz.onrender.com",
        "EXPO_PUBLIC_APP_NAME": "BML",
        "EXPO_PUBLIC_APP_SUBTITLE": "건강한 식단 관리",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "404204939819-m035fj512uv6uvrs7b925kg52ofjvdkn.apps.googleusercontent.com",
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "404204939819-75t03ftkcbrd44m2hfh5spg4agb5nsi6.apps.googleusercontent.com"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://bml-e3uz.onrender.com",
        "EXPO_PUBLIC_STATIC_BASE_URL": "https://bml-e3uz.onrender.com",
        "EXPO_PUBLIC_APP_NAME": "BML",
        "EXPO_PUBLIC_APP_SUBTITLE": "건강한 식단 관리",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID":"404204939819-75t03ftkcbrd44m2hfh5spg4agb5nsi6.apps.googleusercontent.com",
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID":"404204939819-1k353f511tk152khge45i95rikgq73ab.apps.googleusercontent.com"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
"""



1. 개발 빌드 환경 구축 (최초 1회)
로컬 SDK 에러를 피하기 위해 EAS 클라우드 빌드를 사용합니다.

Bash
# EAS CLI 설치 (이미 있다면 패스)
npm install -g eas-cli

# EAS 로그인 (Expo 계정 접속)
eas login

# EAS 설정 파일 생성 (이미 있다면 패스)
eas build:configure
2. 안드로이드 전용 APK 빌드 (지문 포함용)
eas.json에 buildType: "apk"가 설정된 상태에서 실행합니다.

# 클라우드에서 안드로이드 개발 빌드 시작
eas build --profile development --platform android
진행 사항: 빌드 완료 후 터미널에 나오는 QR 코드나 다운로드 링크를 통해 폰에 APK를 설치하세요. (설치된 앱 이름은 프로젝트의 name입니다.)

3. 실시간 코드 수정 및 테스트 (일상 개발)
APK 설치가 완료되었다면, 이제 웹처럼 실시간으로 개발할 수 있습니다.

# expo go 환경으로 toggle
npx expo start --go

# 개발 서버 실행 (--dev-client 옵션 필수)
npx expo start --dev-client
진행 사항: > 1. 폰에서 방금 설치한 내 앱을 켭니다. 2. npx expo start 터미널에 뜬 QR 코드를 내 앱으로 스캔합니다. 3. 이제 구글 로그인 버튼을 누르면 정상적으로 작동합니다!

💡 (참고) 만약 SHA-1 지문을 다시 확인해야 한다면?
구글 콘솔에 등록할 지문은 이 명령어로 확인하세요.

Bash
# 프로젝트 지문 정보 확인
npx eas credentials