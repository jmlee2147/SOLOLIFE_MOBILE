import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

export default function NumberedPin({
  number = 1,
  size = 24, // 크기 조절 가능
  color = "#62974F", // 핀 색
}) {
  // 비율 맞추기: 원본 SVG가 25x32 기준이므로 높이는 자동 비례
  const baseW = 25;
  const baseH = 32;
  const scale = size / baseW;
  const height = baseH * scale;

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height,
      }}
    >
      {/* SVG 핀 */}
      <Svg
        width={19}
        height={25}
        viewBox="0 0 25 32"
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          d="M25 12.5C25 22 13 33.5 13 33.5C13 33.5 0 21 0 12.5C0 5.59644 5.59644 0 12.5 0C19.4036 0 25 5.59644 25 12.5Z"
          fill={color}
          opacity="1"
        />
        <Circle cx="12.5" cy="12.5" r="7.5" fill="white" />
      </Svg>

      {/* 숫자 오버레이 */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: height * 0.05, // 핀 머리 부분 중앙쯤으로 위치 보정
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: color,
            fontWeight: "600",
            fontSize: 12, // 핀 크기에 비례
            lineHeight: size * 0.9,
          }}
        >
          {number}
        </Text>
      </View>
    </View>
  );
}
