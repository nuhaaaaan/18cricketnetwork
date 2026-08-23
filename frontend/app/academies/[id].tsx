import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import api from '../../utils/api';
import { notify } from '../../utils/notify';
import { useAuthStore } from '../../store/authStore';

export default function AcademyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [academy, setAcademy] = useState<any>(null);
  const [message, setMessage] = useState('I want to join a trial session this week.');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get(`/academies/${id}`)
      .then((response) => setAcademy(response.data))
      .catch(() => notify('Unable to load academy'))
      .finally(() => setLoading(false));
  }, [id]);

  const enquire = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    setSending(true);
    try {
      await api.post(`/academies/${id}/leads`, { message });
      notify('Enquiry sent', 'The academy will contact you on your registered phone.');
    } catch (error: any) {
      notify('Could not send enquiry', error.response?.data?.detail || 'Try again');
    } finally {
      setSending(false);
    }
  };

  if (loading || !academy) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      {academy.images?.[0] ? (
        <Image source={{ uri: academy.images[0] }} style={styles.image} />
      ) : (
        <View style={styles.image} />
      )}
      <View style={styles.body}>
        <Text style={styles.name}>{academy.name}</Text>
        <Text style={styles.meta}><Ionicons name="location" size={14} color={Colors.silver} /> {academy.location}, {academy.city}</Text>
        <Text style={styles.fees}>{academy.fees}</Text>
        <Text style={styles.schedule}>{academy.schedule}</Text>
        <Text style={styles.description}>{academy.description}</Text>
        <View style={styles.chips}>
          {(academy.facilities || []).map((item: string) => (
            <View key={item} style={styles.chip}><Text style={styles.chipText}>{item}</Text></View>
          ))}
        </View>
        <Text style={styles.heading}>Ask for a trial</Text>
        <TextInput style={styles.input} value={message} onChangeText={setMessage} multiline />
        <TouchableOpacity style={styles.button} onPress={enquire} disabled={sending}>
          <Text style={styles.buttonText}>{sending ? 'Sending...' : 'Send enquiry'}</Text>
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
  meta: { color: Colors.textSecondary, marginTop: 8 },
  fees: { color: Colors.primary, fontSize: 18, fontWeight: '700', marginTop: 12 },
  schedule: { color: Colors.text, marginTop: 6 },
  description: { color: Colors.text, marginTop: 16, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: { backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  chipText: { color: Colors.text, fontSize: 12 },
  heading: { color: Colors.text, fontWeight: '700', marginTop: 24, marginBottom: 8 },
  input: { minHeight: 90, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, backgroundColor: Colors.surface },
  button: { marginTop: 12, backgroundColor: Colors.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: Colors.white, fontWeight: '700' },
});
