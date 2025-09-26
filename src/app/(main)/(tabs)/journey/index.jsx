import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  InteractionManager,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import FloatingButton from "../../../../components/journey/FloatingButton";
import LogBoardCard from "../../../../components/journey/LogBoardCard";
import LogListCard from "../../../../components/journey/LogListCard";
import SortDropdown from "../../../../components/journey/SortDropdown";
import Icon from "../../../../components/shared/Icon";

const CHARACTER = require("../../../../assets/images/explorer.png");
const FALLBACK_THUMB = require("../../../../assets/images/sample.png");
const MONKEY_PLACEHOLDER = require("../../../../assets/images/monkey-placeholder.png");
const MONKEY_PLACEHOLDER_BOARD = require("../../../../assets/images/monkey-placeholder-board.png");

// ===== ENV =====
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;
const TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN;
const USER_ID = Number(process.env.EXPO_PUBLIC_TEST_USER_ID || 1);

// ===== 유틸 =====
function formatYM(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}.${m}`;
}
function fmtDateISOToYmd(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// ===== 세션 캐시(선택) =====
const LOCATION_NAME_CACHE = new Map(); // id:number -> name

// ===== API 헬퍼 =====
async function fetchLogbookDetail(logbookId) {
  if (!API_BASE || !logbookId) return null;
  const url = `${API_BASE.replace(/\/+$/, "")}/logbooks/${logbookId}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    });
    if (!res.ok) {
      // console.warn("[logbookDetail] !ok", res.status, url);
      return null;
    }
    const data = await res.json();

    // console.warn("[logbookDetail]", logbookId, { entry_content_len: data?.entry_content?.length });

    const raw = typeof data?.entry_content === "string" ? data.entry_content : "";
    const compact = raw.replace(/\s+/g, " ").trim();
    const excerpt = compact ? compact.slice(0, 160) + (compact.length > 160 ? "…" : "") : "";

    return { ...data, excerpt };
  } catch (e) {
    // console.warn("[logbookDetail] fetch error", String(e));
    return null;
  }
}

