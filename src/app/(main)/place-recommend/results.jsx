import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated, // Animated.FlatList 사용
  SafeAreaView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PlaceCard from "../../../components/place/PlaceCard"; // ← 경로 확인
import Button from "../../../components/shared/Button";
import Header from "../../../components/shared/Header";
import { hs, vs } from "../../../utils/scale";

// 데모 데이터
const MOCK_PLACES = [
  {
    id: "1",
    image: require("../../../assets/images/sample.png"),
    title: "55데시벨",
    rating: 4.5,
    categories: ["카페", "디저트"],
    address: "경기도 수원시 영통구",
    tags: ["어두운", "감성적인", "조용한"],
  },
  {
    id: "2",
    image: require("../../../assets/images/shopping.png"),
    title: "카페 게이트",
    rating: 4.3,
    categories: ["카페"],
    address: "경기도 수원시 영통구",
    tags: ["아늑한", "감성적인"],
  },
  {
    id: "3",
    image: require("../../../assets/images/shopping.png"),
    title: "카페 칸나",
    rating: 4.3,
    categories: ["카페"],
    address: "경기도 수원시 영통구",
    tags: ["아늑한", "감성적인"],
  },
];

export default function ResultsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { keywords } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // 키워드 파싱
  const selectedKeywords = useMemo(() => {
    if (!keywords) return [];
    if (Array.isArray(keywords)) return keywords.filter(Boolean);
    const str = String(keywords).trim();
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    const decoded = decodeURIComponent(str);
    return decoded
      .replace(/^\s*\[|\]\s*$/g, "")
      .replace(/['"]/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [keywords]);

  // 갤러리 구성
  const CARD_W = hs(316);                       // PlaceCard 폭과 동일
  const ITEM_GAP = hs(1);                      // ← 더 크게: 다음 카드 더 보이게
  const SPACER = Math.max(0, (width - CARD_W) / 2);
  const contentPadding = {
    paddingHorizontal: SPACER,
    paddingVertical: vs(8),
  };

  const [liked, setLiked] = useState({});
  const scrollX = useRef(new Animated.Value(0)).current;

  const renderItem = useCallback(
    ({ item, index }) => {
      const inputRange = [
        (index - 1) * (CARD_W + ITEM_GAP),
        index * (CARD_W + ITEM_GAP),
        (index + 1) * (CARD_W + ITEM_GAP),
      ];

      // 중앙 1.0, 양옆 0.86로 축소
      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.86, 1.0, 0.86],
        extrapolate: "clamp",
      });

      // 중앙 1.0, 양옆 0.7로 투명도
      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.7, 1.0, 0.7],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={{
            width: CARD_W,
            marginRight: ITEM_GAP,
            transform: [{ scale }],
            opacity,
          }}
        >
          <PlaceCard
            imageSource={item.image}
            title={item.title}
            rating={item.rating}
            categories={item.categories}
            address={item.address}
            tags={item.tags}
            liked={!!liked[item.id]}
            onToggleLike={() =>
              setLiked((p) => ({ ...p, [item.id]: !p[item.id] }))
            }
          />
        </Animated.View>
      );
    },
    [CARD_W, ITEM_GAP, liked, scrollX]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="장소 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      {/* 상단 선택 키워드 뱃지 */}
      <View className="px-[25px] mt-2 mb-2">
        <Text className="text-title-1 font-pretendardExtraBold">
          포슬감자님 여긴 어때요?
        </Text>
        <View className="flex-row flex-wrap mt-2">
          {selectedKeywords.slice(0, 3).map((k) => (
            <View
              key={k}
              className="px-[11px] py-[3px] mr-2 rounded-full bg-green200"
              style={{ marginBottom: vs(11) }}
            >
              <Text className="text-white text-heading-3 font-pretendardSemiBold">
                {k}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 가로 스와이프 갤러리 (중앙정렬 + 스케일/투명도) */}
      <Animated.FlatList
        horizontal
        data={MOCK_PLACES}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + ITEM_GAP}      // 한 장씩 스냅
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={contentPadding}  // 좌/우 패딩 비대칭 → 오른쪽 더 보임
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        extraData={liked}
      />

      {/* 하단 버튼 */}
      <View className="flex-row items-center justify-between px-[25px]"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
            }}>
        <Button title="다시 추천받기" size="small" variant="secondary"
        />
        <Button title="여기 갈래요" size="medium" variant="primary" 
                onPress={() => router.push({
                  pathname: "/route-builder",
                  params: { placeName: "55데시벨"},
                })}/>
      </View>
    </SafeAreaView>
  );
}