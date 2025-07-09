import { Redirect } from 'expo-router';

export default function IndexScreen() {
  // Always start with the onboarding experience
  return <Redirect href="/onboarding" />;
}
