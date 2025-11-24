import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="baseball" size={80} color={Colors.primary} />
          <Text style={styles.title}>18 Cricket</Text>
          <Text style={styles.subtitle}>Your Complete Cricket Ecosystem</Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Ionicons name="cart" size={40} color={Colors.primary} />
            <Text style={styles.featureTitle}>Marketplace</Text>
            <Text style={styles.featureDesc}>Buy cricket gear from trusted vendors</Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="school" size={40} color={Colors.primary} />
            <Text style={styles.featureTitle}>Academies</Text>
            <Text style={styles.featureDesc}>Find the best cricket academies</Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="trophy" size={40} color={Colors.primary} />
            <Text style={styles.featureTitle}>Tournaments</Text>
            <Text style={styles.featureDesc}>Join and track tournaments</Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="location" size={40} color={Colors.primary} />
            <Text style={styles.featureTitle}>Ground Booking</Text>
            <Text style={styles.featureDesc}>Book cricket grounds easily</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.secondaryButtonText}>Login</Text>
          </TouchableOpacity>
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
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  featureDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});