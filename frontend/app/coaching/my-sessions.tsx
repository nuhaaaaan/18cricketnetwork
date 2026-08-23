import { useState, useEffect, useCallback } from 'react';
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
  chipBg: '#eef1f4',
};

interface Session {
  id: string;
  title: string;
  coach_name: string;
  category: string;
  session_type: string;
  scheduled_at: string;
  max_participants: number;
  participants: { user_id: string; name: string }[];
  price_per_person: number;
  status: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function MySessionsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/coaching/sessions', { params: { scope: 'mine' } });
      setSessions(res.data);
    } catch (e) {
      console.error('Error loading sessions', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={UI.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Sessions</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={UI.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {sessions.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={56} color={UI.sub} />
              <Text style={styles.empty}>No coaching sessions yet.</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/coaching' as any)}>
                <Text style={styles.browseText}>Find a coach</Text>
              </TouchableOpacity>
            </View>
          )}
          {sessions.map((s) => (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.typeTag, s.session_type === 'group' ? styles.groupTag : styles.soloTag]}>
                  <Text style={styles.typeTagText}>
                    {s.session_type === 'group' ? 'Group' : '1-on-1'}
                  </Text>
                </View>
                <Text style={[styles.statusText, s.status === 'cancelled' && { color: UI.primary }]}>
                  {s.status}
                </Text>
              </View>
              <Text style={styles.title}>{s.title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={UI.sub} />
                <Text style={styles.metaText}>{formatDate(s.scheduled_at)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={14} color={UI.sub} />
                <Text style={styles.metaText}>
                  {s.participants.length}/{s.max_participants} · ₹{s.price_per_person}/person
                </Text>
              </View>
            </View>
          ))}
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
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  empty: { color: UI.sub, fontSize: 15 },
  browseBtn: { backgroundColor: UI.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  browseText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: UI.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: UI.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  groupTag: { backgroundColor: '#e8f0fe' },
  soloTag: { backgroundColor: '#fdeaea' },
  typeTagText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  statusText: { fontSize: 12, fontWeight: '600', color: UI.sub, textTransform: 'capitalize' },
  title: { fontSize: 16, fontWeight: '700', color: UI.text, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  metaText: { fontSize: 13, color: UI.sub },
});
