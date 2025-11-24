import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLocation {
  country_code: string;
  country_name: string;
  state_or_region: string;
  city: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export interface RegionConfig {
  country_code: string;
  currency: string;
  currency_symbol: string;
  distance_unit: 'km' | 'miles';
  locale: string;
}

// Region configurations for different countries
export const REGION_CONFIGS: Record<string, RegionConfig> = {
  US: {
    country_code: 'US',
    currency: 'USD',
    currency_symbol: '$',
    distance_unit: 'miles',
    locale: 'en-US',
  },
  IN: {
    country_code: 'IN',
    currency: 'INR',
    currency_symbol: '₹',
    distance_unit: 'km',
    locale: 'en-IN',
  },
  GB: {
    country_code: 'GB',
    currency: 'GBP',
    currency_symbol: '£',
    distance_unit: 'km',
    locale: 'en-GB',
  },
  AU: {
    country_code: 'AU',
    currency: 'AUD',
    currency_symbol: 'A$',
    distance_unit: 'km',
    locale: 'en-AU',
  },
  CA: {
    country_code: 'CA',
    currency: 'CAD',
    currency_symbol: 'C$',
    distance_unit: 'km',
    locale: 'en-CA',
  },
  AE: {
    country_code: 'AE',
    currency: 'AED',
    currency_symbol: 'د.إ',
    distance_unit: 'km',
    locale: 'en-AE',
  },
  NZ: {
    country_code: 'NZ',
    currency: 'NZD',
    currency_symbol: 'NZ$',
    distance_unit: 'km',
    locale: 'en-NZ',
  },
  ZA: {
    country_code: 'ZA',
    currency: 'ZAR',
    currency_symbol: 'R',
    distance_unit: 'km',
    locale: 'en-ZA',
  },
  PK: {
    country_code: 'PK',
    currency: 'PKR',
    currency_symbol: '₨',
    distance_unit: 'km',
    locale: 'en-PK',
  },
  BD: {
    country_code: 'BD',
    currency: 'BDT',
    currency_symbol: '৳',
    distance_unit: 'km',
    locale: 'en-BD',
  },
  LK: {
    country_code: 'LK',
    currency: 'LKR',
    currency_symbol: 'Rs',
    distance_unit: 'km',
    locale: 'en-LK',
  },
};

// Default to USA for initial launch
const DEFAULT_REGION = 'US';

class LocationService {
  private static instance: LocationService;
  private currentLocation: UserLocation | null = null;
  private homeLocation: UserLocation | null = null;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  /**
   * Get current device location
   */
  async getCurrentPosition(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return location;
    } catch (error) {
      console.error('Get current position error:', error);
      return null;
    }
  }

  /**
   * Reverse geocode to get location details
   */
  async reverseGeocode(lat: number, lng: number): Promise<UserLocation | null> {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results && results.length > 0) {
        const result = results[0];
        return {
          country_code: result.isoCountryCode || DEFAULT_REGION,
          country_name: result.country || 'United States',
          state_or_region: result.region || result.subregion || '',
          city: result.city || result.district || '',
          lat,
          lng,
          timestamp: Date.now(),
        };
      }
      return null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  }

  /**
   * Detect user location with GPS
   */
  async detectUserLocation(): Promise<UserLocation | null> {
    try {
      const position = await this.getCurrentPosition();
      if (position) {
        const location = await this.reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );
        if (location) {
          this.currentLocation = location;
          await this.saveCurrentLocation(location);
          return location;
        }
      }
      return null;
    } catch (error) {
      console.error('Detect user location error:', error);
      return null;
    }
  }

  /**
   * Save current location to storage
   */
  async saveCurrentLocation(location: UserLocation): Promise<void> {
    try {
      await AsyncStorage.setItem('current_location', JSON.stringify(location));
    } catch (error) {
      console.error('Save current location error:', error);
    }
  }

  /**
   * Get saved current location
   */
  async getSavedCurrentLocation(): Promise<UserLocation | null> {
    try {
      const data = await AsyncStorage.getItem('current_location');
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Get saved current location error:', error);
      return null;
    }
  }

  /**
   * Save home location
   */
  async saveHomeLocation(location: UserLocation): Promise<void> {
    try {
      await AsyncStorage.setItem('home_location', JSON.stringify(location));
      this.homeLocation = location;
    } catch (error) {
      console.error('Save home location error:', error);
    }
  }

  /**
   * Get home location
   */
  async getHomeLocation(): Promise<UserLocation | null> {
    try {
      const data = await AsyncStorage.getItem('home_location');
      if (data) {
        this.homeLocation = JSON.parse(data);
        return this.homeLocation;
      }
      return null;
    } catch (error) {
      console.error('Get home location error:', error);
      return null;
    }
  }

  /**
   * Get region configuration based on country code
   */
  getRegionConfig(countryCode: string): RegionConfig {
    return REGION_CONFIGS[countryCode] || REGION_CONFIGS[DEFAULT_REGION];
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    unit: 'km' | 'miles' = 'km'
  ): number {
    const R = unit === 'km' ? 6371 : 3959; // Radius of Earth in km or miles
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format distance with appropriate unit
   */
  formatDistance(distanceInKm: number, unit: 'km' | 'miles' = 'km'): string {
    const distance = unit === 'miles' ? distanceInKm * 0.621371 : distanceInKm;
    if (distance < 1) {
      const meters = Math.round(distance * 1000);
      return `${meters} ${unit === 'miles' ? 'ft' : 'm'}`;
    }
    return `${distance.toFixed(1)} ${unit}`;
  }

  /**
   * Format currency with region-specific symbol
   */
  formatCurrency(amount: number, countryCode: string): string {
    const config = this.getRegionConfig(countryCode);
    return `${config.currency_symbol}${amount.toLocaleString(config.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Check if location has changed significantly (moved to new country)
   */
  hasLocationChangedSignificantly(oldLocation: UserLocation, newLocation: UserLocation): boolean {
    return oldLocation.country_code !== newLocation.country_code;
  }

  /**
   * Get default location for first-time users (USA)
   */
  getDefaultLocation(): UserLocation {
    return {
      country_code: 'US',
      country_name: 'United States',
      state_or_region: '',
      city: '',
      lat: 37.0902, // Center of USA
      lng: -95.7129,
      timestamp: Date.now(),
    };
  }

  /**
   * Check if location setup is complete
   */
  async isLocationSetupComplete(): Promise<boolean> {
    try {
      const setupComplete = await AsyncStorage.getItem('location_setup_complete');
      return setupComplete === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Mark location setup as complete
   */
  async markLocationSetupComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem('location_setup_complete', 'true');
    } catch (error) {
      console.error('Mark location setup complete error:', error);
    }
  }
}

export default LocationService.getInstance();
