/**
 * Navigation & Maps Screen
 * 18 Cricket Network
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import SearchBar from '@/components/Navigation/SearchBar';
import LocationInfoCard from '@/components/Navigation/LocationInfoCard';
import {
  LocationData,
  getCurrentLocation,
  calculateDistance,
  estimateRoute,
  geocodeAddress,
} from '@/utils/navigationService';

const INITIAL_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function NavigateScreen() {
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [distance, setDistance] = useState<number | undefined>();
  const [duration, setDuration] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    initializeLocation();
  }, []);

  // Handle location params from navigation
  useEffect(() => {
    if (params.locationData && typeof params.locationData === 'string') {
      try {
        const location = JSON.parse(params.locationData) as LocationData;
        handleSelectLocation(location);
      } catch (error) {
        console.error('Error parsing location data:', error);
      }
    }
  }, [params.locationData]);

  const initializeLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setHasLocationPermission(true);
        
        // Center map on user location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } else {
        Alert.alert(
          'Location Permission',
          'Location permission is required to show your current location on the map.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error initializing location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    try {
      // Search in backend API for grounds, academies, stores
      // For now, use geocoding as fallback
      const coords = await geocodeAddress(query);
      
      if (coords) {
        return [
          {
            id: `search_${Date.now()}`,
            name: query,
            address: query,
            latitude: coords.latitude,
            longitude: coords.longitude,
            type: 'search' as const,
          },
        ];
      }
      
      return [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  };

  const handleSelectLocation = (location: LocationData) => {
    setSelectedLocation(location);
    setRouteCoordinates([]);
    setDistance(undefined);
    setDuration(undefined);

    // Animate map to show both current location and selected location
    if (mapRef.current && currentLocation) {
      const coords = [
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      ];

      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 100, right: 50, bottom: 400, left: 50 },
        animated: true,
      });

      // Calculate distance
      const dist = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        location.latitude,
        location.longitude
      );
      setDistance(dist);
    } else {
      // Just center on selected location
      mapRef.current?.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const handleRoutePreview = async () => {
    if (!currentLocation || !selectedLocation) {
      Alert.alert('Error', 'Current location or destination not available');
      return;
    }

    setLoadingRoute(true);
    try {
      // Get route information
      const route = await estimateRoute(
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        }
      );

      setDistance(route.distance);
      setDuration(route.duration);

      // Draw a simple straight line (in production, use actual route API)
      setRouteCoordinates([
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        },
      ]);

      // Fit map to show entire route
      if (mapRef.current) {
        mapRef.current.fitToCoordinates(
          [
            {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            },
            {
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            },
          ],
          {
            edgePadding: { top: 100, right: 50, bottom: 400, left: 50 },
            animated: true,
          }
        );
      }
    } catch (error) {
      console.error('Error getting route:', error);
      Alert.alert('Error', 'Unable to calculate route');
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleRecenterMap = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={
          currentLocation
            ? {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : INITIAL_REGION
        }
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        showsCompass={true}
        showsTraffic={false}
      >
        {/* Selected Location Marker */}
        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
            title={selectedLocation.name}
            description={selectedLocation.address}
          >
            <View style={styles.customMarker}>
              <Ionicons name="location" size={40} color={Colors.primary} />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Colors.primary}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar onSelectLocation={handleSelectLocation} onSearch={handleSearch} />
      </View>

      {/* Recenter Button */}
      {hasLocationPermission && (
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenterMap}>
          <Ionicons name="navigate" size={24} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* Location Info Card */}
      {selectedLocation && (
        <View style={styles.infoCardContainer}>
          <LocationInfoCard
            location={selectedLocation}
            distance={distance}
            duration={duration}
            onRoutePreview={handleRoutePreview}
            isLoadingRoute={loadingRoute}
          />
        </View>
      )}

      {/* No Location Permission Message */}
      {!hasLocationPermission && (
        <View style={styles.permissionMessage}>
          <Ionicons name="location-outline" size={32} color={Colors.textSecondary} />
          <Text style={styles.permissionText}>
            Enable location services to see your current position
          </Text>
          <TouchableOpacity style={styles.enableButton} onPress={initializeLocation}>
            <Text style={styles.enableButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 16,
    right: 16,
  },
  recenterButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 80,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  infoCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  customMarker: {
    alignItems: 'center',
  },
  permissionMessage: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  enableButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
