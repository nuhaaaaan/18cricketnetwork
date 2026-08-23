import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import api from '../../utils/api';
import { notify } from '../../utils/notify';
import { useAuthStore } from '../../store/authStore';

const SLOTS = ['6-8AM', '8-10AM', '4-6PM', '6-8PM'];

export default function GroundDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [ground, setGround] = useState<any>(null);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [bookingType, setBookingType] = useState('hourly');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    api.get(`/grounds/${id}`)
      .then((response) => setGround(response.data))
      .catch(() => notify('Unable to load ground'))
      .finally(() => setLoading(false));
  }, [id]);

  const book = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    const amount = ground.pricing?.[bookingType] || ground.pricing?.hourly || 0;
    setBooking(true);
    try {
      await api.post('/bookings', {
        ground_id: ground.id,
        booking_date: new Date().toISOString().slice(0, 10),
        time_slot: slot,
        booking_type: bookingType,
        total_amount: amount,
      });
      notify('Ground booked', `${slot} is confirmed`);
      router.push('/bookings');
    } catch (error: any) {
      notify('Booking failed', error.response?.data?.detail || 'Try another slot');
    } finally {
      setBooking(false);
    }
  };

  if (loading || !ground) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      {ground.images?.[0] ? <Image source={{ uri: ground.images[0] }} style={styles.image} /> : <View style={styles.image} />}
      <View style={styles.body}>
        <Text style={styles.name}>{ground.name}</Text>
        <Text style={styles.meta}>{ground.ground_type} · {ground.location}, {ground.city}</Text>
        <Text style={styles.description}>{ground.description}</Text>
        <View style={styles.chips}>
          {(ground.facilities || []).map((item: string) => (
            <View key={item} style={styles.chip}><Text style={styles.chipText}>{item}</Text></View>
          ))}
        </View>
        <Text style={styles.heading}>Booking type</Text>
        <View style={styles.chips}>
          {Object.keys(ground.pricing || {}).map((key) => (
            <TouchableOpacity key={key} style={[styles.chip, bookingType === key && styles.chipActive]} onPress={() => setBookingType(key)}>
              <Text style={styles.chipText}>{key} ₹{ground.pricing[key]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.heading}>Time slot</Text>
        <View style={styles.chips}>
          {SLOTS.map((item) => (
            <TouchableOpacity key={item} style={[styles.chip, slot === item && styles.chipActive]} onPress={() => setSlot(item)}>
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={book} disabled={booking}>
          <Text style={styles.buttonText}>{booking ? 'Booking...' : `Book for ₹${ground.pricing?.[bookingType] || 0}`}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  image: { width: '100%', height: 220, backgroundColor: Colors.surface },
  body: { padding: 20 },
  name: { color: Colors.text, fontSize: 24, fontWeight: '700' },
  meta: { color: Colors.textSecondary, marginTop: 8, textTransform: 'capitalize' },
  description: { color: Colors.text, marginTop: 16, lineHeight: 22 },
  heading: { color: Colors.text, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { color: Colors.text, fontSize: 13 },
  button: { marginTop: 24, backgroundColor: Colors.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: Colors.white, fontWeight: '700' },
});
