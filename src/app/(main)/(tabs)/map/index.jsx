import { Images } from "@assets/images";
import BottomSheet, {
  BottomSheetFlashList,
  BottomSheetScrollView,
  BottomSheetView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView from "../../../../components/map/MapView";
import Icon from "../../../../components/shared/Icon";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN;

export default function MapScreen() {
  const router = useRouter();

  // 검색화면에서 넘겨주는 쿼리 q (returnTo=map)
  const { q: rawQ } = useLocalSearchParams();
  const qFromRoute = Array.isArray(rawQ) ? rawQ[0] : rawQ;

  // 상태
  const [searchResults, setSearchResults] = useState([]); // 디테일까지 보강된 검색 결과
  const [likedPlaces, setLikedPlaces] = useState([]); // 좋아요 장소(마커/초기 바텀시트용)
  const [likedIds, setLikedIds] = useState(new Set());
  const [lastQuery, setLastQuery] = useState(""); // 바텀시트 제목/분기용

  // 바텀시트
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["35%", "60%"], []);
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 100,
    overshootClamping: true,
    restDisplacementThreshold: 0.1,
    restSpeedThreshold: 0.1,
    stiffness: 500,
  });

  // 🔹 상세에서 사진 최대 3장 가져오기 (문자열 배열 반환)
  const fetchLocationDetailPhotos = useCallback(async (id) => {
    if (!id) return [];
    try {
      const r = await fetch(`${API_BASE_URL}/locations/${id}`, {
        headers: { Accept: "application/json" },
      });
      const d = await r.json();
      const photos =
        Array.isArray(d.photos) && d.photos.length
          ? d.photos.slice(0, 3)
          : d.fallback_photo_url
          ? [d.fallback_photo_url]
          : [];
      return photos.filter(Boolean);
    } catch {
      return [];
    }
  }, []);

  // 1) 좋아요 목록(초기) + 🔹 각 장소 사진 디테일 보강
  useEffect(() => {
    async function fetchLikes() {
      try {
        const res = await fetch(`${API_BASE_URL}/me/locations/likes`, {
          headers: { Authorization: `Bearer ${TEST_TOKEN}` },
        });
        const data = await res.json();
        const ids = (data.items || []).map((it) => it.location.location_id);
        setLikedIds(new Set(ids));

        // 기본 스키마(사진은 일단 비움 → 이후 보강)
        const baseList = (data.items || []).map((it) => ({
          id: String(it.location.location_id),
          name: it.location.location_name,
          address: it.location.address ?? "",
          lat: Number(it.location.latitude),
          lng: Number(it.location.longitude),
          category: it.location.category ?? "",
          rating: it.location.rating_avg ?? null,
          reviews: it.location.review_count ?? null,
          tags: it.location.tags || it.location.features_flat || [],
          photos: [], // 🔸 나중에 보강
          liked: true,
        }));
        setLikedPlaces(baseList);

        // 상세로 사진 보강 (병렬)
        const photoLists = await Promise.all(
          ids.map((id) => fetchLocationDetailPhotos(id))
        );
        const byId = new Map(
          ids.map((id, i) => [String(id), photoLists[i] || []])
        );
        setLikedPlaces((prev) =>
          prev.map((p) => ({
            ...p,
            photos: byId.get(p.id) ?? [],
          }))
        );
      } catch (err) {
        console.error("좋아요 목록 불러오기 실패", err);
      }
    }
    fetchLikes();
  }, [API_BASE_URL, TEST_TOKEN, fetchLocationDetailPhotos]);

  // 2) 검색 실행 (라이트 + 디테일 보강)
  const handleSearch = useCallback(
    async (query) => {
      if (!query?.trim()) return;
      try {
        // 2-1. 라이트 검색
        const res = await fetch(
          `${API_BASE_URL}/search/locations?q=${encodeURIComponent(
            query
          )}&limit=20`
        );
        const data = await res.json();
        const items = data?.items || [];

        // 2-2. 디테일로 좌표/메타 보강
        const detailed = await Promise.all(
          items.map(async (it) => {
            const id = it.location_id;
            try {
              const dRes = await fetch(`${API_BASE_URL}/locations/${id}`);
              const det = await dRes.json();

              const photos =
                Array.isArray(det.photos) && det.photos.length
                  ? det.photos.slice(0, 3)
                  : det.fallback_photo_url
                  ? [
                      det.fallback_photo_url,
                      det.fallback_photo_url,
                      det.fallback_photo_url,
                    ].slice(0, 3)
                  : [];

              return {
                id: String(id),
                name: det.location_name ?? it.title ?? "",
                address: det.address ?? it.address ?? "",
                lat: Number(det.latitude),
                lng: Number(det.longitude),
                category: det.category ?? "",
                rating: det.rating_avg ?? null,
                reviews: det.review_count ?? null,
                tags: Array.from(
                  new Set([
                    ...(det.keywords || []),
                    ...(det.features_flat || []),
                  ])
                ),
                photos,
                opening_hours: det.opening_hours || null,
                liked: likedIds.has(id),
                price_level: det.price_level ?? null,
              };
            } catch {
              // 디테일 실패 시 최소 스키마
              return {
                id: String(id),
                name: it.title ?? "",
                address: it.address ?? "",
                lat: null,
                lng: null,
                category: "",
                rating: null,
                reviews: null,
                tags: [],
                photos: [],
                opening_hours: null,
                liked: likedIds.has(id),
              };
            }
          })
        );

        setSearchResults(detailed);
        setLastQuery(query);
        bottomSheetRef.current?.snapToIndex(1);
      } catch (err) {
        console.error("검색 실패", err);
        setSearchResults([]);
        setLastQuery(query);
      }
    },
    [likedIds]
  );

  // 3) 검색화면에서 돌아오면 자동검색
  useFocusEffect(
    React.useCallback(() => {
      if (qFromRoute) handleSearch(qFromRoute);
    }, [qFromRoute, handleSearch])
  );

  // 4) 지도 마커 = 검색 중엔 검색 결과만, 아니면 좋아요만
  const markers = useMemo(() => {
    const isSearched = lastQuery.trim().length > 0;
    const isLiked = (id) =>
      likedIds.has(Number(id)) || likedIds.has(String(id));

    if (isSearched) {
      return searchResults
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map((p, i) => ({
          id: p.id ?? String(i),
          lat: p.lat,
          lng: p.lng,
          name: p.name ?? "",
          label: String(i + 1),
          liked: isLiked(p.id),
        }));
    }
    return likedPlaces
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        name: p.name ?? "",
        liked: true,
      }));
  }, [searchResults, likedPlaces, likedIds, lastQuery]);

  // 5) 바텀시트 뷰 데이터/타이틀
  const isSearched = lastQuery.length > 0;
  const sheetTitle = isSearched
    ? `‘${lastQuery}’ 검색 결과`
    : "좋아요 누른 장소";

  // 6) 좋아요(초기) 카드 — 🔹 사진 실제 반영 (없으면 회색 + placeholder)
  const renderLikedItem = useCallback(
    ({ item }) => {
      const firstPhoto = Array.isArray(item.photos) ? item.photos[0] : null;
      const hasPhoto = typeof firstPhoto === "string" && firstPhoto.length > 0;

      return (
        <View style={styles.smallCard}>
          {hasPhoto ? (
            <Image
              source={{ uri: firstPhoto }}
              style={styles.smallCardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.smallCardImage, styles.placeholderCenter]}>
              <Image
                source={Images.placeholder.map}
                style={{ width: 48, height: 48, resizeMode: "contain" }}
              />
            </View>
          )}
          <Text style={styles.smallCardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.smallCardAddr} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      );
    },
    []
  );

  // 7) 검색 결과 카드 — 장소명 누르면 상세로 이동
  const SearchResultCard = useCallback(({ item, onPress }) => {
    return (
      <View style={styles.resultCard}>
        {/* 타이틀행 */}
        <View style={styles.resultHeaderRow}>
          <Pressable
            onPress={() => onPress?.(item)}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text
              className="text-heading-2 font-pretendardSemiBold text-[#244DD3]"
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </Pressable>
          <View style={styles.resultHeaderIcons}>
            <Pressable hitSlop={10} style={{ marginRight: 10 }}>
              <Icon name="share2" width={25} height={25} />
            </Pressable>
            <Pressable hitSlop={10}>
              <Icon name="heart_outline" width={25} height={25} />
            </Pressable>
          </View>
        </View>

        {/* 카테고리 / 주소 */}
        {!!item.category && (
          <Text
            className="text-body-3 font-pretendardRegular text-gray700"
            numberOfLines={1}
          >
            {item.category}
          </Text>
        )}
        {!!item.address && (
          <Text
            className="text-body-3 font-pretendardRegular text-gray700"
            numberOfLines={1}
          >
            {item.address}
          </Text>
        )}

        {/* 평점 */}
        {(item.rating ?? null) !== null && (
          <View style={styles.resultRatingRow}>
            <Icon name="star" width={18} height={18} />
            <Text style={styles.resultRatingText}>
              {Number(item.rating).toFixed(1)}
            </Text>
            {item.reviews ? (
              <Text style={styles.resultReviewCount}>({item.reviews})</Text>
            ) : null}
          </View>
        )}

        {/* 해시태그 */}
        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 4).map((t, idx) => (
              <Text
                key={idx}
                className="text-caption font-pretendardRegular text-gray700"
                numberOfLines={1}
              >
                #{String(t)}
              </Text>
            ))}
          </View>
        )}

        {/* 사진 3장 스트립 */}
        <View style={styles.photoRow}>
          {(item.photos?.length ? item.photos : [1, 2, 3])
            .slice(0, 3)
            .map((ph, i) => {
              const src =
                typeof ph === "string"
                  ? { uri: ph }
                  : Images.backgrounds.sample;
              return <Image key={i} source={src} style={styles.photoThumb} />;
            })}
        </View>

        {/* 카드 하단 꽉 찬 구분선 */}
        <View style={styles.fullDivider} />
      </View>
    );
  }, []);

  const goToDetail = useCallback(
    (item) => {
      // detail 화면이 재사용하는 초기 payload 형태로 맞춰줌
      const initialPayload = {
        location_id: Number(item.id),
        location_name: item.name ?? "",
        rating_avg: item.rating ?? null,
        category: item.category ?? "",
        address: item.address ?? "",
        latitude: Number(item.lat),
        longitude: Number(item.lng),
        photos: item.photos || [],
        opening_hours: item.opening_hours || null,
        // 태그 계열은 둘 다 채워주면 페이지에서 하이라이트/표시하기 편함
        keywords: Array.isArray(item.tags) ? item.tags : [],
        features_flat: Array.isArray(item.tags) ? item.tags : [],
        __thumbs__: item.photos || [],
      };

      router.push({
        pathname: "/place-recommend/detail/[id]",
        params: {
          id: String(item.id),
          initial: encodeURIComponent(JSON.stringify(initialPayload)),
        },
      });
    },
    [router]
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Android status bar 투명 */}
      {Platform.OS === "android" && (
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
      )}

      {/* 지도 (배경 전면) */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
        {/* 지도탭에서는 숫자 라벨 숨김 */}
        <MapView markers={markers.map((m) => ({ ...m, label: "" }))} />
      </View>

      {/* 상단 검색 오버레이 */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topContainer}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/journey-create/search-place",
                params: { returnTo: "map" },
              })
            }
            style={styles.searchBox}
          >
            <Text style={styles.searchPlaceholder}>장소 검색하기</Text>
            <Icon name="search_outline" width={20} height={20} />
          </Pressable>

          <View style={styles.chipsRow}>
            {["카페", "활동", "쇼핑", "먹거리"].map((cat) => (
              <Pressable
                key={cat}
                onPress={() => handleSearch(cat)}
                style={styles.chip}
              >
                <Text className="text-body-2 font-pretendardMedium text-gray700">
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>

      {/* 바텀시트 */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        animationConfigs={animationConfigs}
        enableDynamicSizing={false}
        backgroundStyle={{
          backgroundColor: "#FFF",
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.11,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 0 },
        }}
        handleIndicatorStyle={{
          backgroundColor: "#D9D9D9",
          width: 78,
          height: 3,
          borderRadius: 50,
        }}
      >
        {isSearched ? (
          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 25, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-heading-2 font-pretendardSemiBold mb-[11px]">
              {sheetTitle}
            </Text>

            {searchResults.map((item, idx) => (
              <View key={item.id}>
                <SearchResultCard
                  key={item.id}
                  item={item}
                  onPress={goToDetail}
                />
              </View>
            ))}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView style={{ paddingHorizontal: 25, paddingTop: 20 }}>
            <Text className="text-heading-2 font-pretendardSemiBold mb-[11px]">
              {sheetTitle}
            </Text>
            <BottomSheetFlashList
              key="likes-horizontal"
              horizontal
              showsHorizontalScrollIndicator={false}
              data={likedPlaces}
              keyExtractor={(item) => item.id}
              renderItem={renderLikedItem}
              estimatedItemSize={120}
              contentContainerStyle={{ paddingRight: 25 }}
              style={{ height: 170 }}
            />
          </BottomSheetView>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject },
  topContainer: {
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 35,
    paddingLeft: 18,
    paddingRight: 25,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#AFAFAF",
    shadowColor: "#000",
    shadowOpacity: 0.11,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  searchPlaceholder: {
    flex: 1,
    color: "#AFAFAF",
    fontSize: 16,
    fontWeight: 500,
  },
  chipsRow: { flexDirection: "row", marginTop: 8 },
  chip: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#AFAFAF",
    width: 70,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.11,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },

  // 좋아요(초기) 작은 카드
  smallCard: { width: 100, marginRight: 20 },
  smallCardImage: { width: "100%", height: 100, borderRadius: 5 },
  placeholderCenter: {
    backgroundColor: "#D9D9D9",
    justifyContent: "center",
    alignItems: "center",
  },
  smallCardTitle: { marginTop: 6, fontWeight: "600" },
  smallCardAddr: { color: "#666", fontSize: 12 },

  // 검색 결과 카드
  resultCard: {
    paddingBottom: 18,
    marginBottom: 0,
  },
  resultHeaderRow: { flexDirection: "row", alignItems: "center" },
  resultHeaderIcons: { flexDirection: "row", marginLeft: "auto" },
  resultRatingRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  resultRatingText: {
    marginLeft: 6,
    color: "#EE7A13",
    fontSize: 18,
    fontWeight: "700",
  },
  resultReviewCount: { marginLeft: 4, color: "#666" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  photoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  photoThumb: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 2,
    borderRadius: 5,
    backgroundColor: "#EEE",
  },
  fullDivider: {
    height: 1,
    backgroundColor: "#D4D4D4",
    marginTop: 17,
    marginHorizontal: -25, // 좌우 꽉차게
    alignSelf: "stretch",
  },
});