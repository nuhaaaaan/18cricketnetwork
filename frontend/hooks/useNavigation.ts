/**
 * Custom hook for navigation to maps
 */

import { useRouter } from 'expo-router';
import { LocationData } from '@/utils/navigationService';

export function useMapNavigation() {
  const router = useRouter();

  const navigateToLocation = (location: LocationData) => {
    // Navigate to the navigate tab with location params
    router.push({
      pathname: '/(tabs)/navigate',
      params: {
        locationData: JSON.stringify(location),
      },
    });
  };

  return { navigateToLocation };
}
