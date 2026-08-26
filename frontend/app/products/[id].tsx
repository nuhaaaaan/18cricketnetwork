import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/format';
import { useCartStore } from '../../store/cartStore';
import { palette, spacing, radius, typography } from '../../constants/theme';
import Screen from '../../components/ui/Screen';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  original_price?: number;
  stock: number;
  images: string[];
  brand?: string;
  vendor_name: string;
  vendor_id: string;
  is_used: boolean;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [added, setAdded] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const addToCart = () => {
    if (!product) return;
    addItem({
      product_id: product.id,
      product_name: product.name,
      vendor_id: product.vendor_id,
      vendor_name: product.vendor_name,
      quantity: 1,
      price: product.price,
      image: product.images?.[0],
    });
    setAdded(true);
  };

  if (loading) {
    return (
      <Screen title="Product" showBack>
        <Skeleton height={260} radius={radius.lg} />
        <Skeleton width="70%" height={22} style={{ marginTop: spacing.lg }} />
        <Skeleton width="40%" height={16} style={{ marginTop: spacing.sm }} />
      </Screen>
    );
  }

  if (notFound || !product) {
    return (
      <Screen title="Product" showBack padded={false}>
        <EmptyState icon="alert-circle-outline" title="Product not found" message="This product may have been removed or is no longer available." />
      </Screen>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <Screen title={product.name} showBack scroll>
      <View style={styles.hero}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.heroImg} resizeMode="cover" />
        ) : (
          <Ionicons name="baseball-outline" size={64} color={palette.primary} />
        )}
      </View>

      <View style={styles.row}>
        <Text style={styles.price}>{formatCurrency(product.price)}</Text>
        {!!product.original_price && product.original_price > product.price && (
          <Text style={styles.strike}>{formatCurrency(product.original_price)}</Text>
        )}
        {product.is_used && (
          <View style={styles.usedBadge}><Text style={styles.usedText}>USED</Text></View>
        )}
      </View>

      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.meta}>
        {[product.brand, product.category].filter(Boolean).join(' · ')} · Sold by {product.vendor_name}
      </Text>
      <Text style={[styles.stock, outOfStock && { color: palette.error }]}>
        {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
      </Text>

      {!!product.description && <Text style={styles.desc}>{product.description}</Text>}

      <View style={styles.actions}>
        <PrimaryButton
          title={added ? 'Added to cart' : outOfStock ? 'Unavailable' : 'Add to cart'}
          icon={added ? 'checkmark' : 'cart-outline'}
          disabled={outOfStock}
          onPress={addToCart}
        />
        <SecondaryButton title="View cart" icon="bag-handle-outline" onPress={() => router.push('/cart' as any)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 260,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.glassBorder,
  },
  heroImg: { width: '100%', height: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  price: { ...typography.h1, color: palette.primary },
  strike: { ...typography.body, color: palette.textTertiary, textDecorationLine: 'line-through' },
  usedBadge: { backgroundColor: palette.warning, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  usedText: { ...typography.micro, color: palette.black },
  name: { ...typography.h2, color: palette.textPrimary, marginTop: spacing.md },
  meta: { ...typography.caption, color: palette.textSecondary, marginTop: spacing.xs, textTransform: 'capitalize' },
  stock: { ...typography.caption, color: palette.success, marginTop: spacing.sm },
  desc: { ...typography.body, color: palette.textSecondary, lineHeight: 22, marginTop: spacing.lg },
  actions: { gap: spacing.md, marginTop: spacing.xl },
});
