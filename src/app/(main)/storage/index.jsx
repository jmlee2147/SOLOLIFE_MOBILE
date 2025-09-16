import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    Pressable,
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
const H_PADDING = 16;
const ITEM_W = (SCREEN_W - H_PADDING * 2 - GAP * (COLS - 1)) / COLS;

// 데모용 루트 목록 (서버 연동 전)
const MOCK_ROUTES = [
  {
    id: "j101",
    title: "전시투어",
    date: "2025-08-29",
    placeSummary: "어쩌구미술관-저쩌구미술관-어쩌구박물관",
    thumbs: [
      require("../../../assets/images/sample.png"),
      require("../../../assets/images/sample.png"),
      require("../../../assets/images/sample.png"),
    ],
  },
  {
    id: "j102",
    title: "야외산책",
    date: "2025-08-29",
    placeSummary: "호수공원-사찰-수변산책로",
    thumbs: [
      require("../../../assets/images/sample.png"),
      require("../../../assets/images/sample.png"),
      require("../../../assets/images/sample.png"),
    ],
  },
];

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

  // 데이터 (로컬 즐찾 / Journeys)
  const [favoritePlaces, setFavoritePlaces] = useState([]);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    // 로컬 즐찾 불러오기
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("favorites");
        const list = raw ? JSON.parse(raw) : [];
        setFavoritePlaces(
          list.map((it, idx) => ({
            id: String(it.location_id ?? idx),
            title: it.name ?? "모든장소",
            count: it.count ?? Math.floor(Math.random() * 95) + 1,
            thumb: it.thumb ?? SAMPLE,
          }))
        );
      } catch {}
    })();
  }, []);

  useEffect(() => {
    // TODO: GET /journeys → setRoutes(items.map(...))
    setRoutes(MOCK_ROUTES);
  }, []);

  // 탭별 데이터 선택 + 정렬
  const data = useMemo(() => {
    const list = tab === "place" ? favoritePlaces : routes;
    if (sortKey === "name") {
      return [...list].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    return [...list].reverse();
  }, [favoritePlaces, routes, tab, sortKey]);

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
            <Text
              className="text-heading-3 font-pretendardSemiBold"
              style={{ color: tab === "place" ? "#000" : "#AFAFAF" }}
            >
              장소
            </Text>
            {tab === "place" && (
              <View
                style={{
                  position: "absolute",
                  bottom: -1,
                  height: 2,
                  width: SCREEN_W / 2,
                  backgroundColor: "#000",
                }}
              />
            )}
          </Pressable>

          {/* 루트 탭 */}
          <Pressable
            onPress={() => setTab("route")}
            style={{ flex: 1, alignItems: "center", position: "relative", paddingBottom: 8 }}
            hitSlop={8}
          >
            <Text
              className="text-heading-3 font-pretendardSemiBold"
              style={{ color: tab === "route" ? "#000" : "#AFAFAF" }}
            >
              루트
            </Text>
            {tab === "route" && (
              <View
                style={{
                  position: "absolute",
                  bottom: -1,
                  height: 2,
                  width: SCREEN_W / 2,
                  backgroundColor: "#000",
                }}
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* Toolbar: 정렬 / 편집 */}
      <View style={styles.toolbarRow}>
        <SortDropdown value={sortKey} onChange={(v) => setSortKey(v)} options={latestOptions} />
        <Pressable
          style={styles.editBtn}
          onPress={() => {
            /* 편집 모드 토글 예정 */
          }}
        >
          <Text className="text-body-2 font-pretendardMedium">편집</Text>
        </Pressable>
      </View>

      {/* 콘텐츠: 장소 그리드 / 루트 리스트 */}
      {tab === "place" ? (
        <FlatList
          data={data}
          key="place-grid"
          keyExtractor={(item) => item.id}
          numColumns={COLS}
          contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingTop: 8, paddingBottom: 24 }}
          columnWrapperStyle={{ gap: GAP }}
          renderItem={({ item }) => (
            <GridItem
              title={item.title}
              count={item.count}
              source={item.thumb}
              onPress={() => {
                // router.push(`/place/${item.id}`)
              }}
            />
          )}
          ListEmptyComponent={<Empty tab="place" />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={data}
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
                router.push({ pathname: "/(main)/storage/route/[id]", params: { id: item.id } })
              }
            />
          )}
          ListEmptyComponent={<Empty tab="route" />}
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

function GridItem({ title, source, count, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ width: ITEM_W }}>
      <View style={styles.thumbWrap}>
        <Image source={source} style={styles.thumb} resizeMode="cover" />
        {typeof count === "number" && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={styles.itemTitle} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

function RouteRow({ title, placeSummary, date, thumbs = [], onPress }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: "#fff" }}>
      {/* 썸네일 3개 가로 */}
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

      {/* 타이틀 & 날짜 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginTop: 5,
        }}
      >
        <Text className="text-heading-1 font-pretendardSemiBold">
          {title}
        </Text>
        <Text className="text-caption font-pretendardRegular text-gray700">
          {date}
        </Text>
      </View>

      {/* 장소 요약 */}
      <Text
        numberOfLines={1}
        className="text-body-3 font-pretendardRegular"
      >
        {placeSummary}
      </Text>

      {/* 구분선 */}
      <View style={{ height: 1, backgroundColor: "#D4D4D4", marginTop: 15, marginHorizontal: -25, }} />
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

  thumbWrap: {
    width: ITEM_W,
    height: ITEM_W,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EEE",
  },
  thumb: { width: "100%", height: "100%" },
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