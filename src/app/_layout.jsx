import { LikeSheetProvider } from "@components/shared/LikeSheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../../global.css";
import { ThemeProvider } from "../providers/ThemeProvider";
import { ToastProvider } from "../providers/ToastProvider";

export default function MainLayout() {
  const [loaded] = useFonts({
    "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.ttf"),
    "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.ttf"),
    "Pretendard-SemiBold": require("../assets/fonts/Pretendard-SemiBold.ttf"),
    "Pretendard-ExtraBold": require("../assets/fonts/Pretendard-ExtraBold.ttf"),
  });

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ThemeProvider>
          <ToastProvider>
            <LikeSheetProvider>
              <StatusBar style="dark" translucent={true} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  presentation: "card",
                  animation: "slide_from_right",
                  gestureEnabled: true,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              />
            </LikeSheetProvider>
          </ToastProvider>
        </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
