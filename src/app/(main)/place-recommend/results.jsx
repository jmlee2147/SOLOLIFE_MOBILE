import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  postLocationRecommendations,
  toggleLocationLike,
} from "../../../services/api"; // ✅ 추가
import { vs } from "../../../utils/scale";

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
  if (!cat) return catKey;
  if (subKey && cat.subcategories?.[subKey]?.label)
    return cat.subcategories[subKey].label;
  return cat.label;
}

// 최대 3장 썸네일 뽑아 {uri} 형태로 정규화
function getThumbsFromPlace(place) {
  const arr = Array.isArray(place?.photos) ? place.photos : [];
  return arr
    .slice(0, 3)
    .map((u) => (u ? { uri: u } : null))
    .filter(Boolean);
}

// 저장소(장소) 구조: [{id, title, count, thumbs}]
async function upsertFavoritePlace(place) {
  const key = "favorites";
  const raw = await AsyncStorage.getItem(key);
  const list = raw ? JSON.parse(raw) : [];

  const id = String(place.location_id);
  const title = place.location_name || "모든장소";
  const thumbs = getThumbsFromPlace(place);

  const idx = list.findIndex((x) => String(x.id) === id);
  if (idx >= 0) {
    // 업데이트: 썸네일 갱신(비어있으면 유지), count는 임의 규칙(필요시 서버쪽 count로 교체)
    const prev = list[idx];
    list[idx] = {
      ...prev,
      title,
      thumbs: thumbs.length ? thumbs : prev.thumbs,
      count: typeof prev.count === "number" ? prev.count : 1,
    };
  } else {
    list.push({
      id,
      title,
      count: 1, // 기본 1개로 시작
      thumbs: thumbs.length ? thumbs : [], // 없으면 빈 배열
    });
  }

  await AsyncStorage.setItem(key, JSON.stringify(list));
}

async function removeFavoritePlace(place) {
  const key = "favorites";
  const raw = await AsyncStorage.getItem(key);
  const list = raw ? JSON.parse(raw) : [];
  const id = String(place.location_id);
  const next = list.filter((x) => String(x.id) !== id);
  await AsyncStorage.setItem(key, JSON.stringify(next));
}

