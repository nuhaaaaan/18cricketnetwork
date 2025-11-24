import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

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

export default function MarketplaceScreen() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'bat', name: 'Bats', icon: 'baseball' },
    { id: 'ball', name: 'Balls', icon: 'tennisball' },
    { id: 'pads', name: 'Pads', icon: 'shield' },
    { id: 'gloves', name: 'Gloves', icon: 'hand-left' },
    { id: 'shoes', name: 'Shoes', icon: 'footsteps' },
  ];

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (search) params.search = search;

      const response = await api.get('/products', { params });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      vendor_id: product.vendor_id,
      vendor_name: product.vendor_name,
      quantity: 1,
      price: product.price,
      image: product.images[0],
    });
    alert('Added to cart!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/cart' as any)}
        >
          <Ionicons name="cart" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {user?.user_type === 'vendor' && (
        <TouchableOpacity
          style={styles.addProductButton}
          onPress={() => router.push('/products/create' as any)}
        >
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Text style={styles.addProductText}>Add Product</Text>
        </TouchableOpacity>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={16}
              color={selectedCategory === category.id ? Colors.white : Colors.text}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.productsContainer}>
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => router.push(`/products/${product.id}` as any)}
              >
                <View style={styles.productImage}>
                  {product.images[0] ? (
                    <Image
                      source={{ uri: product.images[0] }}
                      style={styles.productImageContent}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="baseball" size={40} color={Colors.primary} />
                  )}
                  {product.is_used && (
                    <View style={styles.usedBadge}>
                      <Text style={styles.usedBadgeText}>Used</Text>
                    </View>
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  {product.brand && (
                    <Text style={styles.productBrand}>{product.brand}</Text>
                  )}
                  <View style={styles.productPriceRow}>
                    <Text style={styles.productPrice}>₹{product.price}</Text>
                    {product.original_price && product.original_price > product.price && (
                      <Text style={styles.productOriginalPrice}>
                        ₹{product.original_price}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => handleAddToCart(product)}
                  >
                    <Ionicons name="cart" size={16} color={Colors.white} />
                    <Text style={styles.addToCartText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  cartButton: {
    padding: 8,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    gap: 8,
  },
  addProductText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsContainer: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    margin: '1%',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  productImage: {
    height: 150,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImageContent: {
    width: '100%',
    height: '100%',
  },
  usedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  usedBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  productOriginalPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addToCartText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});