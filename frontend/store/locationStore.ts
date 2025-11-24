import { create } from 'zustand';
import locationService, { UserLocation, RegionConfig } from '../utils/locationService';

interface LocationState {
  currentLocation: UserLocation | null;
  homeLocation: UserLocation | null;
  regionConfig: RegionConfig;
  isLoadingLocation: boolean;
  locationPermissionGranted: boolean;
  searchRadius: number; // in km
  
  // Actions
  setCurrentLocation: (location: UserLocation) => void;
  setHomeLocation: (location: UserLocation) => void;
  setLocationPermissionGranted: (granted: boolean) => void;
  detectAndSetLocation: () => Promise<void>;
  loadSavedLocations: () => Promise<void>;
  updateSearchRadius: (radius: number) => void;
  switchRegion: (location: UserLocation) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  homeLocation: null,
  regionConfig: locationService.getRegionConfig('US'), // Default to USA
  isLoadingLocation: false,
  locationPermissionGranted: false,
  searchRadius: 50, // Default 50km radius
  
  setCurrentLocation: (location: UserLocation) => {
    set({
      currentLocation: location,
      regionConfig: locationService.getRegionConfig(location.country_code),
    });
    locationService.saveCurrentLocation(location);
  },
  
  setHomeLocation: (location: UserLocation) => {
    set({ homeLocation: location });
    locationService.saveHomeLocation(location);
  },
  
  setLocationPermissionGranted: (granted: boolean) => {
    set({ locationPermissionGranted: granted });
  },
  
  detectAndSetLocation: async () => {
    set({ isLoadingLocation: true });
    try {
      const location = await locationService.detectUserLocation();
      if (location) {
        get().setCurrentLocation(location);
        
        // If home location not set, set it to current location
        if (!get().homeLocation) {
          get().setHomeLocation(location);
        } else {
          // Check if user has moved to a new country
          const homeLocation = get().homeLocation;
          if (homeLocation && locationService.hasLocationChangedSignificantly(homeLocation, location)) {
            // Will be handled by app to show region change prompt
            console.log('Significant location change detected');
          }
        }
        
        set({ locationPermissionGranted: true });
      } else {
        // Permission denied or location unavailable
        set({ locationPermissionGranted: false });
        
        // Set default USA location for first launch
        const defaultLocation = locationService.getDefaultLocation();
        get().setCurrentLocation(defaultLocation);
        get().setHomeLocation(defaultLocation);
      }
    } catch (error) {
      console.error('Location detection error:', error);
      
      // Fallback to default location
      const defaultLocation = locationService.getDefaultLocation();
      get().setCurrentLocation(defaultLocation);
      get().setHomeLocation(defaultLocation);
    } finally {
      set({ isLoadingLocation: false });
    }
  },
  
  loadSavedLocations: async () => {
    try {
      const currentLocation = await locationService.getSavedCurrentLocation();
      const homeLocation = await locationService.getHomeLocation();
      
      if (currentLocation) {
        set({
          currentLocation,
          regionConfig: locationService.getRegionConfig(currentLocation.country_code),
        });
      }
      
      if (homeLocation) {
        set({ homeLocation });
      }
      
      // If no saved locations, use default
      if (!currentLocation && !homeLocation) {
        const defaultLocation = locationService.getDefaultLocation();
        get().setCurrentLocation(defaultLocation);
        get().setHomeLocation(defaultLocation);
      }
    } catch (error) {
      console.error('Load saved locations error:', error);
    }
  },
  
  updateSearchRadius: (radius: number) => {
    set({ searchRadius: radius });
  },
  
  switchRegion: (location: UserLocation) => {
    get().setCurrentLocation(location);
  },
}));
