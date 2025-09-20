import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../../../components/shared/Button";
import Header from "../../../../components/shared/Header";
import Icon from "../../../../components/shared/Icon";
import { getOpenBadge } from "../../../../utils/openingHours";

const { width: SCREEN_W } = Dimensions.get("window");
const HIGHLIGHT_COLOR = "#EE7A13";
const TAG_COLOR = "#6B6B6B";

const REVIEWS_MOCK = [
  {
    id: "rv-1",
    user: "집가고 싶은 나",
    rating: 4,
    content: "분위기 좋고 좌석 간격 넓어서 집중하기 편해요.",
    photos: [
      "https://picsum.photos/seed/rev1a/600/400",
      "https://picsum.photos/seed/rev1b/600/400",
      "https://picsum.photos/seed/rev1c/600/400",
    ],
  },
  {
    id: "rv-2",
    user: "감자튀김",
    rating: 5,
    content:
      "조용해서 작업하기 좋았어요. 디저트도 깔끔! 콘센트 자리도 많네요.",
    photos: ["https://picsum.photos/seed/rev2a/600/400"],
  },
  {
    id: "rv-3",
    user: "배고픈판다",
    rating: 3,
    content: "주말엔 조금 붐벼요. 평일 오전 추천!",
    photos: [],
  },
];

// 문자열/객체/require 섞여도 안전하게 이미지 소스로 변환
function normalizeToImageSources(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => {
      if (typeof v === "number") return v; // require()
      if (v && typeof v === "object" && v.uri) return { uri: String(v.uri) };
      if (typeof v === "string" && v.trim().length) return { uri: v };
      return null;
    })
    .filter(Boolean);
}

