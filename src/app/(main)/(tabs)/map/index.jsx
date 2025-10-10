import { Images } from "@assets/images";
import SortDropdown from "@components/journey/SortDropdown";
import MapView from "@components/map/MapView";
import Icon from "@components/shared/Icon";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
  Dimensions,
  Easing,
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN?.trim();

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const COLS = 3;
const GAP = 14;
const H_PADDING = 25;
const ITEM_W = (SCREEN_W - H_PADDING * 2 - GAP * (COLS - 1)) / COLS;

const PLACEHOLDER = Images.placeholder.map;

const CATEGORY_ICON = {
  카페: { type: "img", source: Images.places.mapCafe },
  활동: { type: "img", source: Images.places.mapActivity },
  쇼핑: { type: "img", source: Images.places.mapShopping },
  먹거리: { type: "img", source: Images.places.mapEat },
};

// 바텀시트 모드
const SHEET_MODE = { RECO: "reco", SEARCH: "search", STORAGE: "storage" };

// 현재 위치에서 많이 찾는 장소 (목업)
const popularMock = [
  {
    id: "m1",
    name: "마장동김씨 청주동남지구점",
    address: "청주시 상당구 ...",
    category: "카페, 디저트",
    rating: 4.5,
    reviews: 10,
    tags: ["루센트브라운", "샌디크림빵", "크로칸슈", "마카롱"],
    photos: [
      Images.backgrounds.sample,
      Images.backgrounds.sample,
      Images.backgrounds.sample,
    ],
    lat: 0,
    lng: 0,
  },
  {
    id: "m2",
    name: "브루잉랩",
    address: "영통구 망포동 ...",
    category: "카페",
    rating: 4.7,
    reviews: 86,
    tags: ["핸드드립", "원두굿", "조용함"],
    photos: [
      Images.backgrounds.sample,
      Images.backgrounds.sample,
      Images.backgrounds.sample,
    ],
    lat: 0,
    lng: 0,
  },
  {
    id: "m3",
    name: "한입버거",
    address: "수원시 영통구 ...",
    category: "버거, 패스트푸드",
    rating: 4.2,
    reviews: 51,
    tags: ["가성비", "빠른제공"],
    photos: [
      Images.backgrounds.sample,
      Images.backgrounds.sample,
      Images.backgrounds.sample,
    ],
    lat: 0,
    lng: 0,
  },
];

