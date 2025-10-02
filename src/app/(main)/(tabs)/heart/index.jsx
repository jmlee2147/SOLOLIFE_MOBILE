import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../../../../components/shared/Header";

const IMG_CHEST = require("../../../../assets/images/gacha_treasure.png");
const IMG_SCROLL = require("../../../../assets/images/gacha_scroll.png");
const IMG_SHOP = require("../../../../assets/images/shop_halloween.png");

export default function GachaHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <View style={{ height: insets.top }} />
      <Header
        title="가챠"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        backgroundColor="transparent"
        titleColor="#111"
        iconColor="#111"
      />

      <View style={styles.container}>
        {/* 캐릭터 뽑기 */}
        <CapsuleCard
          image={IMG_CHEST}
          title="캐릭터 뽑기"
          onPress={() => router.push("/(fullscreen)/gacha/character")}
        />

        {/* 배경 뽑기 */}
        <CapsuleCard
          image={IMG_SCROLL}
          title="배경 뽑기"
          style={{ marginTop: 24 }}
          onPress={() => router.push("/(fullscreen)/gacha/background")}
        />

        {/* 이벤트 배너 */}
        <EventBanner
          image={IMG_SHOP}
          lines={["~10/31", "이벤트 기간 동안에만 만날 수 있어요!"]}
          style={{ marginTop: 28 }}
          onPress={() => router.push("/(fullscreen)/shop/halloween")}
        />
      </View>
    </View>
  );
}

function CapsuleCard({ image, title, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.capsule, style]}
      android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: false }}
      hitSlop={8}
    >
      <View style={styles.capsuleInner}>
        <Image source={image} resizeMode="contain" style={styles.capsuleImg} />
        <Text className="text-heading-1 font-pretendardSemiBold">{title}</Text>
      </View>
    </Pressable>
  );
}

function EventBanner({ image, lines = [], onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.bannerWrap, style]} hitSlop={8}>
      <Image source={image} resizeMode="contain" style={styles.bannerSticker} />
      <View style={styles.bannerBubble}>
        <Text className="text-body-2 font-pretendardMedium">{lines[0] || ""}</Text>
        {lines[1] ? <Text style={styles.bannerDesc}>{lines[1]}</Text> : null}
      </View>
    </Pressable>
  );
}

const GRAY_TEXT = "#111111";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: "center",
  },

  capsule: {
    borderWidth: 2,
    borderColor: "#42790E",
    borderRadius: 999,
    paddingVertical: 20,
    paddingHorizontal: 45,
  },
  capsuleInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  capsuleImg: {
    width: 130,
    height: 130,
  },

  bannerWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerSticker: {
    width: 86,
    height: 103,
  },
  bannerBubble: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    zIndex: 2,
  },
  bannerTitle: {
    fontSize: 14,
    color: "#111",
    fontFamily: "Pretendard-SemiBold",
    marginBottom: 2,
  },
});