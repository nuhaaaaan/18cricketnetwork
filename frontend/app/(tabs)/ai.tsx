import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import api from '../../utils/api';
import { palette, spacing, radius, typography } from '../../constants/theme';

interface Msg { role: 'user' | 'ai'; text: string }

const STARTERS = [
  'What can 18 Cricket do?',
  'Find tournaments open for registration',
  'Show grounds near me',
  'Find batting gloves',
];

export default function AIScreen() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/chatbot', { message: q });
      setMessages((m) => [...m, { role: 'ai', text: res.data?.response || "I couldn't process that right now." }]);
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: '18 Cricket AI is unavailable right now. Please try again shortly.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.badge}><Ionicons name="sparkles" size={16} color={palette.primary} /></View>
        <View>
          <Text style={styles.title}>18 Cricket AI</Text>
          <Text style={styles.sub}>Your cricket intelligence layer</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {messages.length === 0 ? (
            <View style={styles.intro}>
              <Text style={styles.introTitle}>Ask about cricket, gear, grounds, tournaments and your game.</Text>
              <Text style={styles.introNote}>18 Cricket AI answers from real platform data — it won&apos;t invent players, scores or products that don&apos;t exist yet.</Text>
              <View style={styles.starters}>
                {STARTERS.map((s) => (
                  <TouchableOpacity key={s} style={styles.starter} onPress={() => send(s)}>
                    <Text style={styles.starterText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            messages.map((m, i) => (
              <View key={i} style={[styles.bubble, m.role === 'user' ? styles.user : styles.ai]}>
                <Text style={[styles.bubbleText, m.role === 'user' && { color: palette.white }]}>{m.text}</Text>
              </View>
            ))
          )}
          {loading && <ActivityIndicator color={palette.primary} style={{ marginTop: spacing.md }} />}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask 18 Cricket AI…"
            placeholderTextColor={palette.textTertiary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => send(input)} disabled={loading || !input.trim()}>
            <Ionicons name="arrow-up" size={20} color={palette.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
  badge: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: 'rgba(225,29,42,0.12)', alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h3, color: palette.textPrimary },
  sub: { ...typography.caption, color: palette.textSecondary },
  scroll: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  intro: { paddingTop: spacing.xl },
  introTitle: { ...typography.h3, color: palette.textPrimary, lineHeight: 26 },
  introNote: { ...typography.caption, color: palette.textSecondary, marginTop: spacing.md, lineHeight: 20 },
  starters: { gap: spacing.sm, marginTop: spacing.xl },
  starter: { backgroundColor: palette.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  starterText: { ...typography.body, color: palette.textPrimary },
  bubble: { maxWidth: '85%', borderRadius: radius.lg, padding: spacing.md },
  user: { alignSelf: 'flex-end', backgroundColor: palette.primary },
  ai: { alignSelf: 'flex-start', backgroundColor: palette.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  bubbleText: { ...typography.body, color: palette.textPrimary, lineHeight: 21 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  input: { flex: 1, backgroundColor: palette.surface, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: 12, color: palette.textPrimary, ...typography.body, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.glassBorder },
  sendBtn: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
});
