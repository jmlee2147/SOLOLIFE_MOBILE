// app/(main)/_layout.jsx
import { Stack } from "expo-router";
import React from "react";
import SafeScreen from "../../components/shared/SafeScreen";

export default function MainLayout() {
  return (
    <SafeScreen backgroundColor="#FFFFFF">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
      </Stack>
    </SafeScreen>
  );
}
