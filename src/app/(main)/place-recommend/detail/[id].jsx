import { Images } from "@assets/images";
import Button from "@components/shared/Button";
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

    const photosPrimary = normalizeToImageSources(initialItem.photos);
    const thumbsBackup = normalizeToImageSources(initialItem.__thumbs__);
    const mergedImages = (
      photosPrimary.length ? photosPrimary : thumbsBackup
    ).slice(0, 3);

    const { openNow, hoursText, hasHours } = getOpenBadge(
      initialItem.opening_hours
    );

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
      hoursText,
      openNow,
      hasHours,
      phone: "",
      price: initialItem.price_level ? `₩ Lv.${initialItem.price_level}` : "",
      coords: { lat: initialItem.latitude, lng: initialItem.longitude },
    };
  }, [initialItem, id]);

  // 캐러셀 이미지
  const images = place.images?.length
    ? place.images
    : [Images.backgrounds.sample];
  const IMG_W = SCREEN_W;
  // SafeAreaView 제거했으니 이제 위로 꽉 차게: 상태바 영역 포함(뒤로가기 버튼은 inset만큼 내려 배치)
  const IMG_H = 346; // 필요하면 원하는 높이로 조정

  // 페이지 인덱스 동적 반영
  const [imgIndex, setImgIndex] = useState(0);
  const pageIndexText = useMemo(
    () => `${imgIndex + 1} / ${images.length}`,
    [imgIndex, images.length]
  );

  // 탭
  const [tab, setTab] = useState("home");
  const [wReview, setWReview] = useState(0);
  const [wRoute, setWRoute] = useState(0);
  const [wPhoto, setWPhoto] = useState(0);
  const [wHome, setWHome] = useState(0);

  // ===== 리뷰 상태 =====
  const PAGE_SIZE = 20;
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function fetchReviews({ reset = false } = {}) {
    if (!place?.id) return;
    if (loading) return;

    const nextPage = reset ? 1 : page;
    const url =
      `${API_BASE}/reviews?locationId=${encodeURIComponent(place.id)}` +
      `&page=${nextPage}&limit=${PAGE_SIZE}&order=created_at.desc`;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const raw = await res.text();
      const json = JSON.parse(raw);
      const items = Array.isArray(json.items) ? json.items : [];
      setReviews((prev) => (reset ? items : [...prev, ...items]));
      setHasMore(items.length === PAGE_SIZE);
      setPage(nextPage + 1);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
      if (reset) setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!place?.id) return;
    setPage(1);
    setHasMore(true);
    setReviews([]);
    fetchReviews({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchReviews({ reset: true });
  };

  return (
    // SafeAreaView 제거 → 화면 맨 위까지 컨텐츠 확장
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 사진 위 오버레이 뒤로가기 버튼 */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 12,
          zIndex: 20,
          elevation: 20,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(0,0,0,0.45)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="previous" width={22} height={22} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 이미지 캐러셀 (화면 위끝까지) */}
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
              {
                useNativeDriver: false,
              }
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

          {/* 페이지 인덱스 뱃지 */}
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
        <View className="px-[15px] pt-6">
          <View className="flex-row items-center justify-between mb-[10px]">
            <Text
              className="mr-1 text-black text-title-3 font-pretendardSemiBold m"
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
              paddingHorizontal: 15,
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
            {place.tags.map((t, i) => (
              <Text
                key={`${String(t)}-${i}`}
                style={{
                  color: TAG_COLOR,
                  marginRight: 6,
                  marginBottom: 4,
                }}
                className="text-body-2 font-pretendardMedium"
              >
                #{String(t)}
              </Text>
            ))}
          </View>
        )}
        {/* 길찾기 / 공유 버튼 */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 15,
            marginTop: 20,
            gap: 5,
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: "#62974F",
              borderRadius: 99,
              width: 64,
              height: 30,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-white text-body-2 font-pretendardSemiBold">
              길찾기
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {}}
            style={{
              borderRadius: 99,
              borderWidth: 1,
              borderColor: "#D4D4D4",
              width: 64,
              height: 30,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-black text-body-2 font-pretendardMedium">
              공유
            </Text>
            <Icon
              name="share"
              width={17}
              height={17}
              style={{ marginLeft: 1.5 }}
            />
          </Pressable>
        </View>

        {/* 탭 */}
        <View style={{ paddingHorizontal: 25, paddingTop: 24 }}>
          <View style={{ position: "relative" }}>
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
              <TabBtn
                label="홈"
                active={tab === "home"}
                onPress={() => setTab("home")}
                onWidth={setWHome}
                w={wHome}
              />
              <TabBtn
                label="리뷰"
                active={tab === "review"}
                onPress={() => setTab("review")}
                onWidth={setWReview}
                w={wReview}
              />
              <TabBtn
                label="사진"
                active={tab === "photo"}
                onPress={() => setTab("photo")}
                onWidth={setWPhoto}
                w={wPhoto}
              />
              <TabBtn
                label="관련 여정"
                active={tab === "route"}
                onPress={() => setTab("route")}
                onWidth={setWRoute}
                w={wRoute}
              />
            </View>
          </View>

          {/* 탭 콘텐츠 */}
          {tab === "home" ? (
            <View style={{ marginTop: 12 }}>
              <InfoRow
                icon="location_outline"
                text={
                  place.address?.trim()?.length
                    ? place.address
                    : "아직 정보가 없어요."
                }
              />
              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Icon name="time" width={24} height={24} />
                </View>
                <View style={styles.textCol}>
                  <Text
                    className="text-black font-pretendardMedium text-body-1"
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
              <InfoRow
                icon="phone"
                text={
                  place.phone?.trim()?.length
                    ? place.phone
                    : "아직 정보가 없어요."
                }
              />
              <InfoRow
                icon="price"
                text={
                  place.price?.trim()?.length
                    ? place.price
                    : "아직 정보가 없어요."
                }
              />
            </View>
          ) : tab === "review" ? (
            <ReviewsBlock
              loading={loading}
              error={error}
              reviews={reviews}
              hasMore={hasMore}
              fetchMore={() => fetchReviews()}
            />
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
          title="장소 선택하기"
          size="large"
          variant="primary"
          onPress={() =>
            router.push({
              pathname: "/place-recommend/confirm",
              params: {
                placeId: String(place.id),
                placeName: String(place.name || "선택한 장소"),
                lat: String(place.coords?.lat ?? ""),
                lng: String(place.coords?.lng ?? ""),
                category: place.categories?.[0] ?? "",
                region: place.address || "",
                moodsKo: JSON.stringify(parseJsonArr(moodsKo)),
                keywordsKo: JSON.stringify(parseJsonArr(keywordsKo)),
                photos: encodeURIComponent(JSON.stringify(place.images || [])),
              },
            })
          }
        />
      </View>
    </View>
  );
}

function TabBtn({ label, active, onPress, onWidth, w }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{ paddingBottom: 8, marginRight: 34 }}
    >
      <Text
        onLayout={(e) => onWidth(e.nativeEvent.layout.width)}
        className={[
          "text-body-1 font-pretendardMedium",
          active ? "text-black" : "text-gray500",
        ].join(" ")}
      >
        {label}
      </Text>
      {active && (
        <View
          style={{
            position: "absolute",
            bottom: -1,
            height: 2,
            width: w,
            backgroundColor: "#000",
          }}
        />
      )}
    </Pressable>
  );
}

