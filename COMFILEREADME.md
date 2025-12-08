# 앱 디버깅 실행

   ```bash
   # 서버만 실행
   npx react-native start --reset-cache

   # npx react-native run-android --deviceId R3CW205EESY
   # npx react-native run-android --deviceId ce01160193ca563f03

   npx react-native run-android

   # release 모드로 개발실행
   npx react-native run-android --mode=release
   # 또는
   npx react-native run-ios

   ## 한번에 2대이상의 디바이스로 디버깅할때.
   # debug 빌드
   ```
   npx react-native build-android --mode=debug --deviceId ce01160193ca563f03
   npx react-native build-android --mode=debug --deviceId R3CW205EESY2
   ```

   # 또는 release 빌드
   ```
   npx react-native build-android --mode=release --deviceId ce01160193ca563f03
   npx react-native build-android --mode=release --deviceId R3CW205EESY2
   ```

Bundle 추출
```
cd android
.\gradlew.bat bundleRelease
```
결과물 : \android\app\build\outputs\bundle\release\app-release.aab