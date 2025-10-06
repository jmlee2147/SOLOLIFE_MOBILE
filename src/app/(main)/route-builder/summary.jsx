import MapView from "@components/map/MapView";
import RouteStepCard, {
  PIN_CENTER_X,
  PIN_SIZE,
} from "@components/route/RouteStepCard";
import Button from "@components/shared/Button";
import Icon from "@components/shared/Icon";
import BottomSheet, {
  BottomSheetScrollView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { postLocationRecommendations, postRouteNext } from "@services/api";
import { setPendingToast } from "@utils/toastNext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, Line, LinearGradient, Stop } from "react-native-svg";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN?.trim();

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

function sanitizeToken(t) {
  return String(t || "")
    .trim()
    .replace(/^Bearer\s+/i, "");
}

async function ensureToken() {
  const t = sanitizeToken(TEST_TOKEN);
  try {
    await AsyncStorage.setItem("jwt", t);
  } catch {}
  return t;
}

function mapApiItemToCard(item, stepIndexBase = 2) {
  const photo = Array.isArray(item?.photos) && item.photos[0];
  const imageSource =
    photo && typeof photo === "string" && /^https?:\/\//i.test(photo)
      ? { uri: photo }
      : null;
  const lat = Number(item?.latitude ?? item?.lat);
  const lng = Number(item?.longitude ?? item?.lng);
  const rawTitle =
    item?.location_name ??
    item?.title ??
    item?.name ??
    item?.place_name ??
    item?.poi_name;

  return {
    id: item?.location_id ?? `${stepIndexBase}-${Math.random()}`,
    location_id: item?.location_id,
    title: (typeof rawTitle === "string" ? rawTitle.trim() : "") || "이름없음",
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

  const [firstTop, setFirstTop] = useState(null);
  const [lastTop, setLastTop] = useState(null);

  const [saving, setSaving] = useState(false);

  // RouteSummaryScreen 컴포넌트 내부
  const categoryForRecs = useMemo(() => {
    // 1순위: 현재 첫 장소의 카테고리
    const fromItems = items?.[0]?.categories?.[0];
    // 2순위: 파라미터로 넘어온 firstCategory (있으면)
    const fromParams =
      typeof params?.firstCategory === "string"
        ? params.firstCategory.trim()
        : "";
    return (fromItems || fromParams || "").trim();
  }, [items, params?.firstCategory]);

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
  const moods = parsedArray(params.moodsKo).concat(parsedArray(params.moods));

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

  const region =
    typeof params.region === "string" && params.region.trim()
      ? String(params.region)
      : "경기도 수원시 영통구";

  const prefetchedMapped = useMemo(
    () =>
      (prefetchedItems || [])
        .slice(0, 2)
        .map((it, idx) => mapApiItemToCard(it, 2 + idx))
        .filter((c) => c.lat != null && c.lng != null),
    [prefetchedItems]
  );
  const hasPrefetched = prefetchedMapped.length > 0;

  const [items, setItems] = useState(
    hasPrefetched ? [first, ...prefetchedMapped] : [first]
  );
  const [loading, setLoading] = useState(!hasPrefetched);
  const [err, setErr] = useState("");

  const [previewTitle, setPreviewTitle] = useState("");
  const [previewSummary, setPreviewSummary] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewErr, setPreviewErr] = useState("");

  const getAuthToken = useMemo(
    () => async () => {
      try {
        const jwt = await AsyncStorage.getItem("jwt");
        return jwt || TEST_TOKEN || "";
      } catch {
        return TEST_TOKEN || "";
      }
    },
    []
  );

  // 프리뷰 요약
  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();

    async function run() {
      const locationIds = items
        .map((p) => Number(p.location_id))
        .filter((n) => Number.isFinite(n));

      if (locationIds.length === 0 || !API_BASE_URL) {
        setPreviewTitle(items[0]?.title ? items[0].title : "추천");
        setPreviewSummary("");
        return;
      }

      setPreviewLoading(true);
      setPreviewErr("");
      try {
        const token = await getAuthToken();
        const r = await fetch(`${API_BASE_URL}/journeys/preview`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            locations: locationIds.map((id) => ({ location_id: id })),
          }),
        });

        const text = await r.text();
        if (!r.ok) throw new Error(`Preview failed (HTTP ${r.status})`);
        const data = JSON.parse(text || "{}");

        if (!aborted) {
          setPreviewTitle(
            (
              data?.journey_title ||
              data?.title ||
              items[0]?.title ||
              "추천"
            ).trim()
          );
          setPreviewSummary(data?.journey_summary || data?.summary || "");
        }
      } catch (e) {
        if (!aborted) {
          setPreviewErr("요약 생성에 실패했어요.");
          setPreviewTitle(items[0]?.title ? items[0].title : "추천");
          setPreviewSummary("");
        }
      } finally {
        !aborted && setPreviewLoading(false);
      }
    }

    if (items?.length) run();
    return () => {
      aborted = true;
      controller.abort();
    };
  }, [items, getAuthToken]);

  // 최초 다음 후보(뒤 2칸) 채우기
  const didRunRef = useRef(false);
  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    if (hasPrefetched) {
      setItems((prev) =>
        prev.length >= 3 ? prev : [first, ...prefetchedMapped]
      );
      setLoading(false);
      return;
    }

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
            .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng)) ||
          [];

        let next = [first, ...mapped];
        if (next.length < 3) {
          const need = 3 - next.length;
          next = [...next, ...FALLBACK_OTHERS.slice(0, need)];
        }
        setItems(next);
      } catch (e) {
        setErr("추천을 불러오지 못했어요.");
        setItems([first, ...FALLBACK_OTHERS]);
      } finally {
        !canceled && setLoading(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [hasPrefetched, first, prefetchedMapped, moods, region]);

  // 지도 마커
  const markers = useMemo(
    () =>
      items
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
        ),
    [items]
  );

  const numberedMarkers = useMemo(
    () => markers.map((m, idx) => ({ ...m, label: String(idx + 1) })),
    [markers]
  );

  // bottom sheet
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["42%", "62%"], []);
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 100,
    overshootClamping: true,
    stiffness: 500,
  });

  // 변경된 제목 반영
  const incomingTitle =
    typeof params?.routeTitle === "string" && params.routeTitle.trim()
      ? params.routeTitle.trim()
      : "";
  const currentTitle = useMemo(
    () => (incomingTitle || previewTitle || items[0]?.title || "추천").trim(),
    [incomingTitle, previewTitle, items]
  );

  const LINE_X = 25 + (typeof PIN_CENTER_X === "number" ? PIN_CENTER_X : 10);

  async function handleSave() {
    const title = (currentTitle || "").trim();
    const ids = items
      .map((p) => Number(p.location_id))
      .filter((n) => Number.isFinite(n));

    if (!title) {
      Alert.alert("루트 저장", "루트 이름을 입력해 주세요.");
      return;
    }
    if (!ids.length) {
      Alert.alert("루트 저장", "선택된 장소가 없습니다.");
      return;
    }

    try {
      setSaving(true);
      const token = await ensureToken();
      const body = {
        journey_title: title,
        locations: ids.map((id, idx) => ({
          location_id: Number(id),
          sequence_number: idx + 1,
        })),
      };

      const res = await fetch(`${API_BASE_URL}/journeys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sanitizeToken(token)}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (
          res.status === 401 ||
          String(data?.error).toLowerCase().includes("invalid token")
        ) {
          await AsyncStorage.removeItem("jwt");
          throw new Error("로그인이 필요합니다. (토큰 무효)");
        }
        const msg =
          data?.error ||
          (res.status === 401
            ? "로그인이 필요합니다."
            : `저장에 실패했어요. (HTTP ${res.status})`);
        throw new Error(msg);
      }

      const journeyId = String(data?.journey_id);
      if (!journeyId) throw new Error("서버 응답에 journey_id가 없습니다.");

      const meta = {
        thumbs: items
          .slice(0, 3)
          .map((c) => c?.imageSource?.uri)
          .filter(Boolean),
        placeSummary: items
          .slice(0, 3)
          .map((c) => c.title)
          .join("-"),
        title,
      };
      try {
        await AsyncStorage.setItem(
          `journey_meta_${journeyId}`,
          JSON.stringify(meta)
        );
      } catch (e) {
        console.warn("[summary save] set journey_meta failed:", e?.message);
      }

      await setPendingToast({
        type: "success",
        message: "루트 저장 완료!",
        subText: "저장소에 추가됨",
        duration: 3000,
        targetRoute: "/home",
      });

      router.replace("/home");
    } catch (e) {
      Alert.alert(
        "루트 저장 실패",
        e?.message || "알 수 없는 오류가 발생했어요."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ height: 600 }}>
        <MapView markers={numberedMarkers} />
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="이전 화면으로"
          hitSlop={10}
          style={{
            position: "absolute",
            left: 14,
            top: Math.max(12, insets.top + 8), // 노치/상단바 피하기
            zIndex: 20,
            elevation: 20,
            backgroundColor: "transparent",
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="previous" width={22} height={22} color="#000" />
        </Pressable>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        animationConfigs={animationConfigs}
        enableDynamicSizing={false}
        enableOverDrag={false}
        enableContentPanningGesture={true}
        backgroundStyle={{
          backgroundColor: "#FFF",
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
        handleIndicatorStyle={{
          backgroundColor: "#D9D9D9",
          width: 78,
          height: 3,
          borderRadius: 50,
        }}
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 25,
            paddingTop: 18,
            paddingBottom: 24 + insets.bottom,
          }}
        >
          {/* 다시 추천받기: ResultsScreen과 동일한 postLocationRecommendations 사용 */}
          <Pressable
            onPress={async () => {
              try {
                if (!categoryForRecs) {
                  Alert.alert(
                    "다시 추천받기",
                    "카테고리를 알 수 없어요. 처음 장소의 카테고리를 확인해 주세요."
                  );
                  return;
                }
                setLoading(true);
                setErr("");

                const res = await postLocationRecommendations({
                  category: categoryForRecs, // ← 필수 추가
                  keywords: [],
                  moods,
                  center: { lat: items[0]?.lat, lng: items[0]?.lng },
                  radius_km: 3,
                });

                const arr = Array.isArray(res?.items) ? res.items : [];
                const uniq = [];
                const seen = new Set([String(items[0]?.location_id)]);
                for (const it of arr) {
                  const id = String(it?.location_id ?? "");
                  if (!id || seen.has(id)) continue;
                  seen.add(id);
                  uniq.push(it);
                  if (uniq.length >= 2) break;
                }

                const mapped = uniq
                  .map((it, idx) => mapApiItemToCard(it, 2 + idx))
                  .filter(
                    (c) => Number.isFinite(c.lat) && Number.isFinite(c.lng)
                  );

                let next = [items[0], ...mapped];
                if (next.length < 3) {
                  const need = 3 - next.length;
                  next = [...next, ...FALLBACK_OTHERS.slice(0, need)];
                }
                setItems(next);
              } catch (e) {
                setErr("추천을 불러오지 못했어요.");
              } finally {
                setLoading(false);
              }
            }}
            hitSlop={8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Icon name="refresh" width={18} height={18} />
            <Text className="ml-[4px] text-body-2 font-pretendardMedium">
              다시 추천받기
            </Text>
          </Pressable>

          <View style={styles.sheetHeaderRow}>
            <Text className="text-title-3 font-pretendardSemiBold">
              {previewLoading && !previewTitle
                ? "여정 준비 중..."
                : currentTitle}
            </Text>
          </View>

          {!!(previewLoading || previewSummary || previewErr) && (
            <Text className="text-body-1 font-pretendardMedium text-gray700 mt-[6px] mb-9">
              {previewLoading && !previewSummary
                ? "AI가 여정 요약을 준비하고 있어요..."
                : previewSummary ||
                  (previewErr ? "" : "AI가 여정을 구성하고 있어요.")}
            </Text>
          )}
          {!!previewErr && (
            <Text style={{ color: "#DC2626", marginTop: 4, fontSize: 12 }}>
              {previewErr}
            </Text>
          )}

          {loading ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator />
              {!!err && (
                <Text style={{ marginTop: 8, color: "#999" }}>{err}</Text>
              )}
            </View>
          ) : (
            <View style={{ position: "relative" }}>
              {/* 배경 점선 */}
              {firstTop !== null && lastTop !== null && lastTop > firstTop && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: 9.5,
                    top: firstTop + PIN_SIZE,
                    height: Math.max(0, lastTop - firstTop - PIN_SIZE / 2),
                    zIndex: 0,
                    elevation: 0,
                    width: 2,
                  }}
                >
                  <Svg
                    width="100%"
                    height="100%"
                    style={{ position: "absolute", left: 0, top: 0 }}
                  >
                    <Defs>
                      <LinearGradient
                        id="routeDottedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="100%"
                        gradientUnits="userSpaceOnUse"
                      >
                        <Stop offset="0%" stopColor="#91B684" stopOpacity="1" />
                        <Stop
                          offset="100%"
                          stopColor="#4D5E97"
                          stopOpacity="1"
                        />
                      </LinearGradient>
                    </Defs>
                    <Line
                      x1="1"
                      y1="0"
                      x2="1"
                      y2="100%"
                      stroke="url(#routeDottedGradient)"
                      strokeWidth={2}
                      strokeDasharray="1 6"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
              )}

              {/* 카드 목록 */}
              <View style={{ zIndex: 1, elevation: 1 }}>
                {items.map((place, i) => {
                  const isFirst = i === 0;
                  const isLast = i === items.length - 1;

                  return (
                    <View
                      key={`${place.id}-${i}`}
                      style={{ marginBottom: isLast ? 0 : 18 }}
                      onLayout={(e) => {
                        const { y } = e.nativeEvent.layout;
                        if (isFirst && firstTop === null) setFirstTop(y);
                        if (isLast) setLastTop(y);
                      }}
                    >
                      <RouteStepCard
                        step={i + 1}
                        title={place.title}
                        rating={place.rating}
                        categories={place.categories}
                        address={place.address}
                        imageSource={place.imageSource}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 푸터 버튼 */}
          <View style={styles.footerBar}>
            <Button
              title="루트 수정하기"
              variant="secondaryWhite"
              size="small"
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
                    routeTitle: currentTitle,
                  },
                })
              }
            />

            <Button
              title={saving ? "저장 중..." : "루트 저장하기"}
              variant={saving ? "disabled" : "primary"}
              size="medium"
              disabled={saving}
              onPress={() => {
                if (saving) return;
                handleSave();
              }}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  footerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  footerSecondary: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D4D4D4",
    backgroundColor: "#C9DCC1",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  footerPrimary: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#62974F",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
});
