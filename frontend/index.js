import { registerRootComponent } from 'expo';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';

// 백그라운드 / 종료 상태에서 FCM 메시지 수신 핸들러 (앱 시작 전 등록 필수)
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  // 알림은 FCM이 OS에 자동으로 표시함 — 여기서는 추가 로직만 처리
  console.log('Background message received:', remoteMessage);
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
