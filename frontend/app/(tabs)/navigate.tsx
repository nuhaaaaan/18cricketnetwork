import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import SearchBar from '../../components/Navigation/SearchBar';
import api from '../../utils/api';

interface Place {
  id: string;
  name: string;
  city?: string;
  location?: string;
  type: 'ground' | 'academy';
  ground_type?: string;
}

export default function NavigateScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/grounds', { params: { limit: 50 } }),
      api.get('/academies', { params: { limit: 50 } }),
    ])
      .then(([grounds, academies]) => {
        setPlaces([
          ...grounds.data.map((item: any) => ({ ...item, type: 'ground' as const })),
          ...academies.data.map((item: any) => ({ ...item, type: 'academy' as const })),
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = places.filter((place) => {
    const haystack = `${place.name} ${place.city || ''} ${place.location || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover nearby</Text>
        <Text style={styles.subtitle}>
          {Platform.OS === 'web' ? 'Search grounds and academies' : 'Map + venue search'}
        </Text>
      </View>
      <View style={styles.search}>
        <SearchBar
          onSelectLocation={(location) => setQuery(location.name)}
          onSearch={async (value) => {
            setQuery(value);
            return [];
          }}
        />
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filtered.map((place) => (
            <TouchableOpacity
              key={`${place.type}-${place.id}`}
              style={styles.card}
              onPress={() =>
                router.push(
                  (place.type === 'ground' ? `/grounds/${place.id}` : `/academies/${place.id}`) as any
                )
              }
            >
              <View style={styles.icon}>
                <Ionicons
                  name={place.type === 'ground' ? 'location' : 'school'}
                  size={22}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{place.name}</Text>
                <Text style={styles.meta}>
                  {place.type} · {place.city || place.location}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
          {filtered.length === 0 && (
            <Text style={styles.empty}>No venues match that search</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  title: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, marginTop: 4 },
  search: { paddingHorizontal: 16, paddingVertical: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { color: Colors.text, fontWeight: '700' },
  meta: { color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 24 },
});
