import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../components/Logo';
import { palette, spacing, radius, typography, gradients, shadow } from '../constants/theme';

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  route: string;
}

const FEATURES: Feature[] = [
  { icon: 'cart', title: 'Shop Cricket Gear', desc: 'Buy from verified sellers', route: '/marketplace' },
  { icon: 'school', title: 'Find Academies', desc: 'Train with the best', route: '/academies' },
  { icon: 'trophy', title: 'Join Tournaments', desc: 'Compete and win', route: '/tournaments' },
  { icon: 'people', title: 'Cricket Community', desc: 'Connect with players', route: '/community' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;
  const glow = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/(tabs)/home');
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.8, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, [fade, rise, glow]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="light" />
        <Text style={styles.loading}>Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {/* Ambient glow backdrop */}
      <Animated.View style={[styles.ambient, { opacity: glow }]} pointerEvents="none">
        <LinearGradient colors={['rgba(225,29,42,0.35)', 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
          <View style={styles.hero}>
            <Logo size="xlarge" />
            <Text style={styles.tagline}>The operating system for cricket</Text>
            <Text style={styles.sub}>Identity · Teams · Matches · Tournaments · Marketplace · Community</Text>
          </View>

          <View style={styles.features}>
            {FEATURES.map((f) => (
              <TouchableOpacity
                key={f.title}
                activeOpacity={0.85}
                style={styles.card}
                onPress={() => router.push(f.route as any)}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name={f.icon} size={22} color={palette.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{f.title}</Text>
                  <Text style={styles.cardDesc}>{f.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={palette.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.cta}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/signup' as any)} style={styles.primaryWrap}>
              <LinearGradient colors={gradients.brandBright} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
                <Ionicons name="finger-print" size={18} color={palette.white} />
                <Text style={styles.primaryText}>Create Cricket Identity</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/login' as any)} style={styles.secondary}>
              <Text style={styles.secondaryText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  loading: { ...typography.body, color: palette.textSecondary },
  ambient: { position: 'absolute', top: -120, left: -60, right: -60, height: 360 },
  scroll: { flexGrow: 1, padding: spacing.xl, paddingTop: spacing.xxxl },
  hero: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xxl },
  tagline: { ...typography.h1, color: palette.textPrimary, marginTop: spacing.xl, textAlign: 'center' },
  sub: { ...typography.caption, color: palette.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  features: { gap: spacing.md, marginBottom: spacing.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  cardIcon: {
    width: 46, height: 46, borderRadius: radius.md,
    backgroundColor: 'rgba(225,29,42,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  cardDesc: { ...typography.caption, color: palette.textSecondary, marginTop: 2 },
  cta: { gap: spacing.md },
  primaryWrap: { borderRadius: radius.md, ...shadow.glow },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 16, borderRadius: radius.md },
  primaryText: { ...typography.bodyStrong, color: palette.white, fontSize: 16 },
  secondary: { paddingVertical: 16, borderRadius: radius.md, alignItems: 'center', borderWidth: 1.5, borderColor: palette.borderStrong },
  secondaryText: { ...typography.bodyStrong, color: palette.textPrimary },
});
