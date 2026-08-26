import { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/format';
import { palette, spacing, radius, typography } from '../constants/theme';
import Screen from '../components/ui/Screen';
import EmptyState from '../components/ui/EmptyState';
import { PrimaryButton } from '../components/ui/Button';

export default function CheckoutScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [placing, setPlacing] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  if (items.length === 0) {
    return (
      <Screen title="Checkout" showBack padded={false}>
        <EmptyState icon="cart-outline" title="Nothing to check out" message="Your cart is empty." actionLabel="Go to Marketplace" onAction={() => router.replace('/(tabs)/marketplace')} />
      </Screen>
    );
  }

  const placeOrder = async () => {
    if (!isAuthenticated) {
      setNotice({ text: 'Please log in to place an order.', ok: false });
      return;
    }
    if (!address.trim() || !city.trim() || !pincode.trim()) {
      setNotice({ text: 'Please fill in your shipping address, city and pincode.', ok: false });
      return;
    }
    setPlacing(true);
    setNotice(null);
    try {
      await api.post('/orders/create', {
        items: items.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          vendor_id: i.vendor_id,
          vendor_name: i.vendor_name,
          quantity: i.quantity,
          price: i.price,
          image: i.image,
        })),
        shipping_address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
      });
      clearCart();
      setNotice({ text: 'Order placed! You can track it under Orders.', ok: true });
      setTimeout(() => router.replace('/(tabs)/marketplace'), 1200);
    } catch (e: any) {
      setNotice({ text: e?.response?.data?.detail || 'Could not place order.', ok: false });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Screen title="Checkout" showBack scroll>
      {notice && (
        <View style={[styles.notice, { backgroundColor: notice.ok ? palette.success : palette.error }]}>
          <Text style={styles.noticeText}>{notice.text}</Text>
        </View>
      )}

      <Text style={styles.section}>Shipping details</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address" placeholderTextColor={palette.textTertiary} />
      <View style={styles.row}>
        <TextInput style={[styles.input, { flex: 1 }]} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={palette.textTertiary} />
        <TextInput style={[styles.input, { flex: 1 }]} value={pincode} onChangeText={setPincode} placeholder="Pincode" placeholderTextColor={palette.textTertiary} keyboardType="numeric" />
      </View>

      <Text style={styles.section}>Order summary</Text>
      <View style={styles.summary}>
        {items.map((i) => (
          <View key={i.product_id} style={styles.summaryRow}>
            <Text style={styles.itemName} numberOfLines={1}>{i.product_name} × {i.quantity}</Text>
            <Text style={styles.itemPrice}>{formatCurrency(i.price * i.quantity)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(getTotal())}</Text>
        </View>
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <PrimaryButton title="Place order" icon="checkmark-circle-outline" loading={placing} onPress={placeOrder} />
      </View>
      <Text style={styles.note}>Payments are not yet enabled — this creates a pending order in your account.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg },
  noticeText: { color: palette.white, ...typography.bodyStrong },
  section: { ...typography.h3, color: palette.textPrimary, marginTop: spacing.lg, marginBottom: spacing.md },
  input: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: palette.textPrimary,
    ...typography.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  summary: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
    gap: spacing.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { ...typography.body, color: palette.textSecondary, flex: 1, marginRight: spacing.md },
  itemPrice: { ...typography.body, color: palette.textPrimary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginVertical: spacing.sm },
  totalLabel: { ...typography.h3, color: palette.textPrimary },
  totalValue: { ...typography.h2, color: palette.primary },
  note: { ...typography.caption, color: palette.textTertiary, marginTop: spacing.md, textAlign: 'center' },
});
