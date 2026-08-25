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
import { CM, coachingApi, STATUS_LABELS, CoachProfile } from '../../utils/coaching';

export default function CoachDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const p = await coachingApi.myProfile();
      setProfile(p);
      if (p) {
        const [ov, bk, ce] = await Promise.all([
          coachingApi.overview().catch(() => null),
          coachingApi.myBookings('coach').catch(() => []),
          coachingApi.certifications().catch(() => []),
        ]);
        setOverview(ov);
        setBookings(bk);
        setCerts(ce);
      }
    } catch (e) {
      console.error('dashboard load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}><ActivityIndicator size="large" color={CM.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Header router={router} />
        <View style={styles.empty}>
          <Ionicons name="ribbon-outline" size={44} color={CM.sub} />
          <Text style={styles.emptyTitle}>You are not a coach yet</Text>
          <TouchableOpacity style={styles.cta} onPress={() => router.push('/coaching/partnership' as any)}>
            <Text style={styles.ctaText}>Become a Coach</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS_LABELS[profile.status] || STATUS_LABELS.DRAFT;
  const isApproved = profile.status === 'APPROVED';

  return (
    <SafeAreaView style={styles.container}>
      <Header router={router} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.statusCard}>
          <View>
            <Text style={styles.coachName}>{profile.displayName}</Text>
            <Text style={styles.coachHeadline}>{profile.headline || 'Coach'}</Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusChipText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {!isApproved && (
          <TouchableOpacity style={styles.reviewBanner} onPress={() => router.push('/coaching/apply' as any)}>
            <Ionicons name="information-circle" size={20} color={CM.warning} />
            <Text style={styles.reviewBannerText}>
              {profile.status === 'SUBMITTED' || profile.status === 'UNDER_REVIEW'
                ? 'Your application is being reviewed. You will be notified once a decision is made.'
                : 'Your application is not complete. Tap to continue and submit.'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.metricsGrid}>
          <Metric label="Upcoming" value={overview?.upcomingSessions ?? 0} icon="calendar-outline" />
          <Metric label="Completed" value={overview?.completedSessions ?? 0} icon="checkmark-done-outline" />
          <Metric label="Pending" value={overview?.pendingRequests ?? 0} icon="hourglass-outline" />
          <Metric label="Profile views" value={overview?.profileViews ?? 0} icon="eye-outline" />
          <Metric label="Rating" value={overview?.rating ?? 0} icon="star-outline" />
          <Metric label="Reviews" value={overview?.reviewCount ?? 0} icon="chatbubble-outline" />
        </View>

        <Text style={styles.sectionTitle}>Manage</Text>
        <View style={styles.linkGrid}>
          <NavCard icon="person-outline" label="Profile & Services" onPress={() => router.push('/coaching/apply' as any)} />
          <NavCard icon="pricetags-outline" label="Pricing" onPress={() => router.push('/coaching/apply' as any)} />
          <NavCard icon="time-outline" label="Availability" onPress={() => router.push('/coaching/apply' as any)} />
          <NavCard icon="calendar-outline" label="Sessions" onPress={() => router.push('/coaching/my-sessions' as any)} />
        </View>

        <Text style={styles.sectionTitle}>Certifications</Text>
        {certs.length === 0 ? (
          <Text style={styles.emptyLine}>No certifications uploaded.</Text>
        ) : (
          certs.map((c) => (
            <View key={c.id} style={styles.certRow}>
              <Ionicons name="document-text-outline" size={18} color={CM.sub} />
              <Text style={[styles.certName]}>{c.name}</Text>
              <View style={[styles.certStatus, c.status === 'VERIFIED' && { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.certStatusText, c.status === 'VERIFIED' && { color: '#0f7a3d' }]}>{c.status}</Text>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Session requests</Text>
        {bookings.length === 0 ? (
          <Text style={styles.emptyLine}>No session requests yet. They will appear here once players book.</Text>
        ) : (
          bookings.map((b) => (
            <View key={b.id} style={styles.bookingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingTitle}>{b.playerName || 'Player'} · {b.sessionType.replace(/_/g, ' ')}</Text>
                <Text style={styles.bookingSub}>{new Date(b.scheduledStart).toLocaleString()}</Text>
              </View>
              <Text style={styles.bookingStatus}>{b.status}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ router }: any) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.push('/coaching' as any)} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={CM.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Coach Dashboard</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}
function Metric({ label, value, icon }: any) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={20} color={CM.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
function NavCard({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.navCard} onPress={onPress}>
      <Ionicons name={icon} size={22} color={CM.primary} />
      <Text style={styles.navLabel}>{label}</Text>
    </TouchableOpacity>
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
  cta: { marginTop: 18, backgroundColor: CM.primary, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  body: { padding: 16, paddingBottom: 40 },
  statusCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: CM.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: CM.border },
  coachName: { fontSize: 18, fontWeight: '800', color: CM.text },
  coachHeadline: { fontSize: 13, color: CM.sub, marginTop: 2 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusChipText: { fontSize: 12, fontWeight: '800' },
  reviewBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CM.warningBg, borderRadius: 12, padding: 14, marginTop: 14 },
  reviewBannerText: { flex: 1, color: CM.warning, fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: CM.text, marginTop: 22, marginBottom: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metric: { width: '31%', backgroundColor: CM.card, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: CM.border },
  metricValue: { fontSize: 22, fontWeight: '900', color: CM.text, marginTop: 6 },
  metricLabel: { fontSize: 11, color: CM.sub, marginTop: 2, textAlign: 'center' },
  linkGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  navCard: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CM.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: CM.border },
  navLabel: { fontSize: 13.5, fontWeight: '700', color: CM.text },
  emptyLine: { fontSize: 13, color: CM.sub },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CM.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: CM.border },
  certName: { flex: 1, fontSize: 14, fontWeight: '600', color: CM.text },
  certStatus: { backgroundColor: CM.warningBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  certStatusText: { fontSize: 11, fontWeight: '700', color: CM.warning },
  bookingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: CM.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: CM.border },
  bookingTitle: { fontSize: 14, fontWeight: '700', color: CM.text },
  bookingSub: { fontSize: 12, color: CM.sub, marginTop: 2 },
  bookingStatus: { fontSize: 11, fontWeight: '800', color: CM.primary },
});
