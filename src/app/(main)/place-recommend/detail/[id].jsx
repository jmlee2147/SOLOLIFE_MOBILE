import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated, Dimensions, Image, Platform, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, View
} from "react-native";
import Button from "../../../../components/shared/Button";
import Header from "../../../../components/shared/Header";
import Icon from "../../../../components/shared/Icon";

const { width: SCREEN_W } = Dimensions.get("window");
const HIGHLIGHT_COLOR = "#62974F";
const TAG_COLOR = "#6B6B6B";


// fallback 목업 데이터
const MOCK = {
  "1": {
    id: "1",
    name: "55 데시벨",
    rating: 4.5,
    categories: ["카페", "디저트"],
    images: [
      require("../../../../assets/images/sample.png"),
      require("../../../../assets/images/cafe.png"),
      require("../../../../assets/images/shopping.png"),
      require("../../../../assets/images/eat.png"),
    ],
    tags: ["어두운", "조용한"],
    address: "경기도 수원시 영통구",
    hours: "10:00 - 21:00",
    phone: "031-1234-5678",
    price: "100만원",
    reviews: [
      { id: "r1", user: "집가고 싶은 나", rating: 4, content: "..." },
      { id: "r2", user: "감자튀김", rating: 5, content: "조용해서 작업하기 좋았어요." },
    ],
    coords: { lat: 37.251, lng: 127.071 },
  },
};
// -------------------------------------

