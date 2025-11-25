/**
 * Location Info Card - Shows details and navigation options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  LocationData,
  openInAppleMaps,
  openInGoogleMaps,
  openInWaze,
  isWazeInstalled,
  formatDistance,
  formatDuration,
} from '@/utils/navigationService';

interface LocationInfoCardProps {
  location: LocationData;
  distance?: number;
  duration?: number;
  onRoutePreview: () => void;
  isLoadingRoute?: boolean;
}

export default function LocationInfoCard({
  location,
  distance,
  duration,
  onRoutePreview,
  isLoadingRoute = false,
}: LocationInfoCardProps) {
  const [wazeAvailable, setWazeAvailable] = useState(false);

  useEffect(() => {
    checkWazeAvailability();
  }, []);

  const checkWazeAvailability = async () => {
    const available = await isWazeInstalled();
    setWazeAvailable(available);
  };

  const handleNavigate = async (app: 'apple' | 'google' | 'waze') => {
    let success = false;

    switch (app) {
      case 'apple':
        success = await openInAppleMaps(location);
        break;
      case 'google':
        success = await openInGoogleMaps(location);
        break;
      case 'waze':
        success = await openInWaze(location);
        break;
    }

    if (!success) {
      Alert.alert(
        'Unable to Open',
        `Could not open ${app === 'apple' ? 'Apple Maps' : app === 'google' ? 'Google Maps' : 'Waze'}. Please check if the app is installed.`
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Location Info */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={
              location.type === 'ground'
                ? 'baseball'
                : location.type === 'academy'
                ? 'school'
                : location.type === 'store'
                ? 'storefront'
                : 'location'
            }
            size={24}
            color={Colors.primary}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{location.name}</Text>
          {location.address && <Text style={styles.address}>{location.address}</Text>}
        </View>
      </View>

      {/* Distance and Duration */}
      {(distance !== undefined || duration !== undefined) && (
        <View style={styles.statsRow}>
          {distance !== undefined && (
            <View style={styles.stat}>
              <Ionicons name="navigate" size={16} color={Colors.textSecondary} />
              <Text style={styles.statText}>{formatDistance(distance)}</Text>
            </View>
          )}
          {duration !== undefined && (
            <View style={styles.stat}>
              <Ionicons name="time" size={16} color={Colors.textSecondary} />
              <Text style={styles.statText}>{formatDuration(duration)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Route Preview Button */}
      <TouchableOpacity
        style={[styles.previewButton, isLoadingRoute && styles.previewButtonDisabled]}
        onPress={onRoutePreview}
        disabled={isLoadingRoute}
      >
        {isLoadingRoute ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="map" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.previewButtonText}>Show Route Preview</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Navigation Apps */}
      <Text style={styles.sectionTitle}>Navigate with:</Text>
      <View style={styles.appsRow}>
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.appButton}
            onPress={() => handleNavigate('apple')}
          >
            <Ionicons name="map" size={24} color={Colors.primary} />
            <Text style={styles.appButtonText}>Apple Maps</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.appButton}
          onPress={() => handleNavigate('google')}
        >
          <Ionicons name="navigate" size={24} color={Colors.primary} />
          <Text style={styles.appButtonText}>Google Maps</Text>
        </TouchableOpacity>

        {wazeAvailable && (
          <TouchableOpacity
            style={styles.appButton}
            onPress={() => handleNavigate('waze')}
          >
            <Ionicons name="car" size={24} color={Colors.primary} />
            <Text style={styles.appButtonText}>Waze</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 6,
  },
  previewButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  buttonIcon: {
    marginRight: 8,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  appButton: {
    alignItems: 'center',
    padding: 12,
    flex: 1,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginHorizontal: 4,
  },
  appButtonText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 6,
    fontWeight: '500',
  },
});
