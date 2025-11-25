# Navigation & Maps Feature - 18 Cricket Network

## Overview
Complete in-app navigation and maps experience for the 18 Cricket Network Expo/React Native app. Users can search for locations, view them on a map, get route previews, and navigate using their preferred map application.

---

## Features

### ✅ Core Functionality
1. **Interactive Map View**
   - Real-time user location tracking with blue dot marker
   - Custom cricket-themed markers for locations
   - Pinch-to-zoom, pan, and rotation support
   - Smooth animations and transitions

2. **Location Search**
   - Debounced search with autocomplete
   - Search any place: grounds, academies, stores, cities, addresses
   - Visual search results with icons and addresses
   - Integration with backend API for cricket-specific entities

3. **Route Preview**
   - In-app route visualization with polylines
   - Distance and estimated travel time
   - Automatic map framing to show entire route
   - Simple route calculation (upgradeable to directions API)

4. **Deep Linking to Native Maps**
   - **Apple Maps** (iOS)
   - **Google Maps** (iOS & Android)
   - **Waze** (if installed)
   - Automatic fallback to web versions

5. **Location Permissions**
   - Graceful permission handling
   - User-friendly prompts
   - Fallback UI when permission denied
   - Re-request permissions option

---

## File Structure

```
frontend/
├── app/(tabs)/
│   └── navigate.tsx                      # Main navigation screen
├── components/Navigation/
│   ├── SearchBar.tsx                     # Search with autocomplete
│   └── LocationInfoCard.tsx              # Location details and navigation options
├── utils/
│   └── navigationService.ts              # Navigation utilities and helpers
├── hooks/
│   └── useNavigation.ts                  # Custom hook for navigating to locations
└── app.json                              # Updated with location permissions
```

---

## Installation & Setup

### 1. Dependencies
Already installed:
```bash
expo-location
react-native-maps
@react-native-community/geolocation
```

### 2. Permissions Setup
Permissions are configured in `app.json`:

**iOS:**
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`

**Android:**
- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`

### 3. Google Maps API Key (Optional)
For production with Google Maps:
1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `app.json`:
```json
{
  "ios": {
    "config": {
      "googleMapsApiKey": "YOUR_IOS_API_KEY"
    }
  },
  "android": {
    "config": {
      "googleMaps": {
        "apiKey": "YOUR_ANDROID_API_KEY"
      }
    }
  }
}
```

---

## Usage

### From Any Screen

#### Method 1: Using the Custom Hook
```typescript
import { useMapNavigation } from '@/hooks/useNavigation';

function GroundDetailScreen() {
  const { navigateToLocation } = useMapNavigation();

  const handleNavigate = () => {
    navigateToLocation({
      id: ground.id,
      name: ground.name,
      latitude: ground.latitude,
      longitude: ground.longitude,
      address: ground.address,
      type: 'ground',
    });
  };

  return (
    <TouchableOpacity onPress={handleNavigate}>
      <Text>View on Map & Navigate</Text>
    </TouchableOpacity>
  );
}
```

#### Method 2: Direct Router Navigation
```typescript
import { useRouter } from 'expo-router';

function AcademyScreen() {
  const router = useRouter();

  const openMap = () => {
    router.push({
      pathname: '/(tabs)/navigate',
      params: {
        locationData: JSON.stringify({
          id: academy.id,
          name: academy.name,
          latitude: academy.latitude,
          longitude: academy.longitude,
          address: academy.address,
          type: 'academy',
        }),
      },
    });
  };
}
```

### Location Data Interface
```typescript
interface LocationData {
  id?: string;
  name: string;                // Display name
  latitude: number;           // Required
  longitude: number;          // Required
  address?: string;           // Optional address
  type?: 'ground' | 'academy' | 'store' | 'match' | 'user' | 'search';
}
```

---

## Navigation Service API

### Location Services

#### `getCurrentLocation()`
Get user's current location.
```typescript
const location = await getCurrentLocation();
// Returns: Location.LocationObject | null
```

#### `requestLocationPermission()`
Request foreground location permissions.
```typescript
const hasPermission = await requestLocationPermission();
// Returns: boolean
```

### Geocoding

