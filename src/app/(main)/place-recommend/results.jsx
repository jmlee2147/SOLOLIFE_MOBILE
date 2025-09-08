import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import PlaceCard from "../../../components/place/PlaceCard";
import Button from "../../../components/shared/Button";
import Header from "../../../components/shared/Header";
import { postLocationRecommendations } from "../../../services/api";
import { hs, vs } from "../../../utils/scale";

export default function ResultsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { category, subcategory, keywordsKo, moodsKo } = useLocalSearchParams();

  const parseJsonArr = (v) => {
    try {
      const a = JSON.parse(String(v));
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  };

  const selectedKeywords = useMemo(() => parseJsonArr(keywordsKo), [keywordsKo]);
  const selectedMoods = useMemo(() => parseJsonArr(moodsKo), [moodsKo]);
  const categoryLabel = useMemo(
    () => (subcategory ? String(subcategory) : String(category || "")),
    [category, subcategory]
  );

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await postLocationRecommendations({
        category: categoryLabel,
        keywords: selectedKeywords,
        moods: selectedMoods,
      });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(e?.message || "추천을 불러오지 못했어요.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [categoryLabel, selectedKeywords, selectedMoods]);

  useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);

  // 갤러리 + 중앙 카드 추적
  const CARD_W = hs(316);
  const ITEM_GAP = hs(8);
  const SPACER = Math.max(0, (width - CARD_W) / 2);
  const contentPadding = useMemo(
    () => ({ paddingHorizontal: SPACER, paddingVertical: vs(8) }),
    [SPACER]
  );

  const listRef = useRef(null);
  const [liked, setLiked] = useState({});
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const snapSize = CARD_W + ITEM_GAP;

  const onSnapEnd = useCallback(
    (e) => {
      const x = e?.nativeEvent?.contentOffset?.x ?? 0;
      const idx = Math.round(x / snapSize);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      setCurrentIndex(clamped);
    },
    [items.length, snapSize]
  );

  const goDetailForIndex = useCallback(
    (index) => {
      const it = items[index];
      if (!it) return;
      router.push({
        pathname: "/place-recommend/detail/[id]",
        params: { id: String(it.location_id) },
      });
    },
    [items, router]
  );

  const scrollToIndex = useCallback(
    (index) => {
      if (!listRef.current) return;
      listRef.current.scrollToOffset({
        offset: index * snapSize,
        animated: true,
      });
    },
    [snapSize]
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const inputRange = [
        (index - 1) * (CARD_W + ITEM_GAP),
        index * (CARD_W + ITEM_GAP),
        (index + 1) * (CARD_W + ITEM_GAP),
      ];
      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.86, 1.0, 0.86],
        extrapolate: "clamp",
      });
      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.7, 1.0, 0.7],
        extrapolate: "clamp",
      });

      // 서버 응답 -> PlaceCard props 매핑
      const imageSource = item?.photos?.[0]
        ? { uri: item.photos[0] }
        : null;
      const title = item?.location_name ?? "";
      const rating = item?.rating_avg ?? null;
      const categories = item?.category ? [item.category] : [];
      const address = item?.address ?? "";
      const tags = [
        ...(Array.isArray(item?.keywords) ? item.keywords : []),
        ...(Array.isArray(item?.features_flat) ? item.features_flat : []),
      ];

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
            imageSource={imageSource}
            title={title}
            rating={rating}
            categories={categories}
            address={address}
            tags={tags}
            liked={!!liked[item.location_id]}
            onToggleLike={() =>
              setLiked((p) => ({ ...p, [item.location_id]: !p[item.location_id] }))
            }
            // 제목 눌렀을 
            // - 중앙 카드가 아니면 먼저 그 카드로 스냅
            // - 중앙 카드면 상세로 이동
            onPressTitle={() => {
              const payload = JSON.stringify(item); // item = 백엔드 응답 1개
              if (index !== currentIndex) {
                scrollToIndex(index);
              } else {
                router.push({
                  pathname: "/place-recommend/detail/[id]",
                  params: { 
                    id: String(item.location_id),
                    initial: encodeURIComponent(payload), // 초기 데이터 전달
                  },
                });
              }
            }}
          />
        </Animated.View>
      );
    },
    [CARD_W, ITEM_GAP, liked, scrollX, currentIndex, scrollToIndex, goDetailForIndex]
  );

  const currentItem = items[currentIndex];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="장소 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      {/* 타이틀 + 상단 선택 뱃지 */}
      <View style={{ paddingHorizontal: 25, paddingTop: 5, backgroundColor: "#FFFFFF" }}>
        <Text className="text-title-1 font-pretendardExtraBold">포슬감자님 여긴 어때요?</Text>

        <View className="flex-row flex-wrap mt-2">
          {[...selectedMoods, ...selectedKeywords].slice(0, 3).map((k) => (
            <View
              key={k}
              className="px-[11px] py-[3px] mr-2 mb-[45px] rounded-full border border-gray200"
            >
              <Text className="text-gray700 text-heading-3 font-pretendardSemiBold">{k}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 본문 */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: "#6B7280" }}>추천을 불러오는 중이에요…</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: "#EF4444", marginBottom: 12 }}>{error}</Text>
          <Button title="다시 시도" size="small" variant="secondary" onPress={fetchRecs} />
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: "#6B7280", marginBottom: 12 }}>
            조건에 맞는 장소를 찾지 못했어요.
          </Text>
          <Button title="조건 바꾸기" size="small" variant="secondary" onPress={() => router.back()} />
        </View>
      ) : (
        <Animated.FlatList
          ref={listRef}
          horizontal
          data={items}
          keyExtractor={(it) => String(it.location_id)}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + ITEM_GAP}
          decelerationRate="fast"
          snapToAlignment="start"
          contentContainerStyle={contentPadding}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onSnapEnd}
          onScrollEndDrag={onSnapEnd}
          extraData={[liked, currentIndex]}
        />
      )}

      {/* 하단 버튼 */}
      <View
        className="flex-row items-center justify-between px-[25px]"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
        <Button title="다시 추천받기" size="small" variant="secondary" onPress={fetchRecs} />
        <Button
          title="여기 갈래요"
          size="medium"
          variant="primary"
          onPress={() => {
            if (!currentItem) return;
            router.push({
              pathname: "/route-builder",
              params: {
                placeName: String(currentItem.location_name || "선택한 장소"),
                lat: String(currentItem.latitude ?? ""),
                lng: String(currentItem.longitude ?? ""),
              },
            });
          }}
        />
      </View>
    </SafeAreaView>
  );
}