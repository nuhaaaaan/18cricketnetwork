import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CM, coachingApi } from '../../utils/coaching';

export default function DiscoverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ specialization?: string; virtual?: string; inPerson?: string }>();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [facets, setFacets] = useState<{ countries: string[]; cities: string[]; specializations: string[] }>({ countries: [], cities: [], specializations: [] });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<any>({
    specialization: params.specialization || '',
    virtual: params.virtual === '1',
    inPerson: params.inPerson === '1',
    country: '',
    city: '',
    verifiedOnly: false,
  });

  const buildParams = useCallback(() => {
    const p: any = { limit: 50 };
    if (search.trim()) p.search = search.trim();
    if (filters.specialization) p.specialization = filters.specialization;
    if (filters.virtual) p.virtual = true;
    if (filters.inPerson) p.inPerson = true;
    if (filters.country) p.country = filters.country;
    if (filters.city) p.city = filters.city;
    if (filters.verifiedOnly) p.verifiedOnly = true;
    return p;
  }, [search, filters]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [disc, fac] = await Promise.all([coachingApi.discover(buildParams()), coachingApi.facets()]);
      setResults(disc.results);
      setFacets(fac);
    } catch (e) {
      console.error('discover load error', e);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFilter = (key: string, value?: any) => {
    setFilters((f: any) => ({ ...f, [key]: value !== undefined ? (f[key] === value ? '' : value) : !f[key] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CM.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find a Coach</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={CM.sub} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search coaches, specializations..."
          placeholderTextColor={CM.sub}
          onSubmitEditing={load}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={load}>
          <Text style={styles.searchGo}>Go</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterStrip} contentContainerStyle={styles.filterStripContent}>
        <FilterPill label="Virtual" active={filters.virtual} onPress={() => toggleFilter('virtual')} icon="videocam-outline" />
        <FilterPill label="In-person" active={filters.inPerson} onPress={() => toggleFilter('inPerson')} icon="location-outline" />
        <FilterPill label="Verified quals" active={filters.verifiedOnly} onPress={() => toggleFilter('verifiedOnly')} icon="ribbon-outline" />
        {['Batting', 'Fast Bowling', 'Spin Bowling', 'Wicketkeeping', 'Fielding', 'Mental Performance'].map((s) => (
          <FilterPill key={s} label={s} active={filters.specialization === s} onPress={() => toggleFilter('specialization', s)} />
        ))}
      </ScrollView>

      {(facets.countries.length > 0 || facets.cities.length > 0) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterStrip2} contentContainerStyle={styles.filterStripContent}>
          {facets.countries.map((c) => (
            <FilterPill key={`co-${c}`} label={c} active={filters.country === c} onPress={() => toggleFilter('country', c)} icon="flag-outline" />
          ))}
          {facets.cities.map((c) => (
            <FilterPill key={`ci-${c}`} label={c} active={filters.city === c} onPress={() => toggleFilter('city', c)} icon="business-outline" />
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={CM.primary} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={44} color={CM.sub} />
          <Text style={styles.emptyTitle}>No verified coaches match your search</Text>
          <Text style={styles.emptySub}>
            Every coach is reviewed and approved before appearing here. Try clearing filters, or apply
            to become a coach yourself.
          </Text>
          <TouchableOpacity style={styles.emptyCta} onPress={() => router.push('/coaching/partnership' as any)}>
            <Text style={styles.emptyCtaText}>Apply to Become a Coach</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.count}>{results.length} verified {results.length === 1 ? 'coach' : 'coaches'}</Text>
          {results.map((c) => (
            <TouchableOpacity key={c.id} style={styles.card} onPress={() => router.push(`/coaching/coach/${c.id}` as any)} activeOpacity={0.85}>
              <View style={styles.cardHead}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(c.displayName)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{c.displayName}</Text>
                    <Ionicons name="checkmark-circle" size={16} color={CM.primary} />
                  </View>
                  {c.headline ? <Text style={styles.headline} numberOfLines={1}>{c.headline}</Text> : null}
                  <View style={styles.metaRow}>
                    {c.city ? (
                      <>
                        <Ionicons name="location-outline" size={12} color={CM.sub} />
                        <Text style={styles.meta}>{[c.city, c.country].filter(Boolean).join(', ')}</Text>
                      </>
                    ) : null}
                    {c.yearsCoaching ? (
                      <>
                        <Ionicons name="ribbon-outline" size={12} color={CM.sub} style={{ marginLeft: 8 }} />
                        <Text style={styles.meta}>{c.yearsCoaching} yrs</Text>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>
              <View style={styles.tagRow}>
                {c.virtualAvailable ? <Tag icon="videocam-outline" label="Virtual" /> : null}
                {c.inPersonAvailable ? <Tag icon="location-outline" label="In-person" /> : null}
                {(c.specializations || []).slice(0, 2).map((s: string) => (
                  <View key={s} style={styles.specChip}><Text style={styles.specChipText}>{s}</Text></View>
                ))}
              </View>
              <View style={styles.cardFoot}>
                <Text style={styles.price}>
                  {c.fromPrice ? `From ${c.fromPrice.currency} ${c.fromPrice.price}` : 'Pricing on profile'}
                </Text>
                <View style={styles.viewBtn}>
                  <Text style={styles.viewBtnText}>View profile</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function FilterPill({ label, active, onPress, icon }: any) {
  return (
    <TouchableOpacity style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
      {icon ? <Ionicons name={icon} size={13} color={active ? '#fff' : CM.sub} /> : null}
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
function Tag({ icon, label }: any) {
  return (
    <View style={styles.tag}>
      <Ionicons name={icon} size={12} color={CM.primary} />
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}
function initials(name?: string) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CM.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: CM.card, borderBottomWidth: 1, borderBottomColor: CM.border },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: CM.text },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: CM.card, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: CM.border },
  searchInput: { flex: 1, fontSize: 15, color: CM.text },
  searchGo: { color: CM.primary, fontWeight: '800', fontSize: 14 },
  filterStrip: { maxHeight: 52, marginTop: 12 },
  filterStrip2: { maxHeight: 52, marginTop: 4 },
  filterStripContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: CM.card, borderWidth: 1, borderColor: CM.border, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, height: 36 },
  pillActive: { backgroundColor: CM.primary, borderColor: CM.primary },
  pillText: { fontSize: 13, color: CM.sub, fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: CM.text, marginTop: 14, textAlign: 'center' },
  emptySub: { fontSize: 13.5, color: CM.sub, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  emptyCta: { marginTop: 20, backgroundColor: CM.primary, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12 },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  body: { padding: 16, paddingBottom: 40 },
  count: { fontSize: 13, color: CM.sub, fontWeight: '600', marginBottom: 12 },
  card: { backgroundColor: CM.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: CM.border },
  cardHead: { flexDirection: 'row', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: CM.accentBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: CM.primary, fontWeight: '800', fontSize: 17 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '800', color: CM.text },
  headline: { fontSize: 13, color: CM.sub, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 },
  meta: { fontSize: 12, color: CM.sub },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: CM.accentBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  tagText: { fontSize: 11.5, color: CM.primary, fontWeight: '700' },
  specChip: { backgroundColor: CM.chipBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  specChipText: { fontSize: 11.5, color: '#374151', fontWeight: '600' },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  price: { fontSize: 14, fontWeight: '800', color: CM.text },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: CM.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  viewBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
