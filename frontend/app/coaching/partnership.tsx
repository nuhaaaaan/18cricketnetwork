import { useEffect, useState } from 'react';
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
import { CM, coachingApi } from '../../utils/coaching';

const POINTS = [
  'Coach applications are reviewed before publication.',
  'Approval is not automatic.',
  'Credentials and experience may be verified.',
  'Coaches determine their eligible session pricing, subject to platform rules.',
  'Different prices may be configured for different coaching services.',
  '18 Cricket Network may charge a platform/service fee on completed sessions.',
  'The exact platform fee/commission is currently to be determined.',
  'Coaches will be informed of the applicable fee before accepting paid bookings.',
  'No platform fee is hard-coded until commercial terms are finalized.',
  'Payment processing fees may apply in the future.',
  'Coaches are responsible for providing accurate professional information.',
  'Fraudulent qualifications may result in suspension/removal.',
  'Coaches must agree to platform Terms, the Coach Agreement and applicable safety/community requirements.',
];

export default function PartnershipScreen() {
  const router = useRouter();
  const [fee, setFee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    coachingApi
      .platformFee()
      .then(setFee)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const feeText =
    fee?.coachPlatformFeeType === 'none'
      ? 'To be determined — no platform fee is currently applied.'
      : fee?.coachPlatformFeeType === 'percentage'
        ? `${fee.coachPlatformFeeValue}% platform fee (effective as disclosed).`
        : fee?.coachPlatformFeeType === 'flat'
          ? `${fee.coachPlatformFeeCurrency} ${fee.coachPlatformFeeValue} flat platform fee.`
          : 'To be determined.';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CM.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coach Partnership</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="ribbon" size={22} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Become an 18 Cricket Network Coach</Text>
          <Text style={styles.heroSub}>
            18 Cricket Network connects cricket players with qualified coaches for physical and
            virtual training.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Before registering, please understand</Text>
        <View style={styles.card}>
          {POINTS.map((p, i) => (
            <View key={i} style={styles.point}>
              <Ionicons name="checkmark-circle" size={18} color={CM.primary} style={{ marginTop: 1 }} />
              <Text style={styles.pointText}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={styles.feeCard}>
          <View style={styles.feeHead}>
            <Ionicons name="pricetag-outline" size={18} color={CM.warning} />
            <Text style={styles.feeTitle}>Current platform fee</Text>
          </View>
          {loading ? (
            <ActivityIndicator color={CM.primary} />
          ) : (
            <Text style={styles.feeText}>{feeText}</Text>
          )}
          <Text style={styles.feeNote}>
            {fee?.note ||
              'Coaches will be informed of the applicable fee before any paid booking features are activated.'}
          </Text>
        </View>

        {showTerms && (
          <View style={styles.card}>
            <Text style={styles.termsTitle}>Coach Terms (summary)</Text>
            <Text style={styles.termsText}>
              By applying you agree to provide accurate professional information, hold any credentials
              you claim, comply with safeguarding and community standards (especially when coaching
              minors), and honor bookings you accept. 18 Cricket Network reviews every application and
              may verify credentials, request more information, or decline or suspend accounts that
              breach these terms. Commercial terms, including any platform/service fee, will be
              disclosed before paid bookings are enabled. Full Terms and the Coach Agreement are
              presented for acceptance during the final step of your application.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/coaching/apply' as any)}
        >
          <Text style={styles.primaryBtnText}>Apply to Become a Coach</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => router.push('/coaching/discover' as any)}
        >
          <Text style={styles.outlineBtnText}>Learn How Coaching Works</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => setShowTerms((s) => !s)}>
          <Text style={styles.ghostBtnText}>{showTerms ? 'Hide Coach Terms' : 'Coach Terms'}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  body: { padding: 16, paddingBottom: 44 },
  hero: {
    backgroundColor: CM.card,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: CM.border,
    marginBottom: 22,
  },
  heroBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CM.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 21, fontWeight: '900', color: CM.text, lineHeight: 27 },
  heroSub: { fontSize: 14, color: CM.sub, marginTop: 8, lineHeight: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: CM.text, marginBottom: 12 },
  card: {
    backgroundColor: CM.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: CM.border,
    marginBottom: 18,
  },
  point: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  pointText: { flex: 1, fontSize: 13.5, color: CM.text, lineHeight: 19 },
  feeCard: {
    backgroundColor: CM.warningBg,
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
  },
  feeHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  feeTitle: { fontSize: 14, fontWeight: '800', color: CM.warning },
  feeText: { fontSize: 14, color: '#7c2d12', fontWeight: '700', marginBottom: 6 },
  feeNote: { fontSize: 12.5, color: '#92400e', lineHeight: 18 },
  termsTitle: { fontSize: 14, fontWeight: '800', color: CM.text, marginBottom: 8 },
  termsText: { fontSize: 13, color: CM.sub, lineHeight: 20 },
  primaryBtn: {
    backgroundColor: CM.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  outlineBtn: {
    marginTop: 12,
    backgroundColor: CM.card,
    borderWidth: 1.5,
    borderColor: CM.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineBtnText: { color: CM.primary, fontWeight: '800', fontSize: 15 },
  ghostBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  ghostBtnText: { color: CM.sub, fontWeight: '700', fontSize: 14 },
});
