import { Stack } from "expo-router";
import React from "react";

export default function FullscreenLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "card",
        animation: "slide_from_right",
        // 배경 투명하게 (필요 시)
        contentStyle: { backgroundColor: "transparent" },
      }}
    />
  );
}