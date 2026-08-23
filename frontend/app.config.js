// Dynamic Expo config layered on top of app.json.
//
// Keeps every static value from app.json and only makes the backend URL
// configurable per environment. When EXPO_PUBLIC_BACKEND_URL is set (e.g. in
// local development, pointing at the local FastAPI server) it wins; otherwise
// the value committed in app.json is used, so production builds are unchanged.
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    EXPO_PUBLIC_BACKEND_URL:
      process.env.EXPO_PUBLIC_BACKEND_URL || config.extra?.EXPO_PUBLIC_BACKEND_URL,
  },
});
