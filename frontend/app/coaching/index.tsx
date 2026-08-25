import { useState, useEffect, useCallback } from 'react';
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
import { CM, coachingApi, CoachProfile } from '../../utils/coaching';

const CATEGORY_CARDS = [
  { key: 'Batting', label: 'Batting', icon: 'baseball-outline' },
  { key: 'Fast Bowling', label: 'Bowling', icon: 'flash-outline' },
  { key: 'Wicketkeeping', label: 'Wicketkeeping', icon: 'hand-left-outline' },
  { key: 'Fielding', label: 'Fielding', icon: 'accessibility-outline' },
  { key: 'Strength & Conditioning', label: 'Performance', icon: 'barbell-outline' },
  { key: 'Mental Performance', label: 'Mindset', icon: 'bulb-outline' },
];

export default function CoachingHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [approvedCount, setApprovedCount] = useState(0);
  const [myProfile, setMyProfile] = useState<CoachProfile | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [disc, mine] = await Promise.all([
        coachingApi.discover({ limit: 1 }),
        coachingApi.myProfile().catch(() => null),
      ]);
      setApprovedCount(disc.count);
      setMyProfile(mine);
    } catch (e) {
      console.error('coaching home load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const becomeCoachLabel = myProfile
    ? myProfile.status === 'APPROVED'
      ? 'Coach Dashboard'
      : 'Continue Application'
    : 'Become a Coach';

  const onBecomeCoach = () => {
    if (myProfile?.status === 'APPROVED') router.push('/coaching/dashboard' as any);
    else if (myProfile) router.push('/coaching/apply' as any);
    else router.push('/coaching/partnership' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CM.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coaching</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={CM.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Train Smarter. Find the Right Coach.</Text>
            <Text style={styles.heroSub}>
              Connect with verified cricket coaches for technique, performance and mindset
              training.
            </Text>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={[styles.heroBtn, styles.heroBtnPrimary]}
                onPress={() => router.push('/coaching/discover' as any)}
              >
                <Ionicons name="search" size={16} color="#fff" />
                <Text style={styles.heroBtnPrimaryText}>Find a Coach</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.heroBtn, styles.heroBtnGhost]}
                onPress={onBecomeCoach}
              >
                <Ionicons name="ribbon-outline" size={16} color="#fff" />
                <Text style={styles.heroBtnGhostText}>{becomeCoachLabel}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.mySessions}
              onPress={() => router.push('/coaching/my-sessions' as any)}
            >
              <Ionicons name="calendar-outline" size={15} color="#fde8e8" />
              <Text style={styles.mySessionsText}>My Sessions</Text>
            </TouchableOpacity>
          </View>

          {myProfile && myProfile.status !== 'APPROVED' && (
            <TouchableOpacity
              style={styles.appBanner}
              onPress={() => router.push('/coaching/apply' as any)}
            >
              <Ionicons name="document-text-outline" size={20} color={CM.warning} />
              <Text style={styles.appBannerText}>
                Your coach application is <Text style={{ fontWeight: '800' }}>{myProfile.status}</Text>.
                Tap to continue.
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Explore coaching</Text>
          <View style={styles.grid}>
            {CATEGORY_CARDS.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={styles.gridCard}
                onPress={() =>
                  router.push(`/coaching/discover?specialization=${encodeURIComponent(c.key)}` as any)
                }
              >
                <View style={styles.gridIcon}>
                  <Ionicons name={c.icon as any} size={24} color={CM.primary} />
                </View>
                <Text style={styles.gridLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formatRow}>
            <TouchableOpacity
              style={styles.formatCard}
              onPress={() => router.push('/coaching/discover?virtual=1' as any)}
            >
              <Ionicons name="videocam-outline" size={20} color={CM.primary} />
              <Text style={styles.formatLabel}>Virtual Coaching</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.formatCard}
              onPress={() => router.push('/coaching/discover?inPerson=1' as any)}
            >
              <Ionicons name="location-outline" size={20} color={CM.primary} />
              <Text style={styles.formatLabel}>Nearby Coaches</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Verified coaches</Text>
          {approvedCount === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={40} color={CM.sub} />
              <Text style={styles.emptyTitle}>No verified coaches are available yet.</Text>
              <Text style={styles.emptySub}>
                Every coach on 18 Cricket Network is reviewed and approved before appearing here.
                Be the first to join.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => router.push('/coaching/partnership' as any)}
              >
                <Text style={styles.emptyCtaText}>Apply to Become a Coach</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.discoverCard}
              onPress={() => router.push('/coaching/discover' as any)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.discoverCount}>{approvedCount}</Text>
                <Text style={styles.discoverLabel}>
                  verified {approvedCount === 1 ? 'coach' : 'coaches'} available
                </Text>
              </View>
              <View style={styles.discoverBtn}>
                <Text style={styles.discoverBtnText}>Browse</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CM.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: CM.card,
    borderBottomWidth: 1,
    borderBottomColor: CM.border,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: CM.text },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  body: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: CM.primary,
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
  },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 28 },
  heroSub: { color: '#fde8e8', fontSize: 14, marginTop: 8, lineHeight: 20 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  heroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  heroBtnPrimary: { backgroundColor: CM.primaryDark },
  heroBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  heroBtnGhost: { backgroundColor: 'rgba(255,255,255,0.16)' },
  heroBtnGhostText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  mySessions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, justifyContent: 'center' },
  mySessionsText: { color: '#fde8e8', fontWeight: '600', fontSize: 13 },
  appBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: CM.warningBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  appBannerText: { flex: 1, color: CM.warning, fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: CM.text, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: {
    width: '31%',
    backgroundColor: CM.card,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CM.border,
  },
  gridIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CM.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridLabel: { fontSize: 12, fontWeight: '600', color: CM.text, textAlign: 'center' },
  formatRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 24 },
  formatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: CM.card,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: CM.border,
  },
  formatLabel: { fontSize: 13, fontWeight: '700', color: CM.text },
  emptyCard: {
    backgroundColor: CM.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CM.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: CM.text, marginTop: 12, textAlign: 'center' },
  emptySub: { fontSize: 13, color: CM.sub, marginTop: 8, textAlign: 'center', lineHeight: 19 },
  emptyCta: {
    marginTop: 18,
    backgroundColor: CM.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CM.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: CM.border,
  },
  discoverCount: { fontSize: 30, fontWeight: '900', color: CM.primary },
  discoverLabel: { fontSize: 13, color: CM.sub, marginTop: 2 },
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CM.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  discoverBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