export default function MapScreen() {
  const router = useRouter();

  // 검색화면에서 넘겨주는 쿼리 q (returnTo=map)
  const { q: rawQ } = useLocalSearchParams();
  const qFromRoute = Array.isArray(rawQ) ? rawQ[0] : rawQ;

  // 모드
  const [sheetMode, setSheetMode] = useState(SHEET_MODE.RECO);

  // 상태: 검색 / 좋아요 / 저장소(장소·루트)
  const [searchResults, setSearchResults] = useState([]);
  const [lastQuery, setLastQuery] = useState("");

  const [likedPlaces, setLikedPlaces] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());

  // 저장소 탭 상태
  const [tab, setTab] = useState("place"); // 'place' | 'route'
  const [sortKey, setSortKey] = useState("latest");
  const latestOptions = useMemo(
    () => [
      { label: "최신순", value: "latest" },
      { label: "이름순", value: "name" },
    ],
    []
  );

  // 장소(저장소) 페이징/로딩
  const [favLoading, setFavLoading] = useState(false);
  const [favRefreshing, setFavRefreshing] = useState(false);
  const favPageRef = useRef(1);
  const favTotalRef = useRef(0);
  const favLimit = 60;

  // 루트(저장소) 목록
  const [routes, setRoutes] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeRefreshing, setRouteRefreshing] = useState(false);

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

  const fabBottom = useRef(new Animated.Value(SCREEN_H * 0.32)).current;
  // 바텀시트 전환 시 FAB 이동 애니메이션
  const animateFabPosition = (toValue) => {
    Animated.timing(fabBottom, {
      toValue,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  // onPress 내부 로직 수정
  const handleFabPress = () => {
    if (sheetMode === SHEET_MODE.STORAGE) {
      setSheetMode(SHEET_MODE.RECO);
      bottomSheetRef.current?.snapToIndex(0);
      animateFabPosition(SCREEN_H * 0.32);
    } else {
      setSheetMode(SHEET_MODE.STORAGE);
      bottomSheetRef.current?.snapToIndex(1);
      animateFabPosition(SCREEN_H * 0.54);
    }
  };

  const handleSheetChange = (index) => {
    if (index === 0) {
      setSheetMode(SHEET_MODE.RECO);
      animateFabPosition(SCREEN_H * 0.32); // 아래로
    } else if (index === 1) {
      setSheetMode(SHEET_MODE.STORAGE);
      animateFabPosition(SCREEN_H * 0.54); // 위로
    }
  };

  // ==== 공통 유틸 ====
  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return "";
    }
  };

  // 🔹 장소 상세에서 사진 최대 3장 가져오기 (문자열 배열 반환)
  const fetchLocationDetailPhotos = useCallback(async (id) => {
    if (!id || !API_BASE_URL) return [];
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

  // ==== 초기 좋아요 목록 + 사진 보강 ====
  useEffect(() => {
    async function fetchLikes() {
      try {
        const res = await fetch(`${API_BASE_URL}/me/locations/likes`, {
          headers: {
            Accept: "application/json",
            ...(TEST_TOKEN ? { Authorization: `Bearer ${TEST_TOKEN}` } : {}),
          },
        });
        const data = await res.json();
        const ids = (data.items || []).map((it) => it.location.location_id);
        setLikedIds(new Set(ids));

        // 기본 스키마(사진은 일단 비움 → 이후 보강)
        const baseList = (data.items || []).map((it, idx) => ({
          id: String(it.location.location_id ?? idx),
          name: it.location.location_name || "이름 없는 장소",
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
  }, [fetchLocationDetailPhotos]);

  // ==== 검색 실행 (라이트 + 디테일 보강) ====
  const handleSearch = useCallback(
    async (query) => {
      if (!query?.trim() || !API_BASE_URL) return;
      try {
        setSheetMode(SHEET_MODE.SEARCH);
        // 1) 라이트 검색
        const res = await fetch(
          `${API_BASE_URL}/search/locations?q=${encodeURIComponent(
            query
          )}&limit=20`
        );
        const data = await res.json();
        const items = data?.items || [];

        // 2) 디테일로 좌표/메타 보강
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
        bottomSheetRef.current?.snapToIndex(1); // 60%
      } catch (err) {
        console.error("검색 실패", err);
        setSearchResults([]);
        setLastQuery(query);
      }
    },
    [likedIds]
  );

  // 검색화면에서 돌아오면 자동검색
  useFocusEffect(
    React.useCallback(() => {
      if (qFromRoute) handleSearch(qFromRoute);
    }, [qFromRoute, handleSearch])
  );

  // 지도 마커: 검색 중엔 검색 결과만, 아니면 좋아요만
  const markers = useMemo(() => {
    const isSearched =
      sheetMode === SHEET_MODE.SEARCH && lastQuery.trim().length > 0;
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
  }, [sheetMode, searchResults, likedPlaces, likedIds, lastQuery]);

  // ==== 저장소: 장소(좋아요) 불러오기 (페이지 단위) ====
  function mapLikedItemsToGrid(items = []) {
    return items.map((entry, idx) => {
      const loc = entry?.location ?? {};
      const id = String(loc.location_id ?? idx);
      const title = loc.location_name || "이름 없는 장소";
      return {
        id,
        title,
        thumbs: null, // 처음엔 null → 로딩상태(회색)
        count: undefined,
        raw: loc,
      };
    });
  }

  async function fetchLocationDetailPhotosForGrid(id) {
    const photos = await fetchLocationDetailPhotos(id);
    return photos.map((uri) => ({ uri }));
  }

  async function fetchLikedPlaces(pageArg = 1, append = false) {
    if (!API_BASE_URL) return;
    const r = await fetch(
      `${API_BASE_URL}/me/locations/likes?page=${pageArg}&limit=${favLimit}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(TEST_TOKEN ? { Authorization: `Bearer ${TEST_TOKEN}` } : {}),
        },
      }
    );

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(
        data?.error ||
          (r.status === 401
            ? "로그인이 필요합니다."
            : `저장한 장소를 불러오지 못했어요. (HTTP ${r.status})`)
      );
    }

    favTotalRef.current = Number(data.total || 0);
    const mapped = mapLikedItemsToGrid(data.items || []);

    // 1) 먼저 thumbs=null 리스트 반영
    setFavoritePlaces((prev) => (append ? [...prev, ...mapped] : mapped));
    favPageRef.current = pageArg;

    // 2) 디테일로 썸네일 보강
    try {
      const ids = (data.items || []).map((it) =>
        String(it?.location?.location_id)
      );
      const photosList = await Promise.all(
        ids.map((id) => fetchLocationDetailPhotosForGrid(id))
      );
      const byId = new Map(ids.map((id, i) => [id, photosList[i] || []]));
      setFavoritePlaces((prev) =>
        prev.map((p) => {
          const photos = byId.get(p.id);
          return { ...p, thumbs: photos && photos.length > 0 ? photos : [] };
        })
      );
    } catch {
      setFavoritePlaces((prev) => prev.map((p) => ({ ...p, thumbs: [] })));
    }
  }

  const [favoritePlaces, setFavoritePlaces] = useState([]);
  const loadLikedInitial = useCallback(async () => {
    if (favLoading) return;
    setFavLoading(true);
    try {
      await fetchLikedPlaces(1, false);
    } catch (e) {
      console.warn("[places] list error:", e?.message);
      setFavoritePlaces([]);
      favTotalRef.current = 0;
    } finally {
      setFavLoading(false);
    }
  }, [favLoading]);

  const refreshLiked = useCallback(async () => {
    if (favRefreshing) return;
    setFavRefreshing(true);
    try {
      await fetchLikedPlaces(1, false);
    } catch (e) {
      console.warn("[places] refresh error:", e?.message);
    } finally {
      setFavRefreshing(false);
    }
  }, [favRefreshing]);

  const canLoadMoreLiked = useMemo(
    () => favoritePlaces.length < favTotalRef.current,
    [favoritePlaces.length]
  );

  const loadMoreLiked = useCallback(async () => {
    if (favLoading || favRefreshing || !canLoadMoreLiked) return;
    setFavLoading(true);
    try {
      await fetchLikedPlaces(favPageRef.current + 1, true);
    } catch (e) {
      console.warn("[places] loadMore error:", e?.message);
    } finally {
      setFavLoading(false);
    }
  }, [favLoading, favRefreshing, canLoadMoreLiked]);

  // ==== 저장소: 루트 목록 ====
  async function fetchJourneys(pageArg = 1, append = false) {
    if (!API_BASE_URL) return;
    const r = await fetch(
      `${API_BASE_URL}/journeys?page=${pageArg}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(TEST_TOKEN ? { Authorization: `Bearer ${TEST_TOKEN}` } : {}),
        },
      }
    );

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(
        data?.error ||
          (r.status === 401
            ? "로그인이 필요합니다."
            : `목록을 불러오지 못했어요. (HTTP ${r.status})`)
      );
    }

    const mapped = [];
    for (const it of data.items ?? []) {
      const id = String(it.journey_id);
      let placeSummary = "";
      let thumbs = [null, null, null];

      try {
        const metaRaw = await AsyncStorage.getItem(`journey_meta_${id}`);
        if (metaRaw) {
          const meta = JSON.parse(metaRaw);
          if (meta.placeSummary) placeSummary = meta.placeSummary;
          if (Array.isArray(meta.thumbs) && meta.thumbs.length > 0) {
            thumbs = meta.thumbs.map((uri) => (uri ? { uri } : null));
          }
        }
      } catch {}

      mapped.push({
        id,
        title: it.journey_title || "무명의 루트",
        date: formatDate(it.created_at),
        placeSummary,
        thumbs,
      });
    }

    setTotal(Number(data.total || 0));
    setRoutes((prev) => (append ? [...prev, ...mapped] : mapped));
    setPage(pageArg);
  }

  const loadRoutesInitial = useCallback(async () => {
    if (routeLoading) return;
    setRouteLoading(true);
    try {
      await fetchJourneys(1, false);
    } catch (e) {
      console.warn("[routes] list error:", e?.message);
      setRoutes([]);
      setTotal(0);
    } finally {
      setRouteLoading(false);
    }
  }, [routeLoading]);

  const refreshRoutes = useCallback(async () => {
    if (routeRefreshing) return;
    setRouteRefreshing(true);
    try {
      await fetchJourneys(1, false);
    } catch (e) {
      console.warn("[routes] refresh error:", e?.message);
    } finally {
      setRouteRefreshing(false);
    }
  }, [routeRefreshing]);

  const canLoadMoreRoutes = useMemo(
    () => routes.length < total,
    [routes.length, total]
  );

  const loadMoreRoutes = useCallback(async () => {
    if (routeLoading || routeRefreshing || !canLoadMoreRoutes) return;
    setRouteLoading(true);
    try {
      await fetchJourneys(page + 1, true);
    } catch (e) {
      console.warn("[routes] loadMore error:", e?.message);
    } finally {
      setRouteLoading(false);
    }
  }, [routeLoading, routeRefreshing, canLoadMoreRoutes, page]);

  // 저장소 초기 로드: 저장소 모드일 때만
  useEffect(() => {
    if (sheetMode !== SHEET_MODE.STORAGE) return;
    if (tab === "place" && favoritePlaces.length === 0) loadLikedInitial();
    if (tab === "route" && routes.length === 0) loadRoutesInitial();
  }, [sheetMode, tab]);

  // 정렬
  const placeData = useMemo(() => {
    const list = [...favoritePlaces];
    if (sortKey === "name") {
      return list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    return list;
  }, [favoritePlaces, sortKey]);

  const routeData = useMemo(() => {
    const list = [...routes];
    if (sortKey === "name") {
      return list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    return list;
  }, [routes, sortKey]);

  // 타이틀
  const sheetTitle =
    sheetMode === SHEET_MODE.SEARCH
      ? `‘${lastQuery}’ 검색 결과`
      : sheetMode === SHEET_MODE.STORAGE
      ? "저장소"
      : "현재 위치에서 많이 찾는 장소";

  // ==== UI ====
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
            {["카페", "활동", "쇼핑", "먹거리"].map((cat) => {
              const meta = CATEGORY_ICON[cat];
              return (
                <Pressable
                  key={cat}
                  onPress={() => handleSearch(cat)}
                  style={[styles.chip, styles.chipWithIcon]}
                >
                  {meta?.type === "icon" ? (
                    <Icon name={meta.name} width={16} height={16} />
                  ) : meta?.type === "img" ? (
                    <Image
                      source={meta.source}
                      style={styles.chipIcon}
                      resizeMode="contain"
                    />
                  ) : null}
                  <Text className="text-body-2 font-pretendardMedium text-gray700">
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      {/* 플로팅 ‘찜/저장’ 버튼 (바텀시트 위) */}
      <Animated.View
        style={[
          styles.fabBase,
          {
            bottom: fabBottom,
            width: sheetMode === SHEET_MODE.STORAGE ? 64 : 93,
            backgroundColor: "rgba(98, 151, 79, 0.8)",
          },
        ]}
      >
        <Pressable onPress={handleFabPress} style={styles.fabInner}>
          {sheetMode !== SHEET_MODE.STORAGE && (
            <Icon name="heart" width={18} height={18} color="#FFF" />
          )}
          <Text style={styles.fabText}>
            {sheetMode === SHEET_MODE.STORAGE ? "닫기" : "찜 / 저장"}
          </Text>
        </Pressable>
      </Animated.View>

      {/* 바텀시트 */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        animationConfigs={animationConfigs}
        enableDynamicSizing={false}
        enablePanDownToClose={false}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={true}
        onChange={(index) => {
          if (sheetMode === SHEET_MODE.RECO) {
            animateFabPosition(index === 0 ? SCREEN_H * 0.32 : SCREEN_H * 0.54);
            return;
          }

          // RECO 외의 경우에는 기존처럼 모드 전환
          if (index === 0) {
            setSheetMode(SHEET_MODE.RECO);
            animateFabPosition(SCREEN_H * 0.32);
          } else if (index === 1) {
            setSheetMode(SHEET_MODE.STORAGE);
            animateFabPosition(SCREEN_H * 0.54);
          }
        }}
        backgroundStyle={{
          backgroundColor: "#FFF",
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 13,
          shadowOffset: { width: 0, height: 0 },
        }}
        handleIndicatorStyle={{
          backgroundColor: "#D9D9D9",
          width: 78,
          height: 3,
          borderRadius: 50,
        }}
      >
        {sheetMode === SHEET_MODE.SEARCH ? (
          // 검색 결과
          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 25, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-heading-2 font-pretendardSemiBold mb-[11px]">
              {sheetTitle}
            </Text>

            {searchResults.map((item) => (
              <View key={item.id}>
                <SearchResultCard item={item} onPress={goToDetail(router)} />
              </View>
            ))}
          </BottomSheetScrollView>
        ) : sheetMode === SHEET_MODE.STORAGE ? (
          // 저장소
          <BottomSheetView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
            showsVerticalScrollIndicator={true}
          >
            {/* 저장소 헤더(탭 + 정렬) */}
            <View
              style={{
                position: "relative",
                paddingHorizontal: 25,
                paddingTop: 20,
              }}
            >
              <Text className="text-heading-2 font-pretendardSemiBold mb-[11px]">
                {sheetTitle}
              </Text>

              <View style={{ position: "relative", paddingTop: 8 }}>
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 1,
                    backgroundColor: "#D4D4D4",
                  }}
                />
                <View style={{ flexDirection: "row" }}>
                  <Pressable
                    onPress={() => setTab("place")}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      position: "relative",
                      paddingBottom: 8,
                    }}
                    hitSlop={8}
                  >
                    <Text
                      className="text-body-1 font-pretendardMedium"
                      style={{ color: tab === "place" ? "#000" : "#AFAFAF" }}
                    >
                      찜 장소
                    </Text>
                    {tab === "place" && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: -1,
                          height: 2,
                          width: SCREEN_W / 2 - 25,
                          backgroundColor: "#000",
                        }}
                      />
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => setTab("route")}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      position: "relative",
                      paddingBottom: 8,
                    }}
                    hitSlop={8}
                  >
                    <Text
                      className="text-body-1 font-pretendardMedium"
                      style={{ color: tab === "route" ? "#000" : "#AFAFAF" }}
                    >
                      저장 루트
                    </Text>
                    {tab === "route" && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: -1,
                          height: 2,
                          width: SCREEN_W / 2 - 25,
                          backgroundColor: "#000",
                        }}
                      />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Toolbar */}
              <View style={styles.toolbarRow}>
                <SortDropdown
                  value={sortKey}
                  onChange={(v) => setSortKey(v)}
                  options={latestOptions}
                />
                <Pressable style={styles.editBtn} onPress={() => {}}>
                  <Text className="text-body-2 font-pretendardMedium">
                    편집
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 저장소 콘텐츠 */}
            {tab === "place" ? (
              <FlatList
                data={placeData}
                key="place-grid"
                keyExtractor={(item) => item.id}
                numColumns={COLS}
                contentContainerStyle={{
                  paddingHorizontal: H_PADDING,
                  paddingTop: 8,
                  paddingBottom: 24,
                }}
                columnWrapperStyle={{ gap: GAP }}
                renderItem={({ item }) => (
                  <CollectionCard
                    title={item.title}
                    count={item.count}
                    thumbs={item.thumbs}
                    onPress={() =>
                      router.push({
                        pathname: "/(main)/place-recommend/detail/[id]",
                        params: {
                          id: item.id,
                          initial: JSON.stringify({
                            location_id: Number(item.id),
                            location_name: item.title,
                            photos:
                              Array.isArray(item.thumbs) && item.thumbs[0]?.uri
                                ? [item.thumbs[0].uri]
                                : [],
                          }),
                        },
                      })
                    }
                  />
                )}
                ListEmptyComponent={
                  favLoading ? (
                    <View style={{ paddingTop: 60, alignItems: "center" }}>
                      <ActivityIndicator />
                    </View>
                  ) : (
                    <Empty tab="place" />
                  )
                }
                onEndReachedThreshold={0.2}
                onEndReached={loadMoreLiked}
                ListFooterComponent={
                  favLoading && favoritePlaces.length > 0 ? (
                    <View style={{ paddingVertical: 12 }}>
                      <ActivityIndicator />
                    </View>
                  ) : null
                }
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <FlatList
                data={routeData}
                key="route-list"
                keyExtractor={(item) => item.id}
                contentContainerStyle={{
                  paddingHorizontal: 25,
                  paddingBottom: 24,
                }}
                ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
                renderItem={({ item }) => (
                  <RouteRow
                    title={item.title}
                    placeSummary={item.placeSummary}
                    date={item.date}
                    thumbs={item.thumbs}
                    onPress={() =>
                      router.push({
                        pathname: "/(main)/storage/route/[id]",
                        params: {
                          id: item.id,
                          thumbs: JSON.stringify(
                            (item.thumbs || []).map((t) =>
                              t?.uri ? t.uri : null
                            )
                          ),
                          title: item.title || "",
                          date: item.date || "",
                        },
                      })
                    }
                  />
                )}
                ListEmptyComponent={
                  routeLoading ? (
                    <View style={{ paddingTop: 60, alignItems: "center" }}>
                      <ActivityIndicator />
                    </View>
                  ) : (
                    <Empty tab="route" />
                  )
                }
                onEndReachedThreshold={0.2}
                onEndReached={loadMoreRoutes}
                ListFooterComponent={
                  routeLoading && routes.length > 0 ? (
                    <View style={{ paddingVertical: 12 }}>
                      <ActivityIndicator />
                    </View>
                  ) : null
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </BottomSheetView>
        ) : (
          // 추천(목업)
          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: 25,
              paddingBottom: 120,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-heading-2 font-pretendardSemiBold mb-[11px]">
              {sheetTitle}
            </Text>
            {popularMock.map((item) => (
              <View key={item.id}>
                <SearchResultCard item={item} onPress={goToDetail(router)} />
              </View>
            ))}
          </BottomSheetScrollView>
        )}
      </BottomSheet>
    </View>
  );
}

/* ===== 카드/행 컴포넌트들 ===== */
function Empty({ tab }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 60 }}>
      <Text style={{ color: "#8A8A8A" }}>
        {tab === "place" ? "저장한 장소가 없어요." : "저장한 루트가 없어요."}
      </Text>
    </View>
  );
}

