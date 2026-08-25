import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CM } from '../../utils/coaching';

// The single giant coach form has been replaced by a polished multi-step
// onboarding flow. This route now forwards to the Coach Partnership disclosure
// page, preserving any existing links into "become a coach".
export default function BecomeCoachRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/coaching/partnership' as any);
  }, [router]);
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={CM.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CM.bg },
});
