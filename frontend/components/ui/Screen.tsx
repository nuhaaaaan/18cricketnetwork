import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette, spacing, typography } from '../../constants/theme';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * AppShell/Screen — dark-first page scaffold with a consistent header.
 * Replaces the ad-hoc per-screen headers and white/dark inconsistency.
 */
export default function Screen({
  title,
  subtitle,
  showBack = false,
  right,
  scroll = false,
  padded = true,
  children,
  contentStyle,
}: ScreenProps) {
  const router = useRouter();
  const Body = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      {(title || showBack || right) && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {showBack && (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={24} color={palette.textPrimary} />
              </TouchableOpacity>
            )}
            <View style={{ flexShrink: 1 }}>
              {!!title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
              {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
            </View>
          </View>
          {!!right && <View style={styles.headerRight}>{right}</View>}
        </View>
      )}
      <Body
        style={styles.flex}
        contentContainerStyle={[
          scroll && styles.scrollContent,
          padded && styles.padded,
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Body>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backBtn: { marginLeft: -6 },
  title: { ...typography.h2, color: palette.textPrimary },
  subtitle: { ...typography.caption, color: palette.textSecondary, marginTop: 2 },
  scrollContent: { paddingBottom: spacing.xxxl },
  padded: { paddingHorizontal: spacing.lg },
});
