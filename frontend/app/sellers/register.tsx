import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { palette, spacing, radius, typography } from '../../constants/theme';
import Screen from '../../components/ui/Screen';
import GlassCard from '../../components/ui/GlassCard';
import { PrimaryButton } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/SkeletonLoader';

const STATUS_COPY: Record<string, { label: string; color: string; note: string }> = {
  draft: { label: 'Draft', color: palette.textSecondary, note: 'Complete your application to submit for review.' },
  pending_review: { label: 'Pending review', color: palette.warning, note: 'Your store is under review. You can list products once approved.' },
  approved: { label: 'Approved', color: palette.success, note: 'Your store is live. You can publish products.' },
  rejected: { label: 'Rejected', color: palette.error, note: 'Your application was not approved. You may update and re-apply.' },
  suspended: { label: 'Suspended', color: palette.error, note: 'Your store is suspended. Contact support.' },
};

export default function SellerRegisterScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const [storeName, setStoreName] = useState('');
  const [sellerType, setSellerType] = useState<'individual' | 'business'>('individual');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const me = await api.get('/sellers/me');
      if (me.data) {
        const s = me.data;
        setExisting(s);
        setStoreName(s.store_name || '');
        setSellerType(s.seller_type || 'individual');
        setContactName(s.contact_name || '');
        setEmail(s.email || '');
        setLocation(s.location || '');
        setDescription(s.description || '');
        setTerms(true);
      }
    } catch { /* not a seller yet */ } finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!isAuthenticated) { router.push('/signup' as any); return; }
    if (!storeName.trim() || !contactName.trim()) { setNotice({ text: 'Store name and contact name are required.', ok: false }); return; }
    if (!terms) { setNotice({ text: 'Please accept the seller terms.', ok: false }); return; }
    setSaving(true); setNotice(null);
    try {
      const res = await api.post('/sellers/register', {
        store_name: storeName.trim(),
        seller_type: sellerType,
        contact_name: contactName.trim(),
        email: email.trim() || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        terms_accepted: true,
      });
      setExisting(res.data);
      setNotice({ text: 'Application submitted! Your store is pending review.', ok: true });
    } catch (e: any) {
      setNotice({ text: e?.response?.data?.detail || 'Could not submit application.', ok: false });
    } finally { setSaving(false); }
  };

  if (loading) {
    return <Screen title="Become a Seller" showBack><Skeleton height={120} radius={radius.lg} /></Screen>;
  }

  const status = existing?.status ? STATUS_COPY[existing.status] : null;

  return (
    <Screen title="Become a Seller" showBack scroll>
      <Text style={styles.lead}>List your cricket gear on the 18 Cricket marketplace. Applications are reviewed before your store goes live.</Text>

      {status && (
        <GlassCard style={{ marginBottom: spacing.lg }}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Store status</Text>
            <View style={[styles.statusChip, { backgroundColor: status.color + '22' }]}>
              <Text style={[styles.statusChipText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={styles.statusNote}>{status.note}</Text>
        </GlassCard>
      )}

      {notice && (
        <View style={[styles.notice, { backgroundColor: notice.ok ? palette.success : palette.error }]}>
          <Text style={styles.noticeText}>{notice.text}</Text>
        </View>
      )}

      <Text style={styles.label}>Store name</Text>
      <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} placeholder="e.g. Cover Drive Cricket Co." placeholderTextColor={palette.textTertiary} />

      <Text style={styles.label}>Seller type</Text>
      <View style={styles.segment}>
        {(['individual', 'business'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.segBtn, sellerType === t && styles.segBtnActive]} onPress={() => setSellerType(t)}>
            <Text style={[styles.segText, sellerType === t && styles.segTextActive]}>{t === 'individual' ? 'Individual' : 'Business'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Contact name</Text>
      <TextInput style={styles.input} value={contactName} onChangeText={setContactName} placeholder="Your name" placeholderTextColor={palette.textTertiary} />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="store@example.com" placeholderTextColor={palette.textTertiary} keyboardType="email-address" autoCapitalize="none" />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City, State" placeholderTextColor={palette.textTertiary} />

      <Text style={styles.label}>About your store</Text>
      <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="What do you sell?" placeholderTextColor={palette.textTertiary} multiline />

      <TouchableOpacity style={styles.terms} onPress={() => setTerms((v) => !v)} activeOpacity={0.8}>
        <Ionicons name={terms ? 'checkbox' : 'square-outline'} size={22} color={terms ? palette.primary : palette.textTertiary} />
        <Text style={styles.termsText}>I accept the seller terms and confirm my listings will be genuine.</Text>
      </TouchableOpacity>

      <View style={{ marginTop: spacing.lg }}>
        <PrimaryButton title={existing ? 'Update application' : 'Submit application'} loading={saving} onPress={submit} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { ...typography.body, color: palette.textSecondary, lineHeight: 21, marginBottom: spacing.lg },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: { ...typography.bodyStrong, color: palette.textPrimary },
  statusChip: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  statusChipText: { ...typography.micro },
  statusNote: { ...typography.caption, color: palette.textSecondary, marginTop: spacing.sm },
  notice: { padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg },
  noticeText: { color: palette.white, ...typography.bodyStrong },
  label: { ...typography.caption, fontWeight: '600', color: palette.textPrimary, marginTop: spacing.md, marginBottom: 6 },
  input: { backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 12, color: palette.textPrimary, ...typography.body, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  textarea: { height: 90, textAlignVertical: 'top' },
  segment: { flexDirection: 'row', backgroundColor: palette.surface, borderRadius: radius.md, padding: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  segBtnActive: { backgroundColor: palette.primary },
  segText: { ...typography.bodyStrong, color: palette.textSecondary },
  segTextActive: { color: palette.white },
  terms: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  termsText: { ...typography.caption, color: palette.textSecondary, flex: 1 },
});
