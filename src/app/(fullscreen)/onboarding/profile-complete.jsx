import { Images } from "@assets/images";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Dimensions, Image, ImageBackground, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");

const TAG_MAP = [
  { key: "shopping", label: "쇼핑", icon: Images?.onboarding?.shopping },
  { key: "cafe", label: "카페", icon: Images?.onboarding?.cafe },
  { key: "book", label: "책/자기발견", icon: Images?.onboarding?.book },
  { key: "activity", label: "산책/활동", icon: Images?.onboarding?.activity },
  { key: "museum", label: "전시/박물관", icon: Images?.onboarding?.museum },
  { key: "food", label: "맛집", icon: Images?.onboarding?.food },
];

function findTag(key) {
  return TAG_MAP.find((t) => t.key === key);
}

export default function ProfileComplete() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const nickname = useMemo(() => String(params.nickname || params.name || "포슬감자"), [params]);
  const levelText = useMemo(() => String(params.levelText || "Lv.1 ‘활기찬 탐험가’"), [params]);
  const dateText = useMemo(() => String(params.date || new Date().toISOString().slice(0, 10).replaceAll("-", "/")), [params]);

  const selectedTags = useMemo(() => {
    try {
      const p = JSON.parse(String(params.tags || "[]"));
      if (Array.isArray(p) && p.length) return p;
    } catch {}
    // default 3
    return ["shopping", "cafe", "activity"];
  }, [params.tags]);

  const moodChips = useMemo(() => {
    try {
      const a = JSON.parse(String(params.moods || "[]"));
      if (Array.isArray(a) && a.length) return a;
    } catch {}
    return ["한적한", "아늑한", "밝은"];
  }, [params.moods]);

  const tagItems = selectedTags.map((k) => findTag(k)).filter(Boolean);

  return (
    <ImageBackground
      source={Images?.onboarding?.bg_profile ?? Images?.onboarding?.["1"]}
      resizeMode="cover"
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      imageStyle={{ marginTop: -insets.top, marginBottom: -insets.bottom }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.headerWrap}>
          <Text className="text-heading-1 font-pretendardSemiBold">탐험 준비 완료!</Text>
          <Text className="text-heading-1 font-pretendardSemiBold">{nickname}님의 프로필이 완성됐어요!</Text>
        </View>

        {/* Card (image background) */}
        <ImageBackground
          source={Images?.onboarding?.profile_card}
          resizeMode="contain"
          style={styles.cardImg}
        >
          {/* Badge top (rope & hole are illustration detail – baked in image) */}
          <View style={styles.row}>
            <Image
              source={Images?.onboarding?.monkey_happy}
              style={styles.monkeyImage}
            />
            <View style={styles.nickWrap}>
              <Text style={styles.nick}>{nickname}</Text>
              <Text style={styles.level}>{levelText}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* 관심있는 주제 */}
          <Text style={styles.sectionTitle}>관심있는 주제</Text>
          <Text style={styles.sectionNote}>*마이페이지에서 변경 가능합니다.</Text>
          <View style={styles.tagGrid}>
            {tagItems.map((t) => (
              <View key={t.key} style={styles.iconPill}>
                {!!t.icon && <Image source={t.icon} style={styles.pillIcon} />}
                <Text style={styles.iconPillText}>{t.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.separator} />

          {/* 선호하는 분위기 */}
          <Text style={styles.sectionTitle}>선호하는 분위기</Text>
          <Text style={styles.sectionNote}>*AI 장소추천에 참고자료로 사용됩니다.</Text>
          <View style={styles.moodRow}>
            {moodChips.map((m) => (
              <View key={m} style={styles.moodPill}>
                <Text style={styles.moodPillText}>{m}</Text>
              </View>
            ))}
          </View>

          {/* footer line */}
          <View style={styles.footerLine} />
          <View style={styles.cardFooter}>
            <Text style={styles.footerDate}>{dateText}</Text>
            <Text style={styles.footerBrand}>솔로몬</Text>
          </View>
        </ImageBackground>

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <Pressable
            onPress={() => router.replace("/(main)/(tabs)/home")}
            style={styles.cta}
            accessibilityLabel="start-exploring"
          >
            <Text style={styles.ctaText}>탐험 시작하기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const CARD_W = 334 * 1.1; // fixed width as per spec
const CARD_H = 553 * 1.1; // fixed height as per spec
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 25,
  },
  headerWrap: {
    marginTop: 30,
    marginBottom: 27,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700", // Pretendard Bold
    color: "#0E0E0E",
    lineHeight: 22,
  },
  headerSub: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "700", // Pretendard Bold
    color: "#0E0E0E",
    lineHeight: 21,
  },
  cardImg: {
    alignSelf: "center",
    width: CARD_W,
    height: CARD_H,
    paddingTop:40,
    paddingHorizontal: 36,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  monkeyImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginRight: 16,
  },
  nickWrap: {
    flex: 1,
    justifyContent: "center",
  },
  nick: {
    fontSize: 20,
    fontWeight: "700", // bold
    color: "#0B0B0B",
    lineHeight: 24,
  },
  level: {
    marginTop: 6,
    fontSize: 14,
    color: "#4D4D4D",
    fontWeight: "600", // semi-bold
    lineHeight: 18,
  },
  separator: {
    height: 1,
    backgroundColor: "#DCE7CD",
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700", // Pretendard Bold
    color: "#0E0E0E",
  },
  sectionNote: {
    marginTop: 4,
    fontSize: 12,
    color: "#888",
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  iconPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F4DF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    width: (CARD_W - 72) / 3, // 3 columns with 36*2 padding + 10*2 gaps approx
    marginBottom: 10,
  },
  pillIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    marginRight: 6,
  },
  iconPillText: {
    fontSize: 13,
    color: "#2E4F1E",
    fontWeight: "600", // Pretendard SemiBold
  },
  moodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  moodPill: {
    backgroundColor: "#EFF6EA",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 10,
    marginBottom: 10,
  },
  moodPillText: {
    fontSize: 13,
    color: "#2E4F1E",
    fontWeight: "600",
  },
  footerLine: {
    height: 1,
    backgroundColor: "#DCE7CD",
    marginTop: 20,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerDate: {
    color: "#6C6C6C",
    fontSize: 12,
    fontWeight: "700",
  },
  footerBrand: {
    color: "#6C6C6C",
    fontSize: 12,
    fontWeight: "700",
  },
  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  cta: {
    height: 50,
    borderRadius: 32,
    backgroundColor: "#467A34",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  ctaText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
});