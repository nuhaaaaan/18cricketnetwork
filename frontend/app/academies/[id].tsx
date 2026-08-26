import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { palette, spacing, radius, typography } from '../../constants/theme';
import Screen from '../../components/ui/Screen';
import GlassCard from '../../components/ui/GlassCard';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/SkeletonLoader';

interface Academy {
  id: string;
  name: string;
  description?: string;
  location?: string;
  city?: string;
  fees?: string;
  schedule?: string;
  contact_phone?: string;
  contact_email?: string;
  facilities?: string[];
  coaches?: string[];
  rating?: number;
}

function Row({ icon, label, value }: { icon: any; label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={palette.primary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

export default function AcademyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/academies/${id}`);
      setItem(res.data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <Screen title="Academy" showBack><Skeleton height={26} width="70%" /><Skeleton height={140} radius={radius.lg} style={{ marginTop: spacing.lg }} /></Screen>;
  }
  if (notFound || !item) {
    return <Screen title="Academy" showBack padded={false}><EmptyState icon="school-outline" title="Academy not found" message="This academy may have been removed." /></Screen>;
  }

  return (
    <Screen title={item.name} showBack scroll>
      {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
      <GlassCard style={{ marginTop: spacing.lg }}>
        <Row icon="location-outline" label="Location" value={[item.location, item.city].filter(Boolean).join(', ')} />
        <Row icon="cash-outline" label="Fees" value={item.fees} />
        <Row icon="time-outline" label="Schedule" value={item.schedule} />
        <Row icon="call-outline" label="Phone" value={item.contact_phone} />
        <Row icon="mail-outline" label="Email" value={item.contact_email} />
        <Row icon="star-outline" label="Rating" value={item.rating ? item.rating.toFixed(1) : undefined} />
      </GlassCard>
      {!!item.facilities?.length && (
        <View style={styles.chips}>
          {item.facilities.map((f, i) => (<View key={i} style={styles.chip}><Text style={styles.chipText}>{f}</Text></View>))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  desc: { ...typography.body, color: palette.textSecondary, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  rowLabel: { ...typography.caption, color: palette.textTertiary, width: 80 },
  rowValue: { ...typography.body, color: palette.textPrimary, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  chip: { backgroundColor: palette.surfaceElevated, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  chipText: { ...typography.caption, color: palette.textSecondary },
});