function CollectionCard({ title, thumbs = null, count, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ width: ITEM_W }}>
      <StackThumb thumbs={thumbs} />
      <Text
        className="text-heading-3 font-pretendardSemiBold mb-[22px]"
        numberOfLines={1}
      >
        {title}
      </Text>
      {typeof count === "number" && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * 최대 3장을 ‘겹쳐 보이게’
 * - thumbs === null  -> 로딩중: 회색 배경만
 * - thumbs === []    -> 사진 없음: 회색 + placeholder
 * - thumbs = [{uri}] -> 실제 이미지
 */
function StackThumb({ thumbs }) {
  const size = ITEM_W;
  const isLoading = thumbs === null;
  const hasNone = Array.isArray(thumbs) && thumbs.length === 0;
  const layers = Array.isArray(thumbs) ? thumbs.slice(0, 3) : [];

  const BackgroundCards = () => (
    <>
      <View
        style={[
          styles.cardBg,
          { top: 12, left: 12, width: size - 12, height: size - 12 },
        ]}
      />
      <View
        style={[
          styles.cardBg,
          { top: 6, left: 6, width: size - 6, height: size - 6 },
        ]}
      />
    </>
  );

  if (isLoading) {
    return (
      <View style={styles.stackWrap}>
        <BackgroundCards />
        <View style={[styles.placeholder, { width: size, height: size }]} />
      </View>
    );
  }

  if (hasNone) {
    return (
      <View style={styles.stackWrap}>
        <BackgroundCards />
        <View style={[styles.placeholder, { width: size, height: size }]}>
          <Image
            source={PLACEHOLDER}
            style={{ width: "60%", height: "60%", resizeMode: "contain" }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.stackWrap}>
      <BackgroundCards />
      {layers[2] && (
        <Image
          source={layers[2]}
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            width: size - 12,
            height: size - 12,
          }}
          resizeMode="cover"
        />
      )}
      {layers[1] && (
        <Image
          source={layers[1]}
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            width: size - 6,
            height: size - 6,
          }}
          resizeMode="cover"
        />
      )}
      <Image
        source={layers[0]}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
}

