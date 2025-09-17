import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../../global.css";
import SafeScreen from "../components/shared/SafeScreen";
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
    <ToastProvider>
      <SafeScreen>
        <StatusBar style="dark" translucent={true} />
        <Stack
          screenOptions={{
            headerShown: false,
            presentation: "card", // 모달/풀스크린 금지
            animation: "slide_from_right", // iOS 기본 슬라이드
            gestureEnabled: true,
            contentStyle: { backgroundColor: "#fff" },
          }}
        >
          {/* 탭 루트 */}
          <Stack.Screen name="(main)/(tabs)" options={{ headerShown: false }} />

          {/* 장소 추천 플로우 */}
          <Stack.Screen
            name="(main)/place-recommend/index"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="(main)/place-recommend/[category]"
            options={{ presentation: "card" }}
          />
          <Stack.Screen name="(main)/place-recommend/keywords" />
          <Stack.Screen name="(main)/place-recommend/results" />
        </Stack>
      </SafeScreen>
    </ToastProvider>
  );
}
