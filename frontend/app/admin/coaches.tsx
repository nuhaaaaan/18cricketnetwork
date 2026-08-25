import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CM, coachingApi, STATUS_LABELS } from '../../utils/coaching';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

const FILTERS = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION', 'APPROVED', 'REJECTED', 'SUSPENDED'];

export default function AdminCoachesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState('SUBMITTED');
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const isAdmin = user?.user_type === 'admin';

  const flash = (text: string, ok = true) => {
    setNotice({ text, ok });
    setTimeout(() => setNotice(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coachingApi.adminList(filter);
      setList(data);
    } catch (e: any) {
      if (e?.response?.status === 403) flash('Administrator access required', false);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { if (isAdmin) load(); else setLoading(false); }, [load, isAdmin]);

  const openDetail = async (id: string) => {
    try {
      setDetail(await coachingApi.adminDetail(id));
    } catch { flash('Could not load coach', false); }
  };

  const act = async (fn: () => Promise<any>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      flash(msg);
      setDetail(null);
      setReason('');
      load();
    } catch (e: any) {
      flash(e?.response?.data?.detail || 'Action failed', false);
    } finally {
      setBusy(false);
    }
  };

  const viewCert = async (certId: string) => {
    try {
      const res = await api.get(`/admin/certifications/${certId}/signed-url`);
      const base = (api.defaults.baseURL || '').replace(/\/api$/, '');
      const url = base + res.data.url;
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(url, '_blank');
      else flash('Signed URL generated (open on web to view)');
    } catch { flash('Could not open document', false); }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <Header router={router} />
        <View style={styles.empty}>
          <Ionicons name="lock-closed-outline" size={44} color={CM.sub} />
          <Text style={styles.emptyTitle}>Administrator access required</Text>
          <Text style={styles.emptySub}>Sign in with a platform admin account to review coach applications.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header router={router} />
      {notice && (
        <View style={[styles.notice, { backgroundColor: notice.ok ? CM.success : CM.primary }]}>
          <Text style={styles.noticeText}>{notice.text}</Text>
        </View>
      )}

      {detail ? (
        <ScrollView contentContainerStyle={styles.body}>
          <TouchableOpacity style={styles.backLink} onPress={() => setDetail(null)}>
            <Ionicons name="chevron-back" size={18} color={CM.primary} />
            <Text style={styles.backLinkText}>All applications</Text>
          </TouchableOpacity>

          <View style={styles.detailCard}>
            <Text style={styles.detailName}>{detail.profile.displayName}</Text>
            <Text style={styles.detailSub}>{detail.profile.legalFullName} · {detail.profile.email}</Text>
            <Text style={styles.detailSub}>{[detail.profile.city, detail.profile.country].filter(Boolean).join(', ')}</Text>
            <Badge status={detail.profile.status} />
          </View>

          <DetailSection title={`Services (${detail.services.length})`}>
            {detail.services.map((s: any) => <Text key={s.id} style={styles.line}>• {s.title} ({s.category})</Text>)}
          </DetailSection>
          <DetailSection title={`Pricing (${detail.pricing.length})`}>
            {detail.pricing.map((p: any) => <Text key={p.id} style={styles.line}>• {p.currency} {p.price} · {p.sessionType} · {p.durationMinutes}min</Text>)}
          </DetailSection>
          <DetailSection title={`Certifications (${detail.certifications.length})`}>
            {detail.certifications.map((c: any) => (
              <View key={c.id} style={styles.certRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.line}>{c.name} — {c.issuer}</Text>
                  <Text style={styles.certStatus}>{c.status}</Text>
                </View>
                <TouchableOpacity style={styles.smallBtn} onPress={() => viewCert(c.id)}>
                  <Text style={styles.smallBtnText}>View</Text>
                </TouchableOpacity>
                {c.status !== 'VERIFIED' && (
                  <TouchableOpacity style={[styles.smallBtn, styles.verifyBtn]} onPress={() => act(() => coachingApi.adminVerifyCert(c.id), 'Certification verified')}>
                    <Text style={[styles.smallBtnText, { color: '#fff' }]}>Verify</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </DetailSection>
          <DetailSection title={`Availability (${detail.availability.length})`}>
            {detail.availability.map((a: any) => <Text key={a.id} style={styles.line}>• {a.dayOfWeek} {a.startTime}–{a.endTime} ({a.timezone})</Text>)}
          </DetailSection>

          <TextInput style={styles.reasonInput} value={reason} onChangeText={setReason} placeholder="Reason / note (for reject or request info)" placeholderTextColor={CM.sub} />

          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionBtn, styles.approve]} disabled={busy} onPress={() => act(() => coachingApi.adminApprove(detail.profile.id), 'Coach approved & published')}>
              <Text style={styles.actionText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.reject]} disabled={busy} onPress={() => act(() => coachingApi.adminReject(detail.profile.id, reason), 'Application rejected')}>
              <Text style={styles.actionText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.info]} disabled={busy} onPress={() => act(() => coachingApi.adminRequestInfo(detail.profile.id, reason), 'More info requested')}>
              <Text style={styles.actionText}>Request Info</Text>
            </TouchableOpacity>
            {detail.profile.status === 'APPROVED' && (
              <TouchableOpacity style={[styles.actionBtn, styles.suspend]} disabled={busy} onPress={() => act(() => coachingApi.adminSuspend(detail.profile.id, reason), 'Coach suspended')}>
                <Text style={styles.actionText}>Suspend</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterStrip} contentContainerStyle={styles.filterContent}>
            {FILTERS.map((f) => (
              <TouchableOpacity key={f} style={[styles.filterPill, filter === f && styles.filterPillActive]} onPress={() => setFilter(f)}>
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{STATUS_LABELS[f]?.label || f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {loading ? (
            <View style={styles.loading}><ActivityIndicator size="large" color={CM.primary} /></View>
          ) : list.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="documents-outline" size={40} color={CM.sub} />
              <Text style={styles.emptyTitle}>No {STATUS_LABELS[filter]?.label.toLowerCase()} applications</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.body}>
              {list.map((c) => (
                <TouchableOpacity key={c.id} style={styles.listCard} onPress={() => openDetail(c.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listName}>{c.displayName}</Text>
                    <Text style={styles.listSub}>{[c.city, c.country].filter(Boolean).join(', ') || 'Location pending'}</Text>
                    <Text style={styles.listSub}>{(c.specializations || []).join(', ')}</Text>
                  </View>
                  <Badge status={c.status} />
                  <Ionicons name="chevron-forward" size={20} color={CM.sub} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function Header({ router }: any) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={CM.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Coach Review</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}
function Badge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.DRAFT;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}
function DetailSection({ title, children }: any) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CM.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: CM.card, borderBottomWidth: 1, borderBottomColor: CM.border },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: CM.text },
  notice: { paddingVertical: 10, paddingHorizontal: 16 },
  noticeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: CM.text, marginTop: 12, textAlign: 'center' },
  emptySub: { fontSize: 13, color: CM.sub, marginTop: 8, textAlign: 'center' },
  filterStrip: { maxHeight: 56 },
  filterContent: { padding: 12, gap: 8, alignItems: 'center' },
  filterPill: { backgroundColor: CM.card, borderWidth: 1, borderColor: CM.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, height: 36, justifyContent: 'center' },
  filterPillActive: { backgroundColor: CM.primary, borderColor: CM.primary },
  filterText: { fontSize: 13, color: CM.sub, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  body: { padding: 16, paddingBottom: 40 },
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CM.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: CM.border },
  listName: { fontSize: 15, fontWeight: '800', color: CM.text },
  listSub: { fontSize: 12, color: CM.sub, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  backLinkText: { color: CM.primary, fontWeight: '700', fontSize: 14 },
  detailCard: { backgroundColor: CM.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: CM.border, marginBottom: 14 },
  detailName: { fontSize: 20, fontWeight: '900', color: CM.text },
  detailSub: { fontSize: 13, color: CM.sub, marginTop: 3 },
  detailSection: { backgroundColor: CM.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: CM.border, marginBottom: 12 },
  detailSectionTitle: { fontSize: 14, fontWeight: '800', color: CM.text, marginBottom: 8 },
  line: { fontSize: 13, color: CM.text, lineHeight: 20 },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  certStatus: { fontSize: 11, fontWeight: '700', color: CM.warning, marginTop: 2 },
  smallBtn: { borderWidth: 1.5, borderColor: CM.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  smallBtnText: { color: CM.primary, fontWeight: '700', fontSize: 12 },
  verifyBtn: { backgroundColor: CM.success, borderColor: CM.success },
  reasonInput: { backgroundColor: CM.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: CM.border, fontSize: 14, color: CM.text, marginBottom: 14 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flexGrow: 1, minWidth: '46%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  approve: { backgroundColor: CM.success },
  reject: { backgroundColor: '#b91c1c' },
  info: { backgroundColor: CM.warning },
  suspend: { backgroundColor: '#7c2d12' },
});
