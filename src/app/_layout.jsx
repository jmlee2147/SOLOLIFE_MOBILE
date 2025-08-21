// src/app/_layout.jsx
import SafeScreen from '../components/shared/SafeScreen';
import TabLayout from './(main)/(tabs)/_layout';

export default function RootLayout() {
  return (
    <SafeScreen>
      <TabLayout />
    </SafeScreen>
  );
}