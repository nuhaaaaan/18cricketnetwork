import { ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CM } from '../../utils/coaching';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

export function Input(props: TextInputProps & { label?: string; hint?: string }) {
  const { label, hint, style, ...rest } = props;
  const input = (
    <TextInput
      placeholderTextColor={CM.sub}
      style={[styles.input, (rest as any).multiline && styles.textarea, style]}
      {...rest}
    />
  );
  if (!label) return input;
  return (
    <Field label={label} hint={hint}>
      {input}
    </Field>
  );
}

export function ChipSelect({
  options,
  selected,
  onToggle,
  multi = true,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  multi?: boolean;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(opt)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Toggle({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: string;
}) {
  return (
    <TouchableOpacity style={styles.toggle} onPress={() => onChange(!value)} activeOpacity={0.8}>
      <View style={styles.toggleLeft}>
        {icon ? <Ionicons name={icon as any} size={18} color={CM.primary} /> : null}
        <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      <View style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </TouchableOpacity>
  );
}

export function Checkbox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity style={styles.checkbox} onPress={() => onChange(!value)} activeOpacity={0.8}>
      <View style={[styles.box, value && styles.boxOn]}>
        {value ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: CM.text, marginBottom: 6 },
  hint: { fontSize: 12, color: CM.sub, marginBottom: 8 },
  input: {
    backgroundColor: CM.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: CM.text,
    borderWidth: 1,
    borderColor: CM.border,
  },
  textarea: { height: 96, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: CM.chipBg,
    borderWidth: 1,
    borderColor: CM.border,
  },
  chipActive: { backgroundColor: CM.primary, borderColor: CM.primary },
  chipText: { fontSize: 13, color: CM.text, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CM.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: CM.border,
    marginBottom: 12,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: CM.text },
  switch: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#cbd5e1',
    padding: 3,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: CM.primary },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  knobOn: { alignSelf: 'flex-end' },
  checkbox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: CM.sub,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxOn: { backgroundColor: CM.primary, borderColor: CM.primary },
  checkboxLabel: { flex: 1, fontSize: 13.5, color: CM.text, lineHeight: 19 },
});
