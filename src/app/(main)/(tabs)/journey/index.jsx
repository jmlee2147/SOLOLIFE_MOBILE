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

// ===== ENV =====
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;
const TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN;
const USER_ID = Number(process.env.EXPO_PUBLIC_TEST_USER_ID || 1);

// ===== 데모 목업(탐험가 탭/보드용만 유지) =====
const MOCK_OTHERS = Array.from({ length: 10 }).map((_, i) => ({
  id: `oth-${i}`,
  profileImage: require("../../../../assets/images/explorer.png"),
  authorName: i % 2 ? "배고픈여우" : "배고픈판다",
  thumbnail: null,
  title: "주말 기록",
  placeText: i % 2 ? "55데시벨, 부타센세" : "55데시벨, 맥도날드",
  dateText: "2025.08.31",
  excerpt: "오늘은 카페에서 하루 종일 공부하고, 저녁엔 햄버거를 먹었다...",
  liked: i === 2,
}));

const MOCK_REELS = [
  { id: "reel-1", thumbnail: FALLBACK_THUMB, title: "기록 제목" },
  { id: "reel-2", thumbnail: FALLBACK_THUMB, title: "기록 제목" },
  { id: "reel-3", thumbnail: FALLBACK_THUMB, title: "기록 제목" },
  { id: "reel-4", thumbnail: FALLBACK_THUMB, title: "기록 제목" },
];

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
    console.warn("[logbook] HTTP status", res.status, url);
    if (!res.ok) return null;
    return await res.json(); // { location_id, image_urls, ... }
  } catch (e) {
    console.warn("[logbook] fetch error", String(e));
    return null;
  }
}

async function fetchLocationMeta(id) {
  if (!API_BASE || !id) return null;
  const url = `${API_BASE.replace(/\/+$/, "")}/locations/${id}`;
  try {
    console.warn("[locations] fetchLocationMeta called with id=", id);
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    });
    console.warn("[locations] HTTP status", res.status, url);
    if (!res.ok) return null;

    const data = await res.json();
    console.warn("[locations] raw data for", id, data);

    const name =
      data.location_name || data.title || data.name || data.locationTitle || ""; // 안전 매핑

    const thumb =
      data.thumbnail_url ||
      data.cover?.thumbnail_url ||
      data.images?.[0]?.thumbnail_url ||
      data.cover?.url ||
      "";

    return { name, thumb };
  } catch (e) {
    console.warn("[locations] fetch error", String(e));
    return null;
  }
}

