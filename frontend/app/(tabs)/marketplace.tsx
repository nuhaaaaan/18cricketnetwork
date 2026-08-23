import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import api from '../../utils/api';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/format';
import { palette, spacing, radius, typography } from '../../constants/theme';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/SkeletonLoader';

const { width } = Dimensions.get('window');
const GUTTER = spacing.lg;
const COLS = width > 700 ? 3 : 2;
const cardW = (Math.min(width, 900) - GUTTER * (COLS + 1)) / COLS;

interface Product {
  id: string; name: string; price: number; images: string[]; brand?: string; is_used?: boolean;
}

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'bat', name: 'Bats' },
  { id: 'ball', name: 'Balls' },
  { id: 'gloves', name: 'Gloves' },
  { id: 'pads', name: 'Pads' },
  { id: 'shoes', name: 'Shoes' },
  { id: 'accessories', name: 'Accessories' },
];

export default function MarketplaceScreen() {
  const router = useRouter();
  const cartCount = useCartStore((s) => s.items.length);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (category !== 'all') params.category = category;
      if (search) params.search = search;
      const res = await api.get('/products', { params });
      setProducts(res.data ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.h1}>Marketplace</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => router.push('/sellers/register' as any)} style={styles.iconBtn} accessibilityLabel="Become a seller">
            <Ionicons name="storefront-outline" size={24} color={palette.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/cart' as any)} style={styles.iconBtn} accessibilityLabel="Cart">
            <Ionicons name="cart-outline" size={24} color={palette.textPrimary} />
            {cartCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={palette.textTertiary} />
        <TextInput style={styles.searchInput} placeholder="Search cricket gear…" placeholderTextColor={palette.textTertiary} value={search} onChangeText={setSearch} autoCapitalize="none" />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c.id} style={[styles.chip, category === c.id && styles.chipActive]} onPress={() => setCategory(c.id)}>
              <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} width={cardW} height={cardW + 40} radius={radius.lg} />)}
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          icon="storefront-outline"
          title="Marketplace is opening soon"
          message="No cricket gear has been listed yet. Verified sellers will appear here once approved. Be the first cricket seller on 18 Cricket Network."
          actionLabel="Become a Seller"
          onAction={() => router.push('/sellers/register' as any)}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridScroll}>
          <View style={styles.grid}>
            {products.map((p) => (
              <TouchableOpacity key={p.id} style={[styles.card, { width: cardW }]} activeOpacity={0.85} onPress={() => router.push(`/products/${p.id}` as any)}>
                <View style={[styles.imageWrap, { height: cardW }]}>
                  {p.images?.[0] ? (
                    <Image source={{ uri: p.images[0] }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <Ionicons name="baseball-outline" size={36} color={palette.primary} />
                  )}
                  {p.is_used && <View style={styles.usedBadge}><Text style={styles.usedText}>USED</Text></View>}
                </View>
                <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.price}>{formatCurrency(p.price)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  h1: { ...typography.h1, color: palette.textPrimary },
  headerIcons: { flexDirection: 'row', gap: spacing.md },
  iconBtn: { padding: 4 },
  badge: { position: 'absolute', top: -2, right: -4, backgroundColor: palette.primary, borderRadius: radius.pill, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: palette.white, fontSize: 10, fontWeight: '700' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, marginHorizontal: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  searchInput: { flex: 1, paddingVertical: 12, color: palette.textPrimary, ...typography.body },
  cats: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder, backgroundColor: palette.surface, marginRight: spacing.sm },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { ...typography.caption, fontWeight: '600', color: palette.textSecondary },
  chipTextActive: { color: palette.white },
  gridScroll: { paddingBottom: spacing.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GUTTER, paddingHorizontal: GUTTER },
  card: {},
  imageWrap: { borderRadius: radius.lg, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  image: { width: '100%', height: '100%' },
  usedBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: palette.warning, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  usedText: { color: palette.black, fontSize: 10, fontWeight: '700' },
  name: { ...typography.bodyStrong, color: palette.textPrimary, marginTop: spacing.sm },
  price: { ...typography.caption, color: palette.primary, fontWeight: '700', marginTop: 2 },
});
