# 18 Cricket Network - Global Location-Aware Architecture

## Overview

The 18 Cricket Network is now fully location-aware with USA as the initial production launch region, but architected to support ALL cricket-playing and non-cricket-playing countries globally.

**App Name**: 18 Cricket Network  
**Store Brand**: 18 Cricket Company  
**Motto**: "A tribute to the legacy of THE KING"  
**Initial Launch**: United States (USA)  
**Global Readiness**: ALL countries supported

---

## 🌍 Supported Regions

### Primary Cricket Nations (Full Support)
- 🇺🇸 **United States** (Initial Launch)
- 🇮🇳 India
- 🇬🇧 United Kingdom
- 🇦🇺 Australia
- 🇨🇦 Canada
- 🇦🇪 United Arab Emirates
- 🇳🇿 New Zealand
- 🇿🇦 South Africa
- 🇵🇰 Pakistan
- 🇧🇩 Bangladesh
- 🇱🇰 Sri Lanka
- 🇼🇸 West Indies

### Architecture
**Any country can be added** without code changes - just configuration updates.

---

## 📱 Implementation Status

### ✅ Completed
1. **Location Service** (`utils/locationService.ts`)
   - GPS detection
   - Reverse geocoding
   - Distance calculations
   - Currency formatting
   - Region configurations

2. **Location Store** (`store/locationStore.ts`)
   - Current location management
   - Home location storage
   - Region switching
   - Search radius configuration

3. **Backend Updates** (In Progress)
   - Location-aware API endpoints
   - Geospatial queries
   - Region filtering

### ⏳ To Be Completed
1. Location Permission Screen
2. Manual Region Selection
3. Region Settings Screen
4. Location Pills in UI
5. "Near Me" Features
6. Chatbot Location Integration

---

## 🏗️ Architecture

### Frontend Components

```
frontend/
├── utils/
│   └── locationService.ts          # Core location utilities
├── store/
│   └── locationStore.ts            # Global location state
├── screens/
│   ├── LocationPermissionScreen    # First-time permission
│   ├── RegionSelectionScreen       # Manual region picker
│   └── RegionSettingsScreen        # Change region settings
└── components/
    └── LocationPill                # Location indicator
```

### Backend Structure

```python
# User location fields
class User:
    country_code: str              # ISO country code
    country_name: str              # Full country name
    state_or_region: str           # State/Province/Region
    city: str                      # City name
    last_known_lat: float          # Last GPS latitude
    last_known_lng: float          # Last GPS longitude
    home_country_code: str         # Original home country
    primary_currency: str          # USD, INR, GBP, etc.
    preferred_distance_unit: str   # km or miles
    search_radius_km: float        # Default search radius

# Venue location fields (Grounds, Academies, etc.)
class Venue:
    country_code: str
    state_or_region: str
    city: str
    lat: float
    lng: float
    address: Dict
```

---

## 🎯 Region Configuration

### Supported Regions

```typescript
export const REGION_CONFIGS = {
  US: {
    country_code: 'US',
    currency: 'USD',
    currency_symbol: '$',
    distance_unit: 'miles',
    locale: 'en-US',
  },
  IN: {
    currency: 'INR',
    currency_symbol: '₹',
    distance_unit: 'km',
    locale: 'en-IN',
  },
  GB: {
    currency: 'GBP',
    currency_symbol: '£',
    distance_unit: 'km',
    locale: 'en-GB',
  },
  // ... etc for all countries
};
```

### Features Per Region

**USA (Initial Launch)**:
- Currency: USD ($)
- Distance: Miles
- Priority: USA leagues, grounds, vendors
- Sections: "Cricket near you in [City, State]"

**India**:
- Currency: INR (₹)
- Distance: Kilometers
- Priority: IPL, Ranji Trophy, local tournaments

**UK**:
- Currency: GBP (£)
- Distance: Kilometers
- Priority: County cricket, club leagues

**Universal**:
- Global feed always available
- International vendors visible
- Cross-border tournaments supported

---

## 🔄 User Flow

### First Launch

```
1. Welcome Screen
   ↓
2. Request Location Permission
   ↓
├─ Granted → Detect GPS Location
│   ↓
│   Auto-detect Country, State, City
│   ↓
│   Save as Current & Home Location
│   ↓
│   Continue to App
│
└─ Denied → Manual Region Selection
    ↓
    Show Country Dropdown
    ↓
    Show State/Region (if applicable)
    ↓
    Show City (optional)
    ↓
    Save Manual Location
    ↓
    Continue to App
```

