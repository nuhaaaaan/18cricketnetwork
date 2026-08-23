import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Colors from '../../constants/Colors';
import api from '../../utils/api';
import { notify } from '../../utils/notify';
import { useAuthStore } from '../../store/authStore';

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const load = async () => {
    const [detail, matchList] = await Promise.all([
      api.get(`/tournaments/${id}`),
      api.get(`/tournaments/${id}/matches`).catch(() => ({ data: [] })),
    ]);
    setTournament(detail.data);
    setMatches(matchList.data || []);
  };

  useEffect(() => {
    load().catch(() => notify('Unable to load tournament')).finally(() => setLoading(false));
  }, [id]);

  const register = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!teamName.trim()) {
      notify('Team name required');
      return;
    }
    setRegistering(true);
    try {
      await api.post(`/tournaments/${id}/register`, { team_name: teamName.trim(), players: [] });
      notify('Registered', `${teamName} is in the tournament`);
      setTeamName('');
      await load();
    } catch (error: any) {
      notify('Registration failed', error.response?.data?.detail || 'Try again');
    } finally {
      setRegistering(false);
    }
  };

  if (loading || !tournament) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.body}>
      <View style={styles.icon}><Ionicons name="trophy" size={36} color={Colors.primary} /></View>
      <Text style={styles.name}>{tournament.name}</Text>
      <Text style={styles.meta}>{tournament.tournament_type} · {tournament.status}</Text>
      <Text style={styles.meta}>{tournament.location}, {tournament.city}</Text>
      <Text style={styles.meta}>
        {format(new Date(tournament.start_date), 'MMM d')} - {format(new Date(tournament.end_date), 'MMM d, yyyy')}
      </Text>
      <Text style={styles.prize}>{tournament.prize_money || 'Prize TBC'}</Text>
      <Text style={styles.description}>{tournament.description}</Text>
      <Text style={styles.meta}>{tournament.teams_registered}/{tournament.max_teams} teams · Entry ₹{tournament.registration_fee}</Text>

      {matches.map((match) => (
        <View key={match.id} style={styles.match}>
          <Text style={styles.matchTitle}>{match.team1_name} vs {match.team2_name}</Text>
          <Text style={styles.meta}>{match.status} · {match.venue}</Text>
          {match.team1_score ? <Text style={styles.meta}>{match.team1_score}</Text> : null}
        </View>
      ))}

      {tournament.status !== 'completed' && (
        <View style={styles.form}>
          <Text style={styles.heading}>Register your team</Text>
          <TextInput
            style={styles.input}
            placeholder="Team name"
            placeholderTextColor={Colors.textSecondary}
            value={teamName}
            onChangeText={setTeamName}
          />
          <TouchableOpacity style={styles.button} onPress={register} disabled={registering}>
            <Text style={styles.buttonText}>{registering ? 'Registering...' : 'Register team'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  body: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { color: Colors.text, fontSize: 24, fontWeight: '700' },
  meta: { color: Colors.textSecondary, marginTop: 6, textTransform: 'capitalize' },
  prize: { color: Colors.primary, fontWeight: '700', fontSize: 18, marginTop: 12 },
  description: { color: Colors.text, marginTop: 16, lineHeight: 22 },
  match: { backgroundColor: Colors.card, padding: 14, borderRadius: 10, marginTop: 16 },
  matchTitle: { color: Colors.text, fontWeight: '700' },
  form: { marginTop: 24 },
  heading: { color: Colors.text, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, color: Colors.text, borderRadius: 8, padding: 12 },
  button: { marginTop: 12, backgroundColor: Colors.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: Colors.white, fontWeight: '700' },
});
