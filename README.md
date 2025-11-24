# 18cricket - Complete Cricket Platform

**"A tribute to the legacy of THE KING"**

A comprehensive mobile-first cricket ecosystem platform featuring a multi-vendor marketplace, academy hub, tournament management, ground booking system, and social community features.

**App Name**: 18cricket (for App Store, Play Store, Microsoft Store)

## 🏏 Features

### 1. **Multi-Vendor Marketplace**
- Buy cricket gear from trusted vendors across India
- Categories: Bats, Balls, Pads, Gloves, Shoes, Accessories
- New and used equipment marketplace
- Shopping cart and wishlist
- Secure payment integration with Razorpay
- Order tracking and management

### 2. **Academy Hub**
- Discover cricket academies in your city
- View academy profiles with fees, schedules, and facilities
- Lead generation system for academies
- Direct contact with academy owners

### 3. **Tournament Management**
- Browse upcoming, ongoing, and completed tournaments
- Register teams for tournaments
- View fixtures, points tables, and match schedules
- Track MVP players and team performance

### 4. **Ground Booking System**
- Find and book cricket grounds
- Filter by ground type: Turf, Mat, Concrete
- View facilities and pricing
- Real-time availability checking
- Booking management

### 5. **Social & Community**
- Share posts, reels, and match highlights
- Create and manage cricket teams
- Team chat and discussions
- Community engagement with likes and comments

## 🛠 Tech Stack

**Frontend**: Expo (React Native), Zustand, Axios, React Native Maps  
**Backend**: FastAPI (Python), MongoDB, JWT Auth, Razorpay  

## 🚀 Quick Start

### Backend:
```bash
cd backend
pip install -r requirements.txt
# Add Razorpay keys to .env
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend:
```bash
cd frontend
yarn install
expo start
```

## 💳 Razorpay Setup

1. **Sign up**: [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)
2. **Get Test Keys**: Settings → API Keys → Test Mode
3. **Add to .env**:
   ```
   RAZORPAY_KEY_ID="rzp_test_xxxxx"
   RAZORPAY_KEY_SECRET="your_secret"
   ```
4. **Test Card**: 4111 1111 1111 1111

## 📱 App Deployment

### Google Play Store
```bash
eas build --platform android
```
- Requires: Google Play Console account ($25)
- Submit AAB file for review

### Apple App Store
```bash
eas build --platform ios
```
- Requires: Apple Developer account ($99/year)
- Submit IPA via App Store Connect

## 📊 API Documentation

Visit: `http://localhost:8001/docs` for interactive API docs

## 🧪 Test Account

- **Phone**: 9876543210
- **Password**: test123
- **Type**: Vendor

## 📞 Support

- Razorpay: [https://razorpay.com/support/](https://razorpay.com/support/)
- Expo: [https://docs.expo.dev/](https://docs.expo.dev/)

---

**Version**: 1.0.0  
Built with ❤️ for Cricket
