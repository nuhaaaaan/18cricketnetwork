import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a472a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
        <Stack.Screen name="auth/register" options={{ title: 'Register' }} />
        <Stack.Screen name="products/[id]" options={{ title: 'Product Details' }} />
        <Stack.Screen name="academies/[id]" options={{ title: 'Academy Details' }} />
        <Stack.Screen name="tournaments/[id]" options={{ title: 'Tournament Details' }} />
        <Stack.Screen name="grounds/[id]" options={{ title: 'Ground Details' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}