function RouteRow({ title, placeSummary, date, thumbs = [], onPress }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: "#fff" }}>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {Array.from({ length: 3 }).map((_, i) => {
          const src = thumbs[i];
          return src?.uri ? (
            <Image
              key={i}
              source={src}
              style={{ flex: 1, height: 110 }}
              resizeMode="cover"
            />
          ) : (
            <View
              key={i}
              style={{
                flex: 1,
                height: 110,
                backgroundColor: "#D9D9D9",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={PLACEHOLDER}
                style={{ width: 80, height: 80, resizeMode: "contain" }}
              />
            </View>
          );
        })}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 5,
        }}
      >
        <Text className="text-heading-1 font-pretendardSemiBold">{title}</Text>
        <Text className="text-caption font-pretendardRegular text-gray700">
          {date}
        </Text>
      </View>
      {!!placeSummary && (
        <Text numberOfLines={1} className="text-body-3 font-pretendardRegular">
          {placeSummary}
        </Text>
      )}
      <View
        style={{
          height: 1,
          backgroundColor: "#D4D4D4",
          marginTop: 15,
          marginHorizontal: -25,
        }}
      />
    </Pressable>
  );
}

// 검색 결과 카드
const SearchResultCard = React.memo(function SearchResultCardBase({
  item,
  onPress,
}) {
  return (
    <View style={styles.resultCard}>
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

      <View style={styles.photoRow}>
        {(item.photos?.length ? item.photos : [1, 2, 3])
          .slice(0, 3)
          .map((ph, i) => {
            const src =
              typeof ph === "string" ? { uri: ph } : Images.backgrounds.sample;
            return <Image key={i} source={src} style={styles.photoThumb} />;
          })}
      </View>

      <View style={styles.fullDivider} />
    </View>
  );
});

