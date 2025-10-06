import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, SafeAreaView, Text, View } from "react-native";
import Header from "../../../components/shared/Header";
import Icon from "../../../components/shared/Icon";
import { MOODS } from "../../../config/category.config";

export default function MoodSelectScreen() {
  const router = useRouter();
  const paramsFromPrev = useLocalSearchParams(); // confirm.jsx에서 온 first/region 등 유지용
  const [selected, setSelected] = useState([]);

  const toggle = (k) =>
    setSelected((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );

  const goNext = () => {
    router.push({
      pathname: "/route-builder/loading",
      params: {
        ...paramsFromPrev, // 기존 파라미터 그대로 전달
        moodsKo: JSON.stringify(selected), // 이번 화면에서 고른 무드 전달
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="루트 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      <View style={{ flex: 1, paddingHorizontal: 25, paddingTop: 5 }}>
        <Text className="text-title-1 mb-[6px] font-pretendardExtraBold">
          루트를 찾고 계시는군요!
        </Text>
        <Text className="mb-12 leading-6 text-heading-3 text-gray700 font-pretendardMedium">
          선호하는 키워드를 선택해주세요.
        </Text>

        <View className="flex-row flex-wrap mt-5">
          {MOODS.map((k) => {
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
