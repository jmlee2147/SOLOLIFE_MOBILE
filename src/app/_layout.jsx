// src/app/(main)/_layout.jsx
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
// 경로 주의: (main) 기준으로 components는 ../../ 가 맞음
import "../../global.css";
import SafeScreen from "../components/shared/SafeScreen";

export default function MainLayout() {
    const [loaded] = useFonts({
      "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.ttf"),
      "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.ttf"),
      "Pretendard-SemiBold": require("../assets/fonts/Pretendard-SemiBold.ttf"),
      "Pretendard-ExtraBold": require("../assets/fonts/Pretendard-ExtraBold.ttf"),
    });
  
    if (!loaded) return null; // 로딩 중에는 화면 렌더 안 함
  
  return (
    <SafeScreen>
      <StatusBar style="dark" translucent={false} />
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: "card",           // 모달/풀스크린 금지
          animation: "slide_from_right",  // iOS 기본 슬라이드
          gestureEnabled: true,
          contentStyle: { backgroundColor: "#fff" },
        }}
      >
        {/* 탭 루트 */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* 장소 추천 플로우 */}
        <Stack.Screen name="place-recommend/index" options={{ presentation: "card" }} />
        <Stack.Screen name="place-recommend/[category]" options={{ presentation: "card" }} />

        {/* 404 핸들러 있다면 */}
        <Stack.Screen name="[...unmatched]" options={{ presentation: "card" }} />
      </Stack>
    </SafeScreen>
  );
}