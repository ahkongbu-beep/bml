import React, { useState, useEffect, useRef } from 'react';
import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();
import Toast from 'react-native-toast-message'
import Navbar from './components/Navbar';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, ActivityIndicator, StyleSheet, BackHandler, Platform, Alert } from 'react-native';
import FeedListScreen from './screens/FeedListScreen';
import FeedSaveScreen from './screens/FeedSaveScreen';
import FeedCommentScreen from './screens/FeedCommentScreen';
import NoticeScreen from './screens/NoticeScreen';
import NoticeDetailScreen from './screens/NoticeDetailScreen';
import MealPlanScreen from './screens/MealPlanScreen';
import MealRegistScreen from './screens/MealRegistScreen';
import MyProfileScreen from './screens/MyProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SplashScreen from './screens/SplashScreen';
import DenyUserScreen from './screens/DenyUserScreen';
import MealMyDetailScreen from './screens/MealMyDetailScreen';
import MealUserDetailScreen from './screens/MealUserDetailScreen';
import LoginScreen from './screens/LoginScreen';
import RegistScreen from './screens/RegistScreen';
import SummaryListScreen from './screens/SummaryListScreen';
import FeedLikeListScreen from './screens/FeedLikeListScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import UserSearchAccount from './screens/UserSearchAccount';
import UserSearchPassword from './screens/UserSearchPassword';
import RegistChildScreen from './screens/RegistChildScreen';
import GoogleConsentScreen from './screens/GoogleConsentScreen';
import MealCopyByFeedScreen from './screens/MealCopyByFeedScreen';
import CommunityScreen from './screens/CommunityScreen';
import CommunityWriteScreen from './screens/CommunityWriteScreen';
import CommunityModifyScreen from './screens/CommunityModifyScreen';
import CommunityDetailScreen from './screens/CommunityDetailScreen';
import MenuListScreen from './screens/MenuListScreen';
import GrowthScreen from './screens/GrowthScreen';
import GrowthReportScreen from './screens/GrowthReportScreen';
import TermsOfServiceScreen from './screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import { AuthProvider, useAuth } from './libs/contexts/AuthContext';
import { getNeedChildRegistration, clearNeedChildRegistration, getNeedGoogleConsent, clearNeedGoogleConsent } from './libs/utils/storage';
import { getMessaging, requestPermission, onMessage } from '@react-native-firebase/messaging';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

// React Query Client 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5분
    },
  },
});

