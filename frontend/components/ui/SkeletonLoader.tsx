import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import { palette, radius, spacing } from '../../constants/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}

/** Single shimmering block. */
export function Skeleton({ width = '100%', height = 16, style, radius: r = radius.sm }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ width, height, borderRadius: r, backgroundColor: palette.surfaceElevated, opacity }, style]} />;
}

/** A list of skeleton cards for loading states. */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <Skeleton height={120} radius={radius.md} />
          <Skeleton width="70%" height={16} style={{ marginTop: spacing.md }} />
          <Skeleton width="40%" height={12} style={{ marginTop: spacing.sm }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
});

export default Skeleton;
