import React from "react";
import { Pressable, View } from "react-native";
import Icon from "../shared/Icon";
import SpeechBubble from "../shared/SpeechBubble";

export default function FloatingButton({
  onPress,
  showLabel = true,
  label = "+100 EXP",
  bottom = 24,
  right = 25,
  size = 50,              // 버튼 지름
  bubbleOffsetX = 0,      // 말풍선 가로 미세조정(+오른쪽 / -왼쪽)
  bubbleOffsetY = 6,      // 말풍선과 버튼 사이 간격
}) {
  return (
    <View
      style={{
        position: "absolute",
        right,
        bottom,
        alignItems: "center",
      }}
    >
      {/* 말풍선: 버튼 중앙 위에 배치 */}
      {showLabel && (
        <SpeechBubble
          text="+100 EXP"
          paddingH={5}
          paddingV={4}
          maxWidth={220}
          textColor="#4B5563"
          style={{ marginBottom: 9 }}
        />
      )}

      {/* 실제 플로팅 버튼 */}
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: true }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#62974F",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 3.3,
          elevation: 6,
        }}
        hitSlop={8}
      >
        <Icon name="write" width={24} height={24} />
      </Pressable>
    </View>
  );
}