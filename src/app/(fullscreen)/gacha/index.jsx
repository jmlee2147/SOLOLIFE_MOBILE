import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getModeConfig } from "./modes";

import { Images } from "@assets/images";
import AppDialog from "@components/shared/AppDialog";
import Header from "@components/shared/Header";

import {
    CHARACTER_INDEX,
    getCharacterSpriteById,
    THEME_LABELS,
} from "@assets/characters";
import { OBJECTS } from "@assets/objects";
import { rollAsset, rollCharacter } from "@services/gacha";

// 모드 레지스트리 (여기서 Anim, sources, centerRender 등을 주입)

export default function GachaScreen({ mode: propMode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode: urlMode } = useLocalSearchParams();
  const cfg = getModeConfig(propMode || urlMode || "character");
  const finalBanner =
    cfg.banner ??
    (isHalloween
      ? { text: "~10/31 이벤트 기간 동안에만 만날 수 있어요!" }
      : undefined);

  const [runKey, setRunKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [opened, setOpened] = useState(false);
  const [askConfirm, setAskConfirm] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState(0); // 코인바 갱신용
  const [result, setResult] = useState(null); // 가챠 결과 보관
  const confirmAnim = useRef(new Animated.Value(0)).current;
  const isRunningRef = useRef(false);
  const { height: WIN_H } = Dimensions.get("window");

  const modeKey = propMode || urlMode || "character";

  const [topSpace, setTopSpace] = useState(0);
  const [bottomSpace, setBottomSpace] = useState(0);

  const playOnce = useCallback(() => {
    if (isRunningRef.current || opened) return;
    isRunningRef.current = true;
    setPlaying(true);
    setRunKey((k) => k + 1);
  }, [opened]);

  const resetAll = useCallback(() => {
    isRunningRef.current = false;
    setPlaying(false);
    setOpened(false);
    setAskConfirm(false);
    setRunKey((k) => k + 1);
  }, []);

  const FREE = process.env.EXPO_PUBLIC_GACHA_FREE?.trim() === "1";

  const handleConfirmGacha = async () => {
    if (isRunningRef.current || opened || loading) return;
    setAskConfirm(false);

    if (FREE) {
      // ✅ 모의 결과 (테스트용)
      const fake =
        cfg.id === "background"
          ? {
              ok: true,
              type: "asset",
              spent: 0,
              asset: { asset_id: 7, id: "tent", label: "텐트", group: "bg23" },
              points: points,
              title: "🌱 초보 탐험가 (Lv.1)",
            }
          : {
              ok: true,
              type: "character",
              spent: 0,
              character_id: "spring_f",
              points: points,
              title: "🌱 초보 탐험가 (Lv.1)",
            };
      setResult(fake);
      isRunningRef.current = true;
      setPlaying(true);
      setRunKey((k) => k + 1);
      return;
    }

    // ✅ 실제 API 호출
    setLoading(true);
    try {
      const res =
        cfg.id === "background" ? await rollAsset() : await rollCharacter(); // 🔥 핵심
      if (!res?.ok) throw new Error("응답 형식 오류");
      setResult(res);
      console.log("🎲 Gacha Result:", res);
      if (typeof res.points === "number") setPoints(res.points);
      isRunningRef.current = true;
      setPlaying(true);
      setRunKey((k) => k + 1);
    } catch (e) {
      console.error("❌ Gacha Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGacha = () => setAskConfirm(false);

  const onCtaPress = useCallback(() => {
    if (opened) return resetAll();
    if (dontShow) handleConfirmGacha();
    else setAskConfirm(true);
  }, [opened, dontShow, handleConfirmGacha, resetAll]);

  // 모드별 애니메이션 컴포넌트/소스/프롭 준비
  const Anim = cfg.anim?.Component;
  const animSources = cfg.anim?.getSources
    ? cfg.anim.getSources(cfg)
    : undefined;

  const animProps = cfg.anim?.props || {};
  const idleImage = cfg.idleImage || Images.gacha.treasure.static;

  const HUD_H = insets.top + 190; // 대략 HUD 전체 영역 (코인바~배너 높이)
  const FOOTER_H = 50 + insets.bottom; // CTA 버튼 포함 하단 영역 높이

  return (
    <View style={{ flex: 1 }}>
      {/* 배경: safe area 무시 풀스크린 */}
      <Image
        source={cfg.bgSource}
        style={[
          styles.bgImage,
          { height: WIN_H + insets.top + insets.bottom, top: -insets.top },
        ]}
        resizeMode="cover"
        pointerEvents="none"
      />
      <LinearGradient
        pointerEvents="none"
        colors={cfg.overlay?.colors ?? ["rgba(0,0,0,0.15)", "rgba(0,0,0,0.35)"]}
        locations={[cfg.overlay?.start ?? 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <View style={{ height: insets.top }} />
        <Header
          title={cfg.title}
          rightIcon="close"
          onRightPress={() => router.push("/home")}
          backgroundColor="transparent"
          titleColor="#FFFFFF"
          iconColor="#FFF"
        />
        {/* HUD & 스위처 */}
        {!playing && !opened && (
          <View
            pointerEvents="box-none"
            style={[styles.hudAbs, { paddingHorizontal: 25 }]}
          >
            <View style={[styles.hudRow, { marginTop: insets.top + 60 }]}>
              {/* 좌: 포인트 바 (코인 겹침 + + 버튼) */}
              <CoinsBar value={`${points}p`} onPlusPress={() => {}} />

              {/* 우: 캐릭터 도감 / 꾸미기 */}
              <View style={styles.rightPillsRow}>
                <Pill icon={Images.common.collection} label="캐릭터 도감" />
                <Pill
                  icon={Images.common.check}
                  label="꾸미기"
                  style={{ marginLeft: 11 }}
                />
              </View>
            </View>

            {/* 배너 */}
            {finalBanner && (
              <EventBanner
                text={finalBanner.text}
                fillColors={["#AAB770", "#B36549"]} // 채우기 그라데이션
                borderColors={["#B7FF6C", "#FF8A3D"]} // 보더 그라데이션
              />
            )}

            <LeftSwitchers
              items={cfg.switchers ?? []}
              onPressItem={(to) => router.replace(`/gacha/${to}`)}
            />
          </View>
        )}
        {/* 중앙: 모드별 애니메이션 선택 */}

        <View
          style={[
            styles.centerAbs,
            playing || opened
              ? {
                  // 절대 중앙: 화면 전체 기준
                  top: 0,
                  height: WIN_H,
                }
              : {
                  // 시각적 중앙: HUD~CTA 사이
                  top: HUD_H,
                  height: WIN_H - HUD_H - FOOTER_H,
                },
          ]}
        >
          {playing || opened ? (
            Anim ? (
              <Anim
                key={`anim-${runKey}`}
                play={playing}
                loop={false}
                sources={animSources}
                renderAfterOpen={() => (
                  <View style={{ alignItems: "center" }}>
                    {/* 🎯 캐릭터 결과 */}
                    {cfg.id === "character" && result?.type === "character" && (
                      <>
                        <Image
                          source={getCharacterSpriteById(
                            result.character_id,
                            true
                          )}
                          style={{ width: 260, height: 260 }}
                          resizeMode="contain"
                        />

                        {/* 위쪽: 테마 대시 */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 8,
                            marginBottom: 2,
                            gap: 6,
                          }}
                        >
                          <Image
                            source={Images.gacha.textDash}
                            style={{ width: 82, height: 10 }}
                            resizeMode="contain"
                          />
                          <Text className="text-white text-body-1 font-pretendardSemiBold">
                            {THEME_LABELS[
                              CHARACTER_INDEX[result.character_id]?.theme
                            ] ?? ""}
                          </Text>
                          <Image
                            source={Images.gacha.textDash}
                            style={{
                              width: 82,
                              height: 10,
                              transform: [{ scaleX: -1 }],
                            }}
                            resizeMode="contain"
                          />
                        </View>

                        {/* 캐릭터 이름 */}
                        <Text className="text-heading-2 font-pretendardSemiBold text-yellow500">
                          {CHARACTER_INDEX[result.character_id]?.name ??
                            result.character_id}
                        </Text>
                      </>
                    )}

                    {/* 💠 오브젝트 결과 */}
                    {cfg.id === "background" && result?.type === "asset" && (
                      <>
                        <Image
                          source={
                            OBJECTS[result.asset?.id]?.src ||
                            Images.placeholder.item
                          }
                          style={{ width: 220, height: 220 }}
                          resizeMode="contain"
                        />

                        {/* 위쪽: 오브젝트 대시 */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 8,
                            marginBottom: 2,
                            gap: 6,
                          }}
                        >
                          <Image
                            source={Images.gacha.textDash}
                            style={{ width: 82, height: 10 }}
                            resizeMode="contain"
                          />
                          <Text className="text-white text-body-1 font-pretendardSemiBold">
                            배경
                          </Text>
                          <Image
                            source={Images.gacha.textDash}
                            style={{
                              width: 82,
                              height: 10,
                              transform: [{ scaleX: -1 }],
                            }}
                            resizeMode="contain"
                          />
                        </View>

                        {/* 오브젝트 이름 */}
                        <Text className="text-heading-2 font-pretendardSemiBold text-yellow500">
                          {result.asset?.label || result.asset?.id}
                        </Text>
                      </>
                    )}

                    {/* 🪙 보너스 결과 (공통) */}
                    {result?.type === "bonus" && (
                      <>
                        <Image
                          source={Images.gacha.points}
                          style={{ width: 220, height: 220 }}
                          resizeMode="contain"
                        />
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 8,
                            marginBottom: 2,
                            gap: 7,
                          }}
                        >
                          <Image
                            source={Images.gacha.textDash}
                            style={{ width: 82, height: 10 }}
                            resizeMode="contain"
                          />
                          <Text className="text-white text-body-1 font-pretendardSemiBold">
                            포인트
                          </Text>
                          <Image
                            source={Images.gacha.textDash}
                            style={{
                              width: 82,
                              height: 10,
                              transform: [{ scaleX: -1 }],
                            }}
                            resizeMode="contain"
                          />
                        </View>

                        <Text className="text-heading-2 font-pretendardSemiBold text-yellow500">
                          {result.bonus} point
                        </Text>
                      </>
                    )}

                    {!result && cfg.centerRender?.({ opened: true })}
                  </View>
                )}
                onComplete={() => {
                  setPlaying(false);
                  isRunningRef.current = false;
                  setOpened(true);
                  confirmAnim.setValue(0);
                  Animated.timing(confirmAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                  }).start();
                }}
                {...animProps}
              />
            ) : null
          ) : (
            <Image
              source={idleImage}
              resizeMode="contain"
              style={{
                width: cfg.idleSize?.width ?? 300,
                height: cfg.idleSize?.height ?? 300,
              }}
            />
          )}
        </View>
        {/* 하단 CTA */}
        <View
          style={[styles.footerAbs, { paddingBottom: insets.bottom }]}
          pointerEvents="box-none"
        >
          {!playing &&
            (opened ? (
              <Animated.View
                style={{
                  opacity: confirmAnim,
                  transform: [
                    {
                      translateY: confirmAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                }}
              >
                <Pressable onPress={resetAll} style={styles.ctaButton}>
                  <View style={styles.ctaContent}>
                    <Text className="text-white text-heading-3 font-pretendardSemiBold">
                      확인
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            ) : (
              <Pressable
                onPress={onCtaPress}
                disabled={askConfirm || loading || playing}
                style={[
                  styles.ctaButton,
                  (askConfirm || loading || playing) && { opacity: 0.6 },
                ]}
              >
                <View style={styles.ctaContent}>
                  <Text className="text-white text-heading-3 font-pretendardSemiBold mr-[10px]">
                    {cfg.cta}
                  </Text>
                  <Image
                    source={Images.common.coin}
                    style={styles.ctaIcon}
                    resizeMode="contain"
                  />
                  <Text className="text-white text-heading-3 font-pretendardSemiBold">
                    {cfg.cost}
                  </Text>
                </View>
              </Pressable>
            ))}
        </View>
        {/* 모달 */}
        <AppDialog
          visible={askConfirm}
          title={`${cfg.cost} 포인트를 사용하여\n${cfg.cta}를 진행할까요?`}
          confirmLabel="확인"
          cancelLabel="취소"
          onConfirm={handleConfirmGacha}
          onCancel={handleCancelGacha}
          dismissOnBackdrop
          variant="dark"
          showDontShow
          dontShowChecked={dontShow}
          onToggleDontShow={() => setDontShow((v) => !v)}
        />
      </View>
    </View>
  );
}

/* == 작은 컴포넌트들 (HUD/스위처) == */
function CoinsBar({ value = "0p", onPlusPress }) {
  return (
    <View style={styles.coinsBarWrap}>
      {/* 코인: pill 위에 크게 겹치기 */}
      <Image
        source={Images.common.coin}
        style={styles.coinOverlap}
        resizeMode="contain"
        pointerEvents="none"
      />

      {/* 포인트 pill (내부에 + 버튼 포함) */}
      <View style={styles.coinsPill}>
        <Text numberOfLines={1} style={styles.coinsText}>
          {value}
        </Text>

        <Pressable
          onPress={onPlusPress}
          style={styles.plusCircleInPill}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="포인트 충전"
        >
          <Text style={styles.plusText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Pill({ label, icon, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, style]}>
      {icon && (
        <Image source={icon} style={styles.pillIcon} resizeMode="contain" />
      )}
      <Text numberOfLines={1} style={styles.pillText}>
        {label}
      </Text>
    </Pressable>
  );
}
function CircleButton({ label, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.circleBtn, style]}>
      <Text style={styles.circleBtnText}>{label}</Text>
    </Pressable>
  );
}
function LeftSwitchers({ items, onPressItem }) {
  if (!items?.length) return null;
  return (
    <View style={styles.leftSwitchersBox} pointerEvents="box-none">
      {items.map((it, idx) => (
        <Pressable
          key={idx}
          style={styles.switcherBtn}
          onPress={() => onPressItem(it.to)}
        >
          <Image
            source={it.icon}
            style={[
              styles.switcherIcon,
              it.iconSize && {
                width: it.iconSize.width,
                height: it.iconSize.height,
              },
              it.iconMarginBottom !== undefined && {
                marginBottom: it.iconMarginBottom,
              },
            ]}
            resizeMode="contain"
          />
          <Text
            className="text-white text-body-2 font-pretendardMedium"
            numberOfLines={1}
          >
            {it.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function EventBanner({
  text,
  fillColors = ["rgba(202, 253, 154, 0.67)", "rgba(249, 121, 0.67)"],
  borderColors = ["#83FF5E", "#FF961E"],
}) {
  const BORDER_W = 1;
  const RADIUS = 26;

  const dateLabel = "~10/31";
  const restText = (text || "").replace(/^~?\s*10\/31\s*/, "");

  return (
    <View style={styles.bannerWrap} pointerEvents="box-none">
      {/* 배너(보더 그라데이션 → 내부 채우기 그라데이션) */}
      <LinearGradient
        colors={borderColors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.bannerBorder, { borderRadius: RADIUS }]}
      >
        <View style={{ padding: BORDER_W, borderRadius: RADIUS }}>
          <LinearGradient
            colors={fillColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.bannerFill, { borderRadius: RADIUS - BORDER_W }]}
          >
            {/* 두 줄: 날짜 → 줄바꿈 → 설명 */}
            <Text className="text-white text-body-2 font-pretendardRegular">
              <Text className="text-white text-body-2 font-pretendardSemiBold">
                {dateLabel}
              </Text>
              {"\n"}
              {restText}
            </Text>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* SHOP 스티커: 배너 위에 겹치게 (앞쪽) */}
      <Image
        source={Images.gacha.widgets.shop}
        style={styles.bannerShop}
        resizeMode="contain"
      />
    </View>
  );
}

/* == 스타일 == */
const styles = StyleSheet.create({
  bgImage: { position: "absolute", left: 0, right: 0, width: "100%" },
  centerAbs: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  hudAbs: { position: "absolute", top: 0, left: 0, right: 0 },
  hudRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rightPillsRow: { flexDirection: "row", alignItems: "center" },

  // 배너 전체 컨테이너 (행 안에서 사용)
  bannerWrap: {
    position: "relative",
    marginTop: 41,
    // HUD 좌측 아래 정렬 느낌 유지
    alignSelf: "flex-start",
    marginLeft: 25,
  },
  // 바깥 그라데이션(보더)
  bannerBorder: {
    // 스티커를 왼쪽에 걸치게 하려고 왼쪽 패딩을 줄이고,
    // pill 자체는 오른쪽으로 길게
    paddingVertical: 0,
  },
  // 내부 채우기
  bannerFill: {
    height: 52, // 스샷 느낌 높이
    minWidth: 270, // 문구 길면 늘어남
    paddingLeft: 50,
    justifyContent: "center",
    // 살짝 그림자 (iOS/Android)
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Pretendard-Regular",
  },
  bannerTextStrong: {
    fontSize: 22,
    fontFamily: "Pretendard-Bold",
  },
  // SHOP 아이콘을 배너 앞쪽에 겹치기
  bannerShop: {
    position: "absolute",
    left: -25, // 배너를 조금 덮도록 음수 위치
    top: -16,
    width: 86,
    height: 86,
    zIndex: 2, // 배너 위로
  },

  leftSwitchersBox: { marginTop: 12, marginLeft: 6, alignItems: "flex-start" },
  switcherBtn: {
    flexDirection: "column",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  switcherIcon: { width: 86, height: 88, marginBottom: -6, marginLeft: -12 },

  coinsBarWrap: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },

  // 코인 겹침
  coinOverlap: {
    position: "absolute",
    left: -8,
    top: -9,
    width: 56,
    height: 56,
    zIndex: 2,
  },

  // pill 자체 (내부에 텍스트 + 원형 버튼)
  coinsPill: {
    height: 36,
    minWidth: 136, // 필요시 조정
    paddingLeft: 44, // ← 코인 겹침 영역 확보
    paddingRight: 12, // ← + 버튼 안쪽 여유
    paddingVertical: 0,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.30)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  coinsText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Pretendard-SemiBold",
    includeFontPadding: false,
  },

  // pill 내부의 원형 +
  plusCircleInPill: {
    width: 17,
    height: 17,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.30)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  plusText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Pretendard-SemiBold",
    lineHeight: 19,
  },

  // 일반 pill
  pill: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    minWidth: 80,
    paddingHorizontal: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.30)",
  },
  pillIcon: { width: 25, height: 25, marginRight: 1 },
  pillText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Pretendard-SemiBold",
  },

  footerAbs: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  ctaButton: {
    backgroundColor: "#62974F",
    borderRadius: 99,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaIcon: { width: 21, height: 21, marginRight: 1 },
});
