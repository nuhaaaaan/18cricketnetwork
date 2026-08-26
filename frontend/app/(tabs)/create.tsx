import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { palette, spacing, radius, typography } from '../../constants/theme';
import SectionHeader from '../../components/ui/SectionHeader';

interface Action {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  route?: string;
  soon?: boolean;
}

const SECTIONS: { heading: string; actions: Action[] }[] = [
  {
    heading: 'Available now',
    actions: [
      { icon: 'storefront-outline', title: 'Register as Seller', desc: 'Sell cricket gear on the marketplace', route: '/sellers/register' },
      { icon: 'ribbon-outline', title: 'Become a Coach', desc: 'Offer technique or mindset coaching', route: '/coaching/become-coach' },
    ],
  },
  {
    heading: 'Coming soon',
    actions: [
      { icon: 'people-outline', title: 'Create a Team', desc: 'Build your squad and manage a roster', soon: true },
      { icon: 'trophy-outline', title: 'Create a Tournament', desc: 'Run a tournament as an organizer', soon: true },
      { icon: 'calendar-outline', title: 'Schedule a Match', desc: 'Friendly, practice or league match', soon: true },
      { icon: 'camera-outline', title: 'Create a Post', desc: 'Share cricket moments and highlights', soon: true },
      { icon: 'location-outline', title: 'List a Ground', desc: 'Register a venue for bookings', soon: true },
      { icon: 'school-outline', title: 'Register an Academy', desc: 'Publish programs and coaches', soon: true },
    ],
  },
];

export default function CreateScreen() {
  const router = useRouter();
  const [note, setNote] = useState<string | null>(null);

  const onPress = (a: Action) => {
    if (a.route) { router.push(a.route as any); return; }
    setNote(`${a.title} is coming soon.`);
    setTimeout(() => setNote(null), 2500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.headerWrap}>
        <Text style={styles.h1}>Create</Text>
        <Text style={styles.sub}>Start something on 18 Cricket Network</Text>
      </View>
      {note && (
        <View style={styles.note}><Text style={styles.noteText}>{note}</Text></View>
      )}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <View key={section.heading} style={{ marginBottom: spacing.xl }}>
            <SectionHeader title={section.heading} />
            <View style={{ gap: spacing.md }}>
              {section.actions.map((a) => (
                <TouchableOpacity
                  key={a.title}
                  activeOpacity={0.85}
                  style={[styles.card, a.soon && styles.cardSoon]}
                  onPress={() => onPress(a)}
                >
                  <View style={styles.icon}><Ionicons name={a.icon} size={22} color={a.soon ? palette.textTertiary : palette.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, a.soon && { color: palette.textSecondary }]}>{a.title}</Text>
                    <Text style={styles.desc}>{a.desc}</Text>
                  </View>
                  {a.soon ? (
                    <View style={styles.soonTag}><Text style={styles.soonText}>Soon</Text></View>
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={palette.textTertiary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  h1: { ...typography.h1, color: palette.textPrimary },
  sub: { ...typography.caption, color: palette.textSecondary, marginTop: 2 },
  note: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: palette.surfaceElevated, borderRadius: radius.md, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  noteText: { ...typography.caption, color: palette.textPrimary },
  scroll: { padding: spacing.lg, paddingTop: 0 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  cardSoon: { opacity: 0.8 },
  icon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: 'rgba(225,29,42,0.10)', alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.bodyStrong, color: palette.textPrimary },
  desc: { ...typography.caption, color: palette.textSecondary, marginTop: 2 },
  soonTag: { backgroundColor: palette.surfaceElevated, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  soonText: { ...typography.micro, color: palette.textSecondary },
});
