// components/anim/MonkeyLoadingVideo.jsx
import { Video } from "expo-av";
import React, { useEffect, useRef } from "react";
import { View } from "react-native";

export default function MonkeyLoadingVideo({
  source = require("../../assets/videos/monkey-walk.mp4"),
  height = 280,
  zoom = 1.35,
  mirror = false,     // 🔥 좌우반전 여부
  style,
}) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.playAsync().catch(() => {});
  }, []);

  const leftPercent = -((zoom - 1) / 2) * 100;

  return (
    <View style={[{ width: "100%", height, overflow: "hidden" }, style]}>
      <Video
        ref={ref}
        source={source}
        style={{
          position: "absolute",
          width: `${zoom * 100}%`,
          height: "100%",
          left: `${leftPercent}%`,
          top: 0,
          transform: mirror ? [{ scaleX: -1 }] : undefined, // 🔥 반전
        }}
        resizeMode="COVER"
        shouldPlay
        isLooping
        isMuted
      />
    </View>
  );
}