import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import { format } from 'date-fns';

interface Tournament {
  id: string;
  name: string;
  description: string;
  location: string;
  city: string;
  start_date: string;
  end_date: string;
  tournament_type: string;
  registration_fee: number;
  prize_money?: string;
  max_teams: number;
  teams_registered: number;
  status: string;
}

export default function TournamentsListScreen() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tournaments', {
        params: { status: filter, limit: 50 },
      });
      setTournaments(response.data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return Colors.primary;
      case 'ongoing':
        return Colors.warning;
      case 'completed':
        return Colors.textSecondary;
      default:
        return Colors.text;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tournaments</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['upcoming', 'ongoing', 'completed'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              filter === status && styles.filterChipActive,
            ]}
            onPress={() => setFilter(status)}
          >
            <Text
              style={[
                styles.filterText,
                filter === status && styles.filterTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
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
          {tournaments.map((tournament) => (
            <TouchableOpacity
              key={tournament.id}
              style={styles.tournamentCard}
              onPress={() => router.push(`/tournaments/${tournament.id}` as any)}
            >
              <View style={styles.tournamentHeader}>
                <View style={styles.tournamentIcon}>
                  <Ionicons name="trophy" size={32} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tournamentName}>{tournament.name}</Text>
                  <View style={styles.typeRow}>
                    <View style={styles.typeChip}>
                      <Text style={styles.typeText}>{tournament.tournament_type}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: getStatusColor(tournament.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{tournament.status}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.tournamentInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={16} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>{tournament.city}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>
                    {format(new Date(tournament.start_date), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="people" size={16} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>
                    {tournament.teams_registered}/{tournament.max_teams} teams
                  </Text>
                </View>
                {tournament.prize_money && (
                  <View style={styles.infoRow}>
                    <Ionicons name="cash" size={16} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>{tournament.prize_money}</Text>
                  </View>
                )}
              </View>

              <View style={styles.tournamentFooter}>
                <Text style={styles.registrationFee}>
                  Entry: ₹{tournament.registration_fee}
                </Text>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          {tournaments.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No tournaments found</Text>
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
  tournamentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  tournamentHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  tournamentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tournamentInfo: {
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
  },
  tournamentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  registrationFee: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
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