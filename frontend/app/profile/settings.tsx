import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user?.name || 'Guest'}</Text>
      <Text style={styles.meta}>{user?.phone || 'Not signed in'}</Text>
      <Text style={styles.meta}>{user?.user_type || 'player'}</Text>

      <TouchableOpacity style={styles.row} onPress={() => router.push('/orders')}>
        <Text style={styles.rowText}>Orders</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={() => router.push('/bookings')}>
        <Text style={styles.rowText}>Ground bookings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={() => router.push('/cart')}>
        <Text style={styles.rowText}>Cart</Text>
      </TouchableOpacity>

      {isAuthenticated ? (
        <TouchableOpacity
          style={styles.logout}
          onPress={async () => {
            await logout();
            router.replace('/');
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.login} onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  name: { color: Colors.text, fontSize: 24, fontWeight: '700' },
  meta: { color: Colors.textSecondary, marginTop: 4, textTransform: 'capitalize' },
  row: { marginTop: 16, backgroundColor: Colors.card, padding: 16, borderRadius: 10 },
  rowText: { color: Colors.text, fontWeight: '600' },
  logout: { marginTop: 32, borderWidth: 1, borderColor: Colors.error, padding: 14, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: Colors.error, fontWeight: '700' },
  login: { marginTop: 32, backgroundColor: Colors.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
  loginText: { color: Colors.white, fontWeight: '700' },
});
