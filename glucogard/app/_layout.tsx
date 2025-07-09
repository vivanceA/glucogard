import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/context/AuthContext';
import { WebAuthProvider } from '@/components/WebAuthProvider';
import { initializeI18n } from '@/lib/i18n';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    initializeI18n();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <WebAuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="web-dashboard" />
            <Stack.Screen name="research-portal" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </WebAuthProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