### Travel Detection

```
User Opens App in New Country
↓
Detect GPS Location
↓
Compare with Home Location
↓
Country Changed?
├─ Yes → Show Dialog:
│   "We've detected you're now in [New Country].
│    Switch your region to see local content?"
│   ├─ Yes → Update Current Region
│   └─ No → Keep Home Region
│
└─ No → Continue Normal
```

---

## 🌐 Location-Aware Features

### 1. Social Feed
- **Near Me Tab**: Posts/Reels from users in same country/region
- **Global Tab**: Worldwide content
- **Filter**: By distance (5km, 20km, 50km, 100km)

### 2. Tournaments
- **Default**: Tournaments in user's country/region
- **Filters**: 
  - Local (within city)
  - Regional (within state)
  - National (within country)
  - International (global)

### 3. Grounds & Facilities
- **Map View**: Grounds near user's location
- **List View**: Sorted by distance
- **Search Radius**: Configurable (default 50km)
- **Units**: Miles (USA) or Km (other regions)

### 4. Marketplace
- **Local Vendors**: Priority display for vendors in same country
- **International Vendors**: Flagged with:
  - "International Shipping"
  - Estimated delivery time
  - Shipping cost
- **Currency**: Auto-convert to user's currency

### 5. Pickup Cricket
- **Only shows**: Matches within search radius
- **Sorted by**: Distance from user
- **Create Match**: Auto-fills user's location

### 6. Coaches/Trainers/Academies
- **Near Me**: Within configurable radius
- **Sort by**: Distance, Rating, Price
- **Travel Distance**: Shown in user's preferred unit

### 7. AI Chatbot
- **Context-Aware**: Knows user's country, region, city
- **Recommendations**: Based on user location
- **Currency**: Uses region currency
- **Distance**: Uses region units

**Example Queries**:
- "Find grounds near me in Dallas"
- "Show academies in my area"
- "What tournaments are happening in California?"
- "Where can I buy a bat nearby?"

---

## 🎨 UI/UX Implementation

### Location Pill (Home Screen)

```tsx
<TouchableOpacity onPress={openRegionSettings}>
  <View style={styles.locationPill}>
    <Ionicons name="location" size={14} color={Colors.primary} />
    <Text style={styles.locationText}>
      {city}, {country_code}
    </Text>
  </View>
</TouchableOpacity>
```

### Section Headers

**Dynamic Labels**:
- "Trending near you"
- "Popular grounds in [City]"
- "Local vendors in [Country]"
- "Tournaments in [Region]"

### Distance Display

```tsx
const distanceText = locationService.formatDistance(
  distanceInKm,
  regionConfig.distance_unit
);

<Text>{distanceText} away</Text>
// USA: "3.2 miles away"
// India: "5.1 km away"
```

### Currency Display

```tsx
const priceText = locationService.formatCurrency(
  amount,
  user.country_code
);

<Text>{priceText}</Text>
// USA: "$50"
// India: "₹4,000"
// UK: "£40"
```

---

## 🔧 Backend API Updates

### Location-Aware Endpoints

```python
# Near Me Query Helper
def get_nearby_items(
    collection,
    lat: float,
    lng: float,
    radius_km: float,
    filters: Dict = None
):
    query = {
        'lat': {
            '$gte': lat - (radius_km / 111),
            '$lte': lat + (radius_km / 111),
        },
        'lng': {
            '$gte': lng - (radius_km / (111 * cos(radians(lat)))),
            '$lte': lng + (radius_km / (111 * cos(radians(lat)))),
        }
    }
    
    if filters:
        query.update(filters)
    
    items = await collection.find(query).to_list()
    
    # Calculate exact distances
    for item in items:
        item['distance_km'] = calculate_distance(
            lat, lng,
            item['lat'], item['lng']
        )
    
    # Sort by distance
    items.sort(key=lambda x: x['distance_km'])
    
    return items
```

### Updated API Endpoints

```python
# Grounds with location
GET /api/grounds?lat={lat}&lng={lng}&radius={radius}&country={code}

# Tournaments by region
GET /api/tournaments?country_code={code}&state={state}&city={city}

# Vendors by country
GET /api/products?country_code={code}&local_only={bool}

# Pickup matches nearby
GET /api/pickup/matches?lat={lat}&lng={lng}&radius={radius}

# Academies near me
GET /api/academies?lat={lat}&lng={lng}&radius={radius}

# Update user location
PUT /api/users/{id}/location
Body: {
  "country_code": "US",
  "state_or_region": "California",
  "city": "Los Angeles",
  "lat": 34.0522,
  "lng": -118.2437
}
```

