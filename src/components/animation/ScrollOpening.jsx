import { Images } from "@assets/images";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, View } from "react-native";

export default function ScrollOpening({
  size = 260,
  play = true,
  loop = false,
  duration = 700,
  onComplete,
  sources,
  style,
  renderAfterOpen,

  // 연출 파라미터(필요시 조정)
  pauseMs = 160,
  openMsRatio = 0.45, // mid→open 비중
  hideScrollAfterOpen = true,
  raysIdleOpacity = 0.55,
  raysIdleRotateMs = 6000,

  // 디버그: 프레임 항상 보이게
  debugShowFrames = false,
}) {
  // 소스 fallback (TreasureOpening과 동일 패턴)
  const CLOSED = sources?.closed || Images.gacha.scroll.closed;
  const MID = sources?.mid || Images.gacha.scroll.half;
  const OPEN = sources?.open || Images.gacha.scroll.open;
  const RAYS = sources?.rays || Images.gacha.scroll.rays;

  const [opened, setOpened] = useState(false);

  // 프레임 페이드
  const closedOpacity = useRef(new Animated.Value(1)).current;
  const midOpacity = useRef(new Animated.Value(0)).current;
  const openOpacity = useRef(new Animated.Value(0)).current;
  const scrollOpacity = useRef(new Animated.Value(1)).current;

  // 팝/이동
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // 레이
  const raysOpacity = useRef(new Animated.Value(0)).current;
  const raysScale = useRef(new Animated.Value(1)).current;
  const raysRotate = useRef(new Animated.Value(0)).current;
  const [raysSize, setRaysSize] = useState({ w: null, h: null });
  const raysLoopRef = useRef(null);

  // 캐릭터/콘텐츠 영역(필요하면 사용)
  const childOpacity = useRef(new Animated.Value(0)).current;
  const childScale = useRef(new Animated.Value(0.92)).current;
  const childTranslateY = useRef(new Animated.Value(16)).current;

  // 레이 원본 사이즈 추론 (숫자 require 안전 처리)
  useEffect(() => {
    const src = RAYS;
    if (typeof src === "number") {
      const r = Image.resolveAssetSource(src);
      if (r?.width && r?.height)
        setRaysSize({ w: r.width / 3, h: r.height / 3 });
      else setRaysSize({ w: size * 2, h: size * 2 });
    } else if (src?.uri) {
      Image.getSize(
        src.uri,
        (w, h) => setRaysSize({ w, h }),
        () => setRaysSize({ w: size * 2, h: size * 2 })
      );
    } else {
      setRaysSize({ w: size * 2, h: size * 2 });
    }
  }, [RAYS, size]);

  const startRaysIdleLoop = () => {
    if (raysLoopRef.current) return;
    raysRotate.setValue(0);
    raysLoopRef.current = Animated.loop(
      Animated.timing(raysRotate, {
        toValue: 1,
        duration: Math.max(1200, raysIdleRotateMs),
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
    if (!play) {
      if (opened) {
        startRaysIdleLoop();
        return;
      }
      // 초기화
      stopRaysIdleLoop();
      setOpened(false);

      closedOpacity.setValue(1);
      midOpacity.setValue(0);
      openOpacity.setValue(0);
      scrollOpacity.setValue(1);

      scale.setValue(1);
      translateY.setValue(0);

      raysOpacity.setValue(0);
      raysScale.setValue(1);

      childOpacity.setValue(0);
      childScale.setValue(0.92);
      childTranslateY.setValue(16);
      return;
    }

    let cancelled = false;
    stopRaysIdleLoop();
    setOpened(false);

    const run = () => {
      if (cancelled) return;

      // 구간 비율
      const midMs = Math.round(duration * (1 - openMsRatio));
      const openMs = Math.round(duration * openMsRatio);

      // 초기값
      closedOpacity.setValue(1);
      midOpacity.setValue(0);
      openOpacity.setValue(0);
      scrollOpacity.setValue(1);

      scale.setValue(1.0);
      translateY.setValue(0);

      raysOpacity.setValue(0);
      raysScale.setValue(0.9);
      childOpacity.setValue(0);
      childScale.setValue(0.92);
      childTranslateY.setValue(16);

      // 시퀀스
      const toMid = Animated.parallel([
        Animated.timing(closedOpacity, {
          toValue: 0,
          duration: midMs * 0.6,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(midOpacity, {
          toValue: 1,
          duration: midMs * 0.6,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.04,
            duration: midMs * 0.5,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.0,
            duration: midMs * 0.5,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -3,
            duration: midMs * 0.5,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: midMs * 0.5,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      const smallBurst = Animated.parallel([
        Animated.sequence([
          Animated.timing(raysOpacity, {
            toValue: 0.95,
            duration: Math.round(openMs * 0.45),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(raysOpacity, {
            toValue: raysIdleOpacity,
            duration: Math.round(openMs * 0.55),
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(raysScale, {
            toValue: 1.15,
            duration: Math.round(openMs * 0.45),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(raysScale, {
            toValue: 1.0,
            duration: Math.round(openMs * 0.55),
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]);

      const toOpen = Animated.parallel([
        // mid ↓ 과 open ↑ 를 살짝 겹치게 → 자연스러운 크로스페이드
        Animated.timing(midOpacity, {
          toValue: 0,
          duration: openMs,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(40),
          Animated.timing(openOpacity, {
            toValue: 1,
            duration: Math.max(120, openMs - 40),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        smallBurst,
      ]);

      Animated.sequence([
        Animated.delay(pauseMs),
        toMid,
        toOpen,
        Animated.parallel([
          hideScrollAfterOpen
            ? Animated.timing(scrollOpacity, {
                toValue: 0,
                duration: 220,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              })
            : Animated.delay(0),
          Animated.sequence([
            Animated.delay(80),
            Animated.parallel([
              Animated.timing(childOpacity, {
                toValue: 1,
                duration: 520,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(childScale, {
                toValue: 1,
                duration: 520,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(childTranslateY, {
                toValue: 0,
                duration: 520,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]),
      ]).start(({ finished }) => {
        if (!finished || cancelled) return;
        setOpened(true);
        startRaysIdleLoop();
        if (loop) {
          setTimeout(() => {
            stopRaysIdleLoop();
            setOpened(false);
            run();
          }, 300);
        } else {
          onComplete && onComplete();
        }
      });
    };

    run();
    return () => {
      cancelled = true;
      stopRaysIdleLoop();
    };
  }, [
    play,
    loop,
    duration,
    onComplete,
    pauseMs,
    openMsRatio,
    raysIdleOpacity,
    raysIdleRotateMs,
    hideScrollAfterOpen,
  ]);

  const raysRotateDeg = raysRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const side = size;
  const abs = { position: "absolute", width: side, height: side };

  const raysW = raysSize.w || side * 2;
  const raysH = raysSize.h || side * 2;
  const raysLeft = -(raysW - side) / 2;
  const raysTop = -(raysH - side) / 2;

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
      {/* 디버그: 프레임 강제 표출 */}
      {debugShowFrames && (
        <>
          <Image
            source={CLOSED}
            style={[abs, { opacity: 0.3 }]}
            resizeMode="contain"
          />
          <Image
            source={MID}
            style={[abs, { opacity: 0.3 }]}
            resizeMode="contain"
          />
          <Image
            source={OPEN}
            style={[abs, { opacity: 0.3 }]}
            resizeMode="contain"
          />
        </>
      )}

      {/* 레이 */}
      {raysW > 0 && raysH > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: raysW,
            height: raysH,
            left: raysLeft,
            top: raysTop,
            opacity: raysOpacity,
            transform: [{ scale: raysScale }, { rotate: raysRotateDeg }],
          }}
        >
          <Animated.Image
            source={RAYS}
            resizeMode="contain"
            style={{ width: "100%", height: "100%" }}
          />
        </Animated.View>
      )}

      {/* 스크롤 프레임 */}
      <Animated.View
        style={[
          abs,
          { opacity: scrollOpacity, transform: [{ scale }, { translateY }] },
        ]}
      >
        <Animated.Image
          source={CLOSED}
          resizeMode="contain"
          style={[abs, { opacity: closedOpacity }]}
        />
        <Animated.Image
          source={MID}
          resizeMode="contain"
          style={[abs, { opacity: midOpacity }]}
        />
        <Animated.Image
          source={OPEN}
          resizeMode="contain"
          style={[abs, { opacity: openOpacity }]}
        />
      </Animated.View>

      {/* 오픈 후 콘텐츠(필요시 사용) */}
      {renderAfterOpen && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: side,
            height: side,
            alignItems: "center",
            justifyContent: "center",
            opacity: childOpacity,
            transform: [{ translateY: childTranslateY }, { scale: childScale }],
          }}
        >
          {renderAfterOpen(size)}
        </Animated.View>
      )}
    </View>
  );
}