function TabNavigator() {
  const [initialRoute, setInitialRoute] = useState<string>('MealPlan');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkChildRegistration = async () => {
      const needsConsent = await getNeedGoogleConsent();
      if (needsConsent) {
        await clearNeedGoogleConsent();
        setInitialRoute('GoogleConsent');
        setIsChecking(false);
        return;
      }
      const needsRegistration = await getNeedChildRegistration();
      if (needsRegistration) {
        setInitialRoute('RegistChild');
        // 플래그 확인 후 삭제 (한 번만 리다이렉트)
        await clearNeedChildRegistration();
      }
      setIsChecking(false);
    };

    checkChildRegistration();
  }, []);

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9AA2" />
      </View>
    );
  }

  return (
    <Tab.Navigator
      initialRouteName={initialRoute}
      tabBar={(props) => (
        <Navbar
          currentRoute={props.state.routes[props.state.index].name}
          onNavigate={(routeName) => {
            const route = props.state.routes.find((r) => r.name === routeName);
            if (route) {
              props.navigation.navigate(route.name);
            }
          }}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="FeedList" component={FeedListScreen} />
      <Tab.Screen name="Notice" component={NoticeScreen} />
      <Tab.Screen name="MealPlan" component={MealPlanScreen} />
      <Tab.Screen name="MyProfile" component={MyProfileScreen} />
      <Tab.Screen name="FeedLikeList" component={FeedLikeListScreen} />
      <Tab.Screen name="SummaryList" component={SummaryListScreen} />
      <Tab.Screen name="UserProfile" component={UserProfileScreen} />
      <Tab.Screen name="SearchPassword" component={UserSearchPassword} />
      <Tab.Screen name="SearchAccount" component={UserSearchAccount} />
      <Tab.Screen name="RegistChild" component={RegistChildScreen} />
      <Tab.Screen name="GoogleConsent" component={GoogleConsentScreen} />
      <Tab.Screen name="Growth" component={GrowthScreen} />
      <Tab.Screen name="MealCopyByFeed" component={MealCopyByFeedScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="CommunityWrite" component={CommunityWriteScreen} />
      <Tab.Screen name="CommunityModify" component={CommunityModifyScreen} />
      <Tab.Screen name="CommunityDetail" component={CommunityDetailScreen} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="FeedSave" component={FeedSaveScreen} />
      <Stack.Screen name="FeedComment" component={FeedCommentScreen} />
      <Stack.Screen name="NoticeDetail" component={NoticeDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="DenyUser" component={DenyUserScreen} />
      <Stack.Screen name="MealRegist" component={MealRegistScreen} />
      <Stack.Screen name="MealMyDetail" component={MealMyDetailScreen} />
      <Stack.Screen name="MealUserDetail" component={MealUserDetailScreen} />
      <Stack.Screen name="FeedLikeList" component={FeedLikeListScreen} />
      <Stack.Screen name="SummaryList" component={SummaryListScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="SearchPassword" component={UserSearchPassword} />
      <Stack.Screen name="SearchAccount" component={UserSearchAccount} />
      <Stack.Screen name="RegistChild" component={RegistChildScreen} />
      <Stack.Screen name="Growth" component={GrowthScreen} />
      <Stack.Screen name="GrowthReport" component={GrowthReportScreen} />
      <Stack.Screen name="MealCopyByFeed" component={MealCopyByFeedScreen} />
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="CommunityWrite" component={CommunityWriteScreen} />
      <Stack.Screen name="CommunityModify" component={CommunityModifyScreen} />
      <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
      <Stack.Screen name="MenuList" component={MenuListScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const lastBackPress = useRef<number>(0);

  // Android 뒤로가기: 스택이 남아있으면 뒤로, 루트이면 2번 눌러 종료
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        // 스택이 있으면 뒤로가기에 맡김
        return false;
      }
      // 루트 화면에서 2번 눌러 종료
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        BackHandler.exitApp();
        return true;
      }
      lastBackPress.current = now;
      Toast.show({
        type: 'info',
        text1: '한 번 더 누르면 앱이 종료됩니다.',
        position: 'bottom',
        visibilityTime: 2000,
      });
      return true;
    });
    return () => subscription.remove();
  }, []);

  // 알림 권한 요청 (Android 13+ 필수)
  useEffect(() => {
    requestPermission(getMessaging());
  }, []);

  // 포그라운드 상태에서 FCM 메시지 수신
  useEffect(() => {
    const unsubscribe = onMessage(getMessaging(), async (remoteMessage) => {
      const title = remoteMessage.notification?.title ?? '알림';
      const body = remoteMessage.notification?.body ?? '';
      Toast.show({
        type: 'info',
        text1: title,
        text2: body,
        position: 'top',
      });
    });
    return unsubscribe;
  }, []);

  // 스플래시 화면이 끝나면 false로 설정
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // 스플래시 화면 표시
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // 인증 상태 로딩 중
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9AA2" />
      </View>
    );
  }

  // 로그인 여부에 따라 화면 분기
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen
            name="Main"
            component={MainNavigator}
            options={{ animationTypeForReplace: isAuthenticated ? 'push' : 'pop' }}
          />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Regist" component={RegistScreen} />
            <Stack.Screen name="RegistChild" component={RegistChildScreen} />
            <Stack.Screen name="SearchPassword" component={UserSearchPassword} />
            <Stack.Screen name="SearchAccount" component={UserSearchAccount} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </SafeAreaProvider>
      </PaperProvider>
      <Toast />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBF7',
  },
});

