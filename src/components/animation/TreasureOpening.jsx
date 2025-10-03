import { Images } from "@assets/images";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, View } from "react-native";

export default function TreasureOpening({
  size = 220,
  play = true,
  loop = false,
  duration = 700,
  onComplete,
  sources,
  style,

  // 레이 유지(오픈 후) 설정
  raysIdleOpacity = 0.65,
  raysIdleRotateMs = 6000,

  // 흔들림/정지/폭발 파라미터
  trembleMs = 550,
  trembleAmplitude = 4,
  trembleRotateDeg = 2.2,
  pauseMs = 200,
  explodeMs = 220,
  explodeScale = 1.18,

  // 새로 추가: 열린 뒤 상자 감추기 & 캐릭터 등장 제어
  hideChestAfterOpen = true,               // 열리면 상자 프레임 감춤
  characterEnterMs = 600,                  // 캐릭터 등장 시간
  characterFromScale = 0.82,               // 캐릭터 시작 스케일
  characterFromY = 18,                     // 캐릭터 시작 Y오프셋(+ 아래)
  renderAfterOpen,                         // (size) => ReactNode  캐릭터 렌더 함수
}) {
  const CLOSED = sources?.closed || Images.gacha.treasure.closed;
  const MID    = sources?.mid    || Images.gacha.treasure.half;
  const OPEN   = sources?.open   || Images.gacha.treasure.open;
  const RAYS   = sources?.rays   || Images.gacha.treasure.rays;

  // 프레임 페이드
  const closedOpacity = useRef(new Animated.Value(1)).current;
  const midOpacity    = useRef(new Animated.Value(0)).current;
  const openOpacity   = useRef(new Animated.Value(0)).current;
  const chestOpacity  = useRef(new Animated.Value(1)).current;

  // 팝/이동
  const scaleX     = useRef(new Animated.Value(1)).current;
  const scaleY     = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // 레이
  const raysOpacity = useRef(new Animated.Value(0)).current;
  const raysScale   = useRef(new Animated.Value(1)).current;
  const raysRotate  = useRef(new Animated.Value(0)).current;

  // 흔들림
  const shakeX      = useRef(new Animated.Value(0)).current;
  const shakeRotVal = useRef(new Animated.Value(0)).current;

  // 캐릭터 등장 애니
  const charOpacity    = useRef(new Animated.Value(0)).current;
  const charScale      = useRef(new Animated.Value(characterFromScale)).current;
  const charTranslateY = useRef(new Animated.Value(characterFromY)).current;

  // 레이 원본 사이즈
  const [raysSize, setRaysSize] = useState({ w: null, h: null });

  // 열린 뒤 상태 유지 여부
  const [opened, setOpened] = useState(false);
  const raysLoopRef = useRef(null);

  // 원본 사이즈 얻기
  useEffect(() => {
    const src = RAYS;
    if (typeof src === "number") {
      const { width, height } = Image.resolveAssetSource(src) || {};
      if (width && height) setRaysSize({ w: width / 3, h: height / 3 });
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

  // 레이 무한 회전
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

  // 흔들림 시퀀스
  const buildTremble = () => {
    const step = 40;
    const cycles = Math.max(1, Math.floor(trembleMs / (step * 3)));
    const seq = [];
    for (let i = 0; i < cycles; i++) {
      seq.push(Animated.parallel([
        Animated.timing(shakeX,      { toValue: -trembleAmplitude, duration: step, easing: Easing.out(Easing.quad),  useNativeDriver: true }),
        Animated.timing(shakeRotVal, { toValue: -1,                duration: step, easing: Easing.out(Easing.quad),  useNativeDriver: true }),
      ]));
      seq.push(Animated.parallel([
        Animated.timing(shakeX,      { toValue:  trembleAmplitude, duration: step, easing: Easing.inOut(Easing.quad),useNativeDriver: true }),
        Animated.timing(shakeRotVal, { toValue:  1,                duration: step, easing: Easing.inOut(Easing.quad),useNativeDriver: true }),
      ]));
      seq.push(Animated.parallel([
        Animated.timing(shakeX,      { toValue: 0, duration: step, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shakeRotVal, { toValue: 0, duration: step, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]));
    }
    return Animated.sequence(seq);
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
      chestOpacity.setValue(1);
      raysOpacity.setValue(0);
      raysScale.setValue(1);
      shakeX.setValue(0);
      shakeRotVal.setValue(0);
      charOpacity.setValue(0);
      charScale.setValue(characterFromScale);
      charTranslateY.setValue(characterFromY);
      return;
    }

    let cancelled = false;
    stopRaysIdleLoop();
    setOpened(false);

    const run = () => {
      if (cancelled) return;

      const squashMs = Math.round(duration * 0.22);
      const settleMs = Math.round(duration * 0.12);
      const midMs    = Math.round(duration * 0.28);
      const openMs   = Math.round(duration * 0.38);

      // 초기값
      closedOpacity.setValue(1);
      midOpacity.setValue(0);
      openOpacity.setValue(0);
      chestOpacity.setValue(1);

      scaleX.setValue(1);
      scaleY.setValue(1);
      translateY.setValue(0);
      shakeX.setValue(0);
      shakeRotVal.setValue(0);

      raysOpacity.setValue(0);
      raysScale.setValue(0.9);
      raysRotate.setValue(0);

      charOpacity.setValue(0);
      charScale.setValue(characterFromScale);
      charTranslateY.setValue(characterFromY);

      // 서브 시퀀스
      const tremble = buildTremble();
      const pause = Animated.delay(pauseMs);

      const squash = Animated.parallel([
        Animated.timing(scaleX, { toValue: 1.05, duration: squashMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scaleY, { toValue: 0.92, duration: squashMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 4, duration: squashMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]);

      const explode = Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleX, { toValue: explodeScale, duration: Math.round(explodeMs * 0.55), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(scaleX, { toValue: 1.0,         duration: Math.round(explodeMs * 0.45), easing: Easing.in(Easing.cubic),  useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scaleY, { toValue: explodeScale, duration: Math.round(explodeMs * 0.55), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 1.0,         duration: Math.round(explodeMs * 0.45), easing: Easing.in(Easing.cubic),  useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(raysOpacity, { toValue: 1.0,  duration: Math.round(explodeMs * 0.55), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(raysScale,   { toValue: 1.22, duration: Math.round(explodeMs * 0.55), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(raysOpacity, { toValue: 0.0,  duration: Math.round(explodeMs * 0.45), easing: Easing.in(Easing.cubic), useNativeDriver: true }),
            Animated.timing(raysScale,   { toValue: 0.9,  duration: Math.round(explodeMs * 0.45), easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          ]),
        ]),
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
        // 레이 지속 상태로
        Animated.sequence([
          Animated.parallel([
            Animated.timing(raysOpacity, { toValue: 0.95, duration: Math.round(openMs * 0.55), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(raysScale,   { toValue: 1.1,  duration: Math.round(openMs * 0.55), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(raysOpacity, { toValue: raysIdleOpacity, duration: Math.round(openMs * 0.45), easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(raysScale,   { toValue: 1.0,             duration: Math.round(openMs * 0.45), easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ]),
        ]),
      ]);

      Animated.sequence([
        tremble,
        pause,
        squash,
        explode,
        toMid,
        toOpen,
        // 열린 직후: 상자 감추기 + 캐릭터 등장
        Animated.parallel([
          hideChestAfterOpen
            ? Animated.timing(chestOpacity, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true })
            : Animated.delay(0),
          Animated.sequence([
            Animated.delay(100), // 살짝 텀 주고
            Animated.parallel([
              Animated.timing(charOpacity,    { toValue: 1, duration: characterEnterMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
              Animated.timing(charScale,      { toValue: 1, duration: characterEnterMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
              Animated.timing(charTranslateY, { toValue: 0, duration: characterEnterMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
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
          onComplete && onComplete(); // 캐릭터 등장까지 끝난 뒤 호출
        }
      });
    };

    run();
    return () => {
      cancelled = true;
      stopRaysIdleLoop();
    };
  }, [
    play, loop, duration, onComplete,
    raysIdleOpacity, raysIdleRotateMs,
    trembleMs, trembleAmplitude, trembleRotateDeg,
    pauseMs, explodeMs, explodeScale,
    hideChestAfterOpen, characterEnterMs, characterFromScale, characterFromY,
  ]);

  const raysRotateDeg = raysRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const shakeRotateDeg = shakeRotVal.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${trembleRotateDeg}deg`, `${trembleRotateDeg}deg`],
  });

  const side = size;
  const abs = { position: "absolute", width: side, height: side };

  const raysW = raysSize.w || 0;
  const raysH = raysSize.h || 0;
  const raysLeft = -(raysW - side) / 2;
  const raysTop  = -(raysH - side) / 2;

  return (
    <View
      style={[
        { width: side, height: side, alignItems: "center", justifyContent: "center", overflow: "visible" },
        style,
      ]}
    >
      {/* 레이 (뒤) */}
      {raysW > 0 && raysH > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: raysW,
            height: raysH,
            left: raysLeft,
            top:  raysTop,
            opacity: raysOpacity,
            transform: [{ scale: raysScale }, { rotate: raysRotateDeg }],
          }}
        >
          <Animated.Image
            source={RAYS}
            resizeMode="contain"
            style={{ width: "100%", height: "100%", tintColor: "rgba(255,220,60,0.95)" }}
          />
        </Animated.View>
      )}

      {/* 상자 프레임 (중간) */}
      <Animated.View
        style={[
          abs,
          {
            opacity: chestOpacity, // 열린 뒤 감춤
            transform: [
              { translateX: shakeX },
              { rotate: shakeRotateDeg },
              { scaleX }, { scaleY }, { translateY },
            ],
          },
        ]}
      >
        <Animated.Image source={CLOSED} resizeMode="contain" style={[abs, { opacity: closedOpacity }]} />
        <Animated.Image source={MID}    resizeMode="contain" style={[abs, { opacity: midOpacity }]} />
        <Animated.Image source={OPEN}   resizeMode="contain" style={[abs, { opacity: openOpacity }]} />
      </Animated.View>

      {/* 캐릭터 (앞) */}
      {renderAfterOpen && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: side,
            height: side,
            alignItems: "center",
            justifyContent: "center",
            opacity: charOpacity,
            transform: [
              { translateY: charTranslateY },
              { scale: charScale },
            ],
          }}
        >
          {renderAfterOpen(size)}
        </Animated.View>
      )}
    </View>
  );
}