#### `geocodeAddress(address: string)`
Convert address to coordinates.
```typescript
const coords = await geocodeAddress("Mumbai, India");
// Returns: { latitude: number; longitude: number } | null
```

#### `reverseGeocode(lat: number, lng: number)`
Convert coordinates to address.
```typescript
const address = await reverseGeocode(19.0760, 72.8777);
// Returns: string | null
```

### Route Calculation

#### `estimateRoute(from, to)`
Estimate route distance and duration.
```typescript
const route = await estimateRoute(
  { latitude: 19.0760, longitude: 72.8777 },
  { latitude: 19.1136, longitude: 72.8697 }
);
// Returns: { distance: number, duration: number }
```

#### `calculateDistance(lat1, lon1, lat2, lon2)`
Calculate direct distance between two points.
```typescript
const meters = calculateDistance(19.0760, 72.8777, 19.1136, 72.8697);
// Returns: number (meters)
```

### Formatting

#### `formatDistance(meters: number)`
Format distance for display.
```typescript
formatDistance(1500); // "1.5km"
formatDistance(500);  // "500m"
```

#### `formatDuration(seconds: number)`
Format duration for display.
```typescript
formatDuration(3600); // "1h 0m"
formatDuration(900);  // "15 min"
```

### Deep Linking

#### `openInAppleMaps(location: LocationData)`
Open location in Apple Maps.
```typescript
const success = await openInAppleMaps(location);
// Returns: boolean
```

#### `openInGoogleMaps(location: LocationData)`
Open location in Google Maps.
```typescript
const success = await openInGoogleMaps(location);
// Returns: boolean
```

#### `openInWaze(location: LocationData)`
Open location in Waze.
```typescript
const success = await openInWaze(location);
// Returns: boolean
```

#### `isWazeInstalled()`
Check if Waze is installed.
```typescript
const installed = await isWazeInstalled();
// Returns: boolean
```

---

## Integration with Backend

### Required Backend Updates

#### 1. Add Location Fields to Models
Update models to include location data:

```python
# backend/api_models.py
class Ground(BaseModel):
    # ... existing fields
    latitude: float
    longitude: float
    address: str
    
class Academy(BaseModel):
    # ... existing fields
    latitude: float
    longitude: float
    address: str

class Store(BaseModel):
    # ... existing fields
    latitude: float
    longitude: float
    address: str
```

#### 2. Search Endpoint
Create a unified search endpoint that returns locations:

```python
@router.get("/search/locations")
async def search_locations(query: str, limit: int = 10):
    """Search across grounds, academies, stores, etc."""
    results = []
    
    # Search grounds
    grounds = await db.grounds.find({
        "$or": [
            {"name": {"$regex": query, "$options": "i"}},
            {"city": {"$regex": query, "$options": "i"}}
        ]
    }).limit(limit).to_list()
    
    for ground in grounds:
        results.append({
            "id": ground["id"],
            "name": ground["name"],
            "address": ground["address"],
            "latitude": ground["latitude"],
            "longitude": ground["longitude"],
            "type": "ground"
        })
    
    # Search academies
    # ... similar logic
    
    return results
```

#### 3. Frontend Search Integration
Update `SearchBar` component to call backend:

```typescript
const handleSearch = async (query: string) => {
  const response = await fetch(
    `${BACKEND_URL}/api/v1/search/locations?query=${encodeURIComponent(query)}`
  );
  const results = await response.json();
  return results;
};
```

---

## UI/UX Guidelines

