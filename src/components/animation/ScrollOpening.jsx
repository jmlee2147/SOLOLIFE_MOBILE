import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, View } from "react-native";

export default function ScrollOpening({
  size = 220,
  play = true,
  loop = false,
  duration = 1000,      // 펼침 속도
  trembleMs = 320,      // 펼침 중 잔진동
  explodeMs = 320,      // 레이 소프트 인
  hideScrollAfterOpen = true,
  holdOpenMs = 500,     // 펼친 뒤 대기
  renderAfterOpen,      // (size)=>ReactNode
  sources,
  style,
  raysIdleOpacity = 0.55,
  raysIdleRotateMs = 7000,
  onComplete,

  // --- 추가 파라미터 ---
  preShakeMs = 420,     // 부들부들(프리-쉐이크) 시간
  settleMs = 140,       // 프리-쉐이크 후 "잠깐 멈춤" 시간
  shakeAmp = 4,         // 프리-쉐이크 좌우(px)
  shakeRotDeg = 1.6,    // 프리-쉐이크 회전(deg)
}) {
  const frames = useMemo(() => {
    const arr = [sources?.f0, sources?.f1, sources?.f2, sources?.f3, sources?.f4, sources?.f5, sources?.f6, sources?.f7].filter(Boolean);
    return arr;
  }, [sources]);
  const RAYS = sources?.rays;

  // ---- Animated Values ----
  const p = useRef(new Animated.Value(0)).current;              // 진행도(프레임 선택)
  const wobble = useRef(new Animated.Value(0)).current;         // 펼침 중 잔진동
  const shake = useRef(new Animated.Value(0)).current;          // 프리-쉐이크
  const raysOpacity = useRef(new Animated.Value(0)).current;
  const raysRotate = useRef(new Animated.Value(0)).current;
  const scrollOpacity = useRef(new Animated.Value(1)).current;

  const afterOpacity = useRef(new Animated.Value(0)).current;
  const afterScale = useRef(new Animated.Value(0.9)).current;
  const afterTranslateY = useRef(new Animated.Value(12)).current;

  const [opened, setOpened] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);

  const frameRef = useRef(0);
  const raysLoopRef = useRef(null);
  const completedRef = useRef(false);

  // ---- Frame index based on p ----
  useEffect(() => {
    const id = p.addListener(({ value }) => {
      const eased = 1 - Math.pow(1 - value, 3); // cubic-out
      const n = Math.max(1, frames.length);
      const idx = Math.min(n - 1, Math.round(eased * (n - 1)));
      if (idx !== frameRef.current) {
        frameRef.current = idx;
        setFrameIdx(idx);
      }
    });
    return () => p.removeListener(id);
  }, [p, frames.length]);

  // ---- transforms ----
  const allScale = wobble.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.995, 1, 0.995],
  });
  const unfoldScaleY = p.interpolate({
    inputRange: [0, 0.45, 0.8, 0.9, 1],
    outputRange: [0.92, 1.06, 1.04, 0.995, 1.0],
  });
  // 프리-쉐이크(좌우+회전)
  const shakeTranslateX = shake.interpolate({
    inputRange: [-1, -0.5, 0, 0.5, 1],
    outputRange: [-shakeAmp, -shakeAmp * 0.5, 0, shakeAmp * 0.5, shakeAmp],
  });
  const shakeRotateDeg = shake.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [`-${shakeRotDeg}deg`, "0deg", `${shakeRotDeg}deg`],
  });

  const raysRotateDeg = raysRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // ---- Infinite Rays Rotation ----
  const startRaysIdleLoop = () => {
    if (!RAYS || raysLoopRef.current) return;
    raysRotate.setValue(0);
    raysLoopRef.current = Animated.loop(
      Animated.timing(raysRotate, {
        toValue: 1,
        duration: Math.max(1500, raysIdleRotateMs),
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    raysLoopRef.current.start();
  };
  const stopRaysIdleLoop = () => {
    if (raysLoopRef.current) {
      raysLoopRef.current.stop();
      raysLoopRef.current = null;
    }
  };
  useEffect(() => {
    startRaysIdleLoop();
    return () => stopRaysIdleLoop();
  }, [RAYS, raysIdleRotateMs]);

  // ---- Main animation ----
  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (cancelled) return;

      setOpened(false);
      completedRef.current = false;

      // reset
      p.setValue(0);
      wobble.setValue(0);
      shake.setValue(0);
      raysOpacity.setValue(0);
      scrollOpacity.setValue(1);
      afterOpacity.setValue(0);
      afterScale.setValue(0.9);
      afterTranslateY.setValue(12);
      setFrameIdx(0);
      frameRef.current = 0;

      // 1) 프리-쉐이크: 좌/우/좌/우 → 중앙
      const steps = Math.max(6, Math.round(preShakeMs / 70));
      const seg = Math.max(40, Math.round(preShakeMs / steps));
      const shakePattern = [-1, 1, -1, 1, -0.5, 0]; // 마지막 0에서 멈춘다
      const preShakeSeq = Animated.sequence(
        shakePattern.map((v) =>
          Animated.timing(shake, {
            toValue: v,
            duration: seg,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          })
        )
      );

      // 2) 잠깐 멈춤(정지)
      const settleHold = Animated.delay(settleMs);

      // 3) 펼침 진행 + 잔진동 + 레이 소프트인
      const openTween = Animated.timing(p, {
        toValue: 1,
        duration,
        easing: Easing.bezier(0.42, 0, 0.25, 1), // 자연스러운 감속
        useNativeDriver: true,
      });
      const wobbleSeq = Animated.sequence([
        Animated.timing(wobble, {
          toValue: -1,
          duration: Math.round(trembleMs * 0.35),
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: 1,
          duration: Math.round(trembleMs * 0.35),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: 0,
          duration: Math.round(trembleMs * 0.3),
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);
      const raysSoftIn = Animated.timing(raysOpacity, {
        toValue: raysIdleOpacity,
        duration: explodeMs,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      });

      Animated.sequence([
        preShakeSeq,            // 부들부들
        settleHold,             // 잠깐 멈춤
        Animated.parallel([     // 촤라락 펼침
          openTween,
          wobbleSeq,
          raysSoftIn,
        ]),
      ]).start(({ finished }) => {
        if (!finished || cancelled) return;

        setOpened(true);

        Animated.sequence([
          Animated.delay(holdOpenMs),
          hideScrollAfterOpen
            ? Animated.timing(scrollOpacity, {
                toValue: 0,
                duration: 220,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              })
            : Animated.delay(0),
          Animated.parallel([
            Animated.timing(afterOpacity, {
              toValue: 1,
              duration: 550,
              easing: Easing.bezier(0.42, 0, 0.25, 1),
              useNativeDriver: true,
            }),
            Animated.timing(afterScale, {
              toValue: 1,
              duration: 550,
              easing: Easing.bezier(0.42, 0, 0.25, 1),
              useNativeDriver: true,
            }),
            Animated.timing(afterTranslateY, {
              toValue: 0,
              duration: 550,
              easing: Easing.bezier(0.42, 0, 0.25, 1),
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          completedRef.current = true;
          if (typeof onComplete === "function") onComplete();
          if (loop && !cancelled) setTimeout(run, 350);
        });
      });
    };

    if (play) run();
    else if (!completedRef.current) {
      p.setValue(0);
      raysOpacity.setValue(0);
      scrollOpacity.setValue(1);
      afterOpacity.setValue(0);
      afterScale.setValue(0.9);
      afterTranslateY.setValue(12);
      shake.setValue(0);
    }

    return () => {
      cancelled = true;
    };
  }, [
    play, loop, duration, trembleMs, explodeMs,
    hideScrollAfterOpen, raysIdleOpacity,
    preShakeMs, settleMs, shakeAmp, shakeRotDeg,
  ]);

  const side = size;

  return (
    <View
      style={[
        { width: side, height: side, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      {/* RAYS (무한 회전) */}
      {RAYS ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: side * 1.8,
            height: side * 1.8,
            opacity: raysOpacity,
            transform: [{ rotate: raysRotateDeg }],
          }}
        >
          <Image source={RAYS} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
        </Animated.View>
      ) : null}

      {/* SCROLL 프레임 시퀀스 (프리-쉐이크 + 스쿼시/스트레치) */}
      <Animated.View
        style={{
          transform: [
            { translateX: shakeTranslateX }, // 프리-쉐이크 좌우
            { rotate: shakeRotateDeg },      // 프리-쉐이크 회전
            { scale: allScale },             // 펼침 중 잔진동
            { scaleY: unfoldScaleY },        // 펼침 스쿼시/스트레치
          ],
          opacity: scrollOpacity,
        }}
      >
        {frames[frameIdx] ? (
          <Image
            source={frames[frameIdx]}
            style={{ width: side, height: side }}
            resizeMode="contain"
          />
        ) : null}
      </Animated.View>

      {/* AFTER OPEN (캐릭터 등) */}
      {renderAfterOpen && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: side,
            height: side,
            alignItems: "center",
            justifyContent: "center",
            opacity: afterOpacity,
            transform: [{ translateY: afterTranslateY }, { scale: afterScale }],
          }}
        >
          {renderAfterOpen(side)}
        </Animated.View>
      )}
    </View>
  );
}