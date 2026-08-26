import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/format';
import { palette, spacing, radius, typography } from '../constants/theme';
import Screen from '../components/ui/Screen';
import GlassCard from '../components/ui/GlassCard';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/SkeletonLoader';

interface Post {
  id: string;
  user_name: string;
  content: string;
  likes: number;
  comments: number;
  created_at: string;
}

export default function CommunityScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/posts', { params: { limit: 50 } });
      setPosts(res.data ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Screen title="Community" subtitle="Cricket moments from the network" showBack scroll>
      {loading ? (
        <SkeletonList count={3} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="The community is just getting started"
          message="Posts, match moments and highlights shared by players will appear here. Be the first to post."
          actionLabel={isAuthenticated ? 'Create a post' : 'Create your cricket identity'}
          onAction={() => router.push((isAuthenticated ? '/(tabs)/create' : '/signup') as any)}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {posts.map((p) => (
            <GlassCard key={p.id}>
              <View style={styles.row}>
                <View style={styles.avatar}><Ionicons name="person" size={18} color={palette.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{p.user_name}</Text>
                  <Text style={styles.time}>{formatDate(p.created_at)}</Text>
                </View>
              </View>
              <Text style={styles.content}>{p.content}</Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}><Ionicons name="heart-outline" size={13} color={palette.textSecondary} /> {p.likes}</Text>
                <Text style={styles.metaText}><Ionicons name="chatbubble-outline" size={13} color={palette.textSecondary} /> {p.comments}</Text>
              </View>
            </GlassCard>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: 'rgba(225,29,42,0.12)', alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.bodyStrong, color: palette.textPrimary },
  time: { ...typography.caption, color: palette.textTertiary },
  content: { ...typography.body, color: palette.textPrimary, lineHeight: 21 },
  meta: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  metaText: { ...typography.caption, color: palette.textSecondary },
});
