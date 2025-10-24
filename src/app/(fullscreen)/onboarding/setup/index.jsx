import { Images } from "@assets/images";
import MonkeyLoadingVideo from "@components/animation/MonkeyLoading";
import Icon from "@components/shared/Icon";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W } = Dimensions.get("window");

const PAGES = [
  { key: "setup-1", type: "input", title: "탐험가님의\n이름은 무엇인가요?" },
  {
    key: "setup-2",
    type: "select-char",
    title: "탐험가님의\n캐릭터를 선택해 주세요.",
  },
  {
    key: "setup-3",
    type: "select-tags",
    title: "관심있는 주제를\n모두 선택해 주세요.",
  },
  { key: "setup-4", type: "finish", title: "좋아요!" },
  // --- New background story & questions ---
  {
    key: "setup-5",
    type: "story",
    bg: Images?.onboarding?.bg_forest,
    lines: [
      "“어느날 포슬감자님은",
      "새로운 카페를 찾아 탐험을 나섰어요.",
      "",
      "포슬감자님의 마음을 끄는 장소는 어디인가요?”",
    ],
    monkey: Images?.onboarding?.monkey_heart,
  },
  {
    key: "setup-6",
    type: "question",
    bg: Images?.onboarding?.bg_forest,
    titleBold: "탐험을 하던 중\n두 가지 갈림길이 나왔습니다.",
    subtitle: "어느 쪽으로 가고 싶으신가요?",
    options: [
      { id: "q1_a", label: "사람들로 북적이는 광장" },
      { id: "q1_b", label: "한적해 보이는 작은 마을" },
    ],
  },
  {
    key: "setup-7",
    type: "question",
    bg: Images?.onboarding?.bg_forest,
    titleBold: "길을 따라 가니 카페가 보이네요!",
    subtitle: "포슬감자님의 마음을 끄는 곳은?",
    options: [
      { id: "q2_a", label: "소박하고 아늑한 안식처 같은 카페" },
      { id: "q2_b", label: "끝없이 펼쳐진 넓고 웅장한 카페" },
    ],
  },
  {
    key: "setup-8",
    type: "question",
    bg: Images?.onboarding?.bg_forest,
    titleBold: "마음을 끄는 카페에 들어왔습니다.",
    subtitle: "포슬감자님 이 카페의 분위기는 어떤가요?",
    options: [
      { id: "q3_a", label: "태양처럼 환하게 밝다" },
      { id: "q3_b", label: "모닥불처럼 은은하고 어둡다" },
    ],
  },
  {
    key: "setup-9",
    type: "loading",
    title: "포슬감자님의 프로필을\n생성 중 이에요.",
    subtitle: "잠시만 기다려주세요.",
    monkey: Images?.onboarding?.monkey_happy,
  },
];

