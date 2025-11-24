import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const stories = [
    { id: '1', name: 'Your Story', hasStory: false },
    { id: '2', name: 'Virat', hasStory: true },
    { id: '3', name: 'Rohit', hasStory: true },
    { id: '4', name: 'Dhoni', hasStory: true },
    { id: '5', name: 'KL Rahul', hasStory: true },
  ];

  const quickActions = [
    { id: 'shop', name: 'Shop', icon: 'cart', route: '/(tabs)/marketplace', gradient: ['#833ab4', '#fd1d1d'] },
    { id: 'academy', name: 'Academy', icon: 'school', route: '/academies/list', gradient: ['#f09433', '#e6683c'] },
    { id: 'tournament', name: 'Tournaments', icon: 'trophy', route: '/tournaments/list', gradient: ['#4158d0', '#c850c0'] },
    { id: 'ground', name: 'Grounds', icon: 'location', route: '/grounds/list', gradient: ['#0575e6', '#021b79'] },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>18Cricket</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="heart-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="chatbubble-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.storiesContainer}
        >
          {stories.map((story) => (
            <TouchableOpacity key={story.id} style={styles.storyItem}>
              <View style={[styles.storyBorder, story.hasStory && styles.storyBorderActive]}>
                <View style={styles.storyAvatar}>
                  <Ionicons name="person" size={32} color={Colors.primary} />
                </View>
              </View>
              {!story.hasStory && (
                <View style={styles.addStoryButton}>
                  <Ionicons name="add" size={16} color={Colors.white} />
                </View>
              )}
              <Text style={styles.storyName}>{story.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Explore Cricket</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <LinearGradient
                  colors={action.gradient}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={action.icon as any} size={32} color={Colors.white} />
                </LinearGradient>
                <Text style={styles.actionName}>{action.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Gear</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/marketplace')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3, 4].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.productCard}
                onPress={() => router.push('/(tabs)/marketplace')}
              >
                <View style={styles.productImage}>
                  <Ionicons name="baseball" size={40} color={Colors.primary} />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>Cricket Bat</Text>
                  <Text style={styles.productPrice}>₹2,500</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Live Tournaments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Tournaments</Text>
            <TouchableOpacity onPress={() => router.push('/tournaments/list' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.liveTournament}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.tournamentTitle}>Bengaluru Premier League</Text>
            <Text style={styles.tournamentInfo}>Match 3 • Mumbai vs Chennai</Text>
            <TouchableOpacity style={styles.watchButton}>
              <Text style={styles.watchButtonText}>Watch Now</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: 'System',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  storiesContainer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    position: 'relative',
  },
  storyBorder: {
    padding: 2,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  storyBorderActive: {
    borderColor: Colors.primary,
  },
  storyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  addStoryButton: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  storyName: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 4,
  },
  quickActionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
  },
  actionGradient: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.info,
    fontWeight: '600',
  },
  productCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    height: 140,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  liveTournament: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.error,
  },
  tournamentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  tournamentInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  watchButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  watchButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});