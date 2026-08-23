import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import api from '../../utils/api';
import { notify } from '../../utils/notify';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        notify('Unable to load product');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const addToCart = () => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      vendor_id: product.vendor_id,
      vendor_name: product.vendor_name,
      quantity: 1,
      price: product.price,
      image: product.images?.[0],
    });
    notify('Added to cart', product.name);
  };

  const saveToWishlist = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/wishlist/${product.id}`);
      notify('Saved', 'Added to your wishlist');
    } catch {
      notify('Could not save item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="baseball" size={72} color={Colors.primary} />
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.brand}>{product.brand || product.vendor_name}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
            {product.original_price ? (
              <Text style={styles.original}>₹{product.original_price}</Text>
            ) : null}
          </View>
          <Text style={styles.meta}>
            {product.category} · {product.stock} in stock · {product.rating || 0}★
          </Text>
          <Text style={styles.description}>{product.description}</Text>
          {product.is_used ? (
            <View style={styles.used}>
              <Text style={styles.usedText}>Used / Pre-owned</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondary} onPress={saveToWishlist} disabled={saving}>
          <Ionicons name="heart-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.primary} onPress={addToCart}>
          <Text style={styles.primaryText}>Add to cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkout} onPress={() => { addToCart(); router.push('/checkout'); }}>
          <Text style={styles.primaryText}>Buy now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  empty: { color: Colors.textSecondary },
  image: { width: '100%', height: 320, backgroundColor: Colors.surface },
  imagePlaceholder: { height: 320, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  body: { padding: 20 },
  brand: { color: Colors.silver, fontSize: 13, marginBottom: 4, textTransform: 'uppercase' },
  name: { color: Colors.text, fontSize: 24, fontWeight: '700', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  price: { color: Colors.primary, fontSize: 22, fontWeight: '700' },
  original: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  meta: { color: Colors.textSecondary, marginBottom: 16 },
  description: { color: Colors.text, fontSize: 15, lineHeight: 22 },
  used: { marginTop: 16, alignSelf: 'flex-start', backgroundColor: Colors.warning, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  usedText: { color: Colors.black, fontWeight: '700', fontSize: 12 },
  footer: { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  secondary: { width: 52, height: 52, borderRadius: 8, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  primary: { flex: 1, backgroundColor: Colors.card, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkout: { flex: 1, backgroundColor: Colors.primary, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: Colors.white, fontWeight: '700' },
});