async function fetchLocationMeta(id) {
  if (!API_BASE || id === null || id === undefined) return null;
  const url = `${API_BASE.replace(/\/+$/, "")}/locations/${Number(id)}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    });
    if (!res.ok) {
      // console.warn("[locations] !ok", res.status, url);
      return null;
    }

    const data = await res.json();
    const root = data?.location || data;
    const name =
      root.location_name ??
      root.locationName ??
      root.title ??
      root.name ??
      root.locationTitle ??
      "";
    const thumb =
      root.thumbnail_url ??
      root.cover?.thumbnail_url ??
      root.images?.[0]?.thumbnail_url ??
      root.cover?.url ??
      "";

    if (name) LOCATION_NAME_CACHE.set(Number(id), name); // 세션 캐시에 저장

    return { name, thumb };
  } catch (e) {
    // console.warn("[locations] fetch error", String(e));
    return null;
  }
}

export default function JourneyScreen() {
  const [tab, setTab] = useState("mine");
  const [view, setView] = useState("list");

  // 탐험가 탭용 정렬/필터
  const [sort, setSort] = useState("latest");
  const [region, setRegion] = useState(null);
  const [category, setCategory] = useState(null);

  // 내 탭 월 네비
  const [month, setMonth] = useState(new Date());

  const [mineW, setMineW] = useState(0);
  const [expW, setExpW] = useState(0);
  const router = useRouter();

  // ===== 내 로그북 =====
  const [myLogs, setMyLogs] = useState([]);
  const [myPage, setMyPage] = useState(1);
  const [myHasMore, setMyHasMore] = useState(true);
  const [myLoading, setMyLoading] = useState(false);
  const [myRefreshing, setMyRefreshing] = useState(false);
  const fetchedMyLocIdsRef = useRef(new Set());

  // ===== 다른 탐험가 로그북 =====
  const [othersLogs, setOthersLogs] = useState([]);
  const [othersPage, setOthersPage] = useState(1);
  const [othersHasMore, setOthersHasMore] = useState(true);
  const [othersLoading, setOthersLoading] = useState(false);
  const [othersRefreshing, setOthersRefreshing] = useState(false);
  const fetchedOthersLocIdsRef = useRef(new Set());

  // ===== 목록 mapper =====
  function mapApiLogToItem(it) {
    const locId = Number.isFinite(Number(it.location_id)) ? Number(it.location_id) : null;
    return {
      id: String(it.logbook_id),
      locationId: locId,
      thumbnailUri: it.image_urls?.[0] || "",
      title: it.entry_title || "",
      placeText: locId != null ? (LOCATION_NAME_CACHE.get(locId) || "") : "",
      excerpt: "",
      dateText: fmtDateISOToYmd(it.created_at),
      visibility: "public",
      commentsCount: it?.commentsCount ?? 0,
      reactionsCount: it?.likes?.length || 0,
      liked: false,
      authorName: it?.user?.nickname || it?.user_name || "탐험가",
    };
  }

  // ===== 내 로그 불러오기 =====
  const fetchMyLogs = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (!API_BASE || !USER_ID) {
        setMyLogs([]);
        setMyHasMore(false);
        return;
      }
      if (myLoading) return;
      setMyLoading(true);
      try {
        const url =
          `${API_BASE.replace(/\/+$/, "")}/logbooks` +
          `?userId=${USER_ID}&page=${page}&limit=20&order=created_at.desc`;
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
          },
        });
        if (!res.ok) {
          if (!append) setMyLogs([]);
          setMyHasMore(false);
          return;
        }
        const data = await res.json();
        const mapped = (data.items || []).map(mapApiLogToItem);

        setMyLogs((prev) => (append ? [...prev, ...mapped] : mapped));
        setMyHasMore((mapped.length || 0) >= (data.limit || 20));
        setMyPage(page);
      } catch {
        if (!append) setMyLogs([]);
        setMyHasMore(false);
      } finally {
        setMyLoading(false);
        setMyRefreshing(false);
      }
    },
    [myLoading]
  );

  // ===== 다른 탐험가 로그 불러오기 =====
  const fetchOthers = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (!API_BASE) {
        setOthersLogs([]);
        setOthersHasMore(false);
        return;
      }
      if (othersLoading) return;
      setOthersLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
          order: sort === "popular" ? "likes.desc,created_at.desc" : "created_at.desc",
          isPublic: "true",
          ...(USER_ID ? { excludeUserId: String(USER_ID) } : {}),
          ...(region && region !== "all" ? { region } : {}),
          ...(category ? { category } : {}),
        });
        const url = `${API_BASE.replace(/\/+$/, "")}/logbooks?${params.toString()}`;

        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
          },
        });
        if (!res.ok) {
          if (!append) setOthersLogs([]);
          setOthersHasMore(false);
          return;
        }
        const data = await res.json();
        const mapped = (data.items || []).map(mapApiLogToItem);

        setOthersLogs((prev) => (append ? [...prev, ...mapped] : mapped));
        setOthersHasMore((mapped.length || 0) >= (data.limit || 20));
        setOthersPage(page);
      } catch {
        if (!append) setOthersLogs([]);
        setOthersHasMore(false);
      } finally {
        setOthersLoading(false);
        setOthersRefreshing(false);
      }
    },
    [othersLoading, sort, region, category]
  );

  // ===== 탭 최초 로드 =====
  useEffect(() => {
    if (tab === "mine") fetchMyLogs({ page: 1, append: false });
    if (tab === "explorers") fetchOthers({ page: 1, append: false });
  }, [tab, fetchMyLogs, fetchOthers]);

  // ===== 상세 조회로 locationId/thumbnail/excerpt 보강 =====
  function useDetailEnrichment(logs, setLogs) {
    useEffect(() => {
      const needDetailIds = logs
        .filter((it) => !it.locationId || !it.thumbnailUri || !it.excerpt)
        .map((it) => it.id);

      if (needDetailIds.length === 0) return;

      let alive = true;
      (async () => {
        const pairs = await Promise.all(
          needDetailIds.map(async (logbookId) => {
            const detail = await fetchLogbookDetail(logbookId);
            if (!detail)
              return [logbookId, { locId: null, firstImage: "", excerpt: "" }];

            const locId = detail?.location_id ?? detail?.locationId ?? null;
            const firstImage = Array.isArray(detail?.image_urls) ? detail.image_urls[0] : "";

            let ex =
              (typeof detail?.entry_content_head === "string" && detail.entry_content_head.trim()) || "";

            if (!ex && typeof detail?.entry_content === "string") {
              const compact = detail.entry_content.replace(/\s+/g, " ").trim();
              ex = compact ? compact.slice(0, 160) + (compact.length > 160 ? "…" : "") : "";
            }

            return [logbookId, { locId, firstImage, excerpt: ex }];
          })
        );

        if (!alive) return;

        setLogs((prev) =>
          prev.map((it) => {
            const hit = pairs.find(([logId]) => String(logId) === String(it.id));
            if (!hit) return it;

            const [, payload] = hit;
            const { locId, firstImage, excerpt } = payload || {};

            return {
              ...it,
              locationId: Number.isFinite(Number(it.locationId))
                ? Number(it.locationId)
                : Number.isFinite(Number(locId))
                ? Number(locId)
                : null,
              thumbnailUri: it.thumbnailUri || firstImage || it.thumbnailUri,
              excerpt: it.excerpt || excerpt || "",
            };
          })
        );
      })();

      return () => {
        alive = false;
      };
    }, [logs, setLogs]);
  }

  useDetailEnrichment(myLogs, setMyLogs);
  useDetailEnrichment(othersLogs, setOthersLogs);

  // ===== 장소 메타(이름/썸네일) 보강 =====
  function useLocationMetaEnrichment(logs, setLogs, fetchedLocIdsRef) {
    useEffect(() => {
      const ids = logs
        .map((it) => Number(it.locationId))
        .filter((n) => Number.isFinite(n));
      const unique = [...new Set(ids)];
      const need = unique.filter((id) => !fetchedLocIdsRef.current.has(id));
      if (need.length === 0) return;

      let alive = true;
      (async () => {
        const pairs = [];
        for (const id of need) {
          const meta = await fetchLocationMeta(id);
          if (meta?.name) {
            fetchedLocIdsRef.current.add(id); // 성공한 것만 캐시
          }
          pairs.push([id, meta]);
        }

        if (!alive) return;

        const byId = new Map(pairs);

        setLogs((prev) =>
          prev.map((it) => {
            const locNum = Number(it.locationId);
            if (!Number.isFinite(locNum)) return it;
            const meta = byId.get(locNum);
            if (meta === undefined) return it; // 이번 배치 아님
            if (!meta) return it; // 실패: 다음 렌더에서 재시도

            return {
              ...it,
              placeText: it.placeText || meta.name || "",
              thumbnailUri: it.thumbnailUri || meta.thumb || it.thumbnailUri,
            };
          })
        );
      })();

      return () => {
        alive = false;
      };
    }, [logs, setLogs, fetchedLocIdsRef]);
  }

  useLocationMetaEnrichment(myLogs, setMyLogs, fetchedMyLocIdsRef);
  useLocationMetaEnrichment(othersLogs, setOthersLogs, fetchedOthersLocIdsRef);

  // ===== 새로고침 / 페이징 =====
  const onRefreshMine = useCallback(() => {
    setMyRefreshing(true);
    fetchedMyLocIdsRef.current = new Set();
    fetchMyLogs({ page: 1, append: false });
  }, [fetchMyLogs]);

  const onEndReachedMine = useCallback(() => {
    if (tab !== "mine") return;
    if (myLoading || !myHasMore) return;
    fetchMyLogs({ page: myPage + 1, append: true });
  }, [tab, myLoading, myHasMore, myPage, fetchMyLogs]);

  const onRefreshOthers = useCallback(() => {
    setOthersRefreshing(true);
    fetchedOthersLocIdsRef.current = new Set();
    fetchOthers({ page: 1, append: false });
  }, [fetchOthers]);

  const onEndReachedOthers = useCallback(() => {
    if (tab !== "explorers") return;
    if (othersLoading || !othersHasMore) return;
    fetchOthers({ page: othersPage + 1, append: true });
  }, [tab, othersLoading, othersHasMore, othersPage, fetchOthers]);

  // ===== 렌더 데이터 =====
  const listData = useMemo(() => {
    if (tab === "mine") return myLogs;
    return othersLogs;
  }, [tab, myLogs, othersLogs]);

  const goMyDetail = useCallback(
    (item) => {
      router.push({
        pathname: "/my-log/[id]",
        params: {
          id: String(item.id),
          t: item.title || "",
          d: item.dateText || "",
          thumb: item.thumbnailUri || "",
        },
      });
      InteractionManager.runAfterInteractions(() => {});
    },
    [router]
  );

  const { width: SCREEN_W } = Dimensions.get("window");
  const CARD_W = 129;
  const CARD_H = 194;
  const GAP = 8;
  const SIDE = 20;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 탭 + 하단 라인 */}
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
          <Pressable
            onPress={() => setTab("mine")}
            style={{ flex: 1, alignItems: "center", position: "relative", paddingBottom: 8 }}
            hitSlop={8}
          >
            <Text
              onLayout={(e) => setMineW(e.nativeEvent.layout.width)}
              className={["text-heading-2 font-pretendardSemiBold", tab === "mine" ? "text-black" : "text-gray500"].join(" ")}
            >
              내 여정 기록
            </Text>
            {tab === "mine" && (
              <View style={{ position: "absolute", bottom: -1, height: 3, width: mineW, backgroundColor: "#000" }} />
            )}
          </Pressable>

          <Pressable
            onPress={() => setTab("explorers")}
            style={{ flex: 1, alignItems: "center", position: "relative", paddingBottom: 8 }}
            hitSlop={8}
          >
            <Text
              onLayout={(e) => setExpW(e.nativeEvent.layout.width)}
              className={["text-heading-2 font-pretendardSemiBold", tab === "explorers" ? "text-black" : "text-gray500"].join(" ")}
            >
              탐험가들의 기록
            </Text>
            {tab === "explorers" && (
              <View style={{ position: "absolute", bottom: -1, height: 3, width: expW, backgroundColor: "#000" }} />
            )}
          </Pressable>
        </View>
      </View>

      {/* 상단 인트로/요약 */}
      {tab === "mine" ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={CHARACTER} style={{ width: 46, height: 46, resizeMode: "contain" }} />
            <View style={{ marginLeft: 6 }}>
              <Text className="text-gray700 text-body-2 font-pretendardMedium">포슬감자님,</Text>
              <Text className="text-gray700 text-body-2 font-pretendardMedium">오늘은 어떤 곳을 탐험하셨나요?</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", marginTop: 13 }}>
            {[
              { label: "작성한 기록", value: myLogs.length },
              { label: "받은 감정", value: 0 },
              { label: "표시한 감정", value: 0 },
            ].map((s, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <Text className="text-heading-2 text-yellow900 font-pretendardSemiBold">{s.value}</Text>
                <Text className="text-gray700 text-body-2  font-pretendardMedium mt-[5px]">{s.label}</Text>
              </View>
            ))}
          </View>

          <View
            style={{
              height: 10,
              backgroundColor: "#F4F4F4",
              marginTop: 12,
              marginHorizontal: -20,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: "absolute", left: 0, right: 0, top: 1, height: 4 }}
            />
          </View>
        </View>
      ) : (
        <View style={{ paddingTop: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingBottom: 13,
              borderBottomWidth: 1,
              borderBottomColor: "#D4D4D4",
            }}
          >
            <Image source={CHARACTER} style={{ width: 46, height: 46, resizeMode: "contain" }} />
            <Text className="text-gray700 text-body-2 font-pretendardMedium" style={{ marginLeft: 6 }}>
              다른 탐험가들의 여정 기록을 살펴보세요!
            </Text>
          </View>

          {/* 릴스 캐러셀 (임시) */}
          <FlatList
            data={[{ id: "r1", thumbnail: FALLBACK_THUMB, title: "기록 제목" }]}
            keyExtractor={(it) => it.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SIDE,
              paddingVertical: 15,
              backgroundColor: "#F4F4F4",
              borderBottomWidth: 1,
              borderBottomColor: "#D4D4D4",
            }}
            ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
            snapToAlignment="start"
            decelerationRate="fast"
            snapToInterval={CARD_W + GAP}
            renderItem={({ item }) => (
              <Pressable onPress={() => {}} style={{ width: CARD_W }}>
                <View
                  style={{
                    width: CARD_W,
                    height: CARD_H,
                    borderRadius: 5,
                    overflow: "hidden",
                    backgroundColor: "#EDEDED",
                  }}
                >
                  <ImageBackground
                    source={item.thumbnail}
                    style={{ flex: 1 }}
                    imageStyle={{ width: CARD_W, height: CARD_H, resizeMode: "cover" }}
                  >
                    <LinearGradient
                      colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"]}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 60,
                        paddingHorizontal: 10,
                        justifyContent: "flex-end",
                        paddingBottom: 8,
                      }}
                    >
                      <Text numberOfLines={1} style={{ color: "#fff", fontFamily: "Pretendard-SemiBold", fontSize: 14 }}>
                        {item.title}
                      </Text>
                    </LinearGradient>
                  </ImageBackground>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* 상단 컨트롤 줄 (mine) */}
      {tab === "mine" ? (
        <View
          style={{
            paddingHorizontal: 15,
            paddingTop: 25,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              hitSlop={10}
            >
              <Icon name="triangle" width={8} height={9} />
            </Pressable>
            <Text className="text-title-1 font-pretendardExtraBold" style={{ marginHorizontal: 10 }}>
              {formatYM(month)}
            </Text>
            <Pressable
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              hitSlop={10}
            >
              <Icon name="triangle" width={8} height={9} style={{ transform: [{ scaleX: -1 }] }} />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable onPress={() => setView(view === "list" ? "board" : "list")} style={{ marginRight: 12 }} hitSlop={10}>
              <Icon name={view === "list" ? "grid" : "list"} width={22} height={22} />
            </Pressable>
            <Pressable onPress={() => {}} hitSlop={10}>
              <Icon name="calendar" width={34} height={34} strokeColor="#AFAFAF" />
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* 드롭다운 줄 */}
      <View
        style={{
          paddingHorizontal: 15,
          paddingTop: tab === "mine" ? 8 : 23,
          paddingBottom: tab === "mine" ? 25 : 28,
          flexDirection: tab === "mine" ? "column" : "row",
          alignItems: tab === "mine" ? "stretch" : "center",
          columnGap: 8,
        }}
      >
        <SortDropdown
          value={sort}
          onChange={(v) => {
            setSort(v);
            if (tab === "explorers") fetchOthers({ page: 1, append: false });
          }}
          options={[
            { label: "최신순", value: "latest" },
            { label: "인기순", value: "popular" },
          ]}
        />
        {tab === "explorers" && (
          <>
            <SortDropdown
              value={region}
              onChange={(v) => {
                setRegion(v);
                fetchOthers({ page: 1, append: false });
              }}
              options={[
                { label: "지역별", value: null },
                { label: "전국", value: "all" },
                { label: "서울", value: "seoul" },
                { label: "경기", value: "gyeonggi" },
                { label: "인천", value: "incheon" },
                { label: "부산", value: "busan" },
              ]}
            />
            <SortDropdown
              value={category}
              onChange={(v) => {
                setCategory(v);
                fetchOthers({ page: 1, append: false });
              }}
              options={[
                { label: "카테고리", value: null },
                { label: "카페", value: "cafe" },
                { label: "쇼핑", value: "shopping" },
                { label: "먹거리", value: "food" },
                { label: "체험", value: "activity" },
                { label: "전시", value: "exhibit" },
                { label: "독서/공부", value: "study" },
                { label: "산책", value: "walk" },
              ]}
            />

            <Pressable onPress={() => setView(view === "list" ? "board" : "list")} hitSlop={10} style={{ marginLeft: "auto" }}>
              <Icon name={view === "list" ? "grid" : "list"} width={22} height={22} />
            </Pressable>
          </>
        )}
      </View>

      {/* 리스트 / 보드 */}
      {view === "list" ? (
        <FlatList
          key="list"
          data={listData}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 110 }}
          ItemSeparatorComponent={() => <View style={{ height: 29 }} />}
          showsVerticalScrollIndicator={false}
          onRefresh={tab === "mine" ? onRefreshMine : onRefreshOthers}
          refreshing={tab === "mine" ? myRefreshing : othersRefreshing}
          onEndReached={tab === "mine" ? onEndReachedMine : onEndReachedOthers}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) =>
            tab === "mine" ? (
              <LogListCard
                isMine
                thumbnail={item.thumbnailUri ? { uri: item.thumbnailUri } : null}
                placeholderImage={MONKEY_PLACEHOLDER}
                placeholderBg="#D9D9D9"
                title={item.title}
                placeText={item.placeText}
                dateText={item.dateText}
                visibility={item.visibility}
                commentsCount={item.commentsCount}
                reactionsCount={item.reactionsCount}
                liked={item.liked}
                onPress={() => goMyDetail(item)}
              />
            ) : (
              <LogListCard
                thumbnail={item.thumbnailUri ? { uri: item.thumbnailUri } : null}
                placeholderImage={MONKEY_PLACEHOLDER}
                placeholderBg="#D9D9D9"
                title={item.title}
                placeText={item.placeText}
                dateText={item.dateText}
                authorName={item.authorName}
                commentsCount={item.commentsCount}
                reactionsCount={item.reactionsCount}
                bookmarked={item.liked}
                onPress={() => {
                  router.push({ pathname: "/explorer/[id]", params: { id: String(item.id) } });
                }}
              />
            )
          }
        />
      ) : (
        <FlatList
          key="board"
          data={tab === "mine" ? myLogs : othersLogs}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{
            paddingHorizontal: tab === "explorers" ? 25 : 15,
            paddingBottom: 110,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <LogBoardCard
              isMine={tab === "mine"} // 내 탭이면 상단 프로필/날짜/북마크 숨김
              profileImage={CHARACTER}
              authorName={tab === "mine" ? "나" : item.authorName}
              placeholderImage={MONKEY_PLACEHOLDER_BOARD}
              placeholderBg="#D9D9D9"
              thumbnail={item.thumbnailUri ? { uri: item.thumbnailUri } : null}
              title={item.title}
              placeText={item.placeText}
              dateText={item.dateText}
              excerpt={item.excerpt}
              liked={item.liked}
              onPress={() => {
                const pathname = tab === "mine" ? "/my-log/[id]" : "/explorer/[id]";
                router.push({ pathname, params: { id: String(item.id) } });
              }}
              style={{ width: "100%" }}
            />
          )}
        />
      )}

      {/* 플로팅 버튼 */}
      {tab === "mine" && (
        <FloatingButton
          onPress={() => router.push("/journey-create")}
          label="+100 EXP"
          showLabel
          bottom={24}
          right={15}
          size={50}
          bubbleOffsetX={0}
          bubbleOffsetY={10}
        />
      )}
    </SafeAreaView>
  );
}