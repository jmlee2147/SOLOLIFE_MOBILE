import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView from "../../../components/map/MapView";
import RouteStepCard from "../../../components/route/RouteStepCard";
import Header from "../../../components/shared/Header";
import { postRouteNext } from "../../../services/api";

/** ---- 안전 폴백 ---- */
const FALLBACK_FIRST = {
  id: 1,
  location_id: 1,
  title: "55데시벨",
  rating: 4.5,
  categories: ["카페", "디저트"],
  address: "경기도 수원시 영통구",
  imageSource: null,
  lat: 37.248492,
  lng: 127.076754,
};
const FALLBACK_OTHERS = [
  {
    id: 2,
    location_id: 2,
    title: "앤드카페",
    rating: 4.2,
    categories: ["카페"],
    address: "경기도 수원시 영통구",
    imageSource: null,
    lat: 37.2512,
    lng: 127.0719,
  },
  {
    id: 3,
    location_id: 3,
    title: "북서울꿈의숲",
    rating: 4.7,
    categories: ["공원"],
    address: "서울 강북구",
    imageSource: null,
    lat: 37.6512,
    lng: 127.0386,
  },
];

const DBG = true;
const log = (...a) => DBG && console.log("[summary]", ...a);

/** 백엔드 응답 → 화면 카드로 매핑 */
function mapApiItemToCard(item, stepIndexBase = 2) {
  const photo = Array.isArray(item?.photos) && item.photos[0];
  const imageSource =
    photo && typeof photo === "string" && /^https?:\/\//i.test(photo)
      ? { uri: photo }
      : null;
  const lat = Number(item?.latitude ?? item?.lat);
  const lng = Number(item?.longitude ?? item?.lng);

  return {
    id: item?.location_id ?? `${stepIndexBase}-${Math.random()}`,
    location_id: item?.location_id,
    title: item?.location_name ?? "이름없음",
    rating: item?.rating_avg ?? undefined,
    categories: item?.category ? [item.category] : [],
    address: item?.address ?? "",
    imageSource,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  };
}

