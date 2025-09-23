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
  raysIdleOpacity = 0.65,     // 열린 상태에서 지속 불투명도
  raysIdleRotateMs = 6000,    // 열린 상태에서 1바퀴 회전 시간

  // 흔들림/정지/폭발 파라미터
  trembleMs = 550,            // 부들부들 총 시간
  trembleAmplitude = 4,       // 좌우 흔들림 px
  trembleRotateDeg = 2.2,     // 흔들릴 때 회전 각도(deg)
  pauseMs = 200,              // 흔들린 뒤 잠깐 멈춤 시간
  explodeMs = 220,            // 펑 시간
  explodeScale = 1.18,        // 펑 최대 스케일
}) {
  const CLOSED = sources?.closed || require("../../assets/images/treasure_close.png");
  const MID    = sources?.mid    || require("../../assets/images/treasure_half.png");
  const OPEN   = sources?.open   || require("../../assets/images/treasure_open.png");
  const RAYS   = sources?.rays   || require("../../assets/images/treasure_rays.png");

  // 프레임 페이드
  const closedOpacity = useRef(new Animated.Value(1)).current;
  const midOpacity    = useRef(new Animated.Value(0)).current;
  const openOpacity   = useRef(new Animated.Value(0)).current;

  // 팝/이동
  const scaleX     = useRef(new Animated.Value(1)).current;
  const scaleY     = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // 레이
  const raysOpacity = useRef(new Animated.Value(0)).current;
  const raysScale   = useRef(new Animated.Value(1)).current;
  const raysRotate  = useRef(new Animated.Value(0)).current;

  // 🔥 추가: 흔들림용 값
  const shakeX      = useRef(new Animated.Value(0)).current; // -amp ~ +amp
  const shakeRotVal = useRef(new Animated.Value(0)).current; // -1 ~ +1 -> deg로 보간

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
      if (width && height) setRaysSize({ w: width / 3 , h: height / 3 });
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

  // 열린 상태 레이 무한회전 시작/정지
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

  // 🔥 흔들림 시퀀스 빌더
  const buildTremble = () => {
    // 1 사이클(좌->우->센터) 시간
    const step = 40; // ms (짧을수록 더 부들거림)
    const cycles = Math.max(1, Math.floor(trembleMs / (step * 3)));
    const seq = [];

    for (let i = 0; i < cycles; i++) {
      // 좌
      seq.push(Animated.parallel([
        Animated.timing(shakeX, { toValue: -trembleAmplitude, duration: step, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(shakeRotVal, { toValue: -1, duration: step, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]));
      // 우
      seq.push(Animated.parallel([
        Animated.timing(shakeX, { toValue: trembleAmplitude, duration: step, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shakeRotVal, { toValue: 1, duration: step, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]));
      // 센터
      seq.push(Animated.parallel([
        Animated.timing(shakeX, { toValue: 0, duration: step, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
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
      stopRaysIdleLoop();
      setOpened(false);
      closedOpacity.setValue(1);
      midOpacity.setValue(0);
      openOpacity.setValue(0);
      raysOpacity.setValue(0);
      raysScale.setValue(1);
      shakeX.setValue(0);
      shakeRotVal.setValue(0);
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

      // 초기화
      closedOpacity.setValue(1);
      midOpacity.setValue(0);
      openOpacity.setValue(0);
      scaleX.setValue(1);
      scaleY.setValue(1);
      translateY.setValue(0);
      shakeX.setValue(0);
      shakeRotVal.setValue(0);

      raysOpacity.setValue(0);
      raysScale.setValue(0.9);
      raysRotate.setValue(0);

      // 0) 🔥 부들부들
      const tremble = buildTremble();

      // 0.5) 🔥 잠깐 멈춤
      const pause = Animated.delay(pauseMs);

      // 1) 눌림
      const squash = Animated.parallel([
        Animated.timing(scaleX, { toValue: 1.05, duration: squashMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scaleY, { toValue: 0.92, duration: squashMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 4, duration: squashMs, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]);

      // 1.5) 🔥 펑! (짧고 강한 스케일 업 + 레이 순간 발광)
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

      // 2) 중간으로
      const toMid = Animated.parallel([
        Animated.timing(closedOpacity, { toValue: 0, duration: settleMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(midOpacity,    { toValue: 1, duration: settleMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scaleX,        { toValue: 1, duration: settleMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scaleY,        { toValue: 1, duration: settleMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateY,    { toValue: 0, duration: settleMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]);

      // 3) 열림 + 레이 등장(지속)
      const toOpen = Animated.parallel([
        Animated.timing(midOpacity,  { toValue: 0, duration: midMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(openOpacity, { toValue: 1, duration: midMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),

        // 팝
        Animated.sequence([
          Animated.timing(scaleX, { toValue: 1.06, duration: Math.round(openMs * 0.5), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(scaleX, { toValue: 1.00, duration: Math.round(openMs * 0.5), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scaleY, { toValue: 1.06, duration: Math.round(openMs * 0.5), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 1.00, duration: Math.round(openMs * 0.5), easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),

        // 레이: 나타난 뒤 '지속' 상태로 settle
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
        tremble,            // 🔥 부들부들
        pause,              // 🔥 멈춤
        squash,             // 눌림
        explode,            // 🔥 펑!
        toMid,              // 중간 프레임
        toOpen,             // 오픈 + 레이 유지
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
    play, loop, duration, onComplete,
    raysIdleOpacity, raysIdleRotateMs,
    trembleMs, trembleAmplitude, trembleRotateDeg,
    pauseMs, explodeMs, explodeScale
  ]);

  const raysRotateDeg = raysRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // 🔥 흔들림 회전( -1 ~ +1 -> deg )
  const shakeRotateDeg = shakeRotVal.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${trembleRotateDeg}deg`, `${trembleRotateDeg}deg`],
  });

  const side = size;
  const abs = { position: "absolute", width: side, height: side };

  // 레이를 상자 중앙에 정렬
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
      {/* 레이: 원본 크기, 열린 동안 유지 */}
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

      {/* 3 프레임 (흔들림/펑!이 프레임에도 적용되도록 공통 트랜스폼 래퍼 추가) */}
      <Animated.View
        style={[
          abs,
          {
            transform: [
              { translateX: shakeX },       // 🔥 좌우 부들부들
              { rotate: shakeRotateDeg },   // 🔥 살짝 회전
              { scaleX }, { scaleY }, { translateY },
            ],
          },
        ]}
      >
        <Animated.Image source={CLOSED} resizeMode="contain" style={[abs, { opacity: closedOpacity }]} />
        <Animated.Image source={MID}    resizeMode="contain" style={[abs, { opacity: midOpacity }]} />
        <Animated.Image source={OPEN}   resizeMode="contain" style={[abs, { opacity: openOpacity }]} />
      </Animated.View>
    </View>
  );
}