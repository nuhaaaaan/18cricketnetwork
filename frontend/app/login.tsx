import { Redirect } from 'expo-router';

// Clean alias for the login route.
export default function Login() {
  return <Redirect href="/auth/login" />;
}
