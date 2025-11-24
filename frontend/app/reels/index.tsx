import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import * as Sharing from 'expo-sharing';

const { height, width } = Dimensions.get('window');

interface Reel {
  id: string;
  user_name: string;
  content: string;
  video_url?: string;
  images: string[];
  likes: number;
  comments: number;
  shares: number;
  created_at: string;
}

export default function ReelsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reels');
      setReels(response.data);
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reelId: string) => {
    if (!isAuthenticated) return;
    try {
      await api.post(`/posts/${reelId}/like`);
      setReels(prev => 
        prev.map(reel => 
          reel.id === reelId ? { ...reel, likes: reel.likes + 1 } : reel
        )
      );
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const handleShare = async (reel: Reel) => {
    try {
      const shareUrl = `https://18cricket.com/reels/${reel.id}`;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUrl);
      }
      await api.post(`/posts/${reel.id}/share`);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderReel = ({ item, index }: { item: Reel; index: number }) => (
    <View style={styles.reelContainer}>
      {/* Reel Content */}
      <View style={styles.reelContent}>
        <View style={styles.reelImagePlaceholder}>
          <Ionicons name="play-circle" size={80} color={Colors.white} />
          <Text style={styles.reelText}>{item.content}</Text>
        </View>
      </View>

      {/* Right Actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
          <Ionicons name="heart" size={32} color={Colors.white} />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/comments/${item.id}` as any)}
        >
          <Ionicons name="chatbubble" size={32} color={Colors.white} />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
          <Ionicons name="paper-plane" size={32} color={Colors.white} />
          <Text style={styles.actionText}>{item.shares}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="ellipsis-vertical" size={32} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.username}>@{item.user_name}</Text>
        </View>
        <Text style={styles.caption}>{item.content}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color={Colors.white} />
      </TouchableOpacity>

      <Text style={styles.title}>Reels</Text>

      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.y / height);
          setCurrentIndex(index);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  title: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    zIndex: 10,
  },
  reelContainer: {
    height: height,
    width: width,
    position: 'relative',
  },
  reelContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelText: {
    color: Colors.white,
    fontSize: 16,
    marginTop: 16,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: Colors.white,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 80,
    left: 12,
    right: 80,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  username: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  caption: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
});