import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CM, coachingApi } from '../../utils/coaching';
import api from '../../utils/api';

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: CM.warning,
  CONFIRMED: CM.success,
  COMPLETED: CM.info,
  CANCELLED: '#b91c1c',
  DECLINED: '#b91c1c',
};

export default function MySessionsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coachingApi.myBookings('player');
      setBookings(data);
    } catch (e) {
      console.error('my-sessions load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CM.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Sessions</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={CM.primary} /></View>
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={44} color={CM.sub} />
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptySub}>Find a verified coach and request your first session.</Text>
          <TouchableOpacity style={styles.cta} onPress={() => router.push('/coaching/discover' as any)}>
            <Text style={styles.ctaText}>Find a Coach</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {bookings.map((b) => (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.coach}>{b.coachName}</Text>
                <Text style={[styles.status, { color: STATUS_COLOR[b.status] || CM.sub }]}>{b.status}</Text>
              </View>
              <Text style={styles.type}>{b.sessionType.replace(/_/g, ' ')}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={CM.sub} />
                <Text style={styles.meta}>{new Date(b.scheduledStart).toLocaleString()}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="pricetag-outline" size={13} color={CM.sub} />
                <Text style={styles.meta}>{b.currency} {b.price} · {b.deliveryMode}</Text>
              </View>
              {['REQUESTED', 'CONFIRMED', 'PENDING_PAYMENT'].includes(b.status) && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={async () => {
                    try {
                      await api.post(`/coaching/bookings/${b.id}/cancel`);
                      load();
                    } catch {}
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CM.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: CM.card, borderBottomWidth: 1, borderBottomColor: CM.border },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: CM.text },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: CM.text, marginTop: 12 },
  emptySub: { fontSize: 13.5, color: CM.sub, marginTop: 8, textAlign: 'center' },
  cta: { marginTop: 18, backgroundColor: CM.primary, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  body: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: CM.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: CM.border },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coach: { fontSize: 16, fontWeight: '800', color: CM.text },
  status: { fontSize: 12, fontWeight: '800' },
  type: { fontSize: 13, color: CM.text, marginTop: 4, textTransform: 'capitalize' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  meta: { fontSize: 12.5, color: CM.sub },
  cancelBtn: { marginTop: 12, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: CM.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  cancelText: { color: CM.primary, fontWeight: '700', fontSize: 13 },
});
