// src/app/(main)/place-recommend/[category].jsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  Text,
  View
} from "react-native";
import Header from "../../../components/shared/Header";
import {
  CATEGORY,
  resolveCategoryKeyByLabel,
} from "../../../config/category.config";

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
  const params = useLocalSearchParams(); // { category: "cafe" | "카페", ... }
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
      router.replace({
        pathname: "/place-recommend/keywords",
        params: { category: catKey },
      });
    }
  }, [cfg, catKey, router]);

  if (!cfg || cfg?.keywords?.length) {
    // 가드/리다이렉트 중
    return null;
  }

  // 4) 서브카테고리 옵션 생성 (key/label 동시 보관)
  const options = Object.entries(cfg.subcategories ?? {}).map(
    ([subKey, sub]) => ({
      key: subKey,
      label: sub.label,
    })
  );

  const onSelect = (sub) => {
    router.push({
      pathname: "/place-recommend/keywords",
      params: { category: catKey, subcategory: sub.key }, 
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

      <View style={{ paddingHorizontal: 25 }}>
        {/* Hero */}
        <View className="items-center">
          <Image
            source={CAT_IMAGE[catKey]}
            className="w-[264px] h-[264px]"
            resizeMode="contain"
          />
        </View>

        {/* Title & Subtitle (가운데 정렬) */}
        <Text className="mt-[-26px] text-center text-title-1 font-pretendardExtraBold">
          {cfg.label /* 한글 라벨: 카페/활동/쇼핑/먹거리 */}
        </Text>
        <Text className="mt-2 text-center whitespace-pre-line text-heading-3 text-gray700 font-pretendardSemiBold">
          {SUBTITLE[catKey] ?? "원하는 테마를 선택하세요."}
        </Text>

        {/* Options List (1열, 버튼 전체폭) */}
        <View style={{ marginTop: 40 }}>
          {options.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => onSelect(opt)}
              style={[
                {
                  width: "100%",
                  height: 56,
                  borderRadius: 999,
                  backgroundColor: "#FFF", // gray50
                  borderWidth: 1,
                  borderColor: "#D4D4D4",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                },
              ]}
            >
              <Text className="text-heading-2 font-pretendardSemiBold">
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
