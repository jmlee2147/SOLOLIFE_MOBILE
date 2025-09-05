// src/app/(main)/place-recommend/[category].jsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Image, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import Header from "../../../components/shared/Header";
import { CATEGORY, resolveCategoryKeyByLabel } from "../../../config/category.config";

// (선택) 카테고리별 서브타이틀만 별도 관리하고 싶으면 여기에 둠
const SUBTITLE = {
  cafe: "카페인 수혈이 필요하다면 여기부터.",
  activity: "다양한 활동을 해 보세요.\n좋은 장소를 발견할지도 몰라요.",
  shopping: "지갑은 가볍게, 만족은 묵직하게.",
  food: "맛있는 행복을 골라보세요.",
};

// 카테고리별 대표 이미지 매핑
const CAT_IMAGE = {
  cafe: require("../../../assets/images/cafe.png"),
  activity: require("../../../assets/images/activity.png"),
  shopping: require("../../../assets/images/shopping.png"),
  food: require("../../../assets/images/eat.png"),
};

export default function CategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();              // { category: "cafe" | "카페", ... }
  const raw = params.category;

  // 1) 파라미터를 key로 정규화
  const catKey = useMemo(() => {
    if (!raw) return undefined;
    // key로 온 경우
    if (CATEGORY[raw]) return String(raw);
    // 한글 라벨로 온 경우
    return resolveCategoryKeyByLabel(String(raw));
  }, [raw]);

  const cfg = catKey ? CATEGORY[catKey] : undefined;

  // 2) 가드: 잘못된 카테고리면 목록으로
  useEffect(() => {
    if (!catKey || !cfg) router.replace("/place-recommend");
  }, [catKey, cfg, router]);

  // 3) 카페처럼 최상위에 keywords가 있으면 이 화면 스킵
  useEffect(() => {
    if (cfg?.keywords?.length) {
      router.replace({ pathname: "/place-recommend/keywords", params: { category: catKey } });
    }
  }, [cfg, catKey, router]);

  if (!cfg || cfg?.keywords?.length) {
    // 가드/리다이렉트 중
    return null;
  }

  // 4) 서브카테고리 옵션 생성 (key/label 동시 보관)
  const options = Object.entries(cfg.subcategories ?? {}).map(([subKey, sub]) => ({
    key: subKey,
    label: sub.label,
  }));

  const onSelect = (sub) => {
    router.push({
      pathname: "/place-recommend/keywords",
      params: { category: catKey, subcategory: sub.key }, // 👉 key 기반으로 이동
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="장소 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="items-center mt-6 mb-3">
          <Image source={CAT_IMAGE[catKey]} className="w-[220px] h-[220px]" resizeMode="contain" />
        </View>

        {/* Title & Subtitle (가운데 정렬) */}
        <Text className="mt-3 text-center text-title-1 font-pretendardExtraBold">
          {cfg.label /* 한글 라벨: 카페/활동/쇼핑/먹거리 */}
        </Text>
        <Text className="mt-2 leading-6 text-center whitespace-pre-line text-heading-3">
          {SUBTITLE[catKey] ?? "원하는 테마를 선택하세요."}
        </Text>

        {/* Options Grid (2열, 카드 166x74) */}
        <View className="flex-row flex-wrap justify-between mt-20">
          {options.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => onSelect(opt)}
              className="w-[166px] h-[74px] rounded-[5px] bg-gray50 items-center justify-center mb-4"
              android_ripple={{ color: "rgba(0,0,0,0.08)" }}
              style={Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOpacity: 0,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                },
                android: { elevation: 2 },
              })}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <Text className="text-heading-2">{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}