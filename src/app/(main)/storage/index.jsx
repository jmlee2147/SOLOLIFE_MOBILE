import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SortDropdown from "../../../components/journey/SortDropdown";
import Header from "../../../components/shared/Header";

const { width: SCREEN_W } = Dimensions.get("window");
const COLS = 3;
const GAP = 14;
const H_PADDING = 25;
const ITEM_W = (SCREEN_W - H_PADDING * 2 - GAP * (COLS - 1)) / COLS;

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const SAMPLE = require("../../../assets/images/sample.png");

export default function StorageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // 탭 상태: 'place' | 'route'
  const [tab, setTab] = useState("place");

  // 정렬
  const [sortKey, setSortKey] = useState("latest");
  const latestOptions = useMemo(
    () => [
      { label: "최신순", value: "latest" },
      { label: "이름순", value: "name" },
    ],
    []
  );

  const [favoritePlaces, setFavoritePlaces] = useState([]); // [{id,title,thumbs:[...]}]
  const [favLoading, setFavLoading] = useState(false);
  const [favRefreshing, setFavRefreshing] = useState(false);
  const favPageRef = useRef(1);
  const favTotalRef = useRef(0);
  const favLimit = 60; // 한 번에 넉넉히

  const tokenRef = useRef(null);

  async function getToken() {
    // 네가 로그인 시 저장해 둔 키와 맞춰줘 (아래는 routes에서 쓰던 'jwt' 키를 재사용)
    const token = tokenRef.current ?? (await AsyncStorage.getItem("jwt"));
    tokenRef.current = token;
    return token;
  }

  function mapLikedItemsToGrid(items = []) {
    return items.map((entry, idx) => {
      const loc = entry?.location ?? {};
      const id = String(loc.location_id ?? idx);
      const title = loc.location_name || "이름 없는 장소";
  
      const firstPhoto =
        Array.isArray(loc.photos) && loc.photos.length > 0
          ? { uri: loc.photos[0] }
          : SAMPLE;
  
      return {
        id,
        title,
        thumbs: [firstPhoto],
        count: undefined,
        raw: loc,
      };
    });
  }

  async function fetchLikedPlaces(pageArg = 1, append = false) {
    const token = await getToken();
    const url = `${BASE_URL}/me/locations/likes?page=${pageArg}&limit=${favLimit}`;
    const r = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg =
        data?.error ||
        (r.status === 401
          ? "로그인이 필요합니다."
          : `저장한 장소를 불러오지 못했어요. (HTTP ${r.status})`);
      throw new Error(msg);
    }

    favTotalRef.current = Number(data.total || 0);
    const mapped = mapLikedItemsToGrid(data.items || []);
    setFavoritePlaces((prev) => (append ? [...prev, ...mapped] : mapped));
    favPageRef.current = pageArg;
  }

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

  const [routes, setRoutes] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const canLoadMore = useMemo(() => routes.length < total, [routes.length, total]);

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

  async function fetchJourneys(pageArg = 1, append = false) {
    const token = await getToken();

    const url = `${BASE_URL}/journeys?page=${pageArg}&limit=${limit}`;
    const r = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg =
        data?.error ||
        (r.status === 401
          ? "로그인이 필요합니다."
          : `목록을 불러오지 못했어요. (HTTP ${r.status})`);
      throw new Error(msg);
    }

    const mapped = [];
    for (const it of data.items ?? []) {
      const id = String(it.journey_id);
      let placeSummary = "";
      let thumbs = [SAMPLE, SAMPLE, SAMPLE];

      try {
        const metaRaw = await AsyncStorage.getItem(`journey_meta_${id}`);
        if (metaRaw) {
          const meta = JSON.parse(metaRaw);
          if (meta.placeSummary) placeSummary = meta.placeSummary;
          if (Array.isArray(meta.thumbs) && meta.thumbs.length > 0) {
            thumbs = meta.thumbs.map((uri) => (uri ? { uri } : SAMPLE));
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

  const loadInitial = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetchJourneys(1, false);
    } catch (e) {
      console.warn("[routes] list error:", e?.message);
      setRoutes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const onRefresh = useCallback(async () => {
    // 탭별로 새로고침 분기
    if (tab === "place") {
      await refreshLiked();
      return;
    }
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchJourneys(1, false);
    } catch (e) {
      console.warn("[routes] refresh error:", e?.message);
    } finally {
      setRefreshing(false);
    }
  }, [tab, refreshing, refreshLiked]);

  const loadMore = useCallback(async () => {
    if (tab === "place") {
      await loadMoreLiked();
      return;
    }
    if (loading || refreshing || !canLoadMore) return;
    setLoading(true);
    try {
      await fetchJourneys(page + 1, true);
    } catch (e) {
      console.warn("[routes] loadMore error:", e?.message);
    } finally {
      setLoading(false);
    }
  }, [tab, loading, refreshing, canLoadMore, page, loadMoreLiked]);

  // 초기 로드
  useEffect(() => {
    if (tab === "route" && routes.length === 0) loadInitial();
    if (tab === "place" && favoritePlaces.length === 0) loadLikedInitial();
  }, [tab]);

  // 정렬
  const placeData = useMemo(() => {
    const list = [...favoritePlaces];
    if (sortKey === "name") {
      return list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    // 최신순: API가 최신순으로 내려주므로 그대로 사용
    return list;
  }, [favoritePlaces, sortKey]);

  const routeData = useMemo(() => {
    const list = [...routes];
    if (sortKey === "name") {
      return list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    return list;
  }, [routes, sortKey]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="저장소"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      {/* Tabs */}
      <View style={{ position: "relative", paddingHorizontal: 25, paddingTop: 8 }}>
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
          {/* 장소 탭 */}
          <Pressable
            onPress={() => setTab("place")}
            style={{ flex: 1, alignItems: "center", position: "relative", paddingBottom: 8 }}
            hitSlop={8}
          >
            <Text className="text-heading-3 font-pretendardSemiBold" style={{ color: tab === "place" ? "#000" : "#AFAFAF" }}>
              장소
            </Text>
            {tab === "place" && (
              <View style={{ position: "absolute", bottom: -1, height: 2, width: SCREEN_W / 2 - 25, backgroundColor: "#000" }} />
            )}
          </Pressable>

          {/* 루트 탭 */}
          <Pressable
            onPress={() => setTab("route")}
            style={{ flex: 1, alignItems: "center", position: "relative", paddingBottom: 8 }}
            hitSlop={8}
          >
            <Text className="text-heading-3 font-pretendardSemiBold" style={{ color: tab === "route" ? "#000" : "#AFAFAF" }}>
              루트
            </Text>
            {tab === "route" && (
              <View style={{ position: "absolute", bottom: -1, height: 2, width: SCREEN_W / 2 - 25, backgroundColor: "#000" }} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbarRow}>
        <SortDropdown value={sortKey} onChange={(v) => setSortKey(v)} options={latestOptions} />
        <Pressable style={styles.editBtn} onPress={() => {}}>
          <Text className="text-body-2 font-pretendardMedium">편집</Text>
        </Pressable>
      </View>

      {/* 콘텐츠 */}
      {tab === "place" ? (
        <FlatList
          data={placeData}
          key="place-grid"
          keyExtractor={(item) => item.id}
          numColumns={COLS}
          contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingTop: 8, paddingBottom: 24 }}
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
                    // 상세 페이지에서 썸네일/이름만 먼저 보여줄 수 있도록 넘김(옵션)
                    initial: JSON.stringify({
                      location_id: Number(item.id),
                      location_name: item.title,
                      photos: item.thumbs?.[0]?.uri ? [item.thumbs[0].uri] : [],
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
          refreshControl={<RefreshControl refreshing={favRefreshing} onRefresh={refreshLiked} />}
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
          contentContainerStyle={{ paddingHorizontal: 25, paddingBottom: 24 }}
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
                    thumbs: JSON.stringify((item.thumbs || []).map((t) => (t?.uri ? t.uri : null))),
                    title: item.title || "",
                    date: item.date || "",
                  },
                })
              }
            />
          )}
          ListEmptyComponent={
            loading ? (
              <View style={{ paddingTop: 60, alignItems: "center" }}>
                <ActivityIndicator />
              </View>
            ) : (
              <Empty tab="route" />
            )
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReachedThreshold={0.2}
          onEndReached={loadMore}
          ListFooterComponent={
            loading && routes.length > 0 ? (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

/* ===== Sub Components ===== */
function Empty({ tab }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 60 }}>
      <Text style={{ color: "#8A8A8A" }}>
        {tab === "place" ? "저장한 장소가 없어요." : "저장한 루트가 없어요."}
      </Text>
    </View>
  );
}

function CollectionCard({ title, thumbs = [], count, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ width: ITEM_W }}>
      <StackThumb thumbs={thumbs} />
      <Text className="text-heading-3 font-pretendardSemiBold mb-[22px]" numberOfLines={1}>
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

/** 최대 3장을 ‘겹쳐 보이게’ */
function StackThumb({ thumbs = [] }) {
  const size = ITEM_W;
  const layers = thumbs.slice(0, 3);
  const bg1 = { top: 12, left: 12, width: size - 12, height: size - 12 };
  const bg2 = { top: 6, left: 6, width: size - 6, height: size - 6 };

  const topImage = layers[0] || SAMPLE;

  return (
    <View style={styles.stackWrap}>
      <View style={[styles.cardBg, bg1]} />
      <View style={[styles.cardBg, bg2]} />
      <Image source={topImage} style={styles.thumb} resizeMode="cover" />
    </View>
  );
}

function RouteRow({ title, placeSummary, date, thumbs = [], onPress }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: "#fff" }}>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Image
            key={i}
            source={thumbs[i] || SAMPLE}
            style={{ flex: 1, height: 110 }}
            resizeMode="cover"
          />
        ))}
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

/* ===== Styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  toolbarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingVertical: 10,
    backgroundColor: "#F4F4F4",
    marginBottom: 18,
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
  stackWrap: {
    width: ITEM_W,
    height: ITEM_W,
    overflow: "hidden",
    marginBottom: 6,
  },
  cardBg: {
    position: "absolute",
    backgroundColor: "#EEE",
  },
  thumb: {
    width: ITEM_W,
    height: ITEM_W,
  },
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
  itemTitle: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    color: "#111",
    fontFamily: "Pretendard-SemiBold",
  },
});