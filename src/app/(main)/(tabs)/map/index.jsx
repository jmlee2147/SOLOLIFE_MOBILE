import { Images } from "@assets/images";
import SortDropdown from "@components/journey/SortDropdown";
import MapView from "@components/map/MapView";
import Icon from "@components/shared/Icon";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetScrollView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLikeFoldersAll, getLikedPlacesFromFolder } from "@services/api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN?.trim();

// 화면 사이즈/그리드
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

const SHEET_MODE = { RECO: "reco", SEARCH: "search", STORAGE: "storage" };
// ====== Mock Data: 현재 위치에서 많이 찾는 장소 (수원 영통 기준) ======
const MOCK_POPULAR_PLACES = [
  {
    id: "1",
    name: "라운지오커피 영통점",
    category: "카페",
    address: "경기 수원시 영통구 청명남로 12번길 10",
    thumb: { uri: "https://picsum.photos/seed/loungeo/300/300" },
  },
  {
    id: "2",
    name: "버터풀앤크리멀러스 광교점",
    category: "디저트",
    address: "경기 수원시 영통구 센트럴타운로 85",
    thumb: { uri: "https://picsum.photos/seed/butterful/300/300" },
  },
  {
    id: "3",
    name: "테라로사 광교점",
    category: "카페",
    address: "경기 수원시 영통구 광교호수공원로 250",
    thumb: { uri: "https://picsum.photos/seed/terarosa/300/300" },
  },
  {
    id: "4",
    name: "광교호수공원",
    category: "활동",
    address: "경기 수원시 영통구 하동 1026",
    thumb: { uri: "https://picsum.photos/seed/lakepark/300/300" },
  },
  {
    id: "5",
    name: "우마이도 광교점",
    category: "식사",
    address: "경기 수원시 영통구 센트럴타운로 98",
    thumb: { uri: "https://picsum.photos/seed/umaido/300/300" },
  },
  {
    id: "6",
    name: "피그인더가든 수원광교점",
    category: "식사",
    address: "경기 수원시 영통구 광교중앙로 145",
    thumb: { uri: "https://picsum.photos/seed/piginthegarden/300/300" },
  },
  {
    id: "7",
    name: "브루웍스 광교중앙점",
    category: "카페",
    address: "경기 수원시 영통구 광교중앙로 248",
    thumb: { uri: "https://picsum.photos/seed/brewworks/300/300" },
  },
  {
    id: "8",
    name: "영통CGV",
    category: "활동",
    address: "경기 수원시 영통구 봉영로 1576",
    thumb: { uri: "https://picsum.photos/seed/cgv/300/300" },
  },
  {
    id: "9",
    name: "카페 미우",
    category: "카페",
    address: "경기 수원시 영통구 봉영로 1947번길 13",
    thumb: { uri: "https://picsum.photos/seed/miu/300/300" },
  },
  {
    id: "10",
    name: "경희대 국제캠퍼스",
    category: "활동",
    address: "경기 수원시 영통구 덕영대로 1732",
    thumb: { uri: "https://picsum.photos/seed/kyunghee/300/300" },
  },
];
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { q: rawQ } = useLocalSearchParams();
  const qFromRoute = Array.isArray(rawQ) ? rawQ[0] : rawQ;

  const [sheetMode, setSheetMode] = useState(SHEET_MODE.RECO);
  const [tab, setTab] = useState("place"); // 'place' | 'route'
  const [sortKey, setSortKey] = useState("latest");

  const [popular, setPopular] = useState(MOCK_POPULAR_PLACES);

  // ====== 저장소(폴더) 상태 ======
  const [favoriteFolders, setFavoriteFolders] = useState([]); // 폴더 목록
  const [favLoading, setFavLoading] = useState(false);
  const [favRefreshing, setFavRefreshing] = useState(false);

  // 폴더 내부 보기
  const [folderView, setFolderView] = useState({
    mode: "list", // 'list' | 'inside'
    folderId: null,
    folderName: "",
  });
  const [folderPlaces, setFolderPlaces] = useState([]);
  const [folderPlacesLoading, setFolderPlacesLoading] = useState(false);

  // ====== 루트(기존) ======
  const [routes, setRoutes] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeRefreshing, setRouteRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [routeView, setRouteView] = useState({
    mode: "list", // 'list' | 'inside'
    routeId: null,
    routeTitle: "",
  });
  const [routeDetail, setRouteDetail] = useState(null);
  const [routeDetailLoading, setRouteDetailLoading] = useState(false);
  const [routeThumbs, setRouteThumbs] = useState([null, null, null]); // 상세용 썸네일들

  // ====== 검색/맵 마커를 위한 최소 상태 ======
  const [searchResults, setSearchResults] = useState([]);
  const [lastQuery, setLastQuery] = useState("");
  const [likedPlaces, setLikedPlaces] = useState([]); // 지도 마커용
  const [likedIds, setLikedIds] = useState(new Set());

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["30%", "60%"], []);
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 100,
    overshootClamping: true,
    restDisplacementThreshold: 0.1,
    restSpeedThreshold: 0.1,
    stiffness: 500,
  });

  // FAB 애니메이션
  const fabBottom = useRef(new Animated.Value(SCREEN_H * 0.28)).current;
  const animateFabPosition = (toValue) => {
    Animated.timing(fabBottom, {
      toValue,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  // ====== 유틸 ======
  async function collectLikedFromFolders() {
    try {
      const foldersResp = await getLikeFoldersAll();

      // ✅ 폴더 응답 형태 통합: 배열 | {items} | {data:{items}}
      const foldersArr =
        (Array.isArray(foldersResp) && foldersResp) ||
        (foldersResp &&
          Array.isArray(foldersResp.items) &&
          foldersResp.items) ||
        (foldersResp &&
          foldersResp.data &&
          Array.isArray(foldersResp.data.items) &&
          foldersResp.data.items) ||
        [];

      console.log(
        "[folders] total folders:",
        foldersArr.length,
        "sample:",
        foldersArr[0] || null
      );

      const all = [];

      for (const f of foldersArr) {
        const fid = String(f.folder_id ?? f.id);
        // 한 폴더 최대 60개만
        const resp = await getLikedPlacesFromFolder(fid, 1, 60);

        //  폴더 내부 아이템 응답 형태 통합
        const items =
          (resp && Array.isArray(resp.items) && resp.items) ||
          (resp &&
            resp.data &&
            Array.isArray(resp.data.items) &&
            resp.data.items) ||
          (Array.isArray(resp) ? resp : []);

        // console.log("[folders] fid:", fid, "items:", items.length);

        for (const it of items) {
          // 안전 파싱: 다양한 키 및 이상문자 대응 + 스킵 로깅
          const rawLat = it.latitude ?? it.lat ?? it.y ?? "";
          const rawLng = it.longitude ?? it.lng ?? it.x ?? "";
          const lat = typeof rawLat === "number" ? rawLat : Number(String(rawLat).replace(/[^^0-9.\-]/g, ""));
          const lng = typeof rawLng === "number" ? rawLng : Number(String(rawLng).replace(/[^^0-9.\-]/g, ""));
          const id = String(it.location_id ?? it.id ?? it.locationId ?? "").trim();

          if (!Number.isFinite(lat) || !Number.isFinite(lng) || !id) {
            console.log("[likes/folders][skip]", {
              id,
              rawLat,
              rawLng,
              lat,
              lng,
              name: it.location_name ?? it.name,
            });
            continue;
          }

          all.push({
            id,
            name: it.location_name ?? it.name ?? "이름 없는 장소",
            address: it.address ?? "",
            lat,
            lng,
            category: it.category ?? "",
            rating: it.rating_avg ?? null,
            reviews: it.rating_count ?? null,
            tags: it.keywords || it.features || [],
            photos: [],
            liked: true,
          });
        }
      }

      // location_id 기준으로 중복 제거
      const dedup = Array.from(new Map(all.map((p) => [p.id, p])).values());
      // console.log("[likes/fallback] collected total:",dedup.length,"first:",dedup[0] || null);
      return dedup;
    } catch (e) {
      console.warn("[likes/folders] collect fail:", e?.message);
      return [];
    }
  }

  const latestOptions = useMemo(
    () => [
      { label: "최신순", value: "latest" },
      { label: "이름순", value: "name" },
    ],
    []
  );

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

  // 개별 장소 상세 사진
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

  // ====== 내 좋아요(지도 마커용) ======
  useEffect(() => {
    async function fetchLikes() {
      try {
        let idsFromMe = [];
        let withCoords = [];

        // 1) /me 경로: API_BASE_URL이 있을 때만 시도 (없어도 폴더 fallback 계속 진행)
        if (API_BASE_URL) {
          try {
            const res = await fetch(`${API_BASE_URL}/me/locations/likes`, {
              headers: {
                Accept: "application/json",
                ...(TEST_TOKEN
                  ? { Authorization: `Bearer ${TEST_TOKEN}` }
                  : {}),
              },
            });
            const data = await res.json().catch(() => ({}));

            const baseList = (data.items || []).map((it, idx) => {
              const L = it.location || {};
              const rawLat = L.latitude ?? L.lat ?? L.y ?? "";
              const rawLng = L.longitude ?? L.lng ?? L.x ?? "";
              const lat = typeof rawLat === "number" ? rawLat : Number(String(rawLat).replace(/[^^0-9.\-]/g, ""));
              const lng = typeof rawLng === "number" ? rawLng : Number(String(rawLng).replace(/[^^0-9.\-]/g, ""));
              return {
                id: String(L.location_id ?? idx),
                name: L.location_name || "이름 없는 장소",
                address: L.address ?? "",
                lat,
                lng,
                category: L.category ?? "",
                rating: L.rating_avg ?? null,
                reviews: L.review_count ?? null,
                tags: L.tags || L.features_flat || [],
                photos: [],
                liked: true,
              };
            });
            idsFromMe = (data.items || []).map((it) => it.location.location_id);
            withCoords = baseList.filter(
              (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
            );
          } catch (e) {
            console.warn(
              "[likes] /me 호출 실패 -> 폴더 fallback로 진행:",
              e?.message
            );
          }
        } else {
          console.warn("[likes] API_BASE_URL 없음 -> 폴더 fallback로 진행");
        }

        // 2) 좌표가 하나도 없으면 폴더에서 긁어오기 (서비스 api는 이미 잘 동작하고 있음)
        if (withCoords.length === 0) {
          const fromFolders = await collectLikedFromFolders();
          // console.log("[likes/fallback] fromFolders length:",fromFolders.length,"sample:",fromFolders[0] || null);
          withCoords = fromFolders;
          const idsFromFolders = fromFolders.map((p) => p.id);
          setLikedIds(new Set([...idsFromMe, ...idsFromFolders]));
        } else {
          setLikedIds(new Set(idsFromMe));
        }

        // 마커 소스 세팅
        setLikedPlaces(withCoords);

        // 사진은 실제 쓰는 리스트 기준으로 로딩
        const photoLists = await Promise.all(
          withCoords.map((p) => fetchLocationDetailPhotos(p.id))
        );
        const byId = new Map(
          withCoords.map((p, i) => [String(p.id), photoLists[i] || []])
        );
        setLikedPlaces((prev) =>
          prev.map((p) => ({ ...p, photos: byId.get(p.id) ?? [] }))
        );
      } catch (err) {
        console.warn("좋아요 목록 불러오기 실패", err?.message);
      }
    }
    fetchLikes();
  }, [fetchLocationDetailPhotos]);

  // ====== 검색(간소) ======
  const handleSearch = useCallback(
    async (query) => {
      const fallback = () => {
        setSearchResults([]);
        setLastQuery(query);
        setSheetMode(SHEET_MODE.SEARCH);
        bottomSheetRef.current?.snapToIndex(1);
      };
      if (!query?.trim() || !API_BASE_URL) return fallback();
      try {
        setSheetMode(SHEET_MODE.SEARCH);
        const res = await fetch(
          `${API_BASE_URL}/search/locations?q=${encodeURIComponent(
            query
          )}&limit=20`
        );
        const data = await res.json().catch(() => ({}));
        const items = Array.isArray(data?.items) ? data.items : [];
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
                  ? [det.fallback_photo_url]
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
      } catch (e) {
        console.warn("검색 실패:", e?.message);
        fallback();
      }
    },
    [likedIds]
  );

  useFocusEffect(
    React.useCallback(() => {
      if (qFromRoute) handleSearch(qFromRoute);
    }, [qFromRoute, handleSearch])
  );

  // 헤더의 '닫기' 공통 핸들러
  const handleCloseInside = useCallback(() => {
    // 폴더/루트 어느 쪽이든 내부 보기 상태라면 list로 복귀
    if (tab === "place" && folderView.mode === "inside") {
      setFolderView({ mode: "list", folderId: null, folderName: "" });
    }
    if (tab === "route" && routeView.mode === "inside") {
      setRouteView({ mode: "list", routeId: null, routeTitle: "" });
    }
    // 기본 화면(추천)으로 전환 + 시트 하단 스냅
    setSheetMode(SHEET_MODE.RECO);
    bottomSheetRef.current?.snapToIndex(0);
    animateFabPosition(SCREEN_H * 0.28);
  }, [tab, folderView.mode, routeView.mode]);

  // ====== 지도 마커 ======
  const markers = useMemo(() => {
    const isSearched =
      sheetMode === SHEET_MODE.SEARCH && lastQuery.trim().length > 0;

    const isLiked = (id) =>
      likedIds.has(Number(id)) || likedIds.has(String(id));

    if (isSearched) {
      // 검색 결과: 좋아요인 건 하트, 나머진 기본 핀
      return searchResults
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map((p, i) => ({
          id: p.id ?? String(i),
          lat: p.lat,
          lng: p.lng,
          name: p.name ?? "",
          label: String(i + 1),
          liked: isLiked(p.id),
          icon: isLiked(p.id) ? "heart" : "pin",
        }));
    }

    // 기본(첫 진입 포함): 내가 좋아요한 장소 = 하트 마커
    return likedPlaces
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        name: p.name ?? "",
        liked: true,
        icon: "heart", // ★ 하트 고정
      }));
  }, [sheetMode, searchResults, likedPlaces, likedIds, lastQuery]);

  useEffect(() => {
    const valid = (Array.isArray(markers) ? markers : []).filter(
      (m) => Number.isFinite(Number(m.lat)) && Number.isFinite(Number(m.lng))
    );
    // console.log("[markers-src] likedPlaces:", likedPlaces.length,"searchResults:", searchResults.length,"mode:",sheetMode);
    // console.log("[markers-valid] count:", valid.length, "first:", valid[0] || null);
    // console.log("[debug-markers]", JSON.stringify({ type: "debug-markers", count: (markers || []).length, first: (markers || [])[0] ?? null }));
  }, [markers, likedPlaces, searchResults, sheetMode]);
  // ====== 폴더 목록/썸네일 ======
  const getFolderCount = (f) =>
    typeof f.item_count === "number"
      ? f.item_count
      : typeof f._count?.items === "number"
      ? f._count.items
      : 0;

  const fetchFolderThumbs = useCallback(
    async (folderId) => {
      try {
        const { items } = await getLikedPlacesFromFolder(folderId, 1, 3);
        const ids = (items || []).map((it, i) =>
          String(it.location_id ?? it.id ?? i)
        );
        const photosList = await Promise.all(
          ids.map((id) => fetchLocationDetailPhotos(id))
        );
        const flat = photosList
          .map((arr) => (arr && arr[0] ? { uri: arr[0] } : null))
          .filter(Boolean)
          .slice(0, 3);
        return flat;
      } catch {
        return [];
      }
    },
    [fetchLocationDetailPhotos]
  );

  const loadFoldersInitial = useCallback(async () => {
    if (favLoading) return;
    setFavLoading(true);
    try {
      const folders = await getLikeFoldersAll();
      const mapped = (folders || []).map((f, idx) => ({
        id: String(f.folder_id ?? f.id ?? idx),
        title: String(f.name || "이름 없는 폴더"),
        count: getFolderCount(f),
        thumbs: null,
      }));
      setFavoriteFolders(mapped);

      const target = mapped.slice(0, 6);
      await Promise.all(
        target.map(async (folder) => {
          const thumbs = await fetchFolderThumbs(folder.id);
          setFavoriteFolders((prev) =>
            prev.map((p) => (p.id === folder.id ? { ...p, thumbs } : p))
          );
        })
      );
    } catch (e) {
      console.warn("[folders] list error:", e?.message);
      setFavoriteFolders([]);
    } finally {
      setFavLoading(false);
    }
  }, [favLoading, fetchFolderThumbs]);

  const openFolderInside = useCallback(async (folder) => {
    setFolderView({
      mode: "inside",
      folderId: folder.id,
      folderName: folder.title,
    });
    setFolderPlaces([]);
    setFolderPlacesLoading(true);
    try {
      const { items } = await getLikedPlacesFromFolder(folder.id, 1, 60);
      const mapped = (items || []).map((it, i) => ({
        id: String(it.location_id ?? it.id ?? i),
        name: it.location_name ?? it.name ?? "이름 없는 장소",
        category: it.category || "",
        address: it.address || "",
        thumb: null,
      }));
      const ids = mapped.map((m) => m.id);
      const photoLists = await Promise.all(
        ids.map((id) => fetchLocationDetailPhotos(id))
      );
      const byId = new Map(ids.map((id, i) => [id, photoLists[i] || []]));
      setFolderPlaces(
        mapped.map((p) => ({
          ...p,
          thumb: byId.get(p.id)?.[0]
            ? { uri: byId.get(p.id)[0] }
            : Images?.backgrounds?.sample ?? PLACEHOLDER,
        }))
      );
    } catch (e) {
      console.warn("[folderInside] load error:", e?.message);
      setFolderPlaces([]);
    } finally {
      setFolderPlacesLoading(false);
    }
  }, []);

  const backToFolderList = useCallback(() => {
    setFolderView({ mode: "list", folderId: null, folderName: "" });
  }, []);

  const refreshFolders = useCallback(async () => {
    if (favRefreshing) return;
    setFavRefreshing(true);
    try {
      await loadFoldersInitial();
    } finally {
      setFavRefreshing(false);
    }
  }, [favRefreshing, loadFoldersInitial]);

  // ====== 루트(기존) ======
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

  // 응답의 다양한 구조를 한 가지 배열로 정규화
  function normalizeJourneyLocations(resp) {
    const root = resp?.journey || resp?.data || resp || {};
    const raw = Array.isArray(root.locations)
      ? root.locations
      : Array.isArray(root.journey_locations)
      ? root.journey_locations
      : [];

    return raw.map((jl, idx) => {
      const loc = jl?.location || jl?.location_detail || jl || {};
      return {
        location_id: Number(
          loc.location_id ?? jl.location_id ?? jl.journey_location_id ?? idx
        ),
        location_name: loc.location_name ?? jl.location_name ?? "이름없음",
        category: loc.category ?? jl.category ?? "",
        address: loc.address ?? jl.address ?? "",
        rating_avg:
          typeof loc.rating_avg === "number"
            ? loc.rating_avg
            : typeof loc.rating === "number"
            ? loc.rating
            : null,
        fallback_photo_url:
          loc.fallback_photo_url ||
          (Array.isArray(loc.photos) && loc.photos[0]) ||
          null,
      };
    });
  }

  // 루트 상세를 바텀시트 내부에서 리스트로 표시
  const openRouteInside = useCallback(
    async (route) => {
      // 선택한 루트 썸네일 보존
      const target = routes.find((r) => r.id === route.id);
      setRouteThumbs(
        Array.isArray(target?.thumbs) && target.thumbs.length
          ? target.thumbs.slice(0, 3)
          : [null, null, null]
      );

      setRouteView({
        mode: "inside",
        routeId: route.id,
        routeTitle: route.title,
      });
      setRouteDetailLoading(true);

      try {
        // 인증 헤더 추가 (jwt 또는 TEST_TOKEN 사용)
        const storedJwt = (await AsyncStorage.getItem("jwt")) || "";
        const bearer = storedJwt?.startsWith("Bearer ")
          ? storedJwt
          : storedJwt
          ? `Bearer ${storedJwt}`
          : "";
        const auth = bearer || (TEST_TOKEN ? `Bearer ${TEST_TOKEN}` : "");

        const res = await fetch(`${API_BASE_URL}/journeys/${route.id}`, {
          headers: {
            Accept: "application/json",
            ...(auth ? { Authorization: auth } : {}),
          },
        });

        const text = await res.text();
        let json = {};
        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          console.warn("[routeInside] non-JSON response:", text?.slice(0, 200));
        }

        if (!res.ok) {
          console.warn("[routeInside] HTTP", res.status, json?.error || text);
          setRouteDetail({ locations: [] });
        } else {
          // 다양한 응답 구조 보정
          const locations = normalizeJourneyLocations(json);
          setRouteDetail({ ...json, locations });
        }

        // 상세 상태로 전환
        bottomSheetRef.current?.snapToIndex(1);
        animateFabPosition(SCREEN_H * 0.54);
      } catch (e) {
        console.warn("[routeInside] fetch error:", e?.message);
        setRouteDetail({ locations: [] });
      } finally {
        setRouteDetailLoading(false);
      }
    },
    [routes]
  );

  const backToRouteList = useCallback(() => {
    setRouteView({ mode: "list", routeId: null, routeTitle: "" });
  }, []);

  // 저장소 진입 시 데이터 로딩
  useEffect(() => {
    if (sheetMode !== SHEET_MODE.STORAGE) return;
    if (tab === "place" && favoriteFolders.length === 0) loadFoldersInitial();
    if (tab === "route" && routes.length === 0) loadRoutesInitial();
  }, [sheetMode, tab]);

  // 정렬된 데이터
  const placeData = useMemo(() => {
    const list = [...favoriteFolders];
    if (sortKey === "name")
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return list;
  }, [favoriteFolders, sortKey]);

  const routeData = useMemo(() => {
    const list = [...routes];
    if (sortKey === "name")
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return list;
  }, [routes, sortKey]);

  // FAB 동작
  const handleFabPress = () => {
    if (sheetMode === SHEET_MODE.STORAGE) {
      setSheetMode(SHEET_MODE.RECO);
      bottomSheetRef.current?.snapToIndex(0);
      animateFabPosition(SCREEN_H * 0.28);
    } else {
      setSheetMode(SHEET_MODE.STORAGE);
      bottomSheetRef.current?.snapToIndex(1);
      animateFabPosition(SCREEN_H * 0.54);
    }
  };

  const handleSheetChange = (index) => {
    // 바텀시트 높이에 따라 FAB 위치만 조정
    const target = index === 0 ? SCREEN_H * 0.28 : SCREEN_H * 0.54;
    animateFabPosition(target);
  };

  // 시트 제목
  const sheetTitle =
    sheetMode === SHEET_MODE.SEARCH
      ? `‘${lastQuery}’ 검색 결과`
      : sheetMode === SHEET_MODE.STORAGE
      ? "저장소"
      : "현재 위치에서 많이 찾는 장소";

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* 지도 */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
        <MapView
          markers={markers.map((m) => ({ ...m, label: m.label ?? "" }))}
        />
      </View>

      {/* 상단 검색/내비 오버레이 */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topContainer}>
          {/** 폴더 내부 or 루트 내부라면: 이전/닫기 헤더를 표시 */}
          {sheetMode === SHEET_MODE.STORAGE &&
          ((tab === "route" && routeView.mode === "inside") ||
            (tab === "place" && folderView.mode === "inside")) ? (
            <View style={styles.insideHeaderRow}>
              <Pressable
                style={styles.navBtn}
                onPress={tab === "route" ? backToRouteList : backToFolderList}
                hitSlop={10}
              >
                <Icon name="previous" width={24} height={24} />
              </Pressable>

              <Pressable
                style={styles.navBtn}
                onPress={handleCloseInside}
                hitSlop={10}
              >
                <Icon name="close" width={24} height={24} />
              </Pressable>
            </View>
          ) : (
            /** 기본: 검색창 + 카테고리 칩 */
            <>
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
                      {meta?.type === "img" ? (
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
            </>
          )}
        </View>
      </SafeAreaView>

      {/* FAB — 폴더 내부에서는 숨김 */}
      {!(
        sheetMode === SHEET_MODE.STORAGE &&
        (folderView.mode === "inside" || routeView.mode === "inside")
      ) && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.fabBase,
            {
              bottom: fabBottom,
              width: sheetMode === SHEET_MODE.STORAGE ? 64 : 93,
              backgroundColor: "rgba(98,151,79,0.8)",
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
      )}

      {/* 바텀시트 */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        animationConfigs={animationConfigs}
        enableDynamicSizing={false}
        enablePanDownToClose={false}
        enableContentPanningGesture
        enableHandlePanningGesture
        onChange={handleSheetChange}
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
          tab === "route" && routeView.mode === "inside" ? (
            // 루트 상세: 리스트 형태로 렌더
            <BottomSheetScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 25,
                paddingBottom: insets.bottom + 40,
                paddingTop: 20,
              }}
              showsVerticalScrollIndicator={false}
            >
              {routeDetailLoading ? (
                <View style={{ paddingTop: 60, alignItems: "center" }}>
                  <ActivityIndicator />
                </View>
              ) : routeDetail?.locations?.length > 0 ? (
                <>
                  {/* ===== 헤더 ===== */}
                  <View style={{ marginBottom: 21 }}>
                    {/* 타이틀 */}
                    <Text className="text-title-1 font-pretendardExtraBold mb-[6px]">
                      {routeView.routeTitle || "저장된 루트"}
                    </Text>

                    {/* 날짜 + 저장된 루트 + 편집 버튼 */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text className="text-heading-3 font-pretendardSemiBold text-gray700">
                        {routeDetail?.created_at
                          ? `${new Date(
                              routeDetail.created_at
                            ).getFullYear()}.${String(
                              new Date(routeDetail.created_at).getMonth() + 1
                            ).padStart(2, "0")}.${String(
                              new Date(routeDetail.created_at).getDate()
                            ).padStart(2, "0")} 저장된 루트`
                          : "저장된 루트"}
                      </Text>

                      <Pressable
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor: "#F4F4F4",
                        }}
                      >
                        <Text className="text-body-2 font-pretendardMedium text-gray700">
                          편집
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View
                    style={{
                      height: 1,
                      backgroundColor: "#D4D4D4",
                      marginBottom: 28,
                      marginHorizontal: -25,
                    }}
                  />

                  <FlatList
                    data={routeDetail.locations}
                    keyExtractor={(loc, idx) => String(loc.location_id ?? idx)}
                    renderItem={({ item, index }) => (
                      <RouteDetailListItem
                        item={item}
                        thumb={routeThumbs[index] ?? null}
                      />
                    )}
                    ItemSeparatorComponent={() => (
                      <View style={{ height: 10 }} />
                    )}
                    scrollEnabled={false}
                    contentContainerStyle={{ paddingBottom: 10 }}
                  />
                </>
              ) : (
                <View style={{ paddingTop: 60, alignItems: "center" }}>
                  <Text style={{ color: "#8A8A8A" }}>
                    루트에 등록된 장소가 없어요.
                  </Text>
                </View>
              )}
            </BottomSheetScrollView>
          ) : (
            // 저장소 목록 (폴더/루트)
            <BottomSheetFlatList
              data={
                tab === "place"
                  ? folderView.mode === "inside"
                    ? folderPlaces
                    : placeData
                  : routeData
              }
              keyExtractor={(item) => item.id}
              key={
                tab === "place"
                  ? folderView.mode === "inside"
                    ? "folder-inside-2col"
                    : "place-grid-3col"
                  : "route-list"
              }
              numColumns={
                tab === "place" ? (folderView.mode === "inside" ? 2 : COLS) : 1
              }
              contentContainerStyle={{
                paddingHorizontal: 25,
                paddingBottom: insets.bottom + 40,
                paddingTop: 10,
              }}
              bottomInset={insets.bottom + 40}
              onEndReachedThreshold={0.4}
              onEndReached={
                tab === "route" && folderView.mode !== "inside"
                  ? loadMoreRoutes
                  : undefined
              }
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={tab === "place" ? { gap: GAP } : undefined}
              ItemSeparatorComponent={
                folderView.mode !== "inside" && tab === "route"
                  ? () => <View style={{ height: 15 }} />
                  : undefined
              }
              ListHeaderComponent={
                <View style={{ paddingHorizontal: 0, paddingBottom: 15 }}>
                  {folderView.mode === "inside" ? (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingHorizontal: 0,
                        marginBottom: 8,
                        marginTop: 4,
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          className="text-heading-2 font-pretendardSemiBold"
                          style={{ color: "#111" }}
                        >
                          {folderView.folderName}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={{ position: "relative", paddingTop: 8 }}>
                        <View
                          style={{
                            position: "absolute",
                            left: -50,
                            right: -50,
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
                              style={{
                                color: tab === "place" ? "#000" : "#AFAFAF",
                              }}
                            >
                              찜 장소
                            </Text>
                            {tab === "place" && (
                              <View
                                style={{
                                  position: "absolute",
                                  left: -50,
                                  bottom: 0,
                                  height: 2,
                                  width: SCREEN_W / 2 + 25,
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
                              style={{
                                color: tab === "route" ? "#000" : "#AFAFAF",
                              }}
                            >
                              저장 루트
                            </Text>
                            {tab === "route" && (
                              <View
                                style={{
                                  position: "absolute",
                                  right: -50,
                                  bottom: 0,
                                  height: 2,
                                  width: SCREEN_W / 2 + 25,
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
                        {tab === "place" ? (
                          <Pressable
                            style={{
                              flexDirection: "row",
                              gap: 4,
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                            onPress={() =>
                              console.log("새 리스트 추가 버튼 클릭됨")
                            }
                          >
                            <Icon name="plus_circle" width={24} height={24} />
                            <Text className="text-body-2 font-pretendardMedium text-gray700">
                              새 리스트 만들기
                            </Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            style={styles.editBtn}
                            onPress={() => console.log("편집 버튼 클릭됨")}
                          >
                            <Text className="text-body-2 font-pretendardMedium text-gray700">
                              편집
                            </Text>
                          </Pressable>
                        )}
                      </View>

                      <View
                        style={{
                          height: 1,
                          backgroundColor: "#D4D4D4",
                          marginHorizontal: -25,
                        }}
                      />
                    </>
                  )}
                </View>
              }
              renderItem={({ item }) =>
                tab === "place" ? (
                  folderView.mode === "list" ? (
                    // 폴더 카드
                    <CollectionCard
                      title={item.title}
                      count={item.count}
                      thumbs={item.thumbs}
                      onPress={() => openFolderInside(item)}
                    />
                  ) : (
                    // 폴더 내부: 장소 2열 카드
                    <PlaceBigCard
                      title={item.name}
                      category={item.category}
                      address={item.address}
                      thumb={item.thumb}
                      onPress={() =>
                        router.push({
                          pathname: "/(main)/place-recommend/detail/[id]",
                          params: { id: item.id },
                        })
                      }
                    />
                  )
                ) : (
                  <RouteRow
                    title={item.title}
                    placeSummary={item.placeSummary}
                    date={item.date}
                    thumbs={item.thumbs}
                    onPress={() => openRouteInside(item)}
                  />
                )
              }
              refreshing={
                folderView.mode === "inside"
                  ? folderPlacesLoading
                  : tab === "place"
                  ? favRefreshing
                  : routeRefreshing
              }
              onRefresh={
                folderView.mode === "inside"
                  ? undefined
                  : tab === "place"
                  ? refreshFolders
                  : refreshRoutes
              }
              ListEmptyComponent={
                tab === "place" ? (
                  folderView.mode === "inside" ? (
                    folderPlacesLoading ? (
                      <View style={{ paddingTop: 60, alignItems: "center" }}>
                        <ActivityIndicator />
                      </View>
                    ) : (
                      <Empty text="저장한 폴더가 없어요." />
                    )
                  ) : favLoading ? (
                    <View style={{ paddingTop: 60, alignItems: "center" }}>
                      <ActivityIndicator />
                    </View>
                  ) : (
                    <Empty text="폴더에 저장된 장소가 없어요." />
                  )
                ) : routeLoading ? (
                  <View style={{ paddingTop: 60, alignItems: "center" }}>
                    <ActivityIndicator />
                  </View>
                ) : (
                  <Empty text="저장한 루트가 없어요." />
                )
              }
              ListFooterComponent={
                folderView.mode !== "inside" &&
                tab === "route" &&
                routeLoading &&
                routes.length > 0 ? (
                  <View style={{ height: insets.bottom + 40 }}>
                    <ActivityIndicator />
                  </View>
                ) : null
              }
            />
          )
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

            {popular.map((place) => (
              <PopularPlaceItem
                key={place.id}
                item={place}
                onPress={() => console.log("place pressed:", place.name)}
                onToggleLike={(it) =>
                  setPopular((prev) =>
                    prev.map((x) =>
                      x.id === it.id ? { ...x, liked: !x.liked } : x
                    )
                  )
                }
              />
            ))}

            <View
              style={{
                height: 1,
                backgroundColor: "#D4D4D4",
                marginTop: 8,
                marginHorizontal: -25,
              }}
            />
          </BottomSheetScrollView>
        )}
      </BottomSheet>
    </View>
  );
}

/* ===== 공용 컴포넌트 ===== */
function Empty({ text }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 60 }}>
      <Text style={{ color: "#8A8A8A" }}>{text}</Text>
    </View>
  );
}

function CollectionCard({ title, thumbs = null, count, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ width: ITEM_W }}>
      <StackThumb thumbs={thumbs} />
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 22 }}
      >
        <Text
          className="text-body-2 font-pretendardMedium"
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          {title}
        </Text>
        {typeof count === "number" && (
          <Text className="text-body-2 font-pretendardMedium ml-[2px]">
            ({count})
          </Text>
        )}
      </View>
    </Pressable>
  );
}

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

function PlaceBigCard({ title, category, address, thumb, onPress }) {
  const cardW = (SCREEN_W - 25 * 2 - 14) / 2;
  const imgH = cardW;
  const src = thumb?.uri ? thumb : Images?.backgrounds?.sample ?? PLACEHOLDER;

  return (
    <Pressable onPress={onPress} style={{ width: cardW, marginBottom: 18 }}>
      <View
        style={{
          width: cardW,
          height: imgH,
          borderRadius: 5,
          backgroundColor: "#EEE",
          overflow: "hidden",
        }}
      >
        <Image
          source={src}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
      <Text
        numberOfLines={1}
        className="text-heading-2 font-pretendardSemiBold text-[#244DD3] mt-[11px]"
      >
        {title}
      </Text>
      <Text
        numberOfLines={1}
        className="text-body-3 font-pretendardRegular text-gray700"
      >
        {category}
      </Text>
      <Text
        numberOfLines={1}
        className="text-body-3 font-pretendardRegular text-gray700"
      >
        {address}
      </Text>
    </Pressable>
  );
}

const SearchResultCard = React.memo(function SearchResultCardBase({
  item,
  onPress,
}) {
  const photos =
    Array.isArray(item.photos) && item.photos.length > 0 ? item.photos : [];
  const openNow = item?.is_open ?? true;
  const openText =
    item?.today_hours ??
    item?.opening_hours?.today_text ??
    "영업 시간(오늘 영업시간 표시)";

  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeaderRow}>
        <Pressable
          onPress={() => onPress?.(item)}
          hitSlop={8}
          accessibilityRole="button"
          style={{ flexShrink: 1 }}
        >
          <Text
            numberOfLines={1}
            className="text-heading-1 font-pretendardSemiBold text-[#244DD3]"
          >
            {item.name}
          </Text>
        </Pressable>

        <View style={styles.resultHeaderIcons}>
          <Pressable hitSlop={10} style={{ marginRight: 12 }}>
            <Icon name="share2" width={25} height={25} />
          </Pressable>
          <Pressable hitSlop={10}>
            <Icon name="heart_outline" width={25} height={25} />
          </Pressable>
        </View>
      </View>

      {(item.rating ?? null) !== null && (
        <View style={styles.resultRatingRow}>
          <Icon name="star" width={16} height={16} />
          <Text className="text-body-2 font-pretendardMedium text-yellow900">
            {Number(item.rating).toFixed(1)}
          </Text>
          {item.reviews ? (
            <Text className="text-body-3 font-pretendardRegular text-gray700 ml-[2px]">
              ({item.reviews})
            </Text>
          ) : null}
          {!!item.category && (
            <Text style={styles.resultCategory}>· {item.category}</Text>
          )}
        </View>
      )}

      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
      >
        <Text className="text-body-2 font-pretendardMedium">
          {openNow ? "영업중" : "영업종료"}
        </Text>
        <Text className="text-body-2 font-pretendardMedium text-gray700">
          {" · " + openText}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ marginTop: 11, gap: 7 }}
      >
        {(photos.length ? photos : [1, 2, 3, 4]).slice(0, 4).map((ph, i) => {
          const src =
            typeof ph === "string" ? { uri: ph } : Images.backgrounds.sample;
          return (
            <Image
              key={i}
              source={src}
              style={{
                width: 100,
                height: 100,
                borderRadius: 5,
                backgroundColor: "#EEE",
              }}
            />
          );
        })}
      </ScrollView>

      <View style={styles.fullDivider} />
    </View>
  );
});

