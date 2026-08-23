import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function BookingsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    api.get('/bookings')
      .then((response) => setBookings(response.data))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Login to view bookings</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/login')}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {bookings.length === 0 ? (
        <Text style={styles.empty}>No bookings yet</Text>
      ) : (
        bookings.map((booking) => (
          <View key={booking.id} style={styles.card}>
            <Text style={styles.title}>{booking.booking_type} booking</Text>
            <Text style={styles.meta}>{booking.booking_date} · {booking.time_slot}</Text>
            <Text style={styles.meta}>{booking.booking_status} · {booking.payment_status}</Text>
            <Text style={styles.total}>₹{booking.total_amount}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 24 },
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  title: { color: Colors.text, fontWeight: '700', fontSize: 16, textTransform: 'capitalize' },
  meta: { color: Colors.textSecondary, marginTop: 4, textTransform: 'capitalize' },
  total: { color: Colors.primary, fontWeight: '700', marginTop: 12 },
  button: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: Colors.white, fontWeight: '700' },
});