export default function PlaceDetailScreen() {
  const router = useRouter();
  const { id, initial, moodsKo, keywordsKo } = useLocalSearchParams();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [liked, setLiked] = useState(false);

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
  const highlightSet = useMemo(
    () => new Set(highlightedTags),
    [highlightedTags]
  );

  // 초기(옵션) 데이터 파싱
  const initialItem = useMemo(() => {
    try {
      if (!initial) return null;
      return JSON.parse(decodeURIComponent(String(initial)));
    } catch {
      return null;
    }
  }, [initial]);

  // initialItem 기반으로 상세 뷰 모델 생성
  const place = useMemo(() => {
    if (!initialItem) {
      // 안전 기본값 (MOCK 의존성 제거)
      return {
        id: String(id || ""),
        name: "",
        rating: null,
        categories: [],
        images: [],
        tags: [],
        address: "",
        hoursText: null,
        openNow: null,
        hasHours: false,
        phone: "",
        price: "",
        reviews: [],
        coords: { lat: "", lng: "" },
      };
    }

    // 사진: 원본 + __thumbs__ 백업 → 최대 3장
    const photosPrimary = normalizeToImageSources(initialItem.photos);
    const thumbsBackup = normalizeToImageSources(initialItem.__thumbs__);
    const mergedImages = (photosPrimary.length ? photosPrimary : thumbsBackup).slice(0, 3);

    // 영업시간/상태 파싱
    const { openNow, hoursText, hasHours } = getOpenBadge(initialItem.opening_hours);

    return {
      id: String(initialItem.location_id),
      name: initialItem.location_name,
      rating: initialItem.rating_avg ?? null,
      categories: initialItem.category ? [initialItem.category] : [],
      images: mergedImages,
      tags: [
        ...(Array.isArray(initialItem.keywords) ? initialItem.keywords : []),
        ...(Array.isArray(initialItem.features_flat)
          ? initialItem.features_flat
          : []),
      ],
      address: initialItem.address ?? "",
      hoursText,     // "오전 9:30 - 오후 10:30" 또는 null
      openNow,       // true/false/null
      hasHours,      // boolean
      phone: "",
      price: initialItem.price_level ? `₩ Lv.${initialItem.price_level}` : "",
      reviews: [],
      coords: { lat: initialItem.latitude, lng: initialItem.longitude },
    };
  }, [initialItem, id]);

  const insets = useSafeAreaInsets();

  // 캐러셀 이미지
  const images = place.images?.length
    ? place.images
    : [require("../../../../assets/images/sample.png")];

  const IMG_W = SCREEN_W;
  const IMG_H = 346 - insets.top;

  // 페이지 인덱스 동적 반영
  const [imgIndex, setImgIndex] = useState(0);
  const pageIndexText = useMemo(
    () => `${imgIndex + 1} / ${images.length}`,
    [imgIndex, images.length]
  );

  // —— 탭
  const [tab, setTab] = useState("review");
  const [wReview, setWReview] = useState(0);
  const [wRoute, setWRoute] = useState(0);

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
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 이미지 캐러셀 */}
        <View style={{ width: IMG_W, height: IMG_H }}>
          <Animated.FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={images}
            keyExtractor={(_, i) => `img-${i}`}
            renderItem={({ item }) => (
              <Image
                source={item}
                resizeMode="cover"
                style={{ width: IMG_W, height: IMG_H }}
              />
            )}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const x = e?.nativeEvent?.contentOffset?.x ?? 0;
              const idx = Math.max(
                0,
                Math.min(images.length - 1, Math.round(x / IMG_W))
              );
              setImgIndex(idx);
            }}
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
            <Text
              className="mr-1 text-black text-title-1 font-pretendardExtraBold"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ flexShrink: 1 }}
            >
              {place.name || "알 수 없는 장소"}
            </Text>
            <Pressable onPress={() => setLiked((v) => !v)} hitSlop={8}>
              <Icon
                name={liked ? "heart" : "heart_outline"}
                width={25}
                height={25}
              />
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
          {/* 주소 */}
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Icon name="location_outline" width={24} height={24} />
            </View>
            <View style={styles.textCol}>
              <Text
                className="text-gray700 font-pretendardMedium text-body-1"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {place.address?.trim()?.length
                  ? place.address
                  : "아직 정보가 없어요."}
              </Text>
            </View>
          </View>

          {/* 오늘 영업시간 · 상태 */}
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Icon name="time" width={24} height={24} />
            </View>
            <View style={styles.textCol}>
              <Text
                className="text-gray700 font-pretendardMedium text-body-1"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {place.hasHours && place.hoursText ? (
                  <>
                    {place.hoursText}
                    {typeof place.openNow === "boolean" && (
                      <Text
                        style={{
                          color: place.openNow ? "#62974F" : "#DC2626",
                          fontWeight: "500",
                        }}
                      >
                        {"  •  "}
                        {place.openNow ? "영업 중" : "영업 종료"}
                      </Text>
                    )}
                  </>
                ) : typeof place.openNow === "boolean" ? (
                  // 시간은 없고 상태만 있을 때 → 상태만 표시
                  <Text
                    style={{
                      color: place.openNow ? "#62974F" : "#DC2626",
                      fontWeight: "500",
                    }}
                  >
                    {place.openNow ? "영업 중" : "영업 종료"}
                  </Text>
                ) : (
                  "아직 정보가 없어요."
                )}
              </Text>
            </View>
          </View>

          {/* 전화 */}
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Icon name="phone" width={24} height={24} />
            </View>
            <View style={styles.textCol}>
              <Text
                className="text-gray700 font-pretendardMedium text-body-1"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {place.phone?.trim()?.length
                  ? place.phone
                  : "아직 정보가 없어요."}
              </Text>
            </View>
          </View>

          {/* 가격 */}
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Icon name="price" width={24} height={24} />
            </View>
            <View style={styles.textCol}>
              <Text
                className="text-gray700 font-pretendardMedium text-body-1"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {place.price?.trim()?.length
                  ? place.price
                  : "아직 정보가 없어요."}
              </Text>
            </View>
          </View>
        </View>

        {/* 탭 */}
        <View style={{ paddingHorizontal: 25, paddingTop: 24 }}>
          <View style={{ position: "relative" }}>
            {/* 회색 바닥선(전폭) */}
            <View
              style={{
                position: "absolute",
                marginHorizontal: -25,
                left: 0,
                right: 0,
                bottom: 0,
                height: 1,
                backgroundColor: "#D4D4D4",
              }}
            />

            <View style={{ flexDirection: "row" }}>
              {/* 리뷰 탭 */}
              <Pressable
                onPress={() => setTab("review")}
                hitSlop={8}
                style={{ paddingBottom: 8, marginRight: 34 }}
              >
                <Text
                  onLayout={(e) => setWReview(e.nativeEvent.layout.width)}
                  className={[
                    "text-heading-2 font-pretendardSemiBold",
                    tab === "review" ? "text-black" : "text-gray500",
                  ].join(" ")}
                >
                  리뷰
                </Text>
                {tab === "review" && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: -1,
                      height: 3,
                      width: wReview,
                      backgroundColor: "#000",
                    }}
                  />
                )}
              </Pressable>

              {/* 관련 여정 탭 */}
              <Pressable
                onPress={() => setTab("route")}
                hitSlop={8}
                style={{ paddingBottom: 8 }}
              >
                <Text
                  onLayout={(e) => setWRoute(e.nativeEvent.layout.width)}
                  className={[
                    "text-heading-2 font-pretendardSemiBold",
                    tab === "route" ? "text-black" : "text-gray500",
                  ].join(" ")}
                >
                  관련 여정
                </Text>
                {tab === "route" && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: -1,
                      height: 3,
                      width: wRoute,
                      backgroundColor: "#000",
                    }}
                  />
                )}
              </Pressable>
            </View>
          </View>

          {/* 탭 콘텐츠 */}
          {tab === "review" ? (
            <View className="mt-[17px]">
              <View className="flex-row items-center justify-between">
                <Text className="text-heading-3 font-pretendardSemiBold">
                  최신순
                </Text>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/place-review",
                      params: {
                        placeId: place.id,
                        placeName: place.name,
                        address: place.address ?? "",
                      },
                    })
                  }
                >
                  <Text className="text-body-1 font-pretendardMedium text-[#244DD3]">
                    리뷰 작성하기
                  </Text>
                </Pressable>
              </View>
              <View className="mt-3">
                {REVIEWS_MOCK.map((r) => (
                  <ReviewItem key={r.id} review={r} />
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
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 25,
          backgroundColor: "transparent",
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
    paddingHorizontal: 20,
    paddingVertical: 4.5,
    gap: 7,
  },
  iconBox: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  textCol: {
    flex: 1,
    paddingRight: 25,
  },
});

