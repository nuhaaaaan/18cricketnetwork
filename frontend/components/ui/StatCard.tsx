import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, radius, spacing, typography } from '../../constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  value: { ...typography.h2, color: palette.textPrimary },
  label: { ...typography.caption, color: palette.textSecondary, marginTop: 2 },
});
