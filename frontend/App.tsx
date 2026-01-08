import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import FeedListScreen from './screens/FeedListScreen';
import FeedDetailScreen from './screens/FeedDetailScreen';
import FeedSaveScreen from './screens/FeedSaveScreen';
import NoticeScreen from './screens/NoticeScreen';
import NoticeDetailScreen from './screens/NoticeDetailScreen';
import MealPlanScreen from './screens/MealPlanScreen';
import MealRegistScreen from './screens/MealRegistScreen';
import MyPageScreen from './screens/MyPageScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SplashScreen from './screens/SplashScreen';
import DenyUserScreen from './screens/DenyUserScreen';
import LoginScreen from './screens/LoginScreen';
import RegistScreen from './screens/RegistScreen';
import SummaryListScreen from './screens/SummaryListScreen';
import FeedLikeListScreen from './screens/FeedLikeListScreen';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './libs/contexts/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
  return (
    <Tab.Navigator
      initialRouteName="MyPage"
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
      <Tab.Screen name="MyPage" component={MyPageScreen} />
      <Tab.Screen name="FeedLikeList" component={FeedLikeListScreen} />
      <Tab.Screen name="SummaryList" component={SummaryListScreen} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="FeedDetail" component={FeedDetailScreen} />
      <Stack.Screen name="FeedSave" component={FeedSaveScreen} />
      <Stack.Screen name="NoticeDetail" component={NoticeDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="DenyUser" component={DenyUserScreen} />
      <Stack.Screen name="MealRegist" component={MealRegistScreen} />
      <Stack.Screen name="FeedLikeList" component={FeedLikeListScreen} />
      <Stack.Screen name="SummaryList" component={SummaryListScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();

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
    <NavigationContainer>
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
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
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