// 상세로 이동 콜백
const goToDetail = (router) => (item) => {
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
};

/* ===== Styles ===== */
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
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#AFAFAF",
    width: 70,
    height: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.11,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  chipWithIcon: {
    flexDirection: "row",
    gap: 3,
    justifyContent: "center",
  },
  chipIcon: { width: 13, height: 13 },

  // 저장소 툴바
  toolbarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingVertical: 10,
    backgroundColor: "#F4F4F4",
    marginTop: 8,
    marginBottom: 10,
  },
  editBtn: {
    height: 30,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },

  // 장소 썸네일 스택
  stackWrap: {
    width: ITEM_W,
    height: ITEM_W,
    overflow: "hidden",
    marginBottom: 6,
  },
  cardBg: { position: "absolute", backgroundColor: "#EEE" },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 7,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F6D26B",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 12, fontFamily: "Pretendard-Bold", color: "#111" },
  placeholder: {
    backgroundColor: "#D9D9D9",
    justifyContent: "center",
    alignItems: "center",
  },

  // 검색/추천 결과 카드
  resultCard: { paddingBottom: 18, marginBottom: 0 },
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
    marginHorizontal: -25,
    alignSelf: "stretch",
  },

  // 플로팅 버튼
  fabBase: {
    position: "absolute",
    right: 16,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 10,
  },
  fabInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 0,
  },
  fabText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
