import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, SafeAreaView, Text, View } from "react-native";
import Header from "../../../components/shared/Header";
import Icon from "../../../components/shared/Icon";
import { CATEGORY, MOODS, resolveCategoryKeyByLabel } from "../../../config/category.config";

export default function KeywordsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // { category: 'cafe' | '카페', subcategory?: 'exhibition' | ... }
  const rawCategory = params.category;
  const subKeyParam = params.subcategory;

  // 1) category key 정규화
  const catKey = useMemo(() => {
    if (!rawCategory) return "";
    if (CATEGORY?.[rawCategory]) return String(rawCategory); // 이미 key
    return resolveCategoryKeyByLabel(String(rawCategory)) || "";
  }, [rawCategory]);

  const cfg = CATEGORY?.[catKey];
  const subKey = typeof subKeyParam === "string" ? subKeyParam : "";

  // 2) 라벨
  const categoryLabel = cfg?.label ?? String(rawCategory ?? "");
  const subLabel = useMemo(() => {
    if (!cfg?.subcategories || !subKey) return "";
    return cfg.subcategories?.[subKey]?.label ?? "";
  }, [cfg, subKey]);

  // 3) 공통 무드 + 전용 키워드 병합
  const options = useMemo(() => {
    if (!cfg) return Array.isArray(MOODS) ? [...MOODS] : [];
    const common = Array.isArray(MOODS) ? MOODS : [];

    // 루트 카테고리(예: 카페)
    if (Array.isArray(cfg.keywords) && cfg.keywords.length) {
      return Array.from(new Set([...common, ...cfg.keywords]));
    }

    // 서브카테고리(예: 활동/전시)
    const subKw =
      cfg.subcategories && cfg.subcategories[subKey] && Array.isArray(cfg.subcategories[subKey].keywords)
        ? cfg.subcategories[subKey].keywords
        : [];

    return Array.from(new Set([...common, ...subKw]));
  }, [cfg, subKey]);

  // 4) 선택 상태
  const [selected, setSelected] = useState([]);
  const toggle = (k) =>
    setSelected((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  // 5) 타이틀
  const title = useMemo(() => {
    return `${subLabel || categoryLabel} 장소를 찾으시는군요!`;
  }, [categoryLabel, subLabel]);

  // 6) 키워드가 하나도 없으면(드물겠지만) 바로 결과로
  useEffect(() => {
    if (!cfg) return; // 아직 로딩/정규화 실패 시
    if (!options.length) {
      router.replace({
        pathname: "/place-recommend/results",
        params: { category: catKey, subcategory: subKey },
      });
    }
  }, [cfg, options.length, catKey, subKey, router]);

  // 7) 다음(한글 그대로 전송/전달)
  const goNext = () => {
    router.push({
      pathname: "/place-recommend/results",
      params: {
        category: catKey,
        subcategory: subKey,
        keywordsKo: JSON.stringify(selected), // 한글 배열 그대로
      },
    });
  };

  if (!cfg || !options.length) return null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="장소 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      <View style={{ flex: 1, paddingHorizontal: 25, paddingTop: 5 }}>
        {/* 타이틀 */}
        <Text className="text-title-1 mb-[6px] font-pretendardExtraBold">{title}</Text>
        <Text className="mb-12 leading-6 text-heading-3 text-gray700 font-pretendardMedium">
          선호하는 키워드를 선택해주세요.
        </Text>

        {/* 칩 그리드 */}
        <View className="flex-row flex-wrap mt-5">
          {options.map((k) => {
            const active = selected.includes(k);
            return (
              <Pressable
                key={k}
                onPress={() => toggle(k)}
                className={[
                  "px-7 py-4 rounded-full mr-3 mb-5",
                  active ? "bg-green500" : "bg-gray50",
                ].join(" ")}
                android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
                style={Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOpacity: 0,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                  },
                  android: { elevation: 1 },
                })}
                accessibilityRole="button"
                accessibilityLabel={k}
              >
                <Text
                  className={[
                    "text-[18px] font-pretendardMedium",
                    active ? "text-white" : "text-gray700",
                  ].join(" ")}
                >
                  {k}
                </Text>

                {/* 선택 표시 점 */}
                {active && (
                  <View className="absolute w-3 h-3 rounded-full bg-yellow900 -top-1 -right-1" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 하단 '다음' */}
      <View className="absolute bottom-0 left-0 right-0 items-center">
        <Pressable
          onPress={goNext}
          className="w-[64px] h-[64px] rounded-full bg-white items-center justify-center"
          style={Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOpacity: 0,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            },
            android: { elevation: 4 },
          })}
          android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: true }}
          accessibilityRole="button"
          accessibilityLabel="다음"
        >
          <Icon name="next_circle" width={53} height={53}/>
        </Pressable>
        <Text className="mt-[6px] text-heading-3 text-green500 font-pretendardSemiBold">다음</Text>
      </View>
    </SafeAreaView>
  );
}