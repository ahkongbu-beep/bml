# 가상머신 실행
& C:/monorepo/bml/backend/venv/Scripts/Activate.ps1

# fastapi 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 안드로이드 preview 만들기
eas build -p android --profile preview

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
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "env": {
          "EXPO_PUBLIC_API_URL": "https://bml-e3uz.onrender.com",
          "EXPO_PUBLIC_STATIC_BASE_URL": "https://bml-e3uz.onrender.com"
        }
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://bml-e3uz.onrender.com",
        "EXPO_PUBLIC_STATIC_BASE_URL": "https://bml-e3uz.onrender.com"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
"""