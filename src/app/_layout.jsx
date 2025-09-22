import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../../global.css";
import { ToastProvider } from "../providers/ToastProvider";

export default function MainLayout() {
  const [loaded] = useFonts({
    "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.ttf"),
    "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.ttf"),
    "Pretendard-SemiBold": require("../assets/fonts/Pretendard-SemiBold.ttf"),
    "Pretendard-ExtraBold": require("../assets/fonts/Pretendard-ExtraBold.ttf"),
  });

  if (!loaded) return null; // 로딩 중에는 화면 렌더 안 함

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        
          <StatusBar style="dark" translucent={true} />
          <Stack
            screenOptions={{
              headerShown: false,
              presentation: "card", // 모달/풀스크린 금지
              animation: "slide_from_right", // iOS 기본 슬라이드
              gestureEnabled: true,
              contentStyle: { backgroundColor: "transparent" },
            }}
          >
          </Stack>
        
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