### Design Principles
1. **Cricket-Themed**: Red (#DC2626) primary color for markers and buttons
2. **Dark Mode First**: Background (#000), Surface (#1A1A1A)
3. **Smooth Animations**: All map movements and state changes are animated
4. **Touch-Friendly**: Minimum 44pt touch targets on all interactive elements
5. **Clear Hierarchy**: Search → Map → Info Card → Navigation Options

### Color Palette
```typescript
Colors.primary       // #DC2626 (Red)
Colors.background    // #000 (Black)
Colors.surface       // #1A1A1A (Dark Gray)
Colors.text          // #FFFFFF (White)
Colors.textSecondary // #999999 (Gray)
```

### Typography
- **Location Name**: 18px, Bold
- **Address**: 14px, Regular
- **Stats**: 14px, Semibold
- **Buttons**: 16px, Semibold

---

## Map Customization

### Custom Markers
The app uses custom markers with cricket-specific icons:
- 🏏 Ground: `baseball` icon
- 🏫 Academy: `school` icon
- 🏪 Store: `storefront` icon
- 📍 Generic: `location` icon

### Map Style (Optional)
To apply custom map styling (dark theme):

```typescript
// Add to MapView component
<MapView
  customMapStyle={[
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#212121" }]
    },
    // ... more style rules
  ]}
/>
```

---

## Production Considerations

### 1. Directions API
Currently using simple straight-line route preview. For production:

**Option A: Google Directions API**
```typescript
const getDirections = async (origin, destination) => {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.routes[0];
};
```

**Option B: Mapbox Directions API**
```typescript
const getDirections = async (origin, destination) => {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?access_token=${MAPBOX_TOKEN}`;
  const response = await fetch(url);
  return await response.json();
};
```

### 2. Places Autocomplete
For better search suggestions:

**Google Places Autocomplete:**
```bash
yarn add react-native-google-places-autocomplete
```

**Mapbox Search:**
```bash
yarn add @mapbox/search-js-react
```

### 3. Background Location (Optional)
For tracking during navigation:
```bash
yarn add expo-task-manager expo-background-fetch
```

### 4. Offline Maps (Optional)
For areas with poor connectivity:
```bash
yarn add react-native-offline-map
```

---

## Testing

### 1. Test on Real Device
Location services work best on physical devices:
```bash
expo start --device
```

### 2. Test Location Permissions
- Deny permission → Should show prompt
- Grant permission → Should show user location
- Revoke and re-request → Should work

### 3. Test Deep Links
- iOS: Test Apple Maps opens correctly
- Android: Test Google Maps opens correctly
- Both: Test Waze (if installed)

### 4. Test Search
- Search for known locations
- Search for non-existent locations
- Test with poor network connection

---

## Troubleshooting

### Map Not Loading
**Issue**: Blank map screen
**Solutions**:
1. Add Google Maps API key to `app.json`
2. Check network connectivity
3. Verify `react-native-maps` installation

### Location Permission Denied
**Issue**: User location not showing
**Solutions**:
1. Check device settings
2. Reinstall app to reset permissions
3. Test permission request flow

### Deep Link Not Working
**Issue**: External app doesn't open
**Solutions**:
1. Check if app is installed
2. Verify URL scheme format
3. Test with web fallback

### Search Not Working
**Issue**: No search results
**Solutions**:
1. Check backend API endpoint
2. Verify network request
3. Check query format

---

## Future Enhancements

1. **Turn-by-Turn Navigation**: Real-time navigation with voice guidance
2. **Traffic Layer**: Show current traffic conditions
3. **AR Navigation**: Augmented reality directions
4. **Offline Maps**: Download maps for offline use
5. **Location Sharing**: Share location with friends/team
6. **Favorite Locations**: Save frequently visited places
7. **Recent Searches**: History of searched locations
8. **Nearby Feature**: Auto-discover nearby grounds/academies
9. **Multi-Stop Routes**: Plan routes with multiple waypoints
10. **Integration with Matches**: Navigate to match venues with time tracking

---

## Performance Tips

1. **Debounce Search**: Already implemented (500ms delay)
2. **Limit Results**: Return max 10-20 search results
3. **Lazy Load Markers**: Only show markers in viewport
4. **Cache Geocoding**: Store frequently searched locations
5. **Optimize Images**: Use WebP for marker icons

---

## Support

For issues or questions:
- Check logs: `expo start` and look for errors
- Review permissions in device settings
- Verify backend API connectivity
- Check Google Maps API quota (if using)

---

## Summary

The navigation & maps feature is now fully integrated into the 18 Cricket Network app. Users can:
- ✅ Search for any location
- ✅ View locations on an interactive map
- ✅ See route previews with distance and ETA
- ✅ Navigate using Apple Maps, Google Maps, or Waze
- ✅ Easily integrate navigation from any screen

The implementation follows Expo best practices, maintains the app's branding, and provides an excellent user experience.
