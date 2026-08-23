import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import api from '../../utils/api';
import { notify } from '../../utils/notify';

export default function CreateProductScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('bat');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [brand, setBrand] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name || !description || !price) {
      notify('Fill required fields');
      return;
    }
    setLoading(true);
    try {
      await api.post('/products', {
        name,
        description,
        category,
        price: Number(price),
        stock: Number(stock),
        brand,
        images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800'],
        is_used: false,
      });
      notify('Product listed');
      router.replace('/(tabs)/marketplace');
    } catch (error: any) {
      notify('Could not create product', error.response?.data?.detail || 'Vendors only');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {[
        ['Name', name, setName],
        ['Description', description, setDescription],
        ['Category (bat, ball, pads, gloves, shoes)', category, setCategory],
        ['Price', price, setPrice],
        ['Stock', stock, setStock],
        ['Brand', brand, setBrand],
      ].map(([label, value, setter]) => (
        <View key={String(label)} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={String(value)}
            onChangeText={setter as (text: string) => void}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
      ))}
      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'List product'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  field: { marginBottom: 14 },
  label: { color: Colors.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, backgroundColor: Colors.surface },
  button: { backgroundColor: Colors.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: Colors.white, fontWeight: '700' },
});