function InfoRow({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <View className="items-center justify-center" style={styles.iconBox}>
        <Icon name={icon} width={24} height={24} color="#6B6B6B" />
      </View>
      <View style={styles.textCol}>
        <Text
          className="text-black font-pretendardMedium text-body-1"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

function ReviewsBlock({ loading, error, reviews, hasMore, fetchMore }) {
  return (
    <View className="mt-[17px]">
      <View className="flex-start">
        <View
          style={{
            backgroundColor: "rgba(36, 77, 211, 0.12)",
            paddingVertical: 11,
            borderRadius: 99,
            alignItems: "center",
          }}
        >
          <Text className="text-body-1 font-pretendardMedium text-[#244DD3]">
            리뷰 작성하기 +100p
          </Text>
        </View>

        <Text className="text-heading-3 font-pretendardSemiBold mt-[25px]">
          최신순
        </Text>
      </View>

      <View className="mt-3">
        {loading && !reviews.length ? (
          <Text className="text-gray600">리뷰 불러오는 중…</Text>
        ) : error ? (
          <View>
            <Text className="text-red-600">리뷰 로드 실패: {error}</Text>
            <Text className="text-[#244DD3] mt-1">다시 시도</Text>
          </View>
        ) : !reviews.length ? (
          <Text className="text-gray600">아직 리뷰가 없어요.</Text>
        ) : (
          <>
            {reviews.map((r) => (
              <ReviewItem key={r.review_id} review={r} />
            ))}
            {hasMore && (
              <Pressable
                onPress={fetchMore}
                style={{ marginTop: 12, alignSelf: "center" }}
              >
                <Text className="text-body-1 font-pretendardMedium text-[#244DD3]">
                  더 보기
                </Text>
              </Pressable>
            )}
            {loading && reviews.length > 0 && (
              <Text className="mt-2 text-gray600">더 불러오는 중…</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

function ReviewItem({ review }) {
  const SIDE = 25;
  const GAP = 10;
  const COLS = 3;
  const itemW = Math.floor((SCREEN_W - SIDE * 2 - GAP * (COLS - 1)) / COLS);

  const username = review?.user?.username ?? review?.user?.name ?? "익명";
  const rating = Number.isFinite(Number(review?.rating))
    ? Number(review.rating)
    : 0;
  const contentText = Array.isArray(review?.content)
    ? review.content.filter((s) => String(s).trim().length).join(" · ")
    : String(review?.content || "").trim();
  const photos = Array.isArray(review?.photos) ? review.photos : [];

  return (
    <View style={{ paddingVertical: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
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
              {username}
            </Text>
            <View className="flex-row items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon
                  key={i}
                  name={i < rating ? "star" : "star_outline"}
                  color="#000"
                  width={16}
                  height={16}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      {!!contentText && (
        <Text
          style={{ marginTop: 7 }}
          className="text-gray700 text-body-2 font-pretendardMedium"
        >
          {contentText}
        </Text>
      )}

      {!!photos.length && (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 7 }}>
          {photos.slice(0, 3).map((uri, i) => (
            <Image
              key={`${review.review_id}-p-${i}`}
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

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
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