export default function JourneyScreen() {
  const [tab, setTab] = useState("mine"); // 기본 mine로 시작
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

  // ===== 내 로그북 상태/로딩/페이징 =====
  const [myLogs, setMyLogs] = useState([]); // [{ id, locationId, thumbnailUri, title, placeText, dateText, ... }]
  const [myPage, setMyPage] = useState(1);
  const [myHasMore, setMyHasMore] = useState(true);
  const [myLoading, setMyLoading] = useState(false);
  const [myRefreshing, setMyRefreshing] = useState(false);

  // 이미 조회한 locationId(중복 호출 방지)
  const fetchedLocIdsRef = useRef(new Set());

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
          const body = await res.text().catch(() => "");
          console.warn("[mine] GET /logbooks error", res.status, body);
          if (!append) setMyLogs([]);
          setMyHasMore(false);
          return;
        }
        const data = await res.json();

        const mapped = (data.items || []).map((it) => ({
          id: String(it.logbook_id),
          locationId: it.location_id ?? null, // 목록에 없으면 null
          thumbnailUri: it.image_urls?.[0] || "",
          title: it.entry_title || "",
          placeText: "", // ⚠️ 초기에 비워두기: 깜빡임/루프 방지
          dateText: fmtDateISOToYmd(it.created_at),
          visibility: "public",
          commentsCount: it?.commentsCount ?? 0,
          reactionsCount: it?.likes?.length || 0,
          liked: false,
        }));

        setMyLogs((prev) => (append ? [...prev, ...mapped] : mapped));
        setMyHasMore((mapped.length || 0) >= (data.limit || 20));
        setMyPage(page);
      } catch (e) {
        console.warn("[mine] fetch error", String(e));
        if (!append) setMyLogs([]);
        setMyHasMore(false);
      } finally {
        setMyLoading(false);
        setMyRefreshing(false);
      }
    },
    [myLoading]
  );

  // 탭이 mine일 때 최초 로드
  useEffect(() => {
    if (tab === "mine") fetchMyLogs({ page: 1, append: false });
  }, [tab, fetchMyLogs]);

  // ① 상세 조회로 locationId/thumbnail 보강
  useEffect(() => {
    const needDetailIds = myLogs
      .filter((it) => !it.locationId || !it.thumbnailUri)
      .map((it) => it.id);

    if (needDetailIds.length === 0) return;

    let alive = true;
    (async () => {
      const pairs = await Promise.all(
        needDetailIds.map(async (logbookId) => {
          const detail = await fetchLogbookDetail(logbookId);
          const locId = detail?.location_id ?? detail?.locationId ?? null;
          const firstImage = Array.isArray(detail?.image_urls)
            ? detail.image_urls[0]
            : "";
          return [logbookId, locId, firstImage];
        })
      );

      if (!alive) return;

      setMyLogs((prev) =>
        prev.map((it) => {
          const hit = pairs.find(([logId]) => String(logId) === String(it.id));
          if (!hit) return it;
          const [, locId, firstImg] = hit;
          return {
            ...it,
            locationId: it.locationId || (locId ?? null),
            thumbnailUri: it.thumbnailUri || firstImg || it.thumbnailUri,
          };
        })
      );
    })();

    return () => {
      alive = false;
    };
  }, [myLogs]);

  // ② 장소 메타(이름/썸네일) 통합 보강 — 단일 이펙트
  useEffect(() => {
    // 아직 조회 안 한 locationId 수집
    const need = [
      ...new Set(
        myLogs
          .filter(
            (it) =>
              it.locationId &&
              !fetchedLocIdsRef.current.has(Number(it.locationId))
          )
          .map((it) => Number(it.locationId))
      ),
    ];
    if (need.length === 0) return;

    // 중복 호출 방지 마킹
    need.forEach((id) => fetchedLocIdsRef.current.add(id));

    let alive = true;
    (async () => {
      const pairs = await Promise.all(
        need.map(async (id) => [id, await fetchLocationMeta(id)])
      );

      if (!alive) return;

      const byId = new Map(pairs); // id -> {name, thumb} | null

      setMyLogs((prev) =>
        prev.map((it) => {
          if (!it.locationId) return it;
          const meta = byId.get(Number(it.locationId));
          if (meta === undefined) return it; // 이번 배치 대상 아님

          // 실패 시엔 마지막에만 “알 수 없는 탐험지”로 채움(깜빡임 방지)
          if (!meta) {
            if (!it.placeText) return { ...it, placeText: "알 수 없는 탐험지" };
            return it;
          }

          // 성공: 이름/썸네일 보강
          return {
            ...it,
            placeText: meta.name || it.placeText || `장소 #${it.locationId}`,
            thumbnailUri: it.thumbnailUri || meta.thumb || it.thumbnailUri,
          };
        })
      );
    })();

    return () => {
      alive = false;
    };
  }, [myLogs]);

  const onRefreshMine = useCallback(() => {
    setMyRefreshing(true);
    // 새로고침 시, 중복 방지 캐시 초기화해서 이름도 다시 시도하게 할 수 있음(선택)
    fetchedLocIdsRef.current = new Set();
    fetchMyLogs({ page: 1, append: false });
  }, [fetchMyLogs]);

  const onEndReachedMine = useCallback(() => {
    if (tab !== "mine") return;
    if (myLoading || !myHasMore) return;
    fetchMyLogs({ page: myPage + 1, append: true });
  }, [tab, myLoading, myHasMore, myPage, fetchMyLogs]);

  // ===== 리스트 데이터 소스 =====
  const listData = useMemo(() => {
    const base = tab === "mine" ? myLogs : MOCK_OTHERS;
    if (tab === "explorers") {
      const sorted = sort === "popular" ? [...base].reverse() : base; // 데모용
      return sorted;
    }
    return base;
  }, [tab, sort, myLogs]);

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

  // 릴스 카드 레이아웃
  const { width: SCREEN_W } = Dimensions.get("window");
  const CARD_W = 129;
  const CARD_H = 194;
  const GAP = 8;
  const SIDE = 20;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 탭 + 하단 라인 */}
      <View
        style={{ position: "relative", paddingHorizontal: 25, paddingTop: 8 }}
      >
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
            style={{
              flex: 1,
              alignItems: "center",
              position: "relative",
              paddingBottom: 8,
            }}
            hitSlop={8}
          >
            <Text
              onLayout={(e) => setMineW(e.nativeEvent.layout.width)}
              className={[
                "text-heading-2 font-pretendardSemiBold",
                tab === "mine" ? "text-black" : "text-gray500",
              ].join(" ")}
            >
              내 여정 기록
            </Text>
            {tab === "mine" && (
              <View
                style={{
                  position: "absolute",
                  bottom: -1,
                  height: 3,
                  width: mineW,
                  backgroundColor: "#000",
                }}
              />
            )}
          </Pressable>

          <Pressable
            onPress={() => setTab("explorers")}
            style={{
              flex: 1,
              alignItems: "center",
              position: "relative",
              paddingBottom: 8,
            }}
            hitSlop={8}
          >
            <Text
              onLayout={(e) => setExpW(e.nativeEvent.layout.width)}
              className={[
                "text-heading-2 font-pretendardSemiBold",
                tab === "explorers" ? "text-black" : "text-gray500",
              ].join(" ")}
            >
              탐험가들의 기록
            </Text>
            {tab === "explorers" && (
              <View
                style={{
                  position: "absolute",
                  bottom: -1,
                  height: 3,
                  width: expW,
                  backgroundColor: "#000",
                }}
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* 상단 인트로/요약 */}
      {tab === "mine" ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={CHARACTER}
              style={{ width: 46, height: 46, resizeMode: "contain" }}
            />
            <View style={{ marginLeft: 6 }}>
              <Text className="text-gray700 text-body-2 font-pretendardMedium">
                포슬감자님,
              </Text>
              <Text className="text-gray700 text-body-2 font-pretendardMedium">
                오늘은 어떤 곳을 탐험하셨나요?
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", marginTop: 13 }}>
            {[
              { label: "작성한 기록", value: myLogs.length },
              { label: "받은 감정", value: 0 },
              { label: "표시한 감정", value: 0 },
            ].map((s, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <Text className="text-heading-2 text-yellow900 font-pretendardSemiBold">
                  {s.value}
                </Text>
                <Text className="text-gray700 text-body-2  font-pretendardMedium mt-[5px]">
                  {s.label}
                </Text>
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
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 1,
                height: 4,
              }}
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
            <Image
              source={CHARACTER}
              style={{ width: 46, height: 46, resizeMode: "contain" }}
            />
            <Text
              className="text-gray700 text-body-2 font-pretendardMedium"
              style={{ marginLeft: 6 }}
            >
              다른 탐험가들의 여정 기록을 살펴보세요!
            </Text>
          </View>

          {/* 릴스 캐러셀 */}
          <FlatList
            data={MOCK_REELS}
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
                    imageStyle={{
                      width: CARD_W,
                      height: CARD_H,
                      resizeMode: "cover",
                    }}
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
                      <Text
                        numberOfLines={1}
                        style={{
                          color: "#fff",
                          fontFamily: "Pretendard-SemiBold",
                          fontSize: 14,
                        }}
                      >
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
              onPress={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
              hitSlop={10}
            >
              <Icon name="triangle" width={8} height={9} />
            </Pressable>
            <Text
              className="text-title-1 font-pretendardExtraBold"
              style={{ marginHorizontal: 10 }}
            >
              {formatYM(month)}
            </Text>
            <Pressable
              onPress={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
              hitSlop={10}
            >
              <Icon
                name="triangle"
                width={8}
                height={9}
                style={{ transform: [{ scaleX: -1 }] }}
              />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() => setView(view === "list" ? "board" : "list")}
              style={{ marginRight: 12 }}
              hitSlop={10}
            >
              <Icon
                name={view === "list" ? "grid" : "list"}
                width={22}
                height={22}
              />
            </Pressable>
            <Pressable onPress={() => {}} hitSlop={10}>
              <Icon
                name="calendar"
                width={34}
                height={34}
                strokeColor="#AFAFAF"
              />
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* 드롭다운 줄 */}
      {tab === "mine" ? (
        <View
          style={{ paddingHorizontal: 15, paddingTop: 8, paddingBottom: 25 }}
        >
          <SortDropdown
            value={sort}
            onChange={(v) => setSort(v)}
            options={[
              { label: "최신순", value: "latest" },
              { label: "인기순", value: "popular" },
            ]}
          />
        </View>
      ) : (
        <View
          style={{
            paddingHorizontal: 15,
            paddingTop: 23,
            paddingBottom: 28,
            flexDirection: "row",
            alignItems: "center",
            columnGap: 8,
          }}
        >
          <SortDropdown
            value={sort}
            onChange={(v) => setSort(v)}
            options={[
              { label: "최신순", value: "latest" },
              { label: "인기순", value: "popular" },
            ]}
          />
          <SortDropdown
            value={region}
            onChange={(v) => setRegion(v)}
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
            onChange={(v) => setCategory(v)}
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

          <Pressable
            onPress={() => setView(view === "list" ? "board" : "list")}
            hitSlop={10}
            style={{ marginLeft: "auto" }}
          >
            <Icon
              name={view === "list" ? "grid" : "list"}
              width={22}
              height={22}
            />
          </Pressable>
        </View>
      )}

      {/* 리스트 / 보드 */}
      {view === "list" ? (
        <FlatList
          key="list"
          data={listData}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 110 }}
          ItemSeparatorComponent={() => <View style={{ height: 29 }} />}
          showsVerticalScrollIndicator={false}
          onRefresh={tab === "mine" ? onRefreshMine : undefined}
          refreshing={tab === "mine" ? myRefreshing : false}
          onEndReached={tab === "mine" ? onEndReachedMine : undefined}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) =>
            tab === "mine" ? (
              <LogListCard
                isMine
                thumbnail={
                  item.thumbnailUri ? { uri: item.thumbnailUri } : null
                }
                placeholderImage={MONKEY_PLACEHOLDER}
                placeholderBg="#D9D9D9" // ✅ 오타 수정(plaeholderBg → placeholderBg)
                title={item.title}
                placeText={item.placeText}
                dateText={item.dateText}
                visibility={item.visibility}
                commentsCount={item.commentsCount}
                reactionsCount={item.reactionsCount}
                liked={item.liked}
                onPress={() => {
                  router.push({
                    pathname: "/my-log/[id]",
                    params: {
                      id: String(item.id),
                      t: item.title || "",
                      d: item.dateText || "",
                      thumb: item.thumbnailUri || "",
                    },
                  });
                }}
              />
            ) : (
              <LogListCard
                thumbnail={item.thumbnail ? item.thumbnail : null}
                placeholderImage={MONKEY_PLACEHOLDER}
                placeholderBg="#F4F4F4"
                title={item.title}
                placeText={item.placeText}
                dateText={item.dateText}
                authorName={item.authorName}
                commentsCount={3}
                reactionsCount={5}
                bookmarked={item.liked}
                onPress={() => {
                  router.push({
                    pathname: "/explorer/[id]",
                    params: { id: String(item.id) },
                  });
                }}
              />
            )
          }
        />
      ) : (
        <FlatList
          key="board"
          data={MOCK_OTHERS}
          contentContainerStyle={{
            paddingHorizontal: tab === "explorers" ? 25 : 15,
            paddingBottom: 110,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <LogBoardCard
              profileImage={item.profileImage}
              authorName={item.authorName}
              placeholderImage={MONKEY_PLACEHOLDER}
              placeholderBg="#F4F4F4"
              thumbnail={item.thumbnail}
              title={item.title}
              placeText={item.placeText}
              dateText={item.dateText}
              excerpt={item.excerpt}
              liked={item.liked}
              onPress={() => {
                router.push({
                  pathname: "/explorer/[id]",
                  params: { id: String(item.id) },
                });
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
