import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Safescreen from '../components/shared/SafeScreen';

export default function RootLayout() {
  return (
    <Safescreen>
      <StatusBar style="dark" translucent={false} />
      <Slot />
    </Safescreen>
  );
}