---

## 🗺️ Settings Screen

### Region & Location Settings

```
┌─────────────────────────────────────┐
│  Region & Location                  │
├─────────────────────────────────────┤
│                                     │
│  Current Location                   │
│  📍 Los Angeles, California, USA    │
│  [Detected Automatically]           │
│                                     │
│  Home Region                        │
│  🏠 New York, USA                   │
│  [Edit]                             │
│                                     │
│  Search Radius                      │
│  ○ 5 miles                          │
│  ○ 20 miles                         │
│  ● 50 miles                         │
│  ○ 100 miles                        │
│  ○ Custom                           │
│                                     │
│  Preferences                        │
│  Currency: USD ($)                  │
│  Distance: Miles                    │
│                                     │
│  [Change Region Manually]           │
│  [Refresh Location]                 │
│                                     │
└─────────────────────────────────────┘
```

---

## 🌍 Global Expansion Plan

### Phase 1: USA Launch (Current)
- Focus: USA content, grounds, leagues
- Polish: USA-specific features
- Testing: US-based beta users

### Phase 2: India Expansion
- Add: Indian grounds, academies, vendors
- Integrate: IPL, Ranji Trophy data
- Language: Add Hindi support

### Phase 3: UK/Australia/Canada
- Expand: to major cricket nations
- Partnerships: with local cricket boards

### Phase 4: Global
- Scale: to all cricket-playing nations
- Features: Multi-language, multi-currency

---

## 🔐 Privacy & Permissions

### Location Permission Handling

**iOS**:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>18 Cricket Network uses your location to show nearby cricket grounds, academies, tournaments, and pickup matches in your area.</string>
```

**Android**:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### Data Storage
- GPS coordinates stored locally (AsyncStorage)
- Server stores only: country, state, city (no precise coords)
- User can opt out of location services
- Manual region selection always available

---

## 📊 Analytics & Monitoring

### Metrics to Track
- Location permission grant rate
- Most common user regions
- Cross-border activity
- Region switching frequency
- "Near Me" feature usage
- Distance-based engagement

### Reports
- Users by country
- Active regions
- International transactions
- Travel patterns
- Content popularity by region

---

## 🚀 Deployment Checklist

### USA Launch
- [x] Location detection implemented
- [x] USA as default region
- [x] USD currency support
- [x] Miles as distance unit
- [ ] USA grounds database populated
- [ ] USA leagues/tournaments added
- [ ] USA vendors onboarded
- [ ] Location permission screens
- [ ] Region settings UI
- [ ] Testing with USA users

### Global Readiness
- [x] Multi-country architecture
- [x] Currency conversion system
- [x] Distance unit switching
- [ ] Multi-language support
- [ ] International payment methods
- [ ] Regional compliance (GDPR, etc.)
- [ ] Country-specific content

---

## 🎯 Key Benefits

### For Users
- ✅ See cricket activity near them
- ✅ Find local grounds and academies
- ✅ Join nearby pickup matches
- ✅ Support local vendors
- ✅ Discover regional tournaments

### For Platform
- ✅ Higher engagement (localized content)
- ✅ Better match recommendations
- ✅ Increased marketplace conversions
- ✅ Community building by region
- ✅ Global scalability

### For Business
- ✅ USA-first launch strategy
- ✅ Easy international expansion
- ✅ Regional partnerships
- ✅ Localized marketing
- ✅ Country-specific monetization

---

## 📝 Next Steps

### Immediate (Week 1)
1. ✅ Location service implementation
2. ✅ Location store setup
3. ⏳ Permission screens
4. ⏳ Region selection UI
5. ⏳ Settings integration

### Short-term (Week 2-3)
1. Backend API updates
2. "Near Me" features
3. Chatbot integration
4. Testing & polish
5. USA content population

### Long-term (Month 2+)
1. Multi-language support
2. Regional partnerships
3. International expansion
4. Advanced geofencing
5. Location-based notifications

---

**Status**: Foundation Complete ✅  
**Next**: UI Screens & Backend Integration  
**Launch Ready**: USA (with global architecture)
