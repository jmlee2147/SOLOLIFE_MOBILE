// src/app/(main)/place-recommend/[category].jsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Image, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import Header from "../../../components/shared/Header";

const CATEGORY_CONTENT = {
  활동: {
    image: require("../../../assets/images/activity.png"),
    title: "활동",
    subtitle: "다양한 활동을 해 보세요.\n좋은 장소를 발견할지도 몰라요.",
    options: ["체험", "전시", "독서", "산책"],
  },
  카페: {
    image: require("../../../assets/images/cafe.png"),
    title: "카페",
    subtitle: "카페인 수혈이 필요하다면 여기부터.",
    options: ["디저트", "조용한", "루프탑", "공부하기 좋은"],
  },
  쇼핑: {
    image: require("../../../assets/images/shopping.png"),
    title: "쇼핑",
    subtitle: "지갑은 가볍게, 만족은 묵직하게.",
    options: ["문구", "의류", "핸드메이드", "플리마켓"],
  },
  먹거리: {
    image: require("../../../assets/images/eat.png"),
    title: "먹거리",
    subtitle: "맛있는 행복을 골라보세요.",
    options: ["한식", "양식", "중식", "일식", "퓨전"],
  },
};

export default function CategoryScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  const data = CATEGORY_CONTENT[category] ?? {
    image: require("../../../assets/images/activity.png"),
    title: String(category || "카테고리"),
    subtitle: "원하는 테마를 선택하세요.",
    options: ["옵션1", "옵션2", "옵션3", "옵션4"],
  };

  const onSelect = (opt) => {
    router.push({
      pathname: "/place-recommend/keywords",
      params: { category, option: opt },
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

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View className="items-center mt-6 mb-3">
          <Image source={data.image} className="w-[220px] h-[220px]" resizeMode="contain" />
        </View>

        {/* Title & Subtitle (가운데 정렬) */}
        <Text className="mt-3 text-center text-title-1 font-pretendardExtraBold">{data.title}</Text>
        <Text className="mt-2 leading-6 text-center whitespace-pre-line text-heading-3">
          {data.subtitle}
        </Text>

        {/* Options Grid (2열, 카드 166x74, bg-gray-50) */}
        <View className="flex-row flex-wrap justify-between mt-20">
          {data.options.map((opt) => (
            <Pressable
              key={opt}
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
              accessibilityLabel={opt}
            >
              <Text className="text-heading-2">{opt}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}