export default function SetupWizard() {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [name, setName] = useState("");
  const [charId, setCharId] = useState(null); // 'm','f','monkey' 등
  const [tags, setTags] = useState([]);
  const nameInputRef = useRef(null);
  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState(null);
  const [q3, setQ3] = useState(null);

  const progress = useMemo(() => (idx + 1) / PAGES.length, [idx]);

  const goNext = () => {
    // 간단한 유효성 체크
    const page = PAGES[idx];
    if (page.type === "input" && name.trim().length === 0) return;
    if (page.type === "select-char" && !charId) return;
    // Removed guard for select-tags
    // if (page.type === "select-tags" && tags.length === 0) return;

    if (page.type === "question") {
      if (page.key === "setup-6" && !q1) return;
      if (page.key === "setup-7" && !q2) return;
      if (page.key === "setup-8" && !q3) return;
    }

    const next = idx + 1;
    if (next < PAGES.length) {
      setIdx(next);
      listRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      // 완료 → 홈 또는 첫 화면으로
      router.replace("/(main)/(tabs)/home");
    }
  };

  const goBack = () => {
    if (idx === 0) {
      router.back();
      return;
    }
    const prev = idx - 1;
    setIdx(prev);
    listRef.current?.scrollToIndex({ index: prev, animated: true });
  };

  const toggleTag = (t) => {
    setTags((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]
    );
  };

  const TAGS = [
    { key: "cafe", label: "카페" },
    { key: "shopping", label: "쇼핑" },
    { key: "book", label: "책 / 자기 개발" },
    { key: "museum", label: "전시 / 박물관" },
    { key: "food", label: "맛집 탐방" },
    { key: "activity", label: "산책 / 활동" },
  ];
  const tagLabelByKey = Object.fromEntries(TAGS.map((t) => [t.key, t.label]));

  const renderPage = ({ item }) => {
    switch (item.type) {
      case "input":
        return (
          <KeyboardAvoidingView
            style={[styles.page, { width: W }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
          >
            <TopBar insets={insets} onBack={goBack} progress={progress} />
            <CenterTitle text={item.title} />
            <Pressable
              style={styles.inputBox}
              onPress={() => nameInputRef.current?.focus()}
            >
              <TextInput
                ref={nameInputRef}
                value={name}
                onChangeText={setName}
                placeholder="이름을 입력하세요"
                style={styles.textInput}
                maxLength={20}
                returnKeyType="done"
                autoFocus={false}
                onFocus={() => {}}
              />
            </Pressable>
            <BottomNext onPress={goNext} bottomOffset={insets.bottom + 16} />
          </KeyboardAvoidingView>
        );

      case "select-char":
        return (
          <View style={[styles.page, { width: W }]}>
            <TopBar insets={insets} onBack={goBack} progress={progress} />
            <CenterTitle
              text={item.title}
              sub="사용할 캐릭터 하나를 선택해 주세요."
            />
            <View style={styles.rowWrap}>
              {[
                {
                  id: "f",
                  active: require("@assets/characters/base_explorer_female.png"),
                  inactive: require("@assets/characters/base_explorer_female_gray.png"),
                },
                {
                  id: "m",
                  active: require("@assets/characters/base_explorer_male.png"),
                  inactive: require("@assets/characters/base_explorer_male_gray.png"),
                },
              ].map(({ id, active, inactive }) => (
                <Pressable
                  key={id}
                  onPress={() => setCharId(id)}
                  style={styles.charCard}
                >
                  <Image
                    source={charId === id ? active : inactive}
                    style={{
                      width: 208,
                      height: 252,
                      resizeMode: "contain",
                    }}
                  />
                </Pressable>
              ))}
            </View>
            <BottomNext onPress={goNext} bottomOffset={insets.bottom + 16} />
          </View>
        );

      case "select-tags":
        return (
          <View style={[styles.page, { width: W }]}>
            <TopBar insets={insets} onBack={goBack} progress={progress} />
            <CenterTitle
              text={item.title}
              sub="“혼자 시간을 보낼 때 주로 무엇을 하나요?
맞춤형 장소 및 루트를 추천해 드릴게요.”"
            />
            <View style={styles.grid}>
              {TAGS.map(({ key, label }) => {
                const selected = tags.includes(key);
                const icon = Images?.onboarding?.[key];
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      setTags((cur) =>
                        cur.includes(key)
                          ? cur.filter((x) => x !== key)
                          : [...cur, key]
                      );
                    }}
                    style={[styles.tagCell, selected && styles.tagCellActive]}
                  >
                    {icon ? (
                      <Image
                        source={icon}
                        style={{
                          width: 28,
                          height: 28,
                          marginBottom: 8,
                          resizeMode: "contain",
                        }}
                      />
                    ) : null}
                    <Text
                      style={[styles.tagText, selected && styles.tagTextActive]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <BottomNext onPress={goNext} bottomOffset={insets.bottom + 16} />
          </View>
        );

      case "finish":
        return (
          <View style={[styles.page, { width: W }]}>
            <TopBar insets={insets} onBack={goBack} progress={progress} />

            <CenterTitle
              text="좋아요!"
              sub="‘포슬감자님' 에 대해 더 알고 싶어졌어요!
몇 가지 질문을 통해 탐험 스타일을 알아볼까요?"
            />
            <Image
              source={Images.onboarding.monkey_happy}
              style={{
                width: 230,
                height: 251,
                resizeMode: "contain",
                alignSelf: "center",
                marginTop: 44,
                marginBottom: 24,
              }}
            />
            <BottomNext
              onPress={goNext}
              label="다음"
              bottomOffset={insets.bottom + 16}
            />
          </View>
        );

      case "story":
        return (
          <ImageBackground
            source={item.bg}
            style={[styles.page, { width: W }]}
            resizeMode="cover"
            imageStyle={{}}
          >
            <TopBar insets={insets} onBack={goBack} progress={progress} />
            <View style={styles.storyTextWrap}>
              {item.lines.map((t, i) => (
                <Text key={i} style={styles.storyText}>
                  {t}
                </Text>
              ))}
            </View>
            {item.monkey ? (
              <Image
                source={item.monkey}
                style={styles.storyMonkey}
                resizeMode="contain"
              />
            ) : null}
            <BottomNext onPress={goNext} bottomOffset={insets.bottom + 16} />
          </ImageBackground>
        );

      case "question":
        return (
          <ImageBackground
            source={item.bg}
            style={[styles.page, { width: W }]}
            resizeMode="cover"
            imageStyle={{}}
          >
            <TopBar insets={insets} onBack={goBack} progress={progress} />
            <View style={styles.qTitleWrap}>
              <Text style={styles.qTitleBold}>{item.titleBold}</Text>
              {!!item.subtitle && (
                <Text style={styles.qSubtitle}>{item.subtitle}</Text>
              )}
            </View>

            <View style={[styles.qOptionsWrap, styles.qOptionsFixed, { bottom: insets.bottom + 300 }]}>
              {item.options.map((opt) => {
                const selected =
                  (item.key === "setup-6" ? q1 : item.key === "setup-7" ? q2 : q3) === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      if (item.key === "setup-6") setQ1(opt.id);
                      else if (item.key === "setup-7") setQ2(opt.id);
                      else setQ3(opt.id);
                    }}
                    style={[
                      styles.qPill,
                      selected && styles.qPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.qPillText,
                        selected && styles.qPillTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <BottomNext onPress={goNext} bottomOffset={insets.bottom + 16} />
          </ImageBackground>
        );

      case "loading":
        return (
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF", width: W }}>
            <View style={{ flex: 1, alignItems: "flex-start", paddingTop: 62, paddingHorizontal: 25 }}>
              <Text className="text-title-1 font-pretendardExtraBold">포슬감자님의 프로필을</Text>
              <Text className="text-title-1 font-pretendardExtraBold">생성 중이에요.</Text>
              <Text className="mt-2 text-heading-3 text-gray700 font-pretendardMedium mb-[100px]">잠시만 기다려주세요.</Text>

              <MonkeyLoadingVideo height={300} mirror />

            </View>
          </SafeAreaView>
        );

      default:
        return null;
    }
  };

  // Effect: Navigate away after loading page shows for ~2.3s
  useEffect(() => {
    const page = PAGES[idx];
    if (page?.type === "loading") {
      const t = setTimeout(() => {
        // 로딩 후 프로필 완료 화면으로 이동 (경로는 프로젝트에 맞게 조정)
        router.replace("/(fullscreen)/onboarding/profile-complete");
      }, 2300);
      return () => clearTimeout(t);
    }
  }, [idx]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(it) => it.key}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

function TopBar({ insets, onBack, progress }) {
  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Pressable onPress={onBack} hitSlop={12} style={{ padding: 6 }}>
        <Icon name="previous" width={24} height={24} />
      </Pressable>
      <View
        style={{
          flex: 1,
          height: 10,
          backgroundColor: "#F4F4F4",
          borderRadius: 4,
          marginLeft: 12,
        }}
      >
        <View
          style={{
            width: `${Math.round(progress * 100)}%`,
            height: 10,
            backgroundColor: "#93B56C",
            borderRadius: 99,
          }}
        />
      </View>
    </View>
  );
}

function CenterTitle({ text, sub }) {
  return (
    <View
      style={{
        alignItems: "center",
        marginTop: 123,
        marginBottom: 16,
        paddingHorizontal: 24,
      }}
    >
      <Text className="text-center text-title-2 font-pretendardExtraBold">
        {text}
      </Text>
      {sub ? (
        <Text className="text-center text-heading-3 font-pretendardSemiBold text-gray700 mt-[6px]">
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function BottomNext({ onPress, label = "다음" }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: insets.bottom, // respect safe area
        alignItems: "center",
      }}
    >
      <Pressable onPress={onPress} hitSlop={12}>
        <Icon name="next_circle" width={53} height={53} />
      </Pressable>
      <Text className="text-heading-3 font-pretendardSemiBold text-green500 mt-[6px]">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingTitle: {
    fontSize: 24,
    lineHeight: 24 * 1.4,
    fontFamily: "Pretendard-ExtraBold",
    color: "#000",
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 14 * 1.5,
    color: "#6B6B6B",
    fontFamily: "Pretendard-SemiBold",
  },
  page: {
    flex: 1,
    position: "relative",
    marginBottom: -10,
  },
  inputBox: {
    marginHorizontal: 110,
    marginTop: 24,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "#F4F4F4",
  },
  textInput: {
    fontSize: 16,
    color: "#111827",
  },
  rowWrap: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 24,
  },
  charCard: {
    width: 158,
    height: 191,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  charCardActive: {
    borderColor: "#7CAA58",
    shadowColor: "#7CAA58",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 3,
  },
  charLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 16,
  },
  tagCell: {
    width: (W - 25 * 2 - 12 * 2) / 3,
    height: 118,
    borderRadius: 10,
    backgroundColor: "#F4F4F4",
    borderWidth: 2,
    borderColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  tagCellActive: {
    borderColor: "#42790E",
    backgroundColor: "#FCFFFA",
  },
  tagText: {
    fontSize: 16,
    color: "#6B6B6B",
    fontFamily: "Pretendard-SemiBold",
  },
  tagTextActive: {
    color: "#42790E",
  },
  confirmBox: {
    marginTop: 40,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 28,
    fontWeight: "800",
  },
  tagsConfirm: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 24,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F9EC",
  },
  tagPillText: {
    color: "#4E7A2D",
    fontWeight: "700",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  storyTextWrap: {
    marginTop: 130,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  storyText: {
    textAlign: "center",
    color: "#000",
    fontSize: 16,
    lineHeight: 16 * 1.4,
    fontFamily: "Pretendard-SemiBold",
    marginBottom: 6,
  },
  storyMonkey: {
    width: 230,
    height: 230,
    alignSelf: "center",
    marginTop: 28,
  },
  qTitleWrap: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  qTitleBold: {
    fontSize: 24,
    fontFamily: "Pretendard-ExtraBold",
    lineHeight: 24 * 1.4,
    color: "#000",
    textAlign: "left",
  },
  qSubtitle: {
    marginTop: 6,
    fontSize: 16,
    fontFamily: "Pretendard-SemiBold",
    color: "#6B6B6B",
    textAlign: "left",
    marginBottom: 122,
  },
  qOptionsWrap: {
    marginTop: 24,
    gap: 12,
    paddingHorizontal: 24,
  },
  qPill: {
    height: 73,
    width: 343,
    borderRadius: 99,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#FFF",
  },
  qPillActive: {
    backgroundColor: "#FCFFFA",
    borderColor: "#42790E",
    shadowColor: "#000",
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 3,
    elevation: 3,
  },
  qPillText: {
    textAlign: "center",
    fontSize: 20,
    color: "#6B6B6B",
    fontFamily: "Pretendard-SemiBold",
  },
  qPillTextActive: {
    color: "#42790E",
  },

  qOptionsFixed: {
    position: "absolute",
    left: 0,
    right: 25,
  },
});

  