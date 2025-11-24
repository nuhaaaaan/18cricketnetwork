import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const categories = [
    { id: 'marketplace', name: 'Marketplace', icon: 'cart', route: '/(tabs)/marketplace' },
    { id: 'academies', name: 'Academies', icon: 'school', route: '/academies/list' },
    { id: 'tournaments', name: 'Tournaments', icon: 'trophy', route: '/tournaments/list' },
    { id: 'grounds', name: 'Grounds', icon: 'location', route: '/grounds/list' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Cricket Fan'}!</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Your Complete Cricket Ecosystem</Text>
          <Text style={styles.heroSubtitle}>
            Buy gear, find academies, join tournaments, book grounds
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => router.push(category.route as any)}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={category.icon as any} size={32} color={Colors.primary} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/marketplace')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.productCard}
                onPress={() => router.push('/(tabs)/marketplace')}
              >
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="baseball" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.productName}>Cricket Bat</Text>
                <Text style={styles.productPrice}>₹2,500</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular Academies */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Academies</Text>
            <TouchableOpacity onPress={() => router.push('/academies/list' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.academyCard}
                onPress={() => router.push('/academies/list' as any)}
              >
                <View style={styles.academyIconContainer}>
                  <Ionicons name="school" size={32} color={Colors.white} />
                </View>
                <Text style={styles.academyName}>Cricket Academy</Text>
                <Text style={styles.academyLocation}>Bengaluru</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
  },
  heroSection: {
    backgroundColor: Colors.primary,
    padding: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    margin: 8,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: Colors.white,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  productCard: {
    width: 150,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginLeft: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productImagePlaceholder: {
    height: 150,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    padding: 12,
    paddingBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  academyCard: {
    width: 200,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginLeft: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  academyIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  academyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  academyLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});