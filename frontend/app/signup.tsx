import { Redirect } from 'expo-router';

// Clean alias for the registration route.
export default function Signup() {
  return <Redirect href="/auth/register" />;
}
