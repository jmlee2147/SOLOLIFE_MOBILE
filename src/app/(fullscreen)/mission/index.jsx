import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TreasureOpening from "../../../components/animation/TreasureOpening";
import Button from "../../../components/shared/Button";
import Header from "../../../components/shared/Header";

const COIN = require("../../../assets/images/coin.png");
const MEDAL = require("../../../assets/images/medal.png");
const BADGE = require("../../../assets/images/badge.png");
const CHECK = require("../../../assets/images/check.png");
const JEWELS = require("../../../assets/images/jewels.png");

export default function RewardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [runKey, setRunKey] = useState(0);
  const [playing, setPlaying] = useState(false);

  const playOnce = useCallback(() => {
    if (playing) return;
    setPlaying(true);
    setRunKey((k) => k + 1);
  }, [playing]);

  return (
    <View style={{ backgroundColor: "#2C2C35", flex: 1, paddingBottom: insets.bottom}}>
      {/* 레이어 2: 보석 배경 */}
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={{ height: insets.top }} />
      <Image
        source={JEWELS}
        resizeMode="cover"
        pointerEvents="none"
        style={styles.bgImage}
      />

      {/* Header */}
      <Header
        title="뽑기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="settings"
        backgroundColor="transparent" // 배경 투명
        titleColor="#FFFFFF" // 타이틀 흰색
        iconColor="#FFF" // 아이콘 노란색
      />

      {/* 콘텐츠 */}
      <View style={styles.content}>
        {/* Top HUD */}
        <View style={styles.hudRow}>
          <Pill label="100000" icon={COIN} />

          <View style={styles.hudRight}>
            <Pill label="미션" icon={MEDAL} />
            <Pill label="수집함" icon={BADGE} style={{ marginTop: 6 }} />
            <Pill label="출석체크" icon={CHECK} style={{ marginTop: 6 }} />
          </View>
        </View>

        {/* Center: Chest */}
        <View style={styles.center}>
          <Pressable onPress={playOnce} hitSlop={12}>
            <TreasureOpening
              key={`chest-${runKey}`}
              size={280}
              play
              loop={false}
              onComplete={() => setPlaying(false)}
            />
          </Pressable>
        </View>

        {/* Bottom CTA */}
        <View style={styles.footer}>
          <Button
            title="100 포인트로 뽑기"
            variant="primary"
            size="large"
            onPress={playOnce}
          />
        </View>
      </View>
    </View>
  );
}

function Pill({ label, icon, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, style]}>
      {icon && (
        <Image
          source={icon}
          style={{ width: 22, height: 22, marginRight: 6 }}
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
  /* 배경 이미지 */
  bgImage: {
    position: "absolute",
    top: -140,
    left: 0,
    right: 0,
    height: 360,
    width: "100%",
    opacity: 0.18,
  },

  content: {
    flex: 1,
  },

  hudRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hudRight: {
    alignItems: "flex-end",
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

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    color: "#E5E7EB",
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Pretendard-Medium",
  },

  footer: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
});
