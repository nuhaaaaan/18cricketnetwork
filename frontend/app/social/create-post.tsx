import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import api from '../../utils/api';
import { notify } from '../../utils/notify';
import { useAuthStore } from '../../store/authStore';

export default function CreatePostScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [content, setContent] = useState('');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800');
  const [loading, setLoading] = useState(false);

  const publish = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!content.trim()) {
      notify('Write a caption');
      return;
    }
    setLoading(true);
    try {
      await api.post('/posts', {
        content: content.trim(),
        images: image ? [image] : [],
        post_type: 'post',
      });
      notify('Posted', 'Your cricket moment is live');
      router.replace('/(tabs)/social');
    } catch (error: any) {
      notify('Could not post', error.response?.data?.detail || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Caption</Text>
      <TextInput
        style={styles.input}
        multiline
        value={content}
        onChangeText={setContent}
        placeholder="Share a knock, a wicket, or a net session..."
        placeholderTextColor={Colors.textSecondary}
      />
      <Text style={styles.label}>Image URL</Text>
      <TextInput
        style={styles.single}
        value={image}
        onChangeText={setImage}
        placeholder="https://"
        placeholderTextColor={Colors.textSecondary}
      />
      <TouchableOpacity style={styles.button} onPress={publish} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Publishing...' : 'Publish'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  label: { color: Colors.text, fontWeight: '700', marginBottom: 8 },
  input: { minHeight: 140, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, backgroundColor: Colors.surface, marginBottom: 16 },
  single: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, backgroundColor: Colors.surface, marginBottom: 20 },
  button: { backgroundColor: Colors.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: Colors.white, fontWeight: '700' },
});
