import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TreasureOpening from "../../../components/animation/TreasureOpening";
import AppDialog from "../../../components/shared/AppDialog";
import Header from "../../../components/shared/Header";

const COIN = require("../../../assets/images/coin.png");
const MEDAL = require("../../../assets/images/medal.png");
const HAT = require("../../../assets/images/hat.png");
const CHECK = require("../../../assets/images/activity.png");
const JEWELS = require("../../../assets/images/jewels.png");
const SCROLL = require("../../../assets/images/gacha_scroll_outlined.png");
const SHOP = require("../../../assets/images/shop_halloween.png");
const TREASURE_STATIC = require("../../../assets/images/gacha_treasure.png");
const CHARACTER = require("../../../assets/characters/girl/summer.png");

export default function RewardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [runKey, setRunKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [opened, setOpened] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmAnim = React.useRef(new Animated.Value(0)).current;
  const CONFIRM_DELAY_MS = 1000;

  const [askConfirm, setAskConfirm] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  const handleToggleDontShow = () => setDontShow((v) => !v);

  // 확인/취소 핸들러
  const handleConfirmGacha = () => {
    setAskConfirm(false);
    playOnce(); // ← 실제 뽑기 시작
  };
  const handleCancelGacha = () => setAskConfirm(false);

  const isRunningRef = React.useRef(false);

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
    setShowConfirm(false);
    setRunKey((k) => k + 1);
  }, []);

  const onCtaPress = useCallback(() => {
    if (opened) {
      resetAll();
    } else {
      if (dontShow) {
        // 다시 보지 않기 체크되어 있으면 바로 진행
        handleConfirmGacha();
      } else {
        setAskConfirm(true); // 모달 노출
      }
    }
  }, [opened, resetAll, dontShow]);

  return (
    <LinearGradient
      colors={["#2C2C35", "#2C2C35", "#000000"]}
      locations={[0, 0.66, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <View style={{ height: insets.top }} />

        {/* 상단 보석 */}
        <Image
          source={JEWELS}
          resizeMode="cover"
          pointerEvents="none"
          style={styles.jewelImage}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(44,44,53,0)",
            "rgba(44,44,53,0.55)",
            "rgba(44,44,53,1)",
          ]}
          locations={[0.55, 0.78, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.jewelFade}
        />

        <Header
          title="캐릭터 뽑기"
          leftIcon="previous"
          onLeftPress={() => router.back()}
          backgroundColor="transparent"
          titleColor="#FFFFFF"
          iconColor="#FFF"
        />

        {/* HUD: 애니 중일 때는 숨김 */}
        {!playing && !opened && (
          <View
            style={[
              styles.hudAbs,
              { paddingTop: insets.top + 42, paddingHorizontal: 20 },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.hudRow}>
              <Pill label="100000" icon={COIN} />
              <View style={styles.hudRight}>
                <Pill label="미션" icon={MEDAL} />
                <Pill label="캐릭터 도감" icon={HAT} style={{ marginTop: 6 }} />
                <Pill label="꾸미기" icon={CHECK} style={{ marginTop: 6 }} />
              </View>
            </View>
          </View>
        )}

        {/* 중앙 */}
        <View style={styles.centerAbs}>
          {playing || opened ? (
            <TreasureOpening
              key={`chest-${runKey}`}
              size={280}
              play={playing}
              loop={false}
              hideChestAfterOpen
              renderAfterOpen={(s) => (
                <View style={{ alignItems: "center" }}>
                  {/* 캐릭터 이미지 */}
                  <Image
                    source={CHARACTER}
                    style={{ width: 300, height: 300 }}
                    resizeMode="contain"
                  />

                  {/* 이름 줄 */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 12,
                    }}
                  >
                    {/* 왼쪽 구분선 */}
                    <Image
                      source={require("../../../assets/images/text_dash.png")}
                      style={{ width: 82, marginHorizontal: 8 }}
                      resizeMode="contain"
                    />

                    {/* 텍스트 */}
                    <Text className="text-white text-heading-2 font-pretendardSemiBold">
                      여름
                    </Text>

                    {/* 오른쪽 구분선 (좌우반전) */}
                    <Image
                      source={require("../../../assets/images/text_dash.png")}
                      style={{
                        width: 82,
                        marginHorizontal: 8,
                        transform: [{ scaleX: -1 }], // 좌우반전
                      }}
                      resizeMode="contain"
                    />
                  </View>

                  {/* 타이틀 */}
                  <Text className="mt-1 text-yellow500 text-heading-2 font-pretendardSemiBold">
                    바캉스 탐험가
                  </Text>
                </View>
              )}
              onComplete={() => {
                setPlaying(false);
                isRunningRef.current = false;
                setOpened(true);

                setShowConfirm(false);
                setTimeout(() => {
                  setShowConfirm(true);
                  // 페이드 인 + 위로 살짝 슬라이드
                  confirmAnim.setValue(0);
                  Animated.timing(confirmAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                  }).start();
                }, 1000); // ⬅️ 버튼 딜레이(ms) 원하는 값으로
              }}
            />
          ) : (
            <Image
              source={TREASURE_STATIC}
              resizeMode="contain"
              style={{ width: 300, height: 300 }}
            />
          )}
        </View>

        {/* 좌측 하단 위젯: 애니 중일 때는 숨김 */}
        {!playing && !opened && (
          <View
            style={[styles.lowerWidgetsAbs, { bottom: insets.bottom + 72 }]}
            pointerEvents="box-none"
          >
            <Pressable style={styles.bgGacha} onPress={() => {}}>
              <Image
                source={SCROLL}
                style={styles.bgGachaIcon}
                resizeMode="contain"
              />
              <Text className="text-white text-body-2 font-pretendardMedium">
                배경뽑기
              </Text>
            </Pressable>

            <View style={styles.eventRow} pointerEvents="none">
              <Image
                source={SHOP}
                style={styles.shopSticker}
                resizeMode="contain"
              />
              <View style={styles.eventBubble}>
                <Text className="text-body-3 font-pretendardRegular">
                  ~10/31{"\n"}이벤트 기간 동안에만 만날 수 있어요!
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 하단 CTA */}
        <View
          style={[styles.footerAbs, { paddingBottom: insets.bottom }]}
          pointerEvents="box-none"
        >
          {/* 애니 중엔 아예 렌더 안 함 */}
          {!playing &&
            (opened ? (
              showConfirm ? (
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
              ) : null
            ) : (
              <Pressable
                onPress={onCtaPress}
                disabled={askConfirm}
                style={[styles.ctaButton, askConfirm && { opacity: 0.6 }]}
              >
                <View style={styles.ctaContent}>
                  <Text className="text-white text-heading-3 font-pretendardSemiBold mr-[10px]">
                    캐릭터 뽑기
                  </Text>
                  <Image
                    source={COIN}
                    style={styles.ctaIcon}
                    resizeMode="contain"
                  />
                  <Text className="text-white text-heading-3 font-pretendardSemiBold">
                    100
                  </Text>
                </View>
              </Pressable>
            ))}
        </View>
        <AppDialog
          visible={askConfirm}
          title={"100 포인트를 사용하여\n캐릭터 뽑기를 진행할까요?"}
          // description="100 포인트를 사용하여 캐릭터 뽑기를 진행할까요?"
          confirmLabel="확인"
          cancelLabel="취소"
          onConfirm={handleConfirmGacha}
          onCancel={handleCancelGacha}
          dismissOnBackdrop={true}
          variant="dark"
          showDontShow={true}
          dontShowChecked={dontShow}
          onToggleDontShow={handleToggleDontShow}
        />
      </View>
    </LinearGradient>
  );
}

