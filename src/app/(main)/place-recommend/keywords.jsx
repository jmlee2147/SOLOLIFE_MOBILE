import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import Header from "../../../components/shared/Header";

const KEYWORDS_DEFAULT = [
  "북적북적한", "조용한", "넓은", "아늑한", "밝은",
  "사진찍기 좋은", "감성적인", "어두운",
];

export default function KeywordsScreen() {
  const router = useRouter();
  const { category, option } = useLocalSearchParams();
  const title = useMemo(() => `${option ?? category} 장소를 찾으시는군요!`, [option, category]);
  const [selected, setSelected] = useState([]);

  const toggle = (k) => {
    setSelected((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const goNext = () => {
    // TODO: 다음 단계 라우팅
    // router.push({ pathname: "/place-recommend/results", params: { category, option, keywords: JSON.stringify(selected) } });
    console.log("선택 키워드:", selected);
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
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 타이틀 */}
        <Text className="mt-3 leading-tight text-title-1 font-pretendardExtraBold">{title}</Text>
        <Text className="mt-2 mb-12 leading-6 text-heading-3 text-gray300 font-pretendardMedium">
          선호하는 키워드를 선택해주세요.
        </Text>

        {/* 칩 그리드 */}
        <View className="flex-row flex-wrap mt-5">
          {KEYWORDS_DEFAULT.map((k) => {
            const isActive = selected.includes(k);
            return (
              <Pressable
                key={k}
                onPress={() => toggle(k)}
                className={[
                  "px-7 py-4 rounded-full mr-3 mb-5",
                  isActive ? "bg-green500" : "bg-gray50",
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
              >
            
                  <Text
                    className={[
                      "text-[18px] font-pretendardMedium",
                      isActive ? "text-white" : "text-gray300",
                    ].join(" ")}
                  >
                    {k}
                  </Text>

                  {/* 주황 점: 칩 외부 오른쪽 위 */}
                {isActive && (
                <View className="absolute w-3 h-3 rounded-full bg-yellow900 -top-1 -right-1" />
                )}
             
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* 하단 고정 '다음' 버튼 */}
      <View className="absolute bottom-0 left-0 right-0 items-center pb-6">
        <Pressable
          onPress={goNext}
          className="w-[64px] h-[64px] rounded-full bg-white items-center justify-center"
          style={Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            },
            android: { elevation: 4 },
          })}
          android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: true }}
          accessibilityRole="button"
          accessibilityLabel="다음"
        >
          <Text className="text-[28px] font-pretendardExtraBold">→</Text>
        </Pressable>
        <Text className="mt-1 text-gray300 font-pretendardMedium">다음</Text>
      </View>
    </SafeAreaView>
  );
}