import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View } from "react-native";
import MapView from "../../../components/map/MapView";
import RouteStepCard from "../../../components/route/RouteStepCard";
import Button from "../../../components/shared/Button";
import Header from "../../../components/shared/Header";
import { postRouteNext } from "../../../services/api";

// ---- 안전 폴백(파라미터 없거나 API 실패 시) ----
const FALLBACK_FIRST = {
  id: 1,
  location_id: 1,
  title: "55데시벨",
  rating: 4.5,
  categories: ["카페", "디저트"],
  address: "경기도 수원시 영통구",
  imageSource: require("../../../assets/images/sample.png"),
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
    imageSource: require("../../../assets/images/cafe.png"),
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
    imageSource: require("../../../assets/images/activity.png"),
    lat: 37.6512,
    lng: 127.0386,
  },
];

const DBG = true;
const log = (...a) => DBG && console.log("[summary]", ...a);
const warn = (...a) => DBG && console.warn("[summary]", ...a);

const withTimeout = (promise, ms = 7000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("CLIENT_TIMEOUT")), ms)
    ),
  ]);

// 백엔드 응답 → 화면 카드로 매핑
function mapApiItemToCard(item, stepIndexBase = 2) {
  // photos[0] 우선 사용, 없으면 샘플 이미지
  const photo = Array.isArray(item?.photos) && item.photos[0];
  const imageSource =
    photo && typeof photo === "string" && /^https?:\/\//i.test(photo)
      ? { uri: photo }
      : require("../../../assets/images/sample.png");
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

  useEffect(() => {
    log("params =", JSON.stringify(params));
  }
  , [params]);

  const parseJsonArr = (v) => {
    try { const a = JSON.parse(String(v)); return Array.isArray(a) ? a : []; }
    catch { return []; }
  };

  const prefetchedItems = useMemo(
    () => parseJsonArr(params. prefetched),
    [params.prefetched]
  );

  // 파라미터 해석
  // confirm.jsx 또는 이전 단계에서 넘겨줄 수 있는 값들 가정:
  // - firstId, firstCategory, firstLat, firstLng, firstName, region
  // - moodsKo (JSON string array) 또는 moods (JSON string array)
  // 없으면 안전 폴백
  const parsedArray = (v) => {
    if (!v) return [];
    try {
      const a = JSON.parse(String(v));
      return Array.isArray(a) ? a : [];
    } catch { return []; }
  };

  const moods =
    parsedArray(params.moodsKo) // 한글 무드 배열(JSON)
      .concat(parsedArray(params.moods)); // 혹시 다른 키로 올 수도 있음

  useEffect(() => { log("moods =", moods); }, [moods]);

  const first = useMemo(() => {
   // 1순위: confirm.jsx에서 넘긴 first(JSON string, URI 인코딩됨)
   if (params.first) {
     try {
       const raw = decodeURIComponent(String(params.first));
       const obj = JSON.parse(raw);
       const lat = Number(obj.latitude ?? obj.lat);
       const lng = Number(obj.longitude ?? obj.lng);
       if (Number.isFinite(lat) && Number.isFinite(lng)) {
         return {
           id: Number(obj.location_id) || Date.now(),
           location_id: Number(obj.location_id) || Date.now(),
           title: String(obj.location_name ?? "이름없음"),
           rating: obj.rating_avg ?? undefined,
           categories: obj.category ? [String(obj.category)] : [],
           address: String(obj.address ?? ""),
           imageSource: require("../../../assets/images/sample.png"), // 필요시 obj.photos[0] 매핑
           lat, lng,
         };
       }
     } catch {}
   }
   // 2순위: 예전 파라미터(개별 lat/lng 등)
   const lat = Number(params.firstLat);
   const lng = Number(params.firstLng);
   if (Number.isFinite(lat) && Number.isFinite(lng)) {
     return {
       ...FALLBACK_FIRST,
       id: params.firstId ? Number(params.firstId) : FALLBACK_FIRST.id,
       location_id: params.firstId ? Number(params.firstId) : FALLBACK_FIRST.location_id,
       title: params.firstName ? String(params.firstName) : FALLBACK_FIRST.title,
       categories: params.firstCategory ? [String(params.firstCategory)] : FALLBACK_FIRST.categories,
       lat, lng,
     };
   }
   // 3순위: 폴백
   return FALLBACK_FIRST;
 }, [params.first, params.firstId, params.firstName, params.firstCategory, params.firstLat, params.firstLng]);

  useEffect(() => { log("first =", first); }, [first]);

  const excludeCats = Array.isArray(first.categories) && first.categories.length
    ? [first.categories[0]] // 상위 1개만 제외
    : [];

  const region = typeof params.region === "string" && params.region.trim()
    ? String(params.region)
    : "경기도 수원시 영통구"; // 폴백 지역
  
  useEffect(() => { log("region =", region); }, [region]);

  // API 호출 상태
  const prefetchedMapped = useMemo(
    () => (prefetchedItems || [])
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
    setItems((prev) => (prev.length >= 3 ? prev : [first, ...prefetchedMapped]));
    setLoading(false);
    return;
  }

  if (didRunRef.current) return; // 이미 실행됨
  didRunRef.current = true;

  let canceled = false;

  async function fetchNextCandidates() {
    const baseReq = {
      moods,
      exclude_location_ids: first.location_id ? [first.location_id] : [],
      // 상위 1개만 제외
      exclude_categories: Array.isArray(first.categories) && first.categories.length
        ? [first.categories[0]]
        : [],
      center: { lat: first.lat, lng: first.lng },
    };

    const tries = [
      // 1) 기존 조건 (3km, region 포함)
      { ...baseReq, region, radius_km: 3, note: "strict-3km" },
      // 2) 5km로 완화
      { ...baseReq, region, radius_km: 5, note: "relaxed-5km" },
      // 3) 8km + 카테고리 제외 해제
      { ...baseReq, region, radius_km: 8, exclude_categories: [], note: "relaxed-8km-noCatEx" },
      // 4) region 제거
      { ...baseReq, radius_km: 8, exclude_categories: [], note: "no-region" },
    ];

    let merged = [];
    for (const t of tries) {
      if (canceled) break;
      try {
        __DEV__ && console.log("[summary] try:", t.note, t);
        const res = await postRouteNext(t);
        const arr = Array.isArray(res?.items) ? res.items : [];
        __DEV__ && console.log("[summary] got:", t.note, arr.length);
        merged = merged.concat(arr);
        if (merged.length >= 2) break; // 2개 모이면 중단
      } catch (e) {
        __DEV__ && console.warn("[summary] error try:", t.note, e?.message);
      }
    }

    // 중복 제거 (location_id 기준)
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
  } // ← 여기 닫는 중괄호가 꼭 필요했어요!

  async function run() {
    setLoading(true);
    setErr("");

    try {
      const apiItems = await fetchNextCandidates();
      const mapped = apiItems
        .map((it, idx) => mapApiItemToCard(it, 2 + idx))
        .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));

      let next = [first, ...mapped]; // 항상 첫 장소 포함
      if (next.length < 3) {
        const need = 3 - next.length;
        next = [...next, ...FALLBACK_OTHERS.slice(0, need)];
      }

      if (!canceled) {
        __DEV__ && console.log("[summary] mapped items =", mapped);
        __DEV__ && console.log("[summary] final items =", next);
        setItems(next);
      }
    } catch (e) {
      __DEV__ && console.warn("[summary] next error =", e?.message, e);
      if (!canceled) {
        setErr(e?.message || "추천을 불러오지 못했어요.");
        setItems([first, ...FALLBACK_OTHERS]);
      }
    } finally {
      !canceled && setLoading(false);
    }
  }

  run();
  return () => { canceled = true; };
}, [hasPrefetched, first, prefetchedMapped]);

  // ------- ④ 지도 마커 구성 -------
  const markers = useMemo(() => {
    return items
      .map((p, i) => {
        const lat = Number(p.lat);
        const lng = Number(p.lng);
        return {
          id: String(p.location_id ?? i),
          lat,
          lng,
          name: p.title,
        };
      })
      // 0,0 또는 NaN 제거 (bounds 깨짐 방지)
      .filter(m => Number.isFinite(m.lat) && Number.isFinite(m.lng) && !(m.lat === 0 && m.lng === 0));
  }, [items]);

  useEffect(() => {
    if (__DEV__) {
      console.log("[summary] markers len =", markers.length, markers);
    }
  }, [markers]);

  // 전달 직전에 1,2,3… 라벨 재부여(여기서 보장)
  const numberedMarkers = useMemo(
    () => markers.map((m, idx) => ({ ...m, label: String(idx + 1) })),
    [markers]
  );

  const markersKey = useMemo(
    () => JSON.stringify(numberedMarkers.map(m => [m.lat, m.lng, m.label])),
    [numberedMarkers]
  );

  useEffect(() => {
    if (__DEV__) {
      console.log("[summary] numberedMarkers =", numberedMarkers);
    }
  }, [numberedMarkers]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="루트 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      {/* 지도 */}
      <View style={{ height: 212, marginBottom: 41 }}>
        <MapView key={markersKey} markers={numberedMarkers} />
      </View>

      {/* 스텝 카드 리스트 */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center" }}>
          <ActivityIndicator />
          {!!err && <Text style={{ marginTop: 8, color: "#999" }}>{err}</Text>}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {items.map((place, i) => (
            <View key={`${place.id}-${i}`} style={{ marginBottom: 18, paddingHorizontal: 25 }}>
              <RouteStepCard
                step={i + 1}
                title={place.title}
                rating={place.rating}
                categories={place.categories}
                address={place.address}
                imageSource={place.imageSource}
                // (옵션) 길찾기/공유 쓰고 싶으면 onPressDirections/onPressShare 넘기기
              />

              {i < items.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#D4D4D4",
                    marginTop: 18,
                  }}
                />
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* 하단 버튼 */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 25,
          paddingVertical: 12,
          backgroundColor: "#fff",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <Button
          title="루트 수정하기"
          size="small"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/route-builder/edit",
              params: {
                routeItems: JSON.stringify(
                  items.map((c) => c.raw || {
                    location_id: c.location_id,
                    location_name: c.title,
                    category: c.categories?.[0] || "",
                    address: c.address || "",
                    latitude: c.lat,
                    longitude: c.lng,
                    photos: [],
                    rating_avg: c.rating ?? null,
                  })
                ),
                center: JSON.stringify({ lat: items[0]?.lat, lng: items[0]?.lng }),
                region: params?.region || "",   // 있으면
              },
            })
          }
        />
        <Button
          title="루트 저장하기"
          size="medium"
          variant="primary"
          onPress={() => router.push("/route-builder/save")}
        />
      </View>
    </SafeAreaView>
  );
}