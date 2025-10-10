import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, View } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

/**
 * 눈송이 낙하 효과
 * props:
 *  - count: 눈송이 개수 (기본 48~70 추천)
 *  - speedMs: 평균 낙하 시간 (기본 7000)
 *  - sizeRange: [min,max] 눈송이 지름(px)
 *  - driftPx: 좌우 흔들림 최대폭(px) (기본 60)
 */
export default function Snow({
  count = 48,
  speedMs = 7000,
  sizeRange = [3, 8],
  driftPx = 60,
}) {
  const flakes = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
      return {
        key: `flake-${i}`,
        x: Math.random() * W,
        yStart: -40 - Math.random() * 100,
        yEnd: H + 40,
        size,
        drift: (Math.random() - 0.5) * driftPx,
        duration: speedMs * (0.8 + Math.random() * 0.6),
        delay: Math.random() * 2000,
      };
    });
  }, [count, speedMs, sizeRange, driftPx]);

  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
      {flakes.map((f, i) => {
        const { key, ...rest } = f; // key 제거
        return <Flake key={i} {...rest} />;
      })}
    </View>
  );
}

function Flake({ x, yStart, yEnd, size, drift, duration, delay }) {
  const aY = useRef(new Animated.Value(0)).current;
  const aX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(aY, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(aX, {
            toValue: 1,
            duration: duration / 2,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(aX, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [aY, aX, duration, delay]);

  const translateY = aY.interpolate({
    inputRange: [0, 1],
    outputRange: [yStart, yEnd],
  });
  const translateX = aX.interpolate({
    inputRange: [0, 1],
    outputRange: [x - drift, x + drift],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "white",
        opacity: 0.7,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
}
