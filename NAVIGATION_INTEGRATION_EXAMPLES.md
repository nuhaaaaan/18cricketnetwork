# Navigation Integration Examples

## Quick Integration Guide for Existing Screens

### Example 1: Ground Details Screen

```typescript
// app/grounds/[id].tsx
import { useMapNavigation } from '@/hooks/useNavigation';
import { Ionicons } from '@expo/vector-icons';

export default function GroundDetailScreen() {
  const { navigateToLocation } = useMapNavigation();
  const ground = /* fetch ground data */;

  const handleNavigate = () => {
    navigateToLocation({
      id: ground.id,
      name: ground.name,
      latitude: ground.latitude,
      longitude: ground.longitude,
      address: ground.fullAddress,
      type: 'ground',
    });
  };

  return (
    <View style={styles.container}>
      {/* Other ground details */}
      
      <TouchableOpacity 
        style={styles.navigationButton}
        onPress={handleNavigate}
      >
        <Ionicons name="navigate" size={20} color="#fff" />
        <Text style={styles.buttonText}>View on Map & Navigate</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Example 2: Academy List Item

```typescript
// components/AcademyListItem.tsx
import { useMapNavigation } from '@/hooks/useNavigation';

export default function AcademyListItem({ academy }) {
  const { navigateToLocation } = useMapNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name}>{academy.name}</Text>
        <Text style={styles.address}>{academy.city}</Text>
      </View>
      
      <TouchableOpacity
        style={styles.mapButton}
        onPress={() => navigateToLocation({
          id: academy.id,
          name: academy.name,
          latitude: academy.latitude,
          longitude: academy.longitude,
          address: academy.location,
          type: 'academy',
        })}
      >
        <Ionicons name="location" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}
```

### Example 3: Match Venue Navigation

```typescript
// app/matches/[id].tsx
import { useMapNavigation } from '@/hooks/useNavigation';

export default function MatchDetailScreen() {
  const { navigateToLocation } = useMapNavigation();
  const match = /* fetch match data */;

  return (
    <View style={styles.container}>
      <View style={styles.venueSection}>
        <Text style={styles.sectionTitle}>Venue</Text>
        <Text style={styles.venueName}>{match.venue.name}</Text>
        <Text style={styles.venueAddress}>{match.venue.address}</Text>
        
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => navigateToLocation({
            id: match.venue.id,
            name: match.venue.name,
            latitude: match.venue.latitude,
            longitude: match.venue.longitude,
            address: match.venue.address,
            type: 'match',
          })}
        >
          <Ionicons name="navigate-circle" size={24} color="#fff" />
          <Text style={styles.navigateText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

### Example 4: Store Location

```typescript
// app/marketplace/store/[id].tsx
import { useMapNavigation } from '@/hooks/useNavigation';

export default function StoreScreen() {
  const { navigateToLocation } = useMapNavigation();
  const store = /* fetch store data */;

  return (
    <ScrollView style={styles.container}>
      {/* Store details */}
      
      <View style={styles.locationCard}>
        <Text style={styles.cardTitle}>Store Location</Text>
        <Text style={styles.address}>{store.address}</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => navigateToLocation({
              id: store.id,
              name: store.name,
              latitude: store.latitude,
              longitude: store.longitude,
              address: store.address,
              type: 'store',
            })}
          >
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.buttonText}>View on Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
```

### Example 5: Nearby Grounds Search Results

```typescript
// app/grounds/nearby.tsx
import { useMapNavigation } from '@/hooks/useNavigation';
import { FlatList } from 'react-native';

export default function NearbyGroundsScreen() {
  const { navigateToLocation } = useMapNavigation();
  const [grounds, setGrounds] = useState([]);

  return (
    <FlatList
      data={grounds}
      renderItem={({ item }) => (
        <View style={styles.groundCard}>
          <View style={styles.groundInfo}>
            <Text style={styles.groundName}>{item.name}</Text>
            <Text style={styles.distance}>{item.distance} km away</Text>
          </View>
          
          <TouchableOpacity
            style={styles.navigateIcon}
            onPress={() => navigateToLocation({
              id: item.id,
              name: item.name,
              latitude: item.latitude,
              longitude: item.longitude,
              address: item.address,
              type: 'ground',
            })}
          >
            <Ionicons name="navigate" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    />
  );
}
```

---

## Common Button Styles

### Primary Navigation Button
```typescript
const styles = StyleSheet.create({
  navigationButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
```

### Icon-Only Button
```typescript
const styles = StyleSheet.create({
  mapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
```

### Text Link Style
```typescript
const styles = StyleSheet.create({
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  mapLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
```

---

## Backend Model Updates Required

### Ground Model
```python
class Ground(BaseModel):
    id: str
    name: str
    description: str
    # ... existing fields
    
    # ADD THESE:
    latitude: float
    longitude: float
    address: str
    city: str
    state: Optional[str] = None
    country: str = "USA"
    zip_code: Optional[str] = None
```

### Academy Model
```python
class Academy(BaseModel):
    id: str
    name: str
    # ... existing fields
    
    # ADD THESE:
    latitude: float
    longitude: float
    address: str
    city: str
```

### Store Model
```python
class Store(BaseModel):
    id: str
    vendor_id: str
    name: str
    # ... existing fields
    
    # ADD THESE:
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    city: str
```

### Match Model
```python
class Match(BaseModel):
    id: str
    tournament_id: str
    # ... existing fields
    
    venue: dict  # Should contain:
    # {
    #   "name": "Ground Name",
    #   "latitude": 19.0760,
    #   "longitude": 72.8777,
    #   "address": "Full Address"
    # }
```

---

## Testing Checklist

- [ ] Open Navigate tab from bottom navigation
- [ ] Grant location permissions
- [ ] See current location on map
- [ ] Search for a location
- [ ] Select search result
- [ ] Map centers on selected location
- [ ] Tap "Show Route Preview"
- [ ] See route line and distance/time
- [ ] Tap "Navigate with Apple Maps" (iOS)
- [ ] Tap "Navigate with Google Maps"
- [ ] Tap "Navigate with Waze" (if installed)
- [ ] Navigate from Ground detail screen
- [ ] Navigate from Academy detail screen
- [ ] Navigate from Match detail screen
- [ ] Test with location permission denied
- [ ] Test with no internet connection
- [ ] Test search with no results

---

## Quick Tips

1. **Always provide complete LocationData**: Include name, lat, lng, and address
2. **Use appropriate type**: Helps with icon selection and filtering
3. **Handle missing coordinates gracefully**: Show error or hide navigation button
4. **Test on real device**: Location services work best on physical devices
5. **Add loading states**: Show spinner while geocoding or calculating route

---

## Need Help?

Check the main documentation: `/app/NAVIGATION_MAPS_DOCUMENTATION.md`
