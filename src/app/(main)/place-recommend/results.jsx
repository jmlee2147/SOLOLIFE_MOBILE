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
import { CATEGORY } from "../../../config/category.config";
import { postLocationRecommendations } from "../../../services/api";
import { hs, vs } from "../../../utils/scale";

// 🔹 실패/오프라인 시 보여줄 목업(백엔드 응답 형태와 최대한 비슷하게)
const MOCK_ITEMS = [
  {
    location_id: 1,
    location_name: "55데시벨",
    category: "카페",
    address: "경기도 수원시 영통구",
    latitude: 37.248492,
    longitude: 127.076754,
    rating_avg: 4.5,
    photos: [],
    keywords: ["조용한", "디저트"],
    features_flat: ["아늑함"],
  },
  {
    location_id: 2,
    location_name: "앤드카페",
    category: "카페",
    address: "경기도 수원시 영통구",
    latitude: 37.2512,
    longitude: 127.0719,
    rating_avg: 4.2,
    photos: [],
    keywords: ["감성적인"],
    features_flat: [],
  },
  {
    location_id: 3,
    location_name: "북서울꿈의숲",
    category: "공원",
    address: "서울 강북구",
    latitude: 37.6512,
    longitude: 127.0386,
    rating_avg: 4.7,
    photos: [],
    keywords: [],
    features_flat: [],
  },
];

function keyToLabel(catKey = "", subKey = "") {
  const cat = CATEGORY?.[catKey];
  if (!cat) return catKey; // 이미 라벨일 수도 있음

  // 서브카테고리가 있으면 우선 라벨 반환
  if (subKey && cat.subcategories?.[subKey]?.label) {
    return cat.subcategories[subKey].label; // ex: "restaurant" -> "음식점"
  }

  return cat.label; // ex: "cafe" -> "카페"
}
export default function ResultsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  // ✅ params: category(라벨) / subcategory(라벨) / keywordsKo / moodsKo / center(옵션)
  const { category, subcategory, keywordsKo, moodsKo, center, lat, lng } = useLocalSearchParams();

  // JSON 배열 파싱
  const parseJsonArr = (v) => {
    try {
      const a = JSON.parse(String(v));
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  };

  // JSON 객체 파싱
  const parseJsonObj = (v) => {
    try {
      const o = JSON.parse(String(v));
      return o && typeof o === "object" ? o : null;
    } catch {
      return null;
    }
  };

  const selectedKeywords = useMemo(() => parseJsonArr(keywordsKo), [keywordsKo]);
  const selectedMoods = useMemo(() => parseJsonArr(moodsKo), [moodsKo]);

  // 백엔드에 보낼 카테고리 라벨(서브 라벨 우선)
  const categoryLabel = useMemo(() => {
    return keyToLabel(String(category || ""), String(subcategory || ""));
  }, [category, subcategory]);

  // center 보장: 우선순위 - params.center(JSON) > params.lat/lng > 디폴트(영통 근처)
  const centerFromJson = useMemo(() => parseJsonObj(center), [center]);
  const centerFromLatLng = useMemo(() => {
    const nlat = Number(lat);
    const nlng = Number(lng);
    return Number.isFinite(nlat) && Number.isFinite(nlng) ? { lat: nlat, lng: nlng } : null;
  }, [lat, lng]);

  const centerForAPI = useMemo(() => {
    return (
      (centerFromJson?.lat && centerFromJson?.lng && centerFromJson) ||
      centerFromLatLng || 
      { lat: 37.2421, lng: 127.0719 } // 🔸최소한의 기본값(영통 근처)
    );
  }, [centerFromJson, centerFromLatLng]);

  // 상태
  const [items, setItems] = useState([]);
  const [usedMock, setUsedMock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ 추천 불러오기 (center / radius_km 포함)
  const fetchRecs = useCallback(async () => {
    setLoading(true);
    setError("");
    setUsedMock(false);

    try {
      const res = await postLocationRecommendations({
        category: categoryLabel,        // 한글 라벨
        keywords: selectedKeywords,
        moods: selectedMoods,
        center: centerForAPI,           // ✅ 필수
        radius_km: 3,                   // ✅ 요구사항
      });
      const arr = Array.isArray(res?.items) ? res.items : [];
      setItems(arr.length ? arr : MOCK_ITEMS);
      setUsedMock(!arr.length);
    } catch (e) {
      // 🔸 실패 시 목업으로 대체
      setError(e?.message || "추천을 불러오지 못했어요.");
      setItems(MOCK_ITEMS);
      setUsedMock(true);
    } finally {
      setLoading(false);
    }
  }, [categoryLabel, selectedKeywords, selectedMoods, centerForAPI]);

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

      // 서버 응답 -> PlaceCard 매핑
      const imageSource = item?.photos?.[0] ? { uri: item.photos[0] } : null;
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
            onPressTitle={() => {
              const payload = JSON.stringify(item);
              if (index !== currentIndex) {
                scrollToIndex(index);
              } else {
                router.push({
                  pathname: "/place-recommend/detail/[id]",
                  params: {
                    id: String(item.location_id),
                    initial: encodeURIComponent(payload),
                  },
                });
              }
            }}
          />
        </Animated.View>
      );
    },
    [CARD_W, ITEM_GAP, liked, scrollX, currentIndex, scrollToIndex]
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

      {/* 타이틀 + 선택 뱃지 */}
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

        {/* 에러 시 목업 사용 안내(선택) */}
        {usedMock && (
          <Text style={{ color: "#9CA3AF", marginTop: -28, marginBottom: 16 }}>
            네트워크 문제로 임시 결과를 보여드려요.
          </Text>
        )}
      </View>

      {/* 본문 */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: "#6B7280" }}>추천을 불러오는 중이에요…</Text>
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
          keyExtractor={(it, idx) => `${it.location_id}-${idx}`}
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
              pathname: "/place-recommend/confirm",
              params: {
                placeId: String(currentItem.location_id),
                placeName: String(currentItem.location_name || "선택한 장소"),
                lat: String(currentItem.latitude ?? ""),
                lng: String(currentItem.longitude ?? ""),
                category: currentItem.category,         // 한글 라벨
                region: currentItem.address || "",
                // 🔹 다음 화면에서 필요하면 전달
                moodsKo: JSON.stringify(selectedMoods),
                keywordsKo: JSON.stringify(selectedKeywords),
                // 🔹 사용자가 설정했던 중심 좌표도 같이 넘겨두면 이후 단계에서 재사용 가능
                center: JSON.stringify(centerForAPI),
              },
            });
          }}
        />
      </View>
    </SafeAreaView>
  );
}