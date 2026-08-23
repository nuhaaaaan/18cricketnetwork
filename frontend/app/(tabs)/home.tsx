import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/format';
import Logo from '../../components/Logo';
import ChatBotWrapper from '../../components/ChatBot/ChatBotWrapper';
import { palette, spacing, radius, typography, gradients } from '../../constants/theme';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/SkeletonLoader';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  brand?: string;
}

interface Tournament {
  id: string;
  name: string;
  city?: string;
  status?: string;
  tournament_type?: string;
}

const QUICK_ACTIONS = [
  { id: 'shop', name: 'Shop', icon: 'cart', route: '/marketplace', gradient: gradients.brand },
  { id: 'coaching', name: 'Coaching', icon: 'ribbon', route: '/coaching', gradient: gradients.brandBright },
  { id: 'academy', name: 'Academies', icon: 'school', route: '/academies', gradient: gradients.brand },
  { id: 'tournament', name: 'Tournaments', icon: 'trophy', route: '/tournaments', gradient: gradients.brandBright },
  { id: 'ground', name: 'Grounds', icon: 'location', route: '/grounds', gradient: gradients.brand },
  { id: 'community', name: 'Community', icon: 'people', route: '/community', gradient: gradients.brandBright },
] as const;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, t] = await Promise.allSettled([
      api.get('/products', { params: { limit: 10 } }),
      api.get('/tournaments', { params: { limit: 5 } }),
    ]);
    if (p.status === 'fulfilled') setProducts(p.value.data ?? []);
    if (t.status === 'fulfilled') setTournaments(t.value.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ChatBotWrapper>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        {/* Header */}
        <View style={styles.header}>
          <Logo size="small" />
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/reels' as any)}>
              <Ionicons name="film-outline" size={24} color={palette.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/messages' as any)}>
              <Ionicons name="chatbubble-outline" size={24} color={palette.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Greeting / identity */}
          <View style={styles.greetBlock}>
            <Text style={styles.greetSmall}>{greeting()}{user?.name ? ',' : ''}</Text>
            <Text style={styles.greetName}>{user?.name || 'Welcome to 18 Cricket'}</Text>
            <Text style={styles.greetSub}>Your cricket command center</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <SectionHeader title="Explore Cricket" />
            <View style={styles.grid}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(action.route as any)}
                >
                  <LinearGradient colors={action.gradient} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name={action.icon as any} size={26} color={palette.white} />
                  </LinearGradient>
                  <Text style={styles.actionName}>{action.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Trending Gear (real data) */}
          <View style={styles.section}>
            <SectionHeader title="Trending Gear" actionLabel="See all" onAction={() => router.push('/marketplace' as any)} />
            {loading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.productCard}>
                    <Skeleton height={120} radius={radius.md} />
                    <Skeleton width="80%" height={13} style={{ marginTop: spacing.sm }} />
                    <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
                  </View>
                ))}
              </ScrollView>
            ) : products.length === 0 ? (
              <EmptyState
                icon="bag-handle-outline"
                title="Marketplace is opening soon"
                message="No cricket gear has been listed yet. Verified sellers will appear here once approved."
                actionLabel="Become a Seller"
                onAction={() => router.push('/sellers/register' as any)}
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {products.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productCard}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/products/${product.id}` as any)}
                  >
                    <View style={styles.productImage}>
                      {product.images?.[0] ? (
                        <Image source={{ uri: product.images[0] }} style={styles.productImageInner} resizeMode="cover" />
                      ) : (
                        <Ionicons name="baseball-outline" size={36} color={palette.primary} />
                      )}
                    </View>
                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Tournaments (real data) */}
          <View style={styles.section}>
            <SectionHeader title="Tournaments" actionLabel="See all" onAction={() => router.push('/tournaments' as any)} />
            {loading ? (
              <Skeleton height={90} radius={radius.lg} />
            ) : tournaments.length === 0 ? (
              <EmptyState icon="trophy-outline" title="No tournaments yet" message="Tournaments near you will show up here once organizers create them." />
            ) : (
              tournaments.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.tournamentCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/tournaments/${t.id}` as any)}
                >
                  <View style={styles.tournamentIcon}>
                    <Ionicons name="trophy" size={22} color={palette.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tournamentName} numberOfLines={1}>{t.name}</Text>
                    <Text style={styles.tournamentMeta}>
                      {[t.tournament_type, t.city, t.status].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={palette.textTertiary} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ChatBotWrapper>
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
  headerIcons: { flexDirection: 'row', gap: spacing.lg },
  iconButton: { padding: 4 },
  scroll: { paddingBottom: spacing.xxxl },
  greetBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  greetSmall: { ...typography.caption, color: palette.textSecondary },
  greetName: { ...typography.h1, color: palette.textPrimary, marginTop: 2 },
  greetSub: { ...typography.caption, color: palette.textTertiary, marginTop: 4 },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actionCard: { width: '30%', alignItems: 'center' },
  actionGradient: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionName: { ...typography.caption, color: palette.textPrimary, fontWeight: '600' },
  productCard: { width: 150, marginRight: spacing.md },
  productImage: {
    height: 120,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  productImageInner: { width: '100%', height: '100%' },
  productName: { ...typography.bodyStrong, color: palette.textPrimary, marginTop: spacing.sm },
  productPrice: { ...typography.caption, color: palette.primary, fontWeight: '700', marginTop: 2 },
  tournamentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  tournamentIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(225,29,42,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tournamentName: { ...typography.bodyStrong, color: palette.textPrimary },
  tournamentMeta: { ...typography.caption, color: palette.textSecondary, marginTop: 2, textTransform: 'capitalize' },
});
