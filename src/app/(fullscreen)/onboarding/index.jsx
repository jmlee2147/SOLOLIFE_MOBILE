import { Images } from "@assets/images";
import Icon from "@components/shared/Icon";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const SLIDES = [
  {
    key: "slide-1",
    type: "illust",
    image: Images?.onboarding?.["1"] ?? Images?.placeholder?.onboarding,
    lines: [
      "혼자만의 시간을 좋아하던 탐험가는",
      "어느 날, 새로운 자신만의 공간을 찾고 싶었어요.",
      "필요한 물건들만 챙겨 곧바로 숲으로 떠났답니다.",
    ],
  },
  {
    key: "slide-2",
    type: "illust",
    image: Images?.onboarding?.["2"] ?? Images?.placeholder?.onboarding,
    lines: ["하지만 갑자기 -", "발밑이 꺼졌고, 눈 깜작할 새에", "깊은 구덩이 속으로 떨어지고 말았어요."],
  },
  {
    key: "slide-3",
    type: "illust",
    image: Images?.onboarding?.["3"] ?? Images?.placeholder?.onboarding,
    lines: [
      "정신을 차려보니 이런, 아주 깊은 구덩이 안이었어요.",
      "몇 번을 시도해보았지만 혼자서는 탈출이 불가능",
      "할 것 같아서 막막했답니다.",
    ],
  },
  {
    key: "slide-4",
    type: "illust",
    image: Images?.onboarding?.["4"] ?? Images?.placeholder?.onboarding,
    lines: [
      "그러다 갑자기 바스락- 소리가 들렸어요.",
      "고개를 들어보니 작은 원숭이가 손을 내밀고 있네요!",
      "믿음직스러운 표정을 하고선 말이에요.",
    ],
  },
  {
    key: "slide-5",
    type: "illust",
    image: Images?.onboarding?.["5"] ?? Images?.placeholder?.onboarding,
    lines: ["덕분에 무사히 밖으로 나왔어요.", "그의 이름은 로몽, 탐험가였죠.", "가는 방향이 같아 둘은 함께 하기로 했답니다.", "앞으로 어떤 일들이 있을까요?"],
  },
  // --- Character Intro Pages (after illust flow) ---
  {
    key: "intro-1",
    type: "intro",
    charImage: Images?.onboarding?.["6"] ?? Images?.onboarding?.["5"] ?? Images?.placeholder?.onboarding,
    linesRich: [
      [{ text: "반가워요!", style: "headlineBold" }],
      [
        { text: "저는 당신의 여정을 함께할 탐험 가이드", style: "guide" },
      ],
      [
        { text: "로몽 (Lomong)", highlight: true },
        { text: " 이에요." },
      ],
    ],
  },
  {
    key: "intro-2",
    type: "intro",
    charImage: Images?.onboarding?.["7"] ?? Images?.onboarding?.["5"] ?? Images?.placeholder?.onboarding,
    linesRich: [
        [{ text: " ", style: "headlineBold" }],
        [
          { text: "오늘부터 당신은 혼자만의 여정을 떠나는", style: "guide" },
        ],
        [
          { text: "탐험가", highlight: true },
          { text: " 가 될 거예요." },
        ],
    ],
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);

  const onSkip = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(main)/(tabs)/home");
  }, []);

  const goNext = useCallback(() => {
    const cur = SLIDES[index];
    // If we've finished the intro pages, go to the separate Setup flow route
    if (cur?.key === "intro-2") {
      try {
        router.push("/(fullscreen)/onboarding/setup");
      } catch {}
      return;
    }

    const next = index + 1;
    if (next < SLIDES.length) {
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    } else {
      onSkip();
    }
  }, [index, onSkip]);

  const goPrev = useCallback(() => {
    const prev = Math.max(0, index - 1);
    if (prev !== index) {
      listRef.current?.scrollToIndex({ index: prev, animated: true });
      setIndex(prev);
    }
  }, [index]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const first = viewableItems?.[0];
    if (first?.index != null) setIndex(first.index);
  }).current;

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 60,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item }) => {
      // 1) Illustration pages (existing layout)
      if (item.type === "illust" || !item.type) {
        return (
          <View style={[styles.slide, { width: SCREEN_W }]}>
            <ImageBackground
              source={item.image}
              resizeMode="cover"
              style={[styles.illust, { height: ILLUST_HEIGHT - insets.top }]}
              imageStyle={{ marginTop: -insets.top, resizeMode: "cover" }}
            >
              <Pressable
                onPress={onSkip}
                style={[styles.skipBtn, { top: insets.top + 32, right: 25 }]}
                hitSlop={10}
                accessibilityLabel="skip-onboarding"
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text className="text-body-2 text-green500 font-pretendardRegular mr-[6px]">SKIP</Text>
                  <Icon name="skip" width={12} height={12} />
                </View>
              </Pressable>
            </ImageBackground>
            <View style={styles.card}>
              {item.lines?.map((t, i) => (
                <Text key={i} style={styles.body}>
                  {t}
                </Text>
              ))}
            </View>
          </View>
        );
      }
      // 2) Character intro pages (new centered layout)
      return (
        <View style={[styles.slide, { width: SCREEN_W, alignItems: "center" }]}>
          {/* Top text block */}
          <View style={{ paddingTop: insets.top + 100, paddingHorizontal: 24, marginBottom: -60, width: "100%" }}>
            {item.linesRich?.map((line, li) => (
              <Text key={li} style={[styles.introLine, li === 0 && styles.introHeadline]}>
                {line.map((seg, si) => {
                  if (seg.highlight) {
                    return (
                      <Text key={si} style={[styles.introSegment, styles.introHighlight]}>
                        {seg.text}
                      </Text>
                    );
                  }
                  if (seg.style === "headlineBold") {
                    return (
                      <Text key={si} style={[styles.introSegment, styles.introHeadlineBold]}>
                        {seg.text}
                      </Text>
                    );
                  }
                  if (seg.style === "guide") {
                    return (
                      <Text key={si} style={[styles.introSegment, styles.introGuide]}>
                        {seg.text}
                      </Text>
                    );
                  }
                  if (seg.style === "headline") {
                    return (
                      <Text key={si} style={[styles.introSegment, styles.introHeadline]}>
                        {seg.text}
                      </Text>
                    );
                  }
                  return (
                    <Text key={si} style={styles.introSegment}>
                      {seg.text}
                    </Text>
                  );
                })}
              </Text>
            ))}
          </View>
          {/* Character image */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ImageBackground source={item.charImage} resizeMode="contain" style={{ width: 230, height: 244 }} />
          </View>
          {/* Bottom big round next button */}
          <View style={{ alignItems: "center", marginBottom: insets.bottom }}>
            <Pressable
              onPress={goNext}
              hitSlop={12}
              accessibilityLabel="next-intro"
            >
              <Icon name="next_circle" width={53} height={53} />
            </Pressable>
            <Text className="text-heading-3 font-pretendardSemiBold text-green500 mt-[6px]">다음</Text>
          </View>
        </View>
      );
    },
    [insets.top, goNext, onSkip]
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: 0, paddingBottom: 0 },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(it) => it.key}
        horizontal
        pagingEnabled
        bounces={false}
        snapToInterval={SCREEN_W}
        decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={2}
        windowSize={3}
        getItemLayout={(_, i) => ({
          length: SCREEN_W,
          offset: SCREEN_W * i,
          index: i,
        })}
      />

      {/* 하단 네비게이션 (intro 타입에는 숨김) */}
      {SLIDES[index]?.type !== "intro" && (
        <View style={[styles.navBar, { paddingBottom: insets.bottom }]}>
          <View style={{ flex: 1 }} />
          <Pressable onPress={goNext} hitSlop={10} style={styles.navBtn}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text className="text-body-2 font-pretendardRegular text-[#B98B51]">다음</Text>
              <Icon name="next_triangle" width={15} height={20} style={{ marginLeft: 4 }} />
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const ILLUST_HEIGHT = 733;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  slide: {
    flex: 1,
  },
  illust: {
    width: "100%",
    height: ILLUST_HEIGHT,
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  skipBtn: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 18,
    width: 75,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#93B56C",
  },

  card: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: -60,
    // backgroundColor: "#FFF000",
    paddingHorizontal: 20,
  },
  body: {
    fontSize: 20,
    lineHeight: 34,
    color: "#000",
    fontFamily: "SimKyungHa",
  },
  dotsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginHorizontal: 3,
  },
  dotActive: {
    width: 16,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#5C7F4E",
  },
  navBar: {
    position: "absolute",
    left: 16,
    right: 47,
    bottom: 55,
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#FFF000",
  },

  navText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3F5B34",
  },
  // --- Intro/Character Page Styles ---
  introLine: {
    textAlign: "center",
    fontSize: 18,
    lineHeight: 28,
    color: "#1A1A1A",
    fontFamily: "Pretendard-SemiBold",
    marginBottom: 8,
  },
  introHeadline: {
    textAlign: "center",
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "800",
    marginBottom: 12,
  },
  introHeadlineBold: {
    textAlign: "center",
    fontSize: 24,
    lineHeight: 24 * 1.4,
    fontFamily: "Pretendard-ExtraBold",
  },
  introGuide: {
    textAlign: "center",
    fontSize: 20,
    lineHeight: 20 * 1.4,
    color: "#000",
    fontFamily: "Pretendard-SemiBold",
  },
  introHighlight: {
    color: "#EE7A13",
    fontSize: 24,
    lineHeight: 24 * 1.4,
    fontFamily: "Pretendard-ExtraBold",
    
  },
  introSegment: {
    lineHeight: 20 * 1.4,
    fontSize: 20,
    fontFamily: "Pretendard-SemiBold",
    textAlignVertical: "center",
  },
  bigCircleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6C8E53",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bigCircleLabel: {
    marginTop: 8,
    fontSize: 12,
    color: "#6C8E53",
    fontWeight: "700",
  },
});
