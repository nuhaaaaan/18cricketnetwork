import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import api from '../../utils/api';

const UI = {
  bg: '#f5f6f8',
  card: '#ffffff',
  text: '#15171a',
  sub: '#6b7280',
  border: '#e6e8eb',
  primary: Colors.primary,
  accentBg: '#fdeaea',
};

interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export default function CoachingHome() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/coaching/categories');
        setCategories(res.data);
      } catch (e) {
        console.error('Error loading coaching categories', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={UI.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coaching</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={UI.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.lead}>
            Level up your game. Choose a coaching track to find expert coaches and book
            one-on-one or group sessions.
          </Text>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              activeOpacity={0.85}
              onPress={() => router.push(`/coaching/${cat.id}` as any)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={cat.icon as any} size={28} color={UI.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryTitle}>{cat.title}</Text>
                <Text style={styles.categoryDesc}>{cat.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={UI.sub} />
            </TouchableOpacity>
          ))}

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.cta, styles.ctaPrimary]}
              onPress={() => router.push('/coaching/become-coach' as any)}
            >
              <Ionicons name="clipboard-outline" size={18} color="#fff" />
              <Text style={styles.ctaPrimaryText}>Become a Coach</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cta, styles.ctaOutline]}
              onPress={() => router.push('/coaching/my-sessions' as any)}
            >
              <Ionicons name="calendar-outline" size={18} color={UI.primary} />
              <Text style={styles.ctaOutlineText}>My Sessions</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: UI.card,
    borderBottomWidth: 1,
    borderBottomColor: UI.border,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: UI.text },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  body: { padding: 16 },
  lead: { fontSize: 15, color: UI.sub, marginBottom: 20, lineHeight: 21 },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: UI.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: UI.border,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: UI.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: { fontSize: 17, fontWeight: '700', color: UI.text, marginBottom: 4 },
  categoryDesc: { fontSize: 13, color: UI.sub, lineHeight: 18 },
  ctaRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaPrimary: { backgroundColor: UI.primary },
  ctaPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ctaOutline: { backgroundColor: UI.card, borderWidth: 1.5, borderColor: UI.primary },
  ctaOutlineText: { color: UI.primary, fontWeight: '700', fontSize: 15 },
});
