import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from "react-native";
import EditStepCard from "../../../components/route/EditStepCard";
import Button from "../../../components/shared/Button";
import Header from "../../../components/shared/Header";

// ── 목업 데이터 (이미지 경로는 프로젝트에 맞게 조정)
const MOCK_PLACES = [
  {
    id: "1",
    title: "55데시벨",
    rating: 4.5,
    categories: ["카페", "디저트"],
    address: "경기도 수원시 영통구",
    imageSource: require("../../../assets/images/sample.png"),
  },
  {
    id: "2",
    title: "66데시벨",
    rating: 4.5,
    categories: ["카페", "디저트"],
    address: "경기도 수원시 영통구",
    imageSource: require("../../../assets/images/cafe.png"),
  },
  {
    id: "3",
    title: "77데시벨",
    rating: 4.5,
    categories: ["카페", "디저트"],
    address: "경기도 수원시 영통구",
    imageSource: require("../../../assets/images/shopping.png"),
  },
];

// 키워드(칩) 목업
const KEYWORD_PILLS = [
  "카페",
  "쇼핑",
  "먹거리",
  "체험",
  "전시",
  "독서/자기개발",
  "산책",
];

export default function RouteEditScreen() {
  const router = useRouter();

  // 선택한 카드 id (최대 2개)
  const [selectedIds, setSelectedIds] = useState([]);
  // 선택한 키워드(무제한)
  const [selectedPills, setSelectedPills] = useState([]);

  const toggleCard = (id) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev; // 최대 2개 제한
      return [...prev, id];
    });
  };

  const togglePill = (label) => {
    setSelectedPills((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const canProceed = useMemo(() => selectedIds.length > 0, [selectedIds.length]);

  const handleNext = () => {
    if (!canProceed) return;
    // TODO: 선택한 카드/키워드 정보를 넘기려면 params에 포함하세요.
    router.push({
      pathname: "/route-builder/summary",
      // params: { selectedIds: JSON.stringify(selectedIds), selectedPills: JSON.stringify(selectedPills) }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="루트 수정하기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* 상단 타이틀 */}
        <View style={{ paddingHorizontal: 25, paddingTop: 8 }}>
          <Text className="text-title-2 font-pretendardExtraBold">
            변경할 장소를 선택해주세요.
          </Text>
          <Text className="mt-[6px] text-gray700 text-heading-3 font-pretendardMedium">
            최대 2개까지 선택 가능해요.
          </Text>
        </View>

        {/* 카드 리스트 */}
        <View style={{ marginTop: 26 }}>
          {MOCK_PLACES.map((p) => (
            <View key={p.id} style={{ paddingHorizontal: 25, marginBottom: 10 }}>
              <EditStepCard
                title={p.title}
                rating={p.rating}
                categories={p.categories}
                address={p.address}
                imageSource={p.imageSource}
                onPress={() => toggleCard(p.id)}
              />
            </View>
          ))}
        </View>

        {/* 구분 여백 */}
        <View style={{ height: 26 }} />

        {/* 키워드 섹션 */}
        <View style={{ paddingHorizontal: 25 }}>
          <Text className="text-[22px] font-pretendardExtraBold">
            선호하는 키워드를 모두 선택해주세요.
          </Text>

          <View className="flex-row flex-wrap mt-[10px]">
            {KEYWORD_PILLS.map((label) => {
              const active = selectedPills.includes(label);
              return (
                <Pressable
                  key={label}
                  onPress={() => togglePill(label)}
                  className={[
                    "px-[22px] py-[11px] mr-[10px] mb-[13px] rounded-full",
                    active ? "bg-green500" : "bg-[#F3F4F6]",
                  ].join(" ")}
                  android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
                >
                  <Text
                    className={[
                      "text-heading-3 font-pretendardMedium",
                      active ? "text-white" : "text-gray500",
                    ].join(" ")}
                  >
                    {label}
                  </Text>
                  {active && (
                    <View className="absolute w-3 h-3 rounded-full bg-yellow900 -top-1 -right-1" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 25,
          paddingBottom: 0,
          paddingTop: 10,
          backgroundColor: "#fff",
        }}
      >
        <Button
          title="다음"
          size="large"
          variant={canProceed ? "primary" : "disabled"}
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}