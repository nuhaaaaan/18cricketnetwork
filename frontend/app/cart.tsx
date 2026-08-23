import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useCartStore } from '../store/cartStore';

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.list}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <TouchableOpacity style={styles.shop} onPress={() => router.push('/(tabs)/marketplace')}>
              <Text style={styles.shopText}>Browse gear</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.product_id} style={styles.card}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : (
                <View style={styles.image} />
              )}
              <View style={styles.info}>
                <Text style={styles.name}>{item.product_name}</Text>
                <Text style={styles.vendor}>{item.vendor_name}</Text>
                <Text style={styles.price}>₹{item.price}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity onPress={() => updateQuantity(item.product_id, item.quantity - 1)}>
                    <Ionicons name="remove-circle-outline" size={24} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qty}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.product_id, item.quantity + 1)}>
                    <Ionicons name="add-circle-outline" size={24} color={Colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeItem(item.product_id)} style={styles.remove}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      {items.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.total}>Total ₹{getTotal()}</Text>
          <TouchableOpacity style={styles.checkout} onPress={() => router.push('/checkout')}>
            <Text style={styles.checkoutText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, flexGrow: 1 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: Colors.text, fontSize: 18, marginTop: 12, marginBottom: 16 },
  shop: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  shopText: { color: Colors.white, fontWeight: '700' },
  card: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  image: { width: 96, height: 96, backgroundColor: Colors.surface },
  info: { flex: 1, padding: 12 },
  name: { color: Colors.text, fontWeight: '700' },
  vendor: { color: Colors.textSecondary, marginTop: 2 },
  price: { color: Colors.primary, fontWeight: '700', marginTop: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  qty: { color: Colors.text, fontWeight: '700' },
  remove: { marginLeft: 'auto' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  checkout: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  checkoutText: { color: Colors.white, fontWeight: '700' },
});
