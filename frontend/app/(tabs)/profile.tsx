import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');
const itemWidth = (width - 3) / 3;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const stats = [
    { label: 'Posts', value: '12' },
    { label: 'Orders', value: '8' },
    { label: 'Bookings', value: '5' },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.text} />
          <Text style={styles.username}>{user?.name || 'username'}</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.text} />
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="add-circle-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/profile/settings' as any)}>
            <Ionicons name="menu-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileTop}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color={Colors.primary} />
              </View>
            </View>

            <View style={styles.statsContainer}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.stat}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bioSection}>
            <Text style={styles.displayName}>{user?.name}</Text>
            <Text style={styles.bio}>Cricket Enthusiast 🏏</Text>
            <Text style={styles.bio}>Playing since 2010</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.shareButtonText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Story Highlights */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.highlightsContainer}>
          <TouchableOpacity style={styles.highlightItem}>
            <View style={styles.highlightCircle}>
              <Ionicons name="add" size={32} color={Colors.textSecondary} />
            </View>
            <Text style={styles.highlightText}>New</Text>
          </TouchableOpacity>
          {['Gear', 'Matches', 'Training'].map((item, index) => (
            <TouchableOpacity key={index} style={styles.highlightItem}>
              <View style={styles.highlightCircle}>
                <Ionicons name="baseball" size={28} color={Colors.text} />
              </View>
              <Text style={styles.highlightText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tab}>
            <Ionicons name="grid" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Ionicons name="film-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Ionicons name="person-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <View key={item} style={styles.gridItem}>
              <View style={styles.gridImagePlaceholder}>
                <Ionicons name="baseball" size={32} color={Colors.textSecondary} />
              </View>
            </View>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 28,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.text,
    marginTop: 2,
  },
  bioSection: {
    marginBottom: 12,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  bio: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  shareButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  highlightsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  highlightItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  highlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 12,
    color: Colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  gridItem: {
    width: itemWidth,
    height: itemWidth,
    padding: 1,
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 24,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
});