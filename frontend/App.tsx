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
import MyPageScreen from './screens/MyPageScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegistScreen from './screens/RegistScreen';
import Navbar from './components/Navbar';
import { useAuth } from './libs/hooks/useAuth';

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

function MainNavigator() {
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
      <Tab.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="NoticeDetail"
        component={NoticeDetailScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="FeedDetail"
        component={FeedDetailScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="FeedSave"
        component={FeedSaveScreen}
        options={{
          tabBarButton: () => null,
        }}
      />

    </Tab.Navigator>
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
        {/* {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Regist" component={RegistScreen} />
          </>
        )} */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Regist" component={RegistScreen} />
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppContent />
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

