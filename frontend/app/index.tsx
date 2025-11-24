import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoNumber}>18</Text>
            <View style={styles.crownIcon}>
              <Text style={styles.crown}>👑</Text>
            </View>
          </View>
          <Text style={styles.title}>CRICKET COMPANY</Text>
          <Text style={styles.motto}>A tribute to the legacy of THE KING</Text>
        </View>

        <View style={styles.featuresContainer}>
          <LinearGradient
            colors={[Colors.primary, Colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureCard}
          >
            <Ionicons name="cart" size={40} color={Colors.white} />
            <Text style={styles.featureTitle}>Shop Cricket Gear</Text>
            <Text style={styles.featureDesc}>Buy from trusted vendors</Text>
          </LinearGradient>

          <LinearGradient
            colors={[Colors.secondary, Colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureCard}
          >
            <Ionicons name="school" size={40} color={Colors.white} />
            <Text style={styles.featureTitle}>Find Academies</Text>
            <Text style={styles.featureDesc}>Train with the best</Text>
          </LinearGradient>

          <LinearGradient
            colors={[Colors.accent, Colors.ballRedDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureCard}
          >
            <Ionicons name="trophy" size={40} color={Colors.white} />
            <Text style={styles.featureTitle}>Join Tournaments</Text>
            <Text style={styles.featureDesc}>Compete and win</Text>
          </LinearGradient>

          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureCard}
          >
            <Ionicons name="people" size={40} color={Colors.white} />
            <Text style={styles.featureTitle}>Cricket Community</Text>
            <Text style={styles.featureDesc}>Share your moments</Text>
          </LinearGradient>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 50,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  logoNumber: {
    fontSize: 120,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -5,
  },
  crownIcon: {
    position: 'absolute',
    top: -20,
    right: -10,
  },
  crown: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: 8,
    marginTop: 10,
  },
  motto: {
    fontSize: 12,
    color: Colors.silver,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  featuresContainer: {
    marginBottom: 40,
    gap: 12,
  },
  featureCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 12,
  },
  featureDesc: {
    fontSize: 14,
    color: Colors.white,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});