function ReviewItem({ review }) {
  const SIDE = 25;
  const GAP = 10;
  const COLS = 3;
  const itemW = Math.floor((SCREEN_W - SIDE * 2 - GAP * (COLS - 1)) / COLS);

  const photos = Array.isArray(review.photos) ? review.photos : [];

  return (
    <View style={{ paddingVertical: 16 }}>
      {/* 헤더 */}
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#DADADA",
            }}
          />
          <View style={{ marginLeft: 8 }}>
            <Text className="text-gray700 text-body-2 font-pretendardMedium">
              {review.user}
            </Text>
            {/* 별점 아이콘 */}
            <View className="flex-row items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon
                  key={i}
                  name={i < review.rating ? "star" : "star_outline"}
                  color="#000"
                  width={16}
                  height={16}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* 본문 */}
      {!!review.content && (
        <Text style={{ marginTop: 7 }} className="text-gray700 text-body-2 font-pretendardMedium">
          {review.content}
        </Text>
      )}

      {/* 사진 그리드 */}
      {!!photos.length && (
        <View style={{ flexDirection: "row", gap: GAP, marginTop: 7 }}>
          {photos.slice(0, 3).map((uri, i) => (
            <Image
              key={`${review.id}-p-${i}`}
              source={{ uri }}
              style={{
                width: itemW,
                height: itemW,
                backgroundColor: "#EDEDED",
              }}
              resizeMode="cover"
            />
          ))}
        </View>
      )}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          backgroundColor: "#D4D4D4",
          marginHorizontal: -25,
        }}
      />
    </View>
  );
}