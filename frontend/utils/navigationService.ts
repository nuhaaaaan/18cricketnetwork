/**
 * Navigation Service for 18 Cricket Network
 * Handles map navigation, geocoding, and deep linking to native map apps
 */

import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

export interface LocationData {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  type?: 'ground' | 'academy' | 'store' | 'match' | 'user' | 'search';
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  polyline?: string;
}

/**
 * Request location permissions
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current user location
 */
export const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return location;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * Format duration for display
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

/**
 * Open location in Apple Maps
 */
export const openInAppleMaps = async (location: LocationData): Promise<boolean> => {
  const url = `http://maps.apple.com/?daddr=${location.latitude},${location.longitude}&q=${encodeURIComponent(
    location.name
  )}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error opening Apple Maps:', error);
    return false;
  }
};

/**
 * Open location in Google Maps
 */
export const openInGoogleMaps = async (location: LocationData): Promise<boolean> => {
  // Try native app first (Android), then web fallback
  const nativeUrl = `comgooglemaps://?daddr=${location.latitude},${location.longitude}&q=${encodeURIComponent(
    location.name
  )}`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;

  try {
    const canOpenNative = await Linking.canOpenURL(nativeUrl);
    if (canOpenNative) {
      await Linking.openURL(nativeUrl);
      return true;
    }

    // Fallback to web
    await Linking.openURL(webUrl);
    return true;
  } catch (error) {
    console.error('Error opening Google Maps:', error);
    return false;
  }
};

/**
 * Open location in Waze
 */
export const openInWaze = async (location: LocationData): Promise<boolean> => {
  const nativeUrl = `waze://?ll=${location.latitude},${location.longitude}&navigate=yes`;
  const webUrl = `https://waze.com/ul?ll=${location.latitude},${location.longitude}&navigate=yes`;

  try {
    const canOpenNative = await Linking.canOpenURL(nativeUrl);
    if (canOpenNative) {
      await Linking.openURL(nativeUrl);
      return true;
    }

    // Fallback to web
    await Linking.openURL(webUrl);
    return true;
  } catch (error) {
    console.error('Error opening Waze:', error);
    return false;
  }
};

/**
 * Check if Waze is installed
 */
export const isWazeInstalled = async (): Promise<boolean> => {
  try {
    const wazeUrl = 'waze://';
    return await Linking.canOpenURL(wazeUrl);
  } catch {
    return false;
  }
};

/**
 * Geocode an address to coordinates
 * Uses Expo's built-in geocoding
 */
export const geocodeAddress = async (
  address: string
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const results = await Location.geocodeAsync(address);
    if (results.length > 0) {
      return {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const result = results[0];
      const parts = [
        result.name,
        result.street,
        result.city,
        result.region,
        result.postalCode,
        result.country,
      ].filter(Boolean);
      return parts.join(', ');
    }
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};

/**
 * Estimate route info (simple calculation)
 * For production, use actual directions API
 */
export const estimateRoute = async (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): Promise<RouteInfo> => {
  const distance = calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);

  // Simple estimation: assume average speed of 40 km/h
  const averageSpeedKmh = 40;
  const durationSeconds = (distance / 1000 / averageSpeedKmh) * 3600;

  return {
    distance,
    duration: durationSeconds,
  };
};

/**
 * Main navigation helper to be called from anywhere in the app
 */
export const navigateToLocation = (location: LocationData) => {
  // This will be implemented with navigation context
  // For now, return the location data
  return location;
};
