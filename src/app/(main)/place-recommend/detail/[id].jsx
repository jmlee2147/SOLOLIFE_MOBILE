import Button from "@components/shared/Button";
import Header from "@components/shared/Header";
import Icon from "@components/shared/Icon";
import { getOpenBadge } from "@utils/openingHours";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");
const HIGHLIGHT_COLOR = "#EE7A13";
const TAG_COLOR = "#6B6B6B";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN;
// const TEST_USER_ID = process.env.EXPO_PUBLIC_TEST_USER_ID; // 필요시 사용

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
  const insets = useSafeAreaInsets();

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
  const highlightSet = useMemo(() => new Set(highlightedTags), [highlightedTags]);

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
      // 안전 기본값
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
        ...(Array.isArray(initialItem.features_flat) ? initialItem.features_flat : []),
      ],
      address: initialItem.address ?? "",
      hoursText, // "오전 9:30 - 오후 10:30" 또는 null
      openNow, // true/false/null
      hasHours, // boolean
      phone: "",
      price: initialItem.price_level ? `₩ Lv.${initialItem.price_level}` : "",
      coords: { lat: initialItem.latitude, lng: initialItem.longitude },
    };
  }, [initialItem, id]);

  // 캐러셀 이미지
  const images = place.images?.length ? place.images : [Images.backgrounds.sample];
  const IMG_W = SCREEN_W;
  const IMG_H = 346 - insets.top;

  // 페이지 인덱스 동적 반영
  const [imgIndex, setImgIndex] = useState(0);
  const pageIndexText = useMemo(() => `${imgIndex + 1} / ${images.length}`, [imgIndex, images.length]);

  // 탭
  const [tab, setTab] = useState("review");
  const [wReview, setWReview] = useState(0);
  const [wRoute, setWRoute] = useState(0);

  // ===== 리뷰 상태 =====
  const PAGE_SIZE = 20;
  const [reviews, setReviews] = useState([]); // 서버 스키마 그대로 items 원소를 저장
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // 리뷰 조회 (+ 최소 콘솔 디버깅)
  async function fetchReviews({ reset = false } = {}) {
    if (!place?.id) {
      console.log("[reviews] skip: missing place.id");
      return;
    }
    if (loading) return;

    const nextPage = reset ? 1 : page;
    const url =
      `${API_BASE}/reviews?locationId=${encodeURIComponent(place.id)}` +
      `&page=${nextPage}&limit=${PAGE_SIZE}&order=created_at.desc`;

    console.log("[reviews] fetching:", { placeId: place.id, url, nextPage });

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          // Authorization: `Bearer ${TEST_TOKEN}`, // 공개 목록이면 불필요
        },
      });
      console.log("[reviews] status:", res.status);

      const raw = await res.text();
      let json;
      try {
        json = JSON.parse(raw);
      } catch (e) {
        console.log("[reviews] JSON parse error, raw:", raw?.slice(0, 500));
        throw e;
      }

      console.log("[reviews] json keys:", Object.keys(json || {}));
      const items = Array.isArray(json.items) ? json.items : [];
      console.log("[reviews] items.length:", items.length, "sample:", items[0]);

      setReviews((prev) => (reset ? items : [...prev, ...items]));
      setHasMore(items.length === PAGE_SIZE);
      setPage(nextPage + 1);
    } catch (e) {
      console.log("[reviews] error:", e?.message || e);
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
      if (reset) setRefreshing(false);
    }
  }

  // 최초 로드
  useEffect(() => {
    if (!place?.id) return;
    console.log("[reviews] initial load for placeId:", place.id);
    setPage(1);
    setHasMore(true);
    setReviews([]);
    fetchReviews({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.id]);

  const onRefresh = () => {
    console.log("[reviews] pull-to-refresh");
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchReviews({ reset: true });
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
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
              <Image source={item} resizeMode="cover" style={{ width: IMG_W, height: IMG_H }} />
            )}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: false,
            })}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const x = e?.nativeEvent?.contentOffset?.x ?? 0;
              const idx = Math.max(0, Math.min(images.length - 1, Math.round(x / IMG_W)));
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
            <Text className="text-white text-body-3 font-pretendardRegular">{pageIndexText}</Text>
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
          {/* 주소 */}
          <InfoRow icon="location_outline" text={place.address?.trim()?.length ? place.address : "아직 정보가 없어요."} />
          {/* 오늘 영업시간 · 상태 */}
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Icon name="time" width={24} height={24} />
            </View>
            <View style={styles.textCol}>
              <Text className="text-gray700 font-pretendardMedium text-body-1" numberOfLines={1} ellipsizeMode="tail">
                {place.hasHours && place.hoursText ? (
                  <>
                    {place.hoursText}
                    {typeof place.openNow === "boolean" && (
                      <Text style={{ color: place.openNow ? "#62974F" : "#DC2626", fontWeight: "500" }}>
                        {"  •  "}
                        {place.openNow ? "영업 중" : "영업 종료"}
                      </Text>
                    )}
                  </>
                ) : typeof place.openNow === "boolean" ? (
                  <Text style={{ color: place.openNow ? "#62974F" : "#DC2626", fontWeight: "500" }}>
                    {place.openNow ? "영업 중" : "영업 종료"}
                  </Text>
                ) : (
                  "아직 정보가 없어요."
                )}
              </Text>
            </View>
          </View>
          {/* 전화 */}
          <InfoRow icon="phone" text={place.phone?.trim()?.length ? place.phone : "아직 정보가 없어요."} />
          {/* 가격 */}
          <InfoRow icon="price" text={place.price?.trim()?.length ? place.price : "아직 정보가 없어요."} />
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
              <Pressable onPress={() => setTab("review")} hitSlop={8} style={{ paddingBottom: 8, marginRight: 34 }}>
                <Text
                  onLayout={(e) => setWReview(e.nativeEvent.layout.width)}
                  className={["text-heading-2 font-pretendardSemiBold", tab === "review" ? "text-black" : "text-gray500"].join(" ")}
                >
                  리뷰
                </Text>
                {tab === "review" && (
                  <View style={{ position: "absolute", bottom: -1, height: 3, width: wReview, backgroundColor: "#000" }} />
                )}
              </Pressable>

              {/* 관련 여정 탭 */}
              <Pressable onPress={() => setTab("route")} hitSlop={8} style={{ paddingBottom: 8 }}>
                <Text
                  onLayout={(e) => setWRoute(e.nativeEvent.layout.width)}
                  className={["text-heading-2 font-pretendardSemiBold", tab === "route" ? "text-black" : "text-gray500"].join(" ")}
                >
                  관련 여정
                </Text>
                {tab === "route" && (
                  <View style={{ position: "absolute", bottom: -1, height: 3, width: wRoute, backgroundColor: "#000" }} />
                )}
              </Pressable>
            </View>
          </View>

          {/* 탭 콘텐츠 */}
          {tab === "review" ? (
            <View className="mt-[17px]">
              <View className="flex-row items-center justify-between">
                <Text className="text-heading-3 font-pretendardSemiBold">최신순</Text>

                {/* 리뷰 작성: 작성 페이지로 이동(해당 화면에서 POST /reviews 호출) */}
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
                  <Text className="text-body-1 font-pretendardMedium text-[#244DD3]">리뷰 작성하기</Text>
                </Pressable>
              </View>

              {/* 리뷰 목록 */}
              <View className="mt-3">
                {loading && !reviews.length ? (
                  <Text className="text-gray600">리뷰 불러오는 중…</Text>
                ) : error ? (
                  <View>
                    <Text className="text-red-600">리뷰 로드 실패: {error}</Text>
                    <Pressable onPress={() => fetchReviews({ reset: true })}>
                      <Text className="text-[#244DD3] mt-1">다시 시도</Text>
                    </Pressable>
                  </View>
                ) : !reviews.length ? (
                  <Text className="text-gray600">아직 리뷰가 없어요.</Text>
                ) : (
                  <>
                    {reviews.map((r) => (
                      <ReviewItem key={r.review_id} review={r} />
                    ))}
                    {hasMore && (
                      <Pressable onPress={() => fetchReviews()} style={{ marginTop: 12, alignSelf: "center" }}>
                        <Text className="text-body-1 font-pretendardMedium text-[#244DD3]">더 보기</Text>
                      </Pressable>
                    )}
                    {loading && reviews.length > 0 && (
                      <Text className="mt-2 text-gray600">더 불러오는 중…</Text>
                    )}
                  </>
                )}
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

function InfoRow({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <View className="items-center justify-center" style={styles.iconBox}>
        <Icon name={icon} width={24} height={24} />
      </View>
      <View style={styles.textCol}>
        <Text className="text-gray700 font-pretendardMedium text-body-1" numberOfLines={1} ellipsizeMode="tail">
          {text}
        </Text>
      </View>
    </View>
  );
}

function ReviewItem({ review }) {
  const SIDE = 25;
  const GAP = 10;
  const COLS = 3;
  const itemW = Math.floor((SCREEN_W - SIDE * 2 - GAP * (COLS - 1)) / COLS);

  // 서버 스키마 준수: 배열이면 조합해서 한 줄로 표시
  const username = review?.user?.username ?? review?.user?.name ?? "익명";
  const rating = Number.isFinite(Number(review?.rating)) ? Number(review.rating) : 0;
  const contentText = Array.isArray(review?.content)
    ? review.content.filter((s) => String(s).trim().length).join(" · ")
    : String(review?.content || "").trim();

  // 현재 스키마엔 리뷰 사진 필드 없음 → 필요 시 확장
  const photos = Array.isArray(review?.photos) ? review.photos : [];

  return (
    <View style={{ paddingVertical: 16 }}>
      {/* 헤더 */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#DADADA" }} />
          <View style={{ marginLeft: 8 }}>
            <Text className="text-gray700 text-body-2 font-pretendardMedium">{username}</Text>
            {/* 별점 아이콘 */}
            <View className="flex-row items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name={i < rating ? "star" : "star_outline"} color="#000" width={16} height={16} />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* 본문 */}
      {!!contentText && (
        <Text style={{ marginTop: 7 }} className="text-gray700 text-body-2 font-pretendardMedium">
          {contentText}
        </Text>
      )}

      {/* 사진 그리드(옵션 확장용) */}
      {!!photos.length && (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 7 }}>
          {photos.slice(0, 3).map((uri, i) => (
            <Image
              key={`${review.review_id}-p-${i}`}
              source={{ uri }}
              style={{ width: itemW, height: itemW, backgroundColor: "#EDEDED" }}
              resizeMode="cover"
            />
          ))}
        </View>
      )}

      {/* 하단 구분선 */}
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
  },
  textCol: {
    flex: 1,
    paddingRight: 25,
  },
});