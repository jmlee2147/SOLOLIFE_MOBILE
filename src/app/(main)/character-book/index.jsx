import {
    CHARACTERS,
    THEME_LABELS,
    getCharacterImageKey,
} from "@assets/characters/CHARACTERS";
import { Images } from "@assets/images";
import Header from "@components/shared/Header";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from "react-native";

export default function CharacterDexScreen() {
  const router = useRouter();

  // 실제로 해금된 캐릭터 ID 목록 (서버 연동되면 교체)
  const [ownedIds] = useState([
    "base_f",
    "base_m",
    "spring_f",
    "spring_m",
    "reading_f",
    "halloween_m",
  ]);

  // 상단 탭 (필터)
  const tabs = useMemo(
    () => [
      { key: "all", label: "탐험가" },
      { key: "season", label: "계절" },
      { key: "hobby", label: "취미" },
      { key: "halloween", label: "할로윈" },
      { key: "christmas", label: "크리스마스" },
    ],
    []
  );
  const [activeTab, setActiveTab] = useState("all");

  // 테마별 그룹
  const grouped = useMemo(() => {
    const map = {};
    CHARACTERS.forEach((c) => {
      const theme = c.theme;
      if (!map[theme]) map[theme] = [];
      map[theme].push(c);
    });
    return map;
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === "all") return CHARACTERS;
    return CHARACTERS.filter((c) => c.theme === activeTab);
  }, [activeTab]);

  const unlockedCount = ownedIds.length;
  const totalCount = CHARACTERS.length;

  const progress = totalCount ? unlockedCount / totalCount : 0;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      {/* 헤더 */}
      <Header
        title="캐릭터 도감"
        leftIcon="previous"
        onLeftPress={() => router.back()}
      />

      {/* 도감 완성도 카드 */}
      <View
        style={{
          marginHorizontal: 25,
          marginTop: 28,
          marginBottom: 25,

          // 그림자
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.11,
          shadowRadius: 3,
          elevation: 3,
        }}
      >
        {/* 그라데이션 보더 */}
        <LinearGradient
          colors={["#64BC2E", "#2E7A45"]}
          start={[0, 0]}
          end={[1, 1]}
          style={{
            borderRadius: 10,
            padding: 2, // 테두리 두께
          }}
        >
          {/* 실제 카드 내용 */}
          <View
            style={{
              backgroundColor: "#FBFFF7",
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 11,
              paddingVertical: 8,
            }}
          >
            <Image
              source={Images.common.collection}
              style={{ width: 66, height: 66, marginRight: 14 }}
              resizeMode="contain"
            />

            <View style={{ flex: 1 }}>
              {/* 제목 + 카운트 */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Text className="text-heading-3 font-pretendardSemiBold text-green900">
                  도감 완성도
                </Text>

                <Text className="text-body-3 font-pretendardRegular text-green900">
                  {unlockedCount}/{totalCount}
                </Text>
              </View>

              {/* 진행도 바 */}
              <View
                style={{
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: "#F4F4F4",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${Math.max(
                      0,
                      Math.min(100, Math.round(progress * 100))
                    )}%`,
                    backgroundColor: "#62974F",
                    borderRadius: 999,
                  }}
                />
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* 탭 */}
      <View style={{ position: "relative" }}>
        <View
          style={{
            position: "absolute",
            left: 0,
            top: -15,
            bottom: 0,
            width: 28,
            backgroundColor: "#FFF",
            shadowColor: "#000",
            shadowOffset: { width: -1, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 1,
            elevation: 4,
            overflow: "hidden",
            zIndex: 1,
          }}
          pointerEvents="none"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 30,
            gap: 8,
            marginBottom: 16,
          }}
        >
          {tabs.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={{
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: activeTab === t.key ? "#62974F" : "#AFAFAF",
                backgroundColor: activeTab === t.key ? "#62974F" : "#FFFFFF",
                paddingHorizontal: 14,
                height: 34,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: activeTab === t.key ? "#FFF" : "#AFAFAF",
                  fontFamily: "Pretendard-Medium",
                  fontSize: 14,
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 👉 오른쪽 페이드 효과 (살짝 잘린 느낌) */}
        <View
          style={{
            position: "absolute",
            right: 0,
            top: -15,
            bottom: 0,
            width: 28,
            backgroundColor: "white",
            shadowColor: "#000",
            shadowOffset: { width: -1, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 1,
            elevation: 4,
            overflow: "hidden",
          }}
          pointerEvents="none"
        />
      </View>

      {/* 캐릭터 목록 */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 25,
          paddingBottom: 40,
          gap: 70,
        }}
      >
        {Object.keys(grouped).map((theme) => {
          const chars = grouped[theme];
          if (!chars.some((c) => filtered.includes(c))) return null;

          return (
            <View key={theme}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 15, // 기존 Text의 marginBottom 유지
                }}
              >
                <Image
                  source={Images.gacha.textDashGreen}
                  style={{ width: 120, height: 8, marginRight: 30 }}
                  resizeMode="contain"
                />
                <Text
                  className="text-heading-2 font-pretendardSemiBold text-green900"
                  style={{ textAlign: "center" }}
                >
                  {THEME_LABELS[theme]}
                </Text>
                <Image
                  source={Images.gacha.textDashGreen}
                  style={{
                    width: 120,
                    height: 8,
                    marginLeft: 30,
                    transform: [{ scaleX: -1 }],
                  }}
                  resizeMode="contain"
                />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  // 기존: justifyContent: "space-between",
                  // 3열 정확히 맞추려면 왼쪽 정렬하고 아이템에 내부 패딩/마진 주는 편이 깔끔
                  justifyContent: "flex-start",
                  marginHorizontal: -6, // 아이템 가로 패딩 보정
                }}
              >
                {chars.map((c) => {
                  const owned = ownedIds.includes(c.id);
                  const key = getCharacterImageKey(c.file, owned);
                  const img =
                    Images.characters[key] || Images.characters[c.file];
                  return (
                    <View
                      key={c.id}
                      style={{
                        width: "33.3333%",
                        paddingHorizontal: 9, // 좌우 간격
                        marginBottom: 4, // 행 간격
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={img}
                        style={{
                          width: 110,
                          height: 110,
                        }}
                        resizeMode="contain"
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
