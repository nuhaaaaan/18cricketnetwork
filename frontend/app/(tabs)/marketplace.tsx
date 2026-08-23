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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import Logo from '../../components/Logo';

const { width } = Dimensions.get('window');
const itemWidth = (width - 36) / 2;

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
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'bat', name: 'Bats' },
    { id: 'ball', name: 'Balls' },
    { id: 'pads', name: 'Pads' },
    { id: 'gloves', name: 'Gloves' },
    { id: 'shoes', name: 'Shoes' },
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Logo size="small" />
        <View style={styles.headerIcons}>
          {user?.user_type === 'vendor' && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/products/create' as any)}
            >
              <Ionicons name="add-circle-outline" size={28} color={Colors.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/cart' as any)}
          >
            <Ionicons name="cart-outline" size={26} color={Colors.text} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search cricket gear..."
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories */}
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

      {/* Products Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => router.push(`/products/${product.id}` as any)}
              >
                {product.images[0] ? (
                  <Image
                    source={{ uri: product.images[0] }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="baseball" size={32} color={Colors.primary} />
                  </View>
                )}
                {product.is_used && (
                  <View style={styles.usedBadge}>
                    <Text style={styles.usedBadgeText}>USED</Text>
                  </View>
                )}
                <View style={styles.productMeta}>
                  <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.productPrice}>₹{product.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    margin: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryChipTextActive: {
    color: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  productCard: {
    width: itemWidth,
    marginBottom: 16,
    position: 'relative',
    backgroundColor: Colors.card,
    borderRadius: 10,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: itemWidth,
    backgroundColor: Colors.surface,
  },
  productImagePlaceholder: {
    width: '100%',
    height: itemWidth,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productMeta: {
    padding: 10,
  },
  productName: {
    color: Colors.text,
    fontWeight: '600',
  },
  productPrice: {
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 4,
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
});