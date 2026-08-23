import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/format';
import { palette, spacing, radius, typography } from '../../constants/theme';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/SkeletonLoader';

const EXPLORE = [
  { icon: 'location-outline', label: 'Grounds near you', route: '/grounds' },
  { icon: 'school-outline', label: 'Academies', route: '/academies' },
  { icon: 'trophy-outline', label: 'Tournaments', route: '/tournaments' },
  { icon: 'ribbon-outline', label: 'Coaching', route: '/coaching' },
  { icon: 'bag-handle-outline', label: 'Marketplace', route: '/marketplace' },
  { icon: 'people-outline', label: 'Community', route: '/community' },
] as const;

interface Result { id: string; title: string; subtitle: string; route: string; icon: keyof typeof Ionicons.glyphMap }

export default function DiscoverScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef<any>(null);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    setSearched(true);
    const ql = q.toLowerCase();
    const [prod, acad, grnd, tour] = await Promise.allSettled([
      api.get('/products', { params: { search: q, limit: 20 } }),
      api.get('/academies', { params: { limit: 100 } }),
      api.get('/grounds', { params: { limit: 100 } }),
      api.get('/tournaments', { params: { limit: 100 } }),
    ]);
    const out: Result[] = [];
    if (prod.status === 'fulfilled') {
      for (const p of prod.value.data ?? []) out.push({ id: `p-${p.id}`, title: p.name, subtitle: `Gear · ${formatCurrency(p.price)}`, route: `/products/${p.id}`, icon: 'bag-handle-outline' });
    }
    const match = (s?: string) => (s || '').toLowerCase().includes(ql);
    if (acad.status === 'fulfilled') for (const a of acad.value.data ?? []) if (match(a.name) || match(a.city)) out.push({ id: `a-${a.id}`, title: a.name, subtitle: `Academy · ${a.city || ''}`, route: `/academies/${a.id}`, icon: 'school-outline' });
    if (grnd.status === 'fulfilled') for (const g of grnd.value.data ?? []) if (match(g.name) || match(g.city)) out.push({ id: `g-${g.id}`, title: g.name, subtitle: `Ground · ${g.city || ''}`, route: `/grounds/${g.id}`, icon: 'location-outline' });
    if (tour.status === 'fulfilled') for (const t of tour.value.data ?? []) if (match(t.name) || match(t.city)) out.push({ id: `t-${t.id}`, title: t.name, subtitle: `Tournament · ${t.city || ''}`, route: `/tournaments/${t.id}`, icon: 'trophy-outline' });
    setResults(out);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) { setResults([]); setSearched(false); return; }
    timer.current = setTimeout(() => runSearch(query.trim()), 350);
    return () => timer.current && clearTimeout(timer.current);
  }, [query, runSearch]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.headerWrap}>
        <Text style={styles.h1}>Discover</Text>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={palette.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder="Search players, teams, grounds, gear…"
            placeholderTextColor={palette.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color={palette.textTertiary} /></TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!searched ? (
          <>
            <SectionHeader title="Explore" />
            <View style={styles.grid}>
              {EXPLORE.map((e) => (
                <TouchableOpacity key={e.label} style={styles.tile} activeOpacity={0.85} onPress={() => router.push(e.route as any)}>
                  <Ionicons name={e.icon as any} size={24} color={palette.primary} />
                  <Text style={styles.tileLabel}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : loading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={64} radius={radius.md} /><Skeleton height={64} radius={radius.md} /><Skeleton height={64} radius={radius.md} />
          </View>
        ) : results.length === 0 ? (
          <EmptyState icon="search-outline" title="No results yet" message={`Nothing on 18 Cricket matches “${query}” yet. As players, teams, sellers and organizers join, they'll show up here.`} />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {results.map((r) => (
              <TouchableOpacity key={r.id} style={styles.result} activeOpacity={0.85} onPress={() => router.push(r.route as any)}>
                <View style={styles.resultIcon}><Ionicons name={r.icon} size={18} color={palette.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{r.title}</Text>
                  <Text style={styles.resultSub} numberOfLines={1}>{r.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={palette.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  h1: { ...typography.h1, color: palette.textPrimary, marginBottom: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  input: { flex: 1, paddingVertical: 12, color: palette.textPrimary, ...typography.body },
  scroll: { padding: spacing.lg, paddingTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { width: '47%', backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  tileLabel: { ...typography.bodyStrong, color: palette.textPrimary },
  result: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  resultIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: 'rgba(225,29,42,0.12)', alignItems: 'center', justifyContent: 'center' },
  resultTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  resultSub: { ...typography.caption, color: palette.textSecondary, marginTop: 2 },
});
