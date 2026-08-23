import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import api from '../../utils/api';

const UI = {
  bg: '#f5f6f8',
  card: '#ffffff',
  text: '#15171a',
  sub: '#6b7280',
  border: '#e6e8eb',
  primary: Colors.primary,
  accentBg: '#fdeaea',
  inputBg: '#f2f4f6',
  success: '#0f9d58',
};

export default function BecomeCoachScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<'technique' | 'mindset'>('technique');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [experience, setExperience] = useState('');
  const [hourly, setHourly] = useState('');
  const [group, setGroup] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('/coaches/me');
        if (me.data) {
          const c = me.data;
          setCategory(c.category);
          setName(c.name || '');
          setBio(c.bio || '');
          setCity(c.city || '');
          setSpecializations((c.specializations || []).join(', '));
          setExperience(String(c.experience_years ?? ''));
          setHourly(String(c.hourly_rate ?? ''));
          setGroup(String(c.group_rate ?? ''));
        }
      } catch {
        // not a coach yet — fine
      }
    })();
  }, []);

  const submit = async () => {
    if (!name.trim() || !bio.trim() || !city.trim()) {
      setNotice({ text: 'Please fill in your name, bio and city.', ok: false });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await api.post('/coaches/register', {
        name: name.trim(),
        category,
        bio: bio.trim(),
        city: city.trim(),
        specializations: specializations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        experience_years: parseInt(experience, 10) || 0,
        hourly_rate: parseFloat(hourly) || 0,
        group_rate: parseFloat(group) || 0,
      });
      setNotice({ text: 'You are now listed as a coach!', ok: true });
      setTimeout(() => router.replace(`/coaching/${category}` as any), 900);
    } catch (e: any) {
      setNotice({ text: e?.response?.data?.detail || 'Could not save coach profile', ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={UI.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Coach</Text>
        <View style={{ width: 40 }} />
      </View>

      {notice && (
        <View style={[styles.notice, { backgroundColor: notice.ok ? UI.success : UI.primary }]}>
          <Text style={styles.noticeText}>{notice.text}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>Coaching track</Text>
        <View style={styles.segment}>
          {(['technique', 'mindset'] as const).map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.segmentBtn, category === c && styles.segmentBtnActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.segmentText, category === c && styles.segmentTextActive]}>
                {c === 'technique' ? 'Technique' : 'Mindset'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Coach Ravi" placeholderTextColor={UI.sub} />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell players about your coaching experience"
          placeholderTextColor={UI.sub}
          multiline
        />

        <Text style={styles.label}>City</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Bengaluru" placeholderTextColor={UI.sub} />

        <Text style={styles.label}>Specializations (comma separated)</Text>
        <TextInput style={styles.input} value={specializations} onChangeText={setSpecializations} placeholder="batting, footwork, focus" placeholderTextColor={UI.sub} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Experience (yrs)</Text>
            <TextInput style={styles.input} value={experience} onChangeText={setExperience} keyboardType="numeric" placeholder="5" placeholderTextColor={UI.sub} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>1-on-1 rate (₹)</Text>
            <TextInput style={styles.input} value={hourly} onChangeText={setHourly} keyboardType="numeric" placeholder="1500" placeholderTextColor={UI.sub} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Group rate (₹)</Text>
            <TextInput style={styles.input} value={group} onChangeText={setGroup} keyboardType="numeric" placeholder="600" placeholderTextColor={UI.sub} />
          </View>
        </View>

        <TouchableOpacity style={styles.submit} onPress={submit} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Save coach profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: UI.card,
    borderBottomWidth: 1,
    borderBottomColor: UI.border,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: UI.text },
  notice: { paddingVertical: 10, paddingHorizontal: 16 },
  noticeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  body: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: UI.text, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: UI.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: UI.text,
    borderWidth: 1,
    borderColor: UI.border,
  },
  textarea: { height: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  segment: {
    flexDirection: 'row',
    backgroundColor: UI.inputBg,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: UI.border,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: UI.primary },
  segmentText: { fontWeight: '700', color: UI.sub },
  segmentTextActive: { color: '#fff' },
  submit: {
    marginTop: 24,
    backgroundColor: UI.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
