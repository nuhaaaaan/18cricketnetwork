import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    // When the backend is reached through an ngrok preview tunnel this skips
    // ngrok's HTML browser-warning interstitial so XHR calls receive JSON.
    // Harmless for non-ngrok backends.
    'ngrok-skip-browser-warning': 'true',
  },
});

// Attach the auth token (saved at login/register) to every request so that
// authenticated endpoints work when called through this instance.
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore storage errors; request proceeds unauthenticated
  }
  return config;
});

export default api;
