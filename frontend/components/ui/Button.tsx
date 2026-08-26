import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing, typography } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function PrimaryButton({ title, onPress, loading, disabled, icon, style, fullWidth = true }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, styles.primary, fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={palette.white} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={palette.white} />}
          <Text style={styles.primaryText}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, loading, disabled, icon, style, fullWidth = true }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, styles.secondary, fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={palette.primary} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={palette.primary} />}
          <Text style={styles.secondaryText}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  primary: { backgroundColor: palette.primary },
  primaryText: { ...typography.bodyStrong, color: palette.white },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: palette.primary },
  secondaryText: { ...typography.bodyStrong, color: palette.primary },
  disabled: { opacity: 0.5 },
});