export default function RouteSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    log("params =", JSON.stringify(params));
  }, [params]);

  const parsedArray = (v) => {
    if (!v) return [];
    try {
      const a = JSON.parse(String(v));
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  };

  const prefetchedItems = useMemo(
    () => parsedArray(params.prefetched),
    [params.prefetched]
  );

  // 무드
  const moods = parsedArray(params.moodsKo).concat(parsedArray(params.moods));
  useEffect(() => {
    log("moods =", moods);
  }, [moods]);

  // 첫 장소
  const first = useMemo(() => {
    if (params.first) {
      try {
        const raw = decodeURIComponent(String(params.first));
        const obj = JSON.parse(raw);
        const lat = Number(obj.latitude ?? obj.lat);
        const lng = Number(obj.longitude ?? obj.lng);
        const p0 = Array.isArray(obj?.photos) && obj.photos[0];
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return {
            id: Number(obj.location_id) || Date.now(),
            location_id: Number(obj.location_id) || Date.now(),
            title: String(obj.location_name ?? "이름없음"),
            rating: obj.rating_avg ?? undefined,
            categories: obj.category ? [String(obj.category)] : [],
            address: String(obj.address ?? ""),
            imageSource: p0 ? { uri: p0 } : null,
            lat,
            lng,
          };
        }
      } catch {}
    }
    const lat = Number(params.firstLat);
    const lng = Number(params.firstLng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return {
        ...FALLBACK_FIRST,
        id: params.firstId ? Number(params.firstId) : FALLBACK_FIRST.id,
        location_id: params.firstId
          ? Number(params.firstId)
          : FALLBACK_FIRST.location_id,
        title: params.firstName
          ? String(params.firstName)
          : FALLBACK_FIRST.title,
        categories: params.firstCategory
          ? [String(params.firstCategory)]
          : FALLBACK_FIRST.categories,
        lat,
        lng,
      };
    }
    return FALLBACK_FIRST;
  }, [
    params.first,
    params.firstId,
    params.firstName,
    params.firstCategory,
    params.firstLat,
    params.firstLng,
  ]);

  useEffect(() => {
    log("first =", first);
  }, [first]);

  const region =
    typeof params.region === "string" && params.region.trim()
      ? String(params.region)
      : "경기도 수원시 영통구";

  // 미리 넘겨준 후보들
  const prefetchedMapped = useMemo(
    () =>
      (prefetchedItems || [])
        .slice(0, 2)
        .map((it, idx) => mapApiItemToCard(it, 2 + idx))
        .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng)),
    [prefetchedItems]
  );
  const hasPrefetched = prefetchedMapped.length > 0;

  const [items, setItems] = useState(
    hasPrefetched ? [first, ...prefetchedMapped] : [first]
  );
  const [loading, setLoading] = useState(!hasPrefetched);
  const [err, setErr] = useState("");

  // API 호출
  const didRunRef = useRef(false);
  useEffect(() => {
    if (hasPrefetched) {
      didRunRef.current = true;
      setItems((prev) =>
        prev.length >= 3 ? prev : [first, ...prefetchedMapped]
      );
      setLoading(false);
      return;
    }
    if (didRunRef.current) return;
    didRunRef.current = true;

    let canceled = false;

    async function fetchNextCandidates() {
      const baseReq = {
        moods,
        exclude_location_ids: first.location_id ? [first.location_id] : [],
        exclude_categories:
          Array.isArray(first.categories) && first.categories.length
            ? [first.categories[0]]
            : [],
        center: { lat: first.lat, lng: first.lng },
      };

      const tries = [
        { ...baseReq, region, radius_km: 3 },
        { ...baseReq, region, radius_km: 5 },
        { ...baseReq, region, radius_km: 8, exclude_categories: [] },
        { ...baseReq, radius_km: 8, exclude_categories: [] },
      ];

      let merged = [];
      for (const t of tries) {
        if (canceled) break;
        try {
          const res = await postRouteNext(t);
          const arr = Array.isArray(res?.items) ? res.items : [];
          merged = merged.concat(arr);
          if (merged.length >= 2) break;
        } catch {}
      }

      // 중복 제거
      const uniq = [];
      const seen = new Set();
      for (const it of merged) {
        const id = it?.location_id ?? `${it?.location_name}-${it?.category}`;
        if (seen.has(id)) continue;
        seen.add(id);
        uniq.push(it);
        if (uniq.length >= 2) break;
      }
      return uniq;
    }

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const apiItems = await fetchNextCandidates();
        const mapped =
          (apiItems || [])
            .map((it, idx) => mapApiItemToCard(it, 2 + idx))
            .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng)) ??
          [];

        let next = [first, ...mapped];
        if (next.length < 3) {
          const need = 3 - next.length;
          next = [...next, ...FALLBACK_OTHERS.slice(0, need)];
        }
        if (!canceled) {
          setItems(next);
        }
      } catch (e) {
        if (!canceled) {
          setErr(e?.message || "추천을 불러오지 못했어요.");
          setItems([first, ...FALLBACK_OTHERS]);
        }
      } finally {
        !canceled && setLoading(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [hasPrefetched, first, prefetchedMapped, moods, region]);

  /** 지도 마커 */
  const markers = useMemo(() => {
    return items
      .map((p, i) => ({
        id: String(p.location_id ?? i),
        lat: Number(p.lat),
        lng: Number(p.lng),
        name: p.title,
      }))
      .filter(
        (m) =>
          Number.isFinite(m.lat) &&
          Number.isFinite(m.lng) &&
          !(m.lat === 0 && m.lng === 0)
      );
  }, [items]);

  const numberedMarkers = useMemo(
    () => markers.map((m, idx) => ({ ...m, label: String(idx + 1) })),
    [markers]
  );
  const markersKey = useMemo(
    () => JSON.stringify(numberedMarkers.map((m) => [m.lat, m.lng, m.label])),
    [numberedMarkers]
  );

  const locationIds = useMemo(() => {
    const arr = items
      .map((p) => Number(p.location_id))
      .filter((n) => Number.isFinite(n));
    return Array.from(new Set(arr));
  }, [items]);

  /** 바텀시트 **/
  const SHEET_HANDLE_H = 26; // 핸들/헤더 높이
  const [sheetH, setSheetH] = useState(0);
  const [containerH, setContainerH] = useState(0);

  // collapsed 피크 높이: 버튼 포함 영역 + 여유
  const PEEK_EXTRA = 12 + insets.bottom; //46
  const peekHeight = 200 + PEEK_EXTRA; // 카드 1개 일부 + 버튼이 보이도록

  // 시트의 Y(아래로 양수) : 0(완전 펼침) ~ maxY(피크)
  const maxY = Math.max(0, sheetH - peekHeight);
  const sheetY = useRef(new Animated.Value(0)).current;

  // sheetH/peekHeight 계산이 끝나면(=maxY 갱신되면) 즉시 접힘 위치로 이동
  useEffect(() => {
    sheetY.stopAnimation();
    sheetY.setValue(maxY); // 애니메이션 없이 바로 접힘
  }, [maxY, sheetY]);

  // 스냅
  const snapTo = (y) => {
    Animated.spring(sheetY, {
      toValue: Math.min(Math.max(y, 0), maxY),
      useNativeDriver: true,
      stiffness: 220,
      damping: 28,
      mass: 0.9,
    }).start();
  };

  // 드래그
  const dragStart = useRef(0);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          sheetY.stopAnimation((v) => (dragStart.current = v));
        },
        onPanResponderMove: (_e, g) => {
          const next = Math.min(Math.max(dragStart.current + g.dy, 0), maxY);
          sheetY.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          const end = dragStart.current + g.dy + g.vy * 120;
          const mid = maxY / 2;
          const target = end > mid ? maxY : 0;
          snapTo(target);
        },
      }),
    [maxY, sheetY]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header
        title="루트 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      <View style={{ paddingHorizontal: 25, marginBottom: 5 }}>
        <Text className="text-title-1 font-pretendardExtraBold mb-[6px]">
          도심 힐링 루트
        </Text>
        <Text className="text-heading-3 font-pretendardSemiBold text-gray700">
          북적이는 도심 속에서 잠시 벗어나 여유로운 시간을 보낼 수 있는
          루트입니다. 아기자기한 카페와 조용한 공원을 거치며, 하루의 피로를 풀
          수 있도록 구성했어요.
        </Text>
      </View>

      {/* 전체 컨테이너 높이 측정 */}
      <View
        style={{ flex: 1 }}
        onLayout={(e) => setContainerH(e.nativeEvent.layout.height)}
      >
        {/* 지도 */}
        <View style={{ height: 380, marginBottom: 0 }}>
          <MapView key={markersKey} markers={numberedMarkers} />
        </View>

        {/* 바텀시트 */}
        <Animated.View
          style={[
            styles.sheetWrap,
            {
              transform: [{ translateY: sheetY }],
            },
          ]}
          pointerEvents="box-none"
          {...panResponder.panHandlers}
          onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
        >
          <View style={styles.sheetCard}>
            {/* 핸들/헤더 */}
            <View style={styles.handleWrap}>
              <View style={styles.handleBar} />
            </View>
            {/* 하단 버튼 바(시트 안) */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                paddingHorizontal: 25,
                backgroundColor: "#fff",
              }}
            >
              <SecondarySmallButton
                title="루트 수정하기"
                onPress={() =>
                  router.push({
                    pathname: "/route-builder/edit",
                    params: {
                      routeItems: JSON.stringify(
                        items.map((c) => {
                          if (c.raw) return c.raw;
                          const photoUri = c?.imageSource?.uri
                            ? [c.imageSource.uri]
                            : [];
                          return {
                            location_id: c.location_id,
                            location_name: c.title,
                            category: c.categories?.[0] || "",
                            address: c.address || "",
                            latitude: c.lat,
                            longitude: c.lng,
                            photos: photoUri,
                            rating_avg: c.rating ?? null,
                          };
                        })
                      ),
                      center: JSON.stringify({
                        lat: items[0]?.lat,
                        lng: items[0]?.lng,
                      }),
                      region: params?.region || "",
                    },
                  })
                }
              />

              <PrimaryMediumButton
                title="루트 저장하기"
                onPress={() =>
                  router.push({
                    pathname: "/route-builder/save",
                    params: {
                      locationIds: JSON.stringify(
                        Array.from(
                          new Set(
                            items
                              .map((p) => Number(p.location_id))
                              .filter((n) => Number.isFinite(n))
                          )
                        )
                      ),
                      defaultName: `${items[0]?.title ?? "무명"} 루트`,
                      thumbs: JSON.stringify(
                        items
                          .slice(0, 3)
                          .map((c) => c?.imageSource?.uri)
                          .filter(Boolean)
                      ),
                      placeSummary: items
                        .slice(0, 3)
                        .map((c) => c.title)
                        .join("-"),
                    },
                  })
                }
              />
            </View>

            {/* 콘텐츠 */}
            {loading ? (
              <View style={{ padding: 25, alignItems: "center" }}>
                <ActivityIndicator />
                {!!err && (
                  <Text style={{ marginTop: 8, color: "#999" }}>{err}</Text>
                )}
              </View>
            ) : (
              <>
                <View
                  style={{ maxHeight: containerH - SHEET_HANDLE_H }}
                  contentContainerStyle={{
                    paddingBottom: 16 + 56 + insets.bottom,
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  {items.map((place, i) => (
                    <View
                      key={`${place.id}-${i}`}
                      style={{ paddingHorizontal: 25 }}
                    >
                      <View style={{ paddingTop: 16, paddingBottom: 18 }}>
                        <RouteStepCard
                          step={i + 1}
                          title={place.title}
                          rating={place.rating}
                          categories={place.categories}
                          address={place.address}
                          imageSource={place.imageSource}
                        />
                      </View>

                      {i < items.length - 1 && (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: "#D4D4D4",
                            marginHorizontal: -25, // 전폭 분리선
                          }}
                        />
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sheetWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetCard: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
    // 그림자
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 13.5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  handleWrap: {
    height: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  handleBar: {
    width: 78,
    height: 3,
    borderRadius: 50,
    backgroundColor: "#D9D9D9",
  },
});

// 로컬 버튼: small + secondary
function SecondarySmallButton({ title, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#D4D4D4",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#C9DCC1",
        marginRight: 9,
      }}
      android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text className="text-heading-3 font-pretendardSemiBold text-green500">
        {title}
      </Text>
    </Pressable>
  );
}

// 로컬 버튼: medium + primary
function PrimaryMediumButton({ title, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#62974F",
      }}
      android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text className="text-white text-heading-3 font-pretendardSemiBold">
        {title}
      </Text>
    </Pressable>
  );
}