function RouteRow({ title, placeSummary, date, thumbs = [], onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#fff",
        paddingVertical: 8,
      }}
    >
      {/* 📸 썸네일 3개 */}
      <View style={{ flexDirection: "row", gap: 5 }}>
        {Array.from({ length: 3 }).map((_, i) => {
          const src = thumbs[i];
          return (
            <View key={i} style={{ flex: 1 }}>
              {src?.uri ? (
                <Image
                  source={src}
                  style={{
                    width: "100%",
                    height: 110,
                    borderRadius: 5,
                    overflow: "hidden",
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: 110,
                    borderRadius: 5,
                    backgroundColor: "#D9D9D9",
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    source={PLACEHOLDER}
                    style={{ width: 80, height: 80, resizeMode: "contain" }}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* 📍 제목 + 날짜 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <Text className="text-heading-1 font-pretendardSemiBold">{title}</Text>
        <Text className="text-caption font-pretendardRegular text-gray700">
          {date}
        </Text>
      </View>

      {/* 🗺 장소 요약 */}
      {!!placeSummary && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 4,
          }}
        >
          <Icon name="location" width={16} height={16} />
          <Text
            numberOfLines={1}
            className="text-body-3 font-pretendardRegular text-gray700"
          >
            {placeSummary}
          </Text>
        </View>
      )}

      {/* ─ 구분선 */}
      <View
        style={{
          height: 1,
          backgroundColor: "#D4D4D4",
          marginTop: 20,
          marginBottom: 10,
          marginHorizontal: -25,
        }}
      />
    </Pressable>
  );
}

// 루트 상세 리스트 아이템 (RouteDetailScreen 스타일)
function RouteDetailListItem({ item, thumb }) {
  const SAMPLE = Images.backgrounds.sample;
  const imgSrc = thumb?.uri
    ? thumb
    : item?.fallback_photo_url
    ? { uri: item.fallback_photo_url }
    : SAMPLE;

  const rating =
    typeof item?.rating_avg === "number"
      ? item.rating_avg
      : typeof item?.rating === "number"
      ? item.rating
      : null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#FFF",
        marginBottom: 12,
      }}
    >
      <Image
        source={imgSrc}
        style={{
          width: 166,
          height: 166,
          borderRadius: 5,
          backgroundColor: "#D9D9D9",
        }}
      />
      <View
        style={{
          flex: 1,
          minHeight: 166,
          marginLeft: 10,
          justifyContent: "space-between",
        }}
      >
        <View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              className="text-heading-2 font-pretendardSemiBold text-[#244DD3] mr-[9px]"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ flexShrink: 1 }}
            >
              {item.location_name ?? "이름없음"}
            </Text>
          </View>
          <Text className="mt-1 text-body-2 font-pretendardMedium text-gray700">
            {item.category ?? ""}
          </Text>
          {!!item.address && (
            <Text className="text-body-3 font-pretendardRegular text-gray700 mt-[4px]">
              {item.address}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ====== Popular Place List Item (이미지와 동일한 UI) ======
function PopularPlaceItem({ item, onPress, onToggleLike }) {
  const {
    name,
    categories = [],
    address = "",
    rating = null,
    reviews = null,
    openNow = true,
    todayHours = "",
    tags = [],
    thumb,
    liked = false,
  } = item || {};

  return (
    <Pressable onPress={() => onPress?.(item)} style={ppStyles.wrap}>
      {/* 썸네일 */}
      <Image
        source={thumb?.uri ? thumb : Images?.backgrounds?.sample ?? PLACEHOLDER}
        style={ppStyles.thumb}
        resizeMode="cover"
      />

      {/* 본문 */}
      <View style={{ flex: 1, marginLeft: 10 }}>
        {/* 제목 + 하트 */}
        <View style={ppStyles.titleRow}>
          <Text
            numberOfLines={1}
            className="text-heading-2 font-pretendardSemiBold text-[#244DD3]"
            style={ppStyles.title}
          >
            {name}
          </Text>
          <Pressable onPress={() => onToggleLike?.(item)} hitSlop={10}>
            <Icon
              name={liked ? "heart" : "heart_outline"}
              width={25}
              height={25}
            />
          </Pressable>
        </View>

        {/* 평점/리뷰 · 카테고리 */}
        {(rating !== null || categories.length > 0) && (
          <View style={ppStyles.metaRow}>
            {rating !== null && (
              <>
                <Icon name="star" width={16} height={16} />
                <Text
                  className="text-body-2 font-pretendardMedium text-yellow900"
                  style={{ marginLeft: 2 }}
                >
                  {Number(rating).toFixed(1)}
                </Text>
                {typeof reviews === "number" && (
                  <Text
                    className="text-body-3 font-pretendardRegular text-gray700"
                    style={{ marginLeft: 2 }}
                  >
                    ({reviews})
                  </Text>
                )}
                {categories.length > 0 && (
                  <Text style={ppStyles.dotMeta}>
                    {" "}
                    · {categories.join(", ")}
                  </Text>
                )}
              </>
            )}
            {rating === null && categories.length > 0 && (
              <Text className="text-body-3 font-pretendardRegular text-gray700">
                {categories.join(", ")}
              </Text>
            )}
          </View>
        )}

        {/* 영업 상태/시간 */}
        <View style={ppStyles.statusRow}>
          <Icon name="time" width={24} height={24} />
          <Text
            className="text-body-2 font-pretendardMedium"
            style={{ marginLeft: 4 }}
          >
            {openNow ? "영업중" : "영업종료"}
          </Text>
          <Text className="text-body-2 font-pretendardMedium text-gray700">
            {" "}
            · {todayHours}
          </Text>
        </View>

        {/* 태그 */}
        {tags.length > 0 && (
          <Text
            numberOfLines={1}
            className="text-body-3 font-pretendardRegular text-gray700"
            style={{ marginTop: 6 }}
          >
            {tags.map((t) => `#${t}`).join(" ")}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const ppStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  thumb: {
    width: 100,
    height: 100,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  dotMeta: { marginLeft: 4, color: "#666" },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
});

/* ===== 스타일 ===== */
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
  chipWithIcon: { flexDirection: "row", gap: 3, justifyContent: "center" },
  chipIcon: { width: 13, height: 13 },

  toolbarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    paddingVertical: 15,
    backgroundColor: "#FFF",
  },
  editBtn: {
    height: 30,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },

  stackWrap: {
    width: ITEM_W,
    height: ITEM_W,
    overflow: "hidden",
    marginBottom: 6,
  },
  cardBg: { position: "absolute", backgroundColor: "#EEE" },
  placeholder: {
    backgroundColor: "#D9D9D9",
    justifyContent: "center",
    alignItems: "center",
  },

  resultCard: { paddingBottom: 10, marginBottom: 10 },
  resultHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultHeaderIcons: { flexDirection: "row", alignItems: "center" },
  resultRatingRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  resultCategory: { marginLeft: 3, color: "#666", fontSize: 14 },
  fullDivider: {
    height: 1,
    backgroundColor: "#D4D4D4",
    marginTop: 16,
    marginHorizontal: -25,
    alignSelf: "stretch",
  },

  fabBase: {
    position: "absolute",
    right: 16,
    height: 36,
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
  fabText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  insideHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    paddingVertical: 10,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.11,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  insideTitle: {
    flex: 1,
    textAlign: "center",
  },
});

// ===== 라우팅용 헬퍼 =====
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
    pathname: "/(main)/place-recommend/detail/[id]",
    params: {
      id: String(item.id),
      initial: encodeURIComponent(JSON.stringify(initialPayload)),
    },
  });
};