export default function ResultsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { category, subcategory, keywordsKo, moodsKo, center, lat, lng } =
    useLocalSearchParams();

  const parseJsonArr = (v) => {
    try {
      const a = JSON.parse(String(v));
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  };
  const parseJsonObj = (v) => {
    try {
      const o = JSON.parse(String(v));
      return o && typeof o === "object" ? o : null;
    } catch {
      return null;
    }
  };

  const selectedKeywords = useMemo(
    () => parseJsonArr(keywordsKo),
    [keywordsKo]
  );
  const selectedMoods = useMemo(() => parseJsonArr(moodsKo), [moodsKo]);

  const categoryLabel = useMemo(
    () => keyToLabel(String(category || ""), String(subcategory || "")),
    [category, subcategory]
  );

  const centerFromJson = useMemo(() => parseJsonObj(center), [center]);
  const centerFromLatLng = useMemo(() => {
    const nlat = Number(lat),
      nlng = Number(lng);
    return Number.isFinite(nlat) && Number.isFinite(nlng)
      ? { lat: nlat, lng: nlng }
      : null;
  }, [lat, lng]);

  const centerForAPI = useMemo(
    () =>
      (centerFromJson?.lat && centerFromJson?.lng && centerFromJson) ||
      centerFromLatLng || { lat: 37.2421, lng: 127.0719 },
    [centerFromJson, centerFromLatLng]
  );

  const [items, setItems] = useState([]);
  const [usedMock, setUsedMock] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    setUsedMock(false);
    try {
      const res = await postLocationRecommendations({
        category: categoryLabel,
        keywords: selectedKeywords,
        moods: selectedMoods,
        center: centerForAPI,
        radius_km: 3,
      });
      const arr = Array.isArray(res?.items) ? res.items : [];
      setItems(arr.length ? arr : MOCK_ITEMS);
      setUsedMock(!arr.length);
    } catch (e) {
      console.warn("[recommendations] error:", e?.message);
      setItems(MOCK_ITEMS);
      setUsedMock(true);
    } finally {
      setLoading(false);
    }
  }, [categoryLabel, selectedKeywords, selectedMoods, centerForAPI]);

  useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);

  // 카드/스크롤
  const CARD_W = 317;
  const ITEM_GAP = 0;
  const SPACER = Math.max(0, (width - CARD_W) / 2);
  const contentPadding = useMemo(
    () => ({ paddingHorizontal: SPACER, paddingVertical: vs(8) }),
    [SPACER]
  );

  const listRef = useRef(null);
  const [liked, setLiked] = useState({});
  const scrollX = useRef(new Animated.Value(0)).current;
  const dotIndex = useMemo(
    () => Animated.divide(scrollX, CARD_W + ITEM_GAP),
    [scrollX, CARD_W, ITEM_GAP]
  ); // (미사용이지만 남김)
  const [currentIndex, setCurrentIndex] = useState(0);
  const rafRef = useRef(null);
  const snapSize = CARD_W + ITEM_GAP;

  // 좋아요 토글 (낙관적 업데이트)
  const handleToggleLike = useCallback(
    async (place) => {
      const id = place.location_id;
      const prev = !!liked[id];

      // 1) UI 먼저 토글
      setLiked((p) => ({ ...p, [id]: !prev }));

      try {
        // 2) 서버 토글
        const res = await toggleLocationLike(id); // { liked: boolean }
        const nowLiked = !!res?.liked;

        setLiked((p) => ({ ...p, [id]: nowLiked }));

        // 3) 로컬 저장소 동기화 (사진 포함)
        if (nowLiked) {
          await upsertFavoritePlace(place);
        } else {
          await removeFavoritePlace(place);
        }
      } catch (e) {
        console.warn("[like] toggle error:", e?.message);
        // 실패 → 롤백
        setLiked((p) => ({ ...p, [id]: prev }));
        // 실패했어도 최소한 로컬에는 반영하고 싶다면 아래 줄을 켜도 됨 (권장 X)
        // if (!prev) await upsertFavoritePlace(place); else await removeFavoritePlace(place);
      }
    },
    [liked]
  );

  // 스크롤 중 인덱스 추적(rAF 디바운스)
  const onScrollFast = useCallback(
    (e) => {
      const x = e?.nativeEvent?.contentOffset?.x ?? 0;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const idx = Math.round(x / (CARD_W + ITEM_GAP));
        setCurrentIndex((prev) =>
          prev === idx ? prev : Math.max(0, Math.min(items.length - 1, idx))
        );
      });
    },
    [items.length, CARD_W, ITEM_GAP]
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

      const isActive = index === currentIndex;
      const imageSource = item?.photos?.[0] ? { uri: item.photos[0] } : null;
      const title = item?.location_name ?? "";
      const rating = item?.rating_avg ?? null;
      const categories = item?.category ? [item.category] : [];
      const address = item?.address ?? "";
      const tags = [
        ...(Array.isArray(item?.keywords) ? item.keywords : []),
        ...(Array.isArray(item?.features_flat) ? item.features_flat : []),
      ];

      const cardContent = (
        <PlaceCard
          imageSource={imageSource}
          title={title}
          rating={rating}
          categories={categories}
          address={address}
          tags={tags}
          highlightedTags={[...selectedMoods, ...selectedKeywords]}
          liked={!!liked[item.location_id]}
          onToggleLike={() => handleToggleLike(item)} // API 연동 호출
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
                  moodsKo: JSON.stringify(selectedMoods),
                  keywordsKo: JSON.stringify(selectedKeywords),
                },
              });
            }
          }}
        />
      );

      return (
        <Animated.View
          style={{
            width: CARD_W,
            marginRight: ITEM_GAP,
            transform: [{ scale }],
            opacity,
          }}
        >
          {isActive ? (
            <View
              style={{
                borderRadius: 18,
                boxShadow: [
                  {
                    offsetX: 0,
                    offsetY: 49,
                    blurRadius: 35,
                    spreadDistance: -25,
                    color: "rgba(0,0,0,0.19)",
                  },
                ],
                backgroundColor: "transparent",
              }}
            >
              <View style={{ borderRadius: 16 }}>
                {cardContent}
              </View>
            </View>
          ) : (
            cardContent
          )}
        </Animated.View>
      );
    },
    [
      CARD_W,
      ITEM_GAP,
      liked,
      scrollX,
      currentIndex,
      scrollToIndex,
      selectedMoods,
      selectedKeywords,
      handleToggleLike,
    ]
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
      <View
        style={{
          paddingHorizontal: 25,
          paddingTop: 5,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Text className="text-title-1 font-pretendardExtraBold">
          포슬감자님 여긴 어때요?
        </Text>
        <View className="flex-row flex-wrap mt-[3px] mb-[31px]">
          {[...selectedMoods, ...selectedKeywords].slice(0, 3).map((k) => (
            <View
              key={k}
              className="px-[11px] py-[3px] mr-2 rounded-full border border-gray200"
            >
              <Text className="text-gray700 text-heading-3 font-pretendardSemiBold">
                {k}
              </Text>
            </View>
          ))}
        </View>
        {usedMock && (
          <Text style={{ color: "#9CA3AF", marginTop: -28, marginBottom: 16 }}>
            네트워크 문제로 임시 결과를 보여드려요.
          </Text>
        )}
      </View>

      {/* 본문 */}
      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: "#6B7280" }}>
            추천을 불러오는 중이에요…
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: "#6B7280", marginBottom: 12 }}>
            조건에 맞는 장소를 찾지 못했어요.
          </Text>
          <Button
            title="조건 바꾸기"
            size="small"
            variant="secondary"
            onPress={() => router.back()}
          />
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
            { useNativeDriver: true, listener: onScrollFast }
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onScrollFast}
          extraData={[liked, currentIndex]}
        />
      )}

      {/* 페이지네이션 점 */}
      {!loading && items.length > 0 && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 85,
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            {items.map((_, i) => {
              const active = i === currentIndex;
              return (
                <View
                  key={`dot-${i}`}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    marginHorizontal: 5,
                    backgroundColor: active ? "#62974F" : "#D9D9D9",
                    opacity: active ? 1 : 0.7,
                  }}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* 하단 버튼 */}
      <View
        className="flex-row items-center justify-between px-[25px]"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
        <Button
          title="다시 추천받기"
          size="small"
          variant="secondary"
          onPress={fetchRecs}
        />
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
                category: currentItem.category,
                region: currentItem.address || "",
                moodsKo: JSON.stringify(selectedMoods),
                keywordsKo: JSON.stringify(selectedKeywords),
                center: JSON.stringify(centerForAPI),
                photos: encodeURIComponent(
                  JSON.stringify(currentItem.photos || [])
                ),
              },
            });
          }}
        />
      </View>
    </SafeAreaView>
  );
}
