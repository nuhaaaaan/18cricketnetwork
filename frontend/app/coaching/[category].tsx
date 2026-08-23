import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  chipBg: '#eef1f4',
  success: '#0f9d58',
};

const TITLES: Record<string, string> = {
  technique: 'Technique Coaching',
  mindset: 'Mindset Coaching',
};

interface Coach {
  id: string;
  name: string;
  category: string;
  bio: string;
  specializations: string[];
  experience_years: number;
  city: string;
  hourly_rate: number;
  group_rate: number;
  rating: number;
}

interface Participant {
  user_id: string;
  name: string;
}

interface Session {
  id: string;
  title: string;
  coach_name: string;
  session_type: string;
  scheduled_at: string;
  max_participants: number;
  participants: Participant[];
  price_per_person: number;
  status: string;
}

function defaultSchedule(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
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

export default function CoachingCategoryScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const flash = (text: string, ok = true) => {
    setNotice({ text, ok });
    setTimeout(() => setNotice(null), 3500);
  };

  const load = useCallback(async () => {
    if (!category) return;
    try {
      setLoading(true);
      const [coachRes, sessRes] = await Promise.all([
        api.get('/coaches', { params: { category } }),
        api.get('/coaching/sessions', { params: { scope: 'open_groups', category } }),
      ]);
      setCoaches(coachRes.data);
      setSessions(sessRes.data);
    } catch (e) {
      console.error('Error loading coaching data', e);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const bookOneOnOne = async (coach: Coach) => {
    setBusy(true);
    try {
      await api.post('/coaching/sessions', {
        coach_id: coach.id,
        session_type: 'one_on_one',
        scheduled_at: defaultSchedule(2),
        duration_minutes: 60,
        mode: 'in_person',
      });
      flash(`Booked a 1-on-1 with ${coach.name}. See it under My Sessions.`);
    } catch (e: any) {
      flash(e?.response?.data?.detail || 'Could not book session', false);
    } finally {
      setBusy(false);
    }
  };

  const arrangeGroup = async (coach: Coach) => {
    setBusy(true);
    try {
      await api.post('/coaching/sessions', {
        coach_id: coach.id,
        session_type: 'group',
        scheduled_at: defaultSchedule(3),
        duration_minutes: 90,
        mode: 'in_person',
        location: coach.city,
        max_participants: 6,
      });
      flash(`Group session arranged with ${coach.name}. Others can now join.`);
      load();
    } catch (e: any) {
      flash(e?.response?.data?.detail || 'Could not arrange group session', false);
    } finally {
      setBusy(false);
    }
  };

  const joinGroup = async (session: Session) => {
    setBusy(true);
    try {
      await api.post(`/coaching/sessions/${session.id}/join`);
      flash('You joined the group session!');
      load();
    } catch (e: any) {
      flash(e?.response?.data?.detail || 'Could not join session', false);
    } finally {
      setBusy(false);
    }
  };

  const title = TITLES[category as string] || 'Coaching';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={UI.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {notice && (
        <View style={[styles.notice, { backgroundColor: notice.ok ? UI.success : UI.primary }]}>
          <Text style={styles.noticeText}>{notice.text}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={UI.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.sectionTitle}>Coaches</Text>
          {coaches.length === 0 && (
            <Text style={styles.empty}>No coaches listed yet in this track.</Text>
          )}
          {coaches.map((coach) => (
            <View key={coach.id} style={styles.coachCard}>
              <View style={styles.coachHead}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {coach.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coachName}>{coach.name}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={13} color={UI.sub} />
                    <Text style={styles.metaText}>{coach.city}</Text>
                    <Ionicons name="ribbon-outline" size={13} color={UI.sub} style={{ marginLeft: 8 }} />
                    <Text style={styles.metaText}>{coach.experience_years} yrs</Text>
                    {coach.rating > 0 && (
                      <>
                        <Ionicons name="star" size={13} color="#f5a623" style={{ marginLeft: 8 }} />
                        <Text style={styles.metaText}>{coach.rating.toFixed(1)}</Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              <Text style={styles.bio}>{coach.bio}</Text>

              {coach.specializations?.length > 0 && (
                <View style={styles.chipsRow}>
                  {coach.specializations.map((s, i) => (
                    <View key={i} style={styles.chip}>
                      <Text style={styles.chipText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.primaryBtn]}
                  disabled={busy}
                  onPress={() => bookOneOnOne(coach)}
                >
                  <Ionicons name="person-outline" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Book 1-on-1 · ₹{coach.hourly_rate}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.outlineBtn]}
                  disabled={busy}
                  onPress={() => arrangeGroup(coach)}
                >
                  <Ionicons name="people-outline" size={16} color={UI.primary} />
                  <Text style={styles.outlineBtnText}>Group · ₹{coach.group_rate}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Open group sessions</Text>
          {sessions.length === 0 && (
            <Text style={styles.empty}>No open group sessions. Arrange one with a coach above.</Text>
          )}
          {sessions.map((s) => {
            const full = s.participants.length >= s.max_participants;
            return (
              <View key={s.id} style={styles.sessionCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTitle}>{s.title}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={13} color={UI.sub} />
                    <Text style={styles.metaText}>{formatDate(s.scheduled_at)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="people-outline" size={13} color={UI.sub} />
                    <Text style={styles.metaText}>
                      {s.participants.length}/{s.max_participants} joined · ₹{s.price_per_person}/person
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.joinBtn, full && styles.joinBtnDisabled]}
                  disabled={busy || full}
                  onPress={() => joinGroup(s)}
                >
                  <Text style={styles.joinBtnText}>{full ? 'Full' : 'Join'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
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
  notice: { paddingVertical: 10, paddingHorizontal: 16 },
  noticeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  body: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: UI.text, marginBottom: 12 },
  empty: { color: UI.sub, marginBottom: 16 },
  coachCard: {
    backgroundColor: UI.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: UI.border,
  },
  coachHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: UI.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: UI.primary, fontWeight: '800', fontSize: 15 },
  coachName: { fontSize: 16, fontWeight: '700', color: UI.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  metaText: { fontSize: 12, color: UI.sub },
  bio: { fontSize: 14, color: UI.text, lineHeight: 20, marginBottom: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { backgroundColor: UI.chipBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  chipText: { fontSize: 12, color: '#374151', textTransform: 'capitalize' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryBtn: { backgroundColor: UI.primary },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  outlineBtn: { backgroundColor: UI.card, borderWidth: 1.5, borderColor: UI.primary },
  outlineBtnText: { color: UI.primary, fontWeight: '700', fontSize: 13 },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: UI.border,
  },
  sessionTitle: { fontSize: 15, fontWeight: '700', color: UI.text, marginBottom: 4 },
  joinBtn: {
    backgroundColor: UI.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  joinBtnDisabled: { backgroundColor: '#c7ccd1' },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
