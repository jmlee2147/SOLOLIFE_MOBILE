import React from "react";
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export default function SpeechBubble({
  text,
  style,
  // 본체 옵션
  paddingH = 14,
  paddingV = 8,
  radius = 4,
  maxWidth = 280,
  bg = "#fff",
  // 꼬리 옵션
  tailWidth = 12,
  tailHeight = 5,
}) {
  return (
    <View style={[{ alignItems: "center" }, style]}>
      {/* 본체 */}
      <View
        style={{
          maxWidth,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          borderRadius: radius,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 0 },
          elevation: 3,
        }}
      >
        <Text className="font-pretendardMedium text-body-2 text-green500">
          {text}
        </Text>
      </View>

      {/* 꼬리 */}
      <View
        style={{
            alignSelf: "center",
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3, 
        }}
        >
        <Svg width={tailWidth} height={tailHeight} viewBox="0 0 12 5" fill="none">
            <Path
            d="M11.8291 0C11.1379 0.278526 10.5281 0.747394 10.0801 1.36816L9.24316 2.52734C7.64665 4.73912 4.35335 4.73912 2.75684 2.52734L1.91992 1.36816C1.47189 0.747394 0.862088 0.278526 0.170898 0H11.8291Z"
            fill={bg}
            />
        </Svg>
        </View>
    </View>
  );
}