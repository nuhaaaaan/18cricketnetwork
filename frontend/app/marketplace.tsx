import { Redirect } from 'expo-router';

// Clean alias -> Marketplace tab.
export default function Marketplace() {
  return <Redirect href="/(tabs)/marketplace" />;
}