function Pill({ label, icon, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, style]}>
      {icon && (
        <Image
          source={icon}
          style={{ width: 22, height: 22, marginRight: 2 }}
          resizeMode="contain"
        />
      )}
      <Text numberOfLines={1} style={styles.pillText}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  jewelImage: {
    position: "absolute",
    top: -140,
    left: 0,
    right: 0,
    height: 360,
    width: "100%",
    opacity: 0.18,
  },
  jewelFade: {
    position: "absolute",
    top: -140,
    left: 0,
    right: 0,
    height: 360,
    width: "100%",
  },

  hudAbs: { position: "absolute", top: 0, left: 0, right: 0 },
  hudRow: { flexDirection: "row", justifyContent: "space-between" },
  hudRight: { alignItems: "flex-end" },

  centerAbs: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.30)",
    height: 36,
    paddingHorizontal: 12,
  },
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

  lowerWidgetsAbs: { position: "absolute", left: 25, zIndex: 3 },
  bgGacha: { flexDirection: "column", marginBottom: 10 },
  bgGachaIcon: { width: 90, height: 92, marginBottom: -6, marginLeft: -15 },

  eventRow: { flexDirection: "row", alignItems: "flex-end" },
  shopSticker: { width: 59, height: 72, marginRight: 8, zIndex: 3 },
  eventBubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 99,
    paddingTop: 3,
    paddingBottom: 8,
    paddingRight: 14,
    paddingLeft: 38,
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginLeft: -40,
    marginBottom: 15,
    zIndex: 0,
  },
});
