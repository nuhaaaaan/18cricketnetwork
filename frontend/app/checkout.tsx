import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import api from '../utils/api';
import { notify } from '../utils/notify';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!items.length) {
      notify('Cart is empty');
      return;
    }
    if (!address || !city || !pincode) {
      notify('Missing details', 'Add address, city, and pincode');
      return;
    }

    setLoading(true);
    try {
      const created = await api.post('/orders/create', {
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          vendor_id: item.vendor_id,
          vendor_name: item.vendor_name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        shipping_address: address,
        city,
        pincode,
      });
      await api.post(`/orders/${created.data.id}/payment-success`, {
        razorpay_payment_id: `pay_demo_${Date.now()}`,
      });
      clearCart();
      notify('Order placed', 'Payment confirmed. Track it under Orders.');
      router.replace('/orders');
    } catch (error: any) {
      notify('Checkout failed', error.response?.data?.detail || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Shipping</Text>
      <TextInput style={styles.input} placeholder="Address" placeholderTextColor={Colors.textSecondary} value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="City" placeholderTextColor={Colors.textSecondary} value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="Pincode" placeholderTextColor={Colors.textSecondary} value={pincode} onChangeText={setPincode} keyboardType="number-pad" />

      <Text style={styles.heading}>Summary</Text>
      {items.map((item) => (
        <View key={item.product_id} style={styles.row}>
          <Text style={styles.item}>{item.quantity}× {item.product_name}</Text>
          <Text style={styles.item}>₹{item.price * item.quantity}</Text>
        </View>
      ))}
      <Text style={styles.total}>Pay ₹{getTotal()}</Text>
      <Text style={styles.note}>Demo checkout confirms payment locally when Razorpay keys are not configured.</Text>
      <TouchableOpacity style={styles.button} onPress={placeOrder} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Placing order...' : 'Pay & place order'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  heading: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  input: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, color: Colors.text, borderRadius: 8, padding: 12, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  item: { color: Colors.text },
  total: { color: Colors.primary, fontSize: 20, fontWeight: '700', marginVertical: 16 },
  note: { color: Colors.textSecondary, marginBottom: 16 },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: Colors.white, fontWeight: '700' },
});