export default function PlaceDetailScreen() {
  const router = useRouter();
  const { id, initial, moodsKo, keywordsKo } = useLocalSearchParams();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [liked, setLiked] = useState(false);
  const [tab, setTab] = useState("review");

  const parseJsonArr = (v) => {
    try {
      const a = JSON.parse(String(v));
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  };

  const highlightedTags = useMemo(
    () => [...parseJsonArr(moodsKo), ...parseJsonArr(keywordsKo)].map(String),
    [moodsKo, keywordsKo]
  );

  const highlightSet = useMemo(() => new Set(highlightedTags), [highlightedTags]);

  // 초기 데이터(옵션): results에서 넘겨준 백엔드 아이템
  const initialItem = useMemo(() => {
    try {
      if (!initial) return null;
      return JSON.parse(decodeURIComponent(String(initial)));
    } catch {
      return null;
    }
  }, [initial]);

  // 백엔드 아이템 -> 화면용 필드 맵핑
  const placeFromApi = useMemo(() => {
    if (!initialItem) return null;
    return {
      id: String(initialItem.location_id),
      name: initialItem.location_name,
      rating: initialItem.rating_avg ?? null,
      categories: initialItem.category ? [initialItem.category] : [],
      images: (initialItem.photos || []).map((u) => ({ uri: u })),
      tags: [
        ...(Array.isArray(initialItem.keywords) ? initialItem.keywords : []),
        ...(Array.isArray(initialItem.features_flat) ? initialItem.features_flat : []),
      ],
      address: initialItem.address ?? "",
      hours: "", // 상세 스펙 나오면 매핑
      phone: "", // 상세 스펙 나오면 매핑
      price: initialItem.price_level ? `₩ Lv.${initialItem.price_level}` : "",
      reviews: [], // 상세 API 나오면 교체
      coords: { lat: initialItem.latitude, lng: initialItem.longitude },
    };
  }, [initialItem]);

  // 최종 place: 초기데이터 -> MOCK 순
  const place = useMemo(() => {
    if (placeFromApi) return placeFromApi;
    return MOCK[String(id)] ?? MOCK["1"];
  }, [placeFromApi, id]);

  const images = place.images?.length ? place.images : [require("../../../../assets/images/sample.png")];

  const IMG_W = SCREEN_W;
  const IMG_H = Math.round((SCREEN_W * 9) / 16) + 80;

  // 현재 페이지 인덱스 텍스트 (Animated.Value 기반)
  const pageIndexText = useMemo(() => {
    const listenerId = scrollX.addListener(() => {});
    scrollX.removeListener(listenerId);
    return `1 / ${images.length}`;
  }, [images.length, scrollX]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="장소 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* 이미지 캐러셀 */}
        <View style={{ width: IMG_W, height: IMG_H }}>
          <Animated.FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={images}
            keyExtractor={(_, i) => `img-${i}`}
            renderItem={({ item }) => (
              <Image source={item} resizeMode="cover" style={{ width: IMG_W, height: IMG_H }} />
            )}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          />
          <View
            style={{
              position: "absolute",
              right: 21,
              bottom: 20,
              paddingHorizontal: 16,
              paddingVertical: 4,
              borderRadius: 16,
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          >
            <Text className="text-white text-body-3 font-pretendardRegular">
              {pageIndexText}
            </Text>
          </View>
        </View>

        {/* 타이틀/평점/찜 */}
        <View className="px-[25px] pt-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-black text-title-1 font-pretendardExtraBold">{place.name}</Text>
            <Pressable onPress={() => setLiked((v) => !v)} hitSlop={8}>
              <Icon name={liked ? "heart" : "heart_outline"} width={25} height={25} />
            </Pressable>
          </View>

          <View className="flex-row items-center">
            {!!place.categories?.length && (
              <Text className="text-gray700 text-body-1 font-pretendardMedium">
                {place.categories.join(", ")}
              </Text>
            )}
            {!!place.rating && (
              <View className="flex-row items-center ml-2">
                <Icon name="star" width={14} height={14} />
                <Text className="ml-[2px] text-[14px] font-pretendardSemiBold text-[#EE7A13]">
                  {place.rating}
                </Text>
              </View>
            )}
          </View>
        </View>
        

          {/* 해시태그 */}
          {!!place.tags?.length && (
            <View
              style={{
                marginTop: 7,
                paddingHorizontal: 25,
                flexDirection: "row",
                flexWrap: "wrap",
              }}
            >
              {place.tags.map((t, i) => {
                const label = String(t);
                const isHL = highlightSet.has(label);
                return (
                  <Text
                    key={`${label}-${i}`}
                    style={{
                      color: isHL ? HIGHLIGHT_COLOR : TAG_COLOR,
                      marginRight: 6,
                      marginBottom: 4,
                    }}
                    className="text-body-2 font-pretendardMedium"
                  >
                    #{label}
                  </Text>
                );
              })}
            </View>
          )}

        {/* 정보 목록 */}
        <View style={{ marginTop: 12 }}>
          {!!place.address && (
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Icon name="location_outline" width={24} height={24} />
              </View>
              <Text className="text-gray700 font-pretendardMedium text-body-1"
                    numberOfLines={1}
                    ellipsizeMode="tail"
              >
                {place.address}
              </Text>
            </View>
          )}
          {!!place.hours && (
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Icon name="time" width={24} height={24} />
              </View>
              <Text className="text-gray700 font-pretendardMedium text-body-1">{place.hours}</Text>
            </View>
          )}
          {!!place.phone && (
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Icon name="phone" width={24} height={24} />
              </View>
              <Text className="text-gray700 font-pretendardMedium text-body-1">{place.phone}</Text>
            </View>
          )}
          {!!place.price && (
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Icon name="price" width={24} height={24} />
              </View>
              <Text className="text-gray700 font-pretendardMedium text-body-1">{place.price}</Text>
            </View>
          )}
        </View>

        {/* 탭 */}
        <View className="px-4 mt-5">
          <View className="flex-row">
            <Pressable onPress={() => setTab("review")}>
              <Text className={["mr-5 pb-1 text-[16px] font-pretendardSemiBold", tab === "review" ? "text-black" : "text-gray400"].join(" ")}>
                리뷰
              </Text>
            </Pressable>
            <Pressable onPress={() => setTab("route")}>
              <Text className={["pb-1 text-[16px] font-pretendardSemiBold", tab === "route" ? "text-black" : "text-gray400"].join(" ")}>
                관련 여정
              </Text>
            </Pressable>
          </View>
          <View className="h-[1px] bg-gray200 mt-2" />

          {tab === "review" ? (
            <View className="mt-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray700">최신순</Text>
                <Pressable onPress={() => {}}>
                  <Text className="text-[#3B5B2E]">리뷰작성하기</Text>
                </Pressable>
              </View>
              <View className="mt-3">
                {(place.reviews || []).map((r) => (
                  <View key={r.id} className="py-4 border-b border-gray200">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="w-8 h-8 mr-2 rounded-full bg-gray200" />
                        <Text className="text-gray800">{r.user}</Text>
                      </View>
                      <Text>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</Text>
                    </View>
                    {!!r.content && <Text className="mt-2 text-gray700">{r.content}</Text>}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View className="py-8">
              <Text className="text-gray600">관련 여정이 아직 없어요.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 하단 CTA */}
      <View
        style={{
          position: "absolute",
          left: 0, right: 0, bottom: 0,
          paddingHorizontal: 20, paddingBottom: 10, paddingTop: 10,
          backgroundColor: "#fff",
          ...Platform.select({
            ios: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
            android: { elevation: 12 },
          }),
        }}
      >
        <Button
          title="여기 갈래요"
          size="large"
          variant="primary"
          onPress={() =>
            router.push({
              pathname: "/route-builder",
              params: {
                placeId: place.id,
                placeName: place.name,
                lat: place.coords?.lat ?? "",
                lng: place.coords?.lng ?? "",
              },
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 0,
  },
  iconBox: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});