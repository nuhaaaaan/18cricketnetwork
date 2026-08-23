import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { palette } from '../constants/theme';

export default function RootLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.surface },
          headerTintColor: palette.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        {/* Full-screen / self-headered routes */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Log in' }} />
        <Stack.Screen name="auth/register" options={{ title: 'Create account' }} />

        {/* Screens that render their own <Screen> header */}
        <Stack.Screen name="cart" options={{ headerShown: false }} />
        <Stack.Screen name="checkout" options={{ headerShown: false }} />
        <Stack.Screen name="community" options={{ headerShown: false }} />
        <Stack.Screen name="sellers/register" options={{ headerShown: false }} />

        {/* Clean-URL redirect aliases */}
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="marketplace" options={{ headerShown: false }} />
        <Stack.Screen name="academies/index" options={{ headerShown: false }} />
        <Stack.Screen name="tournaments/index" options={{ headerShown: false }} />
        <Stack.Screen name="grounds/index" options={{ headerShown: false }} />
        <Stack.Screen name="products/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="tournaments/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="academies/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="grounds/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="coaching/index" options={{ headerShown: false }} />
        <Stack.Screen name="coaching/[category]" options={{ headerShown: false }} />
        <Stack.Screen name="coaching/become-coach" options={{ headerShown: false }} />
        <Stack.Screen name="coaching/my-sessions" options={{ headerShown: false }} />

        {/* Legacy list screens keep their own in-screen headers (friendly titles) */}
        <Stack.Screen name="academies/list" options={{ headerShown: false }} />
        <Stack.Screen name="grounds/list" options={{ headerShown: false }} />
        <Stack.Screen name="tournaments/list" options={{ headerShown: false }} />
        <Stack.Screen name="messages/index" options={{ title: 'Messages' }} />
        <Stack.Screen name="reels/index" options={{ headerShown: false }} />
        <Stack.Screen name="comments/[id]" options={{ title: 'Comments' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
