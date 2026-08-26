import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { palette, spacing, radius, typography } from '../../constants/theme';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/SkeletonLoader';

const STAT_LABELS: Record<string, string> = {
  products: 'Products',
  orders: 'Orders',
  bookings: 'Bookings',
  academies: 'Academies',
  tournaments: 'Tournaments',
  users: 'Users',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/stats/dashboard');
      setStats(res.data ?? {});
    } catch {
      setStats({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const statEntries = stats ? Object.entries(stats).filter(([, v]) => typeof v === 'number') : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.username} numberOfLines={1}>{user?.name || 'My profile'}</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout} accessibilityLabel="Log out">
          <Ionicons name="log-out-outline" size={24} color={palette.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Identity */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={palette.primary} />
          </View>
          <Text style={styles.name}>{user?.name || 'Cricketer'}</Text>
          {!!user?.user_type && (
            <View style={styles.roleChip}>
              <Text style={styles.roleText}>{user.user_type}</Text>
            </View>
          )}
          {!!user?.phone && <Text style={styles.meta}>{user.phone}</Text>}
        </View>

        {/* Real stats */}
        <View style={styles.statsRow}>
          {loading ? (
            <>
              <Skeleton height={64} radius={radius.md} style={{ flex: 1 }} />
              <Skeleton height={64} radius={radius.md} style={{ flex: 1 }} />
              <Skeleton height={64} radius={radius.md} style={{ flex: 1 }} />
            </>
          ) : statEntries.length > 0 ? (
            statEntries.map(([key, value]) => (
              <StatCard key={key} label={STAT_LABELS[key] || key} value={value} />
            ))
          ) : (
            <StatCard label="Activity" value={0} />
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <EmptyState
            icon="baseball-outline"
            title="Your cricket journey starts here"
            message="Posts, matches and achievements you create will appear on your profile."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  username: { ...typography.h2, color: palette.textPrimary, flex: 1 },
  iconButton: { padding: 4 },
  scroll: { paddingBottom: spacing.xxxl },
  identity: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.primary,
  },
  name: { ...typography.h1, color: palette.textPrimary, marginTop: spacing.md },
  roleChip: {
    backgroundColor: 'rgba(225,29,42,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  roleText: { ...typography.micro, color: palette.primary, textTransform: 'capitalize' },
  meta: { ...typography.caption, color: palette.textSecondary, marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg },
  content: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
});
