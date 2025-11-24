import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';

interface Ground {
  id: string;
  name: string;
  description: string;
  location: string;
  city: string;
  ground_type: string;
  facilities: string[];
  pricing: { [key: string]: number };
  images: string[];
  rating: number;
}

export default function GroundsListScreen() {
  const router = useRouter();
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchGrounds();
  }, [filter]);

  const fetchGrounds = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (filter !== 'all') params.ground_type = filter;
      const response = await api.get('/grounds', { params });
      setGrounds(response.data);
    } catch (error) {
      console.error('Error fetching grounds:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cricket Grounds</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'turf', 'mat', 'concrete'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              filter === type && styles.filterChipActive,
            ]}
            onPress={() => setFilter(type)}
          >
            <Text
              style={[
                styles.filterText,
                filter === type && styles.filterTextActive,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {grounds.map((ground) => (
            <TouchableOpacity
              key={ground.id}
              style={styles.groundCard}
              onPress={() => router.push(`/grounds/${ground.id}` as any)}
            >
              <View style={styles.groundImageContainer}>
                {ground.images[0] ? (
                  <Image
                    source={{ uri: ground.images[0] }}
                    style={styles.groundImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.groundImagePlaceholder}>
                    <Ionicons name="location" size={48} color={Colors.primary} />
                  </View>
                )}
                <View style={styles.typebadge}>
                  <Text style={styles.typeBadgeText}>{ground.ground_type}</Text>
                </View>
              </View>
              <View style={styles.groundInfo}>
                <Text style={styles.groundName}>{ground.name}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color={Colors.textSecondary} />
                  <Text style={styles.groundLocation}>{ground.city}</Text>
                </View>
                <View style={styles.facilitiesRow}>
                  {ground.facilities.slice(0, 3).map((facility, index) => (
                    <View key={index} style={styles.facilityChip}>
                      <Text style={styles.facilityText}>{facility}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.pricingRow}>
                  {Object.entries(ground.pricing).slice(0, 2).map(([key, value]) => (
                    <Text key={key} style={styles.pricingText}>
                      {key}: ₹{value}
                    </Text>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {grounds.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No grounds found</Text>
            </View>
          )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  groundCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  groundImageContainer: {
    height: 180,
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  groundImage: {
    width: '100%',
    height: '100%',
  },
  groundImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  groundInfo: {
    padding: 16,
  },
  groundName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  groundLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  facilityChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  facilityText: {
    fontSize: 12,
    color: Colors.text,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pricingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});
