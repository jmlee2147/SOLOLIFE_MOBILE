import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, View } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

/**
 * 반짝이는 별 효과
 * props:
 *  - count: 별 개수 (기본 40)
 *  - maxTopRatio: 화면 높이 중 별이 배치될 비율(0~1) (기본 0.6)
 *  - durationMs: 한 번 반짝이는 왕복 시간 평균 (기본 3200)
 */
export default function Stars({ count = 40, maxTopRatio = 0.3, durationMs = 3200 }) {
  const stars = useMemo(() => {
    const cap = Math.max(0.1, Math.min(1, maxTopRatio));
    return Array.from({ length: count }).map((_, i) => ({
      id: `star-${i}`, // key는 내부 id로만 보유
      left: Math.random() * W,
      top: Math.random() * (H * cap),
      size: 1 + Math.random() * 2,
      delay: Math.random() * 2500,
      duration: durationMs * (0.7 + Math.random() * 0.6), // ±30%
    }));
  }, [count, maxTopRatio, durationMs]);

  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
      {stars.map((s, i) => {
        const { id, ...rest } = s; 
        return <Twinkle key={i} {...rest} />;
      })}
    </View>
  );
}

function Twinkle({ left, top, size, delay, duration }) {
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: duration / 2, delay, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.2, duration: duration / 2, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [a, delay, duration]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "white",
        opacity: a,
      }}
    />
  );
}