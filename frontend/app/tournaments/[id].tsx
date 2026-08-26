import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { palette, spacing, radius, typography } from '../../constants/theme';
import Screen from '../../components/ui/Screen';
import GlassCard from '../../components/ui/GlassCard';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/SkeletonLoader';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  location?: string;
  city?: string;
  start_date?: string;
  end_date?: string;
  tournament_type?: string;
  registration_fee?: number;
  prize_money?: string;
  max_teams?: number;
  teams_registered?: number;
  status?: string;
}

function Row({ icon, label, value }: { icon: any; label: string; value?: string | number }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={palette.primary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/tournaments/${id}`);
      setItem(res.data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <Screen title="Tournament" showBack><Skeleton height={26} width="70%" /><Skeleton height={140} radius={radius.lg} style={{ marginTop: spacing.lg }} /></Screen>;
  }
  if (notFound || !item) {
    return <Screen title="Tournament" showBack padded={false}><EmptyState icon="trophy-outline" title="Tournament not found" message="This tournament may have been removed." /></Screen>;
  }

  return (
    <Screen title={item.name} showBack scroll>
      {!!item.status && (
        <View style={styles.statusChip}><Text style={styles.statusText}>{item.status}</Text></View>
      )}
      {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
      <GlassCard style={{ marginTop: spacing.lg }}>
        <Row icon="pricetag-outline" label="Format" value={item.tournament_type} />
        <Row icon="location-outline" label="Venue" value={[item.location, item.city].filter(Boolean).join(', ')} />
        <Row icon="calendar-outline" label="Starts" value={formatDate(item.start_date)} />
        <Row icon="calendar-outline" label="Ends" value={formatDate(item.end_date)} />
        <Row icon="people-outline" label="Teams" value={item.max_teams ? `${item.teams_registered ?? 0}/${item.max_teams}` : undefined} />
        <Row icon="cash-outline" label="Entry" value={item.registration_fee ? formatCurrency(item.registration_fee) : undefined} />
        <Row icon="trophy-outline" label="Prize" value={item.prize_money} />
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusChip: { alignSelf: 'flex-start', backgroundColor: 'rgba(225,29,42,0.12)', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { ...typography.micro, color: palette.primary, textTransform: 'capitalize' },
  desc: { ...typography.body, color: palette.textSecondary, lineHeight: 22, marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  rowLabel: { ...typography.caption, color: palette.textTertiary, width: 70 },
  rowValue: { ...typography.body, color: palette.textPrimary, flex: 1, textTransform: 'capitalize' },
});
