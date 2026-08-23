import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const hydrateCart = useCartStore((state) => state.hydrate);

  useEffect(() => {
    loadUser();
    hydrateCart();
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
        <Stack.Screen name="products/create" options={{ title: 'Add Product' }} />
        <Stack.Screen name="academies/[id]" options={{ title: 'Academy Details' }} />
        <Stack.Screen name="academies/list" options={{ headerShown: false }} />
        <Stack.Screen name="tournaments/[id]" options={{ title: 'Tournament Details' }} />
        <Stack.Screen name="tournaments/list" options={{ headerShown: false }} />
        <Stack.Screen name="grounds/[id]" options={{ title: 'Ground Details' }} />
        <Stack.Screen name="grounds/list" options={{ headerShown: false }} />
        <Stack.Screen name="cart" options={{ title: 'Cart' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="orders/index" options={{ title: 'Orders' }} />
        <Stack.Screen name="bookings/index" options={{ title: 'Bookings' }} />
        <Stack.Screen name="social/create-post" options={{ title: 'New Post' }} />
        <Stack.Screen name="profile/settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="messages/index" options={{ headerShown: false }} />
        <Stack.Screen name="reels/index" options={{ headerShown: false }} />
        <Stack.Screen name="comments/[id]" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}