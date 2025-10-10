import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, View } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

/**
 * 빗줄기 낙하 효과 (↙ 방향: 오른쪽 위 → 왼쪽 아래)
 * props:
 *  - count: 빗방울 개수 (기본 90~120 추천)
 *  - angleDeg: 낙하 각도(기본 -25도, 음수면 ↙ / 양수면 ↘)
 *  - speedMs: 평균 낙하 시간 (기본 1600)
 *  - thickness: 빗줄기 두께(px) (기본 1.5)
 *  - lengthRange: [min,max] 빗줄기 길이(px)
 */
export default function Rain({
  count = 120,
  angleDeg = 0,           // ⬅️ 기본을 왼쪽 아래로
  speedMs = 1800,
  thickness = 1.5,
  lengthRange = [10, 26],
}) {
  const angleRad = (angleDeg * Math.PI) / 180;

  // 스폰 마진: 약간 화면 밖에서 들어오도록
  const MARGIN = 80;
  const spawnXMin = angleRad < 0 ? 0 : -MARGIN;        // ↙이면 0~W+MARGIN
  const spawnXMax = angleRad < 0 ? W + MARGIN : W;     // ↘이면 -MARGIN~W

  const drops = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const len = lengthRange[0] + Math.random() * (lengthRange[1] - lengthRange[0]);
      return {
        // key는 스프레드에 포함하지 않기 위해 내부 id로만 사용
        id: `drop-${i}`,
        x: spawnXMin + Math.random() * (spawnXMax - spawnXMin),
        yStart: -40 - Math.random() * 120,
        yEnd: H + 60,
        length: len,
        duration: speedMs * (0.75 + Math.random() * 0.6),
        delay: Math.random() * 800,
      };
    });
  }, [count, speedMs, lengthRange, spawnXMin, spawnXMax]);

  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
      {drops.map((d, i) => {
        const { id, ...rest } = d; // key 제거
        return <Drop key={i} {...rest} angleRad={angleRad} thickness={thickness} />;
      })}
    </View>
  );
}

function Drop({
  x,
  yStart,
  yEnd,
  length,
  duration,
  delay,
  angleRad,
  thickness,
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration, delay]);

  // 수직 이동
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [yStart, yEnd],
  });

  // 대각선 이동: 각도에 따라 X 도 같이 이동 (angleRad < 0 → 왼쪽으로 이동)
  const deltaX = Math.tan(angleRad) * (yEnd - yStart);
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [x, x + deltaX],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: thickness,
        height: length,
        backgroundColor: "rgba(255,255,255,0.4)",
        borderRadius: thickness / 2,
        transform: [
          { translateX },
          { translateY },
          { rotate: `${angleRad}rad` },
        ],
      }}
    />
  );
}