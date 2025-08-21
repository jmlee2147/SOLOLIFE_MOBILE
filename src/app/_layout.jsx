import * as Font from 'expo-font';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Text, TextInput } from 'react-native';
import '../../global.css';
import SafeScreen from '../components/shared/SafeScreen';

if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "pretendardExtraBold": require("../assets/fonts/Pretendard-ExtraBold.ttf"),
        "pretendardSemiBold": require("../assets/fonts/Pretendard-SemiBold.ttf"),
        "pretendardMedium": require("../assets/fonts/Pretendard-Medium.ttf"),
        "pretendardRegular": require("../assets/fonts/Pretendard-Regular.ttf"),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <SafeScreen>
        <Slot />
      </SafeScreen>
    </>
  );
}