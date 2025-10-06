import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, SafeAreaView, Text, View } from "react-native";
import Header from "../../../components/shared/Header";
import Icon from "../../../components/shared/Icon";
import {
  CATEGORY,
  MOODS,
  resolveCategoryKeyByLabel,
} from "../../../config/category.config";

export default function KeywordsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // { category: 'cafe' | '카페', subcategory?: 'exhibition' | ... }
  const rawCategory = params.category;
  const subKeyParam = params.subcategory;

  // 1) category key 정규화
  const catKey = useMemo(() => {
    if (!rawCategory) return "";
    if (CATEGORY?.[rawCategory]) return String(rawCategory);
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

  // 3) 공통 무드 + 전용 키워드 병합(표시는 합쳐서 하되, 전송은 분리)
  const options = useMemo(() => {
    if (!cfg) return Array.isArray(MOODS) ? [...MOODS] : [];
    const common = Array.isArray(MOODS) ? MOODS : [];

    // 루트 카테고리(예: 카페)
    if (Array.isArray(cfg.keywords) && cfg.keywords.length) {
      return Array.from(new Set([...common, ...cfg.keywords]));
    }

    // 서브카테고리(예: 활동/전시)
    const subKw =
      cfg.subcategories &&
      cfg.subcategories[subKey] &&
      Array.isArray(cfg.subcategories[subKey].keywords)
        ? cfg.subcategories[subKey].keywords
        : [];

    return Array.from(new Set([...common, ...subKw]));
  }, [cfg, subKey]);

  // 4) 선택 상태
  const [selected, setSelected] = useState([]);
  const toggle = (k) =>
    setSelected((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );

  // 5) 타이틀
  const title = useMemo(() => {
    return `${subLabel || categoryLabel} 장소를 찾으시는군요!`;
  }, [categoryLabel, subLabel]);

  // 6) 키워드가 하나도 없으면 바로 결과로(빈 배열 전달)
  useEffect(() => {
    if (!cfg) return;
    if (!options.length) {
      // 라벨 기준 category 계산
      const categoryForAPI = subLabel || categoryLabel;
      router.replace({
        pathname: "/place-recommend/results",
        params: {
          category: categoryForAPI, // 라벨로 전달
          subcategory: subKey, // 필요하면 유지
          keywordsKo: JSON.stringify([]),
          moodsKo: JSON.stringify([]),
        },
      });
    }
  }, [cfg, options.length, subKey, router, categoryLabel, subLabel]);

  // 7) 다음(선택값을 무드/키워드로 분리해서 한글 그대로 전달)
  const goNext = () => {
    const selectedMoods = selected.filter((k) => MOODS.includes(k));
    const selectedKeywords = selected.filter((k) => !MOODS.includes(k));
    // 라벨 기준 category 계산
    const categoryForAPI = subLabel || categoryLabel;

    router.push({
      pathname: "/place-recommend/results",
      params: {
        category: categoryForAPI,
        subcategory: subKey,
        keywordsKo: JSON.stringify(selectedKeywords), // 개별 키워드(한글 배열)
        moodsKo: JSON.stringify(selectedMoods), // 공통 무드(한글 배열)
      },
    });
  };

  if (!cfg || !options.length) return null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="close"
        onRightPress={() => router.push("/home")}
      />

      <View style={{ flex: 1, paddingHorizontal: 25, paddingTop: 5 }}>
        {/* 타이틀 */}
        <Text className="text-title-1 mb-[6px] font-pretendardExtraBold">
          <Text className="text-green500">{subLabel || categoryLabel}</Text>
          <Text> 장소를 찾으시는군요!</Text>
        </Text>
        <Text className="mb-12 leading-6 text-heading-3 text-gray700 font-pretendardMedium">
          선호하는 키워드를 선택해주세요.
        </Text>

        {/* 칩 그리드(무드+키워드 합쳐서 표시) */}
        <View className="flex-row flex-wrap mt-5">
          {options.map((k) => {
            const active = selected.includes(k);
            return (
              <Pressable
                key={k}
                onPress={() => toggle(k)}
                className={[
                  "px-7 py-4 rounded-full mr-3 mb-5",
                  active ? "bg-[#FCFFFA]" : "bg-gray50",
                ].join(" ")}
                android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
                style={[
                  {
                    borderWidth: active ? 1.5 : 1.5,
                    borderColor: active ? "#42790E" : "transparent",
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={k}
              >
                <Text
                  className={[
                    "text-[18px] font-pretendardMedium",
                    active ? "text-green900" : "text-gray700",
                  ].join(" ")}
                >
                  {k}
                </Text>
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
          <Icon name="next_circle" width={53} height={53} />
        </Pressable>
        <Text className="mt-[6px] text-heading-3 text-green500 font-pretendardSemiBold">
          다음
        </Text>
      </View>
    </SafeAreaView>
  );
}
