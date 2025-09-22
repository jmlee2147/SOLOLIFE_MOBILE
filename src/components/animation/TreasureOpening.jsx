import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";

export default function TreasureOpening({
  size = 220,
  play = true,
  loop = false,
  duration = 700,
  onComplete,
  sources,
  style,
}) {
  const CLOSED = sources?.closed || require("../../assets/images/treasure_close.png");
  const MID    = sources?.mid    || require("../../assets/images/treasure_half.png");
  const OPEN   = sources?.open   || require("../../assets/images/treasure_open.png");
  const RAYS   = sources?.rays   || require("../../assets/images/treasure_rays.png");

  const closedOpacity = useRef(new Animated.Value(1)).current;
  const midOpacity    = useRef(new Animated.Value(0)).current;
  const openOpacity   = useRef(new Animated.Value(0)).current;

  const scaleX     = useRef(new Animated.Value(1)).current;
  const scaleY     = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale   = useRef(new Animated.Value(0.9)).current;

  const raysOpacity = useRef(new Animated.Value(0)).current;
  const raysScale   = useRef(new Animated.Value(1)).current;
  const raysRotate  = useRef(new Animated.Value(0)).current;

  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!play) {
      closedOpacity.setValue(1);
      midOpacity.setValue(0);
      openOpacity.setValue(0);
      return;
    }
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      setRunning(true);

      const squashMs = Math.round(duration * 0.22);
      const settleMs = Math.round(duration * 0.12);
      const midMs    = Math.round(duration * 0.28);
      const openMs   = Math.round(duration * 0.38);

      closedOpacity.setValue(1);
      midOpacity.setValue(0);
      openOpacity.setValue(0);
      scaleX.setValue(1);
      scaleY.setValue(1);
      translateY.setValue(0);
      glowOpacity.setValue(0);
      glowScale.setValue(0.9);
      raysOpacity.setValue(0);
      raysScale.setValue(0.8);
      raysRotate.setValue(0);

      const squash = Animated.parallel([
        Animated.timing(scaleX, { toValue: 1.05, duration: squashMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scaleY, { toValue: 0.92, duration: squashMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 4, duration: squashMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]);

      const toMid = Animated.parallel([
        Animated.timing(closedOpacity, { toValue: 0, duration: settleMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(midOpacity,    { toValue: 1, duration: settleMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scaleX,        { toValue: 1, duration: settleMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scaleY,        { toValue: 1, duration: settleMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateY,    { toValue: 0, duration: settleMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]);

      const toOpen = Animated.parallel([
        Animated.timing(midOpacity,  { toValue: 0, duration: midMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(openOpacity, { toValue: 1, duration: midMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),

        Animated.sequence([
          Animated.timing(scaleX, { toValue: 1.06, duration: Math.round(openMs * 0.5), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(scaleX, { toValue: 1.00, duration: Math.round(openMs * 0.5), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scaleY, { toValue: 1.06, duration: Math.round(openMs * 0.5), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 1.00, duration: Math.round(openMs * 0.5), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),

        Animated.sequence([
          Animated.parallel([
            Animated.timing(glowOpacity, { toValue: 0.5, duration: Math.round(openMs * 0.55), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(glowScale,   { toValue: 1.1, duration: Math.round(openMs * 0.55), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.timing(glowOpacity, { toValue: 0.12, duration: Math.round(openMs * 0.45), easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),

        Animated.sequence([
          Animated.parallel([
            Animated.timing(raysOpacity, { toValue: 0.9, duration: Math.round(openMs * 0.55), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(raysScale,   { toValue: 1.2, duration: Math.round(openMs * 0.55), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.timing(raysOpacity, { toValue: 0, duration: Math.round(openMs * 0.45), easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(raysRotate, { toValue: 1, duration: openMs + 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]);

      Animated.sequence([squash, toMid, toOpen]).start(({ finished }) => {
        if (!finished || cancelled) return;
        setRunning(false);
        if (loop) setTimeout(() => run(), 300);
        else onComplete && onComplete();
      });
    };

    run();
    return () => { cancelled = true; };
  }, [play, loop, duration, onComplete]);

  const raysRotateDeg = raysRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const side = size;
  const abs = { position: "absolute", width: side, height: side };

  return (
    <View
      style={[
        {
          width: side,
          height: side,
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible",
        },
        style,
      ]}
    >
      {/* ===== 레이 캔버스 (부모보다 크게 만들어 중앙에 겹치기) ===== */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          // 루트보다 크게: 1.8배 캔버스
          width: side * 1.8,
          height: side * 1.8,
          // 중앙 정렬(좌상단을 음수로 이동)
          left: -(side * 0.4),
          top:  -(side * 0.4),
          opacity: raysOpacity,
          transform: [{ scale: raysScale }, { rotate: raysRotateDeg }],
        }}
      >
        <Animated.Image
          source={RAYS}
          resizeMode="contain"
          style={{ width: "100%", height: "100%", tintColor: "rgba(255,220,60,0.95)" }}
        />
        {/* (선택) 중심 강조용 한 겹 더 */}
        <Animated.Image
          source={RAYS}
          resizeMode="contain"
          style={{
            position: "absolute",
            left: "10%",
            top: "10%",
            width: "80%",
            height: "80%",
            tintColor: "rgba(255,235,120,0.9)",
            opacity: 0.9,
          }}
        />
      </Animated.View>

      {/* ===== 글로우 ===== */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: side * 0.9,
          height: side * 0.9,
          borderRadius: side,
          backgroundColor: "#FFD84D",
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
          shadowColor: "#FFD84D",
          shadowOpacity: 0.6,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 0 },
        }}
      />

      {/* ===== 상자 3프레임 ===== */}
      <Animated.Image source={CLOSED} resizeMode="contain" style={[abs, { opacity: closedOpacity }]} />
      <Animated.Image source={MID}    resizeMode="contain" style={[abs, { opacity: midOpacity }]} />
      <Animated.Image
        source={OPEN}
        resizeMode="contain"
        style={[abs, { opacity: openOpacity, transform: [{ scaleX }, { scaleY }, { translateY }] }]}
      />
    </View>
  );
}