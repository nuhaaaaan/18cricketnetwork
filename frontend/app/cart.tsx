import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/format';
import { palette, spacing, radius, typography } from '../constants/theme';
import Screen from '../components/ui/Screen';
import EmptyState from '../components/ui/EmptyState';
import { PrimaryButton } from '../components/ui/Button';

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const getTotal = useCartStore((s) => s.getTotal);

  if (items.length === 0) {
    return (
      <Screen title="Cart" showBack padded={false}>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Browse the marketplace and add cricket gear to your cart."
          actionLabel="Go to Marketplace"
          onAction={() => router.replace('/(tabs)/marketplace')}
        />
      </Screen>
    );
  }

  return (
    <Screen title="Cart" showBack scroll padded={false} contentStyle={styles.scroll}>
      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.product_id} style={styles.row}>
            <View style={styles.thumb}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.thumbImg} resizeMode="cover" />
              ) : (
                <Ionicons name="baseball-outline" size={26} color={palette.primary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{item.product_name}</Text>
              <Text style={styles.vendor} numberOfLines={1}>{item.vendor_name}</Text>
              <Text style={styles.price}>{formatCurrency(item.price)}</Text>
            </View>
            <View style={styles.qtyCol}>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => updateQuantity(item.product_id, item.quantity - 1)} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={16} color={palette.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.product_id, item.quantity + 1)} style={styles.qtyBtn}>
                  <Ionicons name="add" size={16} color={palette.textPrimary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => removeItem(item.product_id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.remove}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatCurrency(getTotal())}</Text>
        </View>
        <PrimaryButton title="Proceed to Checkout" icon="arrow-forward" onPress={() => router.push('/checkout' as any)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  list: { gap: spacing.md, paddingTop: spacing.lg },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  name: { ...typography.bodyStrong, color: palette.textPrimary },
  vendor: { ...typography.caption, color: palette.textSecondary, marginTop: 2 },
  price: { ...typography.bodyStrong, color: palette.primary, marginTop: 4 },
  qtyCol: { alignItems: 'flex-end', justifyContent: 'space-between' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { ...typography.bodyStrong, color: palette.textPrimary, minWidth: 20, textAlign: 'center' },
  remove: { ...typography.caption, color: palette.error, marginTop: spacing.sm },
  summary: { marginTop: spacing.xl, gap: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...typography.h3, color: palette.textSecondary },
  summaryValue: { ...typography.h2, color: palette.textPrimary },
});
