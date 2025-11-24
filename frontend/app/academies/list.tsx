import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';

interface Academy {
  id: string;
  name: string;
  description: string;
  location: string;
  city: string;
  fees: string;
  schedule: string;
  images: string[];
  contact_phone: string;
  facilities: string[];
  rating: number;
}

export default function AcademiesListScreen() {
  const router = useRouter();
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAcademies();
  }, []);

  const fetchAcademies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/academies', { params: { limit: 50 } });
      setAcademies(response.data);
    } catch (error) {
      console.error('Error fetching academies:', error);
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
        <Text style={styles.headerTitle}>Cricket Academies</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search academies..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {academies.map((academy) => (
            <TouchableOpacity
              key={academy.id}
              style={styles.academyCard}
              onPress={() => router.push(`/academies/${academy.id}` as any)}
            >
              <View style={styles.academyImageContainer}>
                {academy.images[0] ? (
                  <Image
                    source={{ uri: academy.images[0] }}
                    style={styles.academyImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.academyImagePlaceholder}>
                    <Ionicons name="school" size={48} color={Colors.primary} />
                  </View>
                )}
              </View>
              <View style={styles.academyInfo}>
                <Text style={styles.academyName}>{academy.name}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color={Colors.textSecondary} />
                  <Text style={styles.academyLocation}>{academy.city}</Text>
                </View>
                <Text style={styles.academyFees}>{academy.fees}</Text>
                <View style={styles.facilitiesRow}>
                  {academy.facilities.slice(0, 3).map((facility, index) => (
                    <View key={index} style={styles.facilityChip}>
                      <Text style={styles.facilityText}>{facility}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {academies.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No academies found</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    margin: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  academyCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  academyImageContainer: {
    height: 180,
    backgroundColor: Colors.surface,
  },
  academyImage: {
    width: '100%',
    height: '100%',
  },
  academyImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  academyInfo: {
    padding: 16,
  },
  academyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  academyLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  academyFees: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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