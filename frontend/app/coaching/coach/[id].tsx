import { useEffect, useState, useCallback } from 'react';
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
import { CM, coachingApi } from '../../../utils/coaching';

export default function CoachProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState<any>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok = true) => {
    setNotice({ text, ok });
    setTimeout(() => setNotice(null), 3500);
  };

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const c = await coachingApi.publicCoach(id);
      setCoach(c);
      setSelectedPricing(c.pricing?.[0] || null);
    } catch (e) {
      console.error('coach load error', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const book = async () => {
    if (!selectedPricing) return flash('Select a session option first', false);
    setBooking(true);
    try {
      const start = new Date();
      start.setDate(start.getDate() + 3);
      start.setHours(10, 0, 0, 0);
      await coachingApi.book({
        coachId: id,
        pricingId: selectedPricing.id,
        serviceId: selectedPricing.serviceId,
        sessionType: selectedPricing.sessionType,
        deliveryMode: selectedPricing.sessionType.includes('VIRTUAL') ? 'virtual' : 'in_person',
        scheduledStart: start.toISOString(),
        durationMinutes: selectedPricing.durationMinutes,
      });
      flash('Session requested! Track it under My Sessions.');
      setTimeout(() => router.push('/coaching/my-sessions' as any), 1200);
    } catch (e: any) {
      flash(e?.response?.data?.detail || 'Could not request session', false);
    } finally {
      setBooking(false);
    }
  };

  if (loading || !coach) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={CM.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CM.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coach Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {notice && (
        <View style={[styles.notice, { backgroundColor: notice.ok ? CM.success : CM.primary }]}>
          <Text style={styles.noticeText}>{notice.text}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(coach.displayName)}</Text>
          </View>
          <Text style={styles.name}>{coach.displayName}</Text>
          {coach.headline ? <Text style={styles.headline}>{coach.headline}</Text> : null}
          <View style={styles.metaRow}>
            {coach.city ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={CM.sub} />
                <Text style={styles.meta}>{[coach.city, coach.country].filter(Boolean).join(', ')}</Text>
              </View>
            ) : null}
            {coach.yearsCoaching ? (
              <View style={styles.metaItem}>
                <Ionicons name="ribbon-outline" size={14} color={CM.sub} />
                <Text style={styles.meta}>{coach.yearsCoaching} yrs coaching</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color="#f5a623" />
              <Text style={styles.meta}>{coach.reviewCount > 0 ? `${coach.averageRating} (${coach.reviewCount})` : 'New'}</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            {(coach.badges || []).map((b: string) => (
              <View key={b} style={styles.badge}>
                <Ionicons name="shield-checkmark" size={13} color={CM.primary} />
                <Text style={styles.badgeText}>{b}</Text>
              </View>
            ))}
          </View>
          <View style={styles.availRow}>
            {coach.virtualAvailable ? <Pill icon="videocam-outline" label="Virtual" /> : null}
            {coach.inPersonAvailable ? <Pill icon="location-outline" label="In-person" /> : null}
          </View>
        </View>

        {coach.bio ? (
          <Section title="About">
            <Text style={styles.paragraph}>{coach.bio}</Text>
          </Section>
        ) : null}

        {coach.coachingPhilosophy ? (
          <Section title="Coaching philosophy">
            <Text style={styles.paragraph}>{coach.coachingPhilosophy}</Text>
          </Section>
        ) : null}

        {(coach.specializations || []).length > 0 && (
          <Section title="Specializations">
            <View style={styles.chipWrap}>
              {coach.specializations.map((s: string) => (
                <View key={s} style={styles.chip}><Text style={styles.chipText}>{s}</Text></View>
              ))}
            </View>
          </Section>
        )}

        {(coach.services || []).length > 0 && (
          <Section title="Coaching services">
            {coach.services.map((s: any) => (
              <View key={s.id} style={styles.serviceRow}>
                <Ionicons name="tennisball-outline" size={18} color={CM.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.serviceTitle}>{s.title}</Text>
                  <Text style={styles.serviceSub}>{s.category}{s.subcategory ? ` · ${s.subcategory}` : ''}</Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {(coach.qualifications || []).length > 0 && (
          <Section title="Verified qualifications">
            {coach.qualifications.map((q: any, i: number) => (
              <View key={i} style={styles.qualRow}>
                <Ionicons name="shield-checkmark" size={18} color={CM.success} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.serviceTitle}>{q.name}</Text>
                  <Text style={styles.serviceSub}>{q.issuer} · Verified qualification</Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {(coach.pricing || []).length > 0 && (
          <Section title="Choose a session">
            {coach.pricing.map((p: any) => {
              const active = selectedPricing?.id === p.id;
              return (
                <TouchableOpacity key={p.id} style={[styles.priceRow, active && styles.priceRowActive]} onPress={() => setSelectedPricing(p)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.priceType}>{formatFormat(p.sessionType)}</Text>
                    <Text style={styles.priceSub}>{p.durationMinutes} minutes</Text>
                  </View>
                  <Text style={styles.priceValue}>{p.currency} {p.price}</Text>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Section>
        )}

        {(coach.reviews || []).length === 0 ? (
          <Section title="Reviews">
            <Text style={styles.emptyLine}>No reviews yet — be the first after your session.</Text>
          </Section>
        ) : (
          <Section title="Reviews">
            {coach.reviews.map((r: any) => (
              <View key={r.id} style={styles.reviewRow}>
                <Text style={styles.reviewRating}>{'★'.repeat(r.rating)}</Text>
                {r.title ? <Text style={styles.serviceTitle}>{r.title}</Text> : null}
                <Text style={styles.paragraph}>{r.text}</Text>
              </View>
            ))}
          </Section>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerPrice}>
            {selectedPricing ? `${selectedPricing.currency} ${selectedPricing.price}` : 'Select a session'}
          </Text>
          {selectedPricing ? <Text style={styles.footerSub}>{formatFormat(selectedPricing.sessionType)}</Text> : null}
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={book} disabled={booking || !selectedPricing}>
          {booking ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>Book Session</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
function Pill({ icon, label }: any) {
  return (
    <View style={styles.availPill}>
      <Ionicons name={icon} size={13} color={CM.primary} />
      <Text style={styles.availPillText}>{label}</Text>
    </View>
  );
}
function initials(name?: string) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}
function formatFormat(f: string) {
  return f.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CM.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: CM.card, borderBottomWidth: 1, borderBottomColor: CM.border },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: CM.text },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notice: { paddingVertical: 10, paddingHorizontal: 16 },
  noticeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  body: { padding: 16, paddingBottom: 120 },
  hero: { backgroundColor: CM.card, borderRadius: 18, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: CM.border },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: CM.accentBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: CM.primary, fontWeight: '900', fontSize: 26 },
  name: { fontSize: 22, fontWeight: '900', color: CM.text },
  headline: { fontSize: 14, color: CM.sub, marginTop: 4, textAlign: 'center' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12.5, color: CM.sub },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: CM.accentBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 11.5, color: CM.primary, fontWeight: '700' },
  availRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  availPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: CM.chipBg, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  availPillText: { fontSize: 12.5, color: CM.text, fontWeight: '600' },
  section: { backgroundColor: CM.card, borderRadius: 16, padding: 18, marginTop: 14, borderWidth: 1, borderColor: CM.border },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: CM.text, marginBottom: 12 },
  paragraph: { fontSize: 14, color: CM.text, lineHeight: 21 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: CM.chipBg, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  chipText: { fontSize: 12.5, color: '#374151', fontWeight: '600' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  serviceTitle: { fontSize: 14, fontWeight: '700', color: CM.text },
  serviceSub: { fontSize: 12, color: CM.sub, marginTop: 2 },
  qualRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: CM.border, marginBottom: 10 },
  priceRowActive: { borderColor: CM.primary, backgroundColor: CM.accentBg },
  priceType: { fontSize: 14, fontWeight: '700', color: CM.text },
  priceSub: { fontSize: 12, color: CM.sub, marginTop: 2 },
  priceValue: { fontSize: 16, fontWeight: '800', color: CM.primary, marginRight: 12 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: CM.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: CM.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: CM.primary },
  emptyLine: { fontSize: 13, color: CM.sub },
  reviewRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: CM.border },
  reviewRating: { color: '#f5a623', fontSize: 14, marginBottom: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: CM.card, borderTopWidth: 1, borderTopColor: CM.border },
  footerPrice: { fontSize: 18, fontWeight: '900', color: CM.text },
  footerSub: { fontSize: 12, color: CM.sub },
  bookBtn: { backgroundColor: CM.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
