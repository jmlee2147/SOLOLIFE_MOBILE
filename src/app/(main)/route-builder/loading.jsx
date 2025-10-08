import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import MonkeyLoadingVideo from "../../../components/animation/MonkeyLoading";
import { postRouteNext } from "../../../services/api";

/** JSON 배열 파서 */
const parseJsonArray = (v) => {
  try {
    const a = JSON.parse(String(v ?? "[]"));
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
};

/** region 문자열로 대략 중심 좌표 추정 (없으면 서울시청) */
function guessCenterFromRegion(regionStr) {
  const s = String(regionStr || "");
  if (/수원시\s*영통구/.test(s)) return { lat: 37.2512, lng: 127.0719 };
  if (/수원시/.test(s)) return { lat: 37.2636, lng: 127.0286 };
  if (/성남시\s*분당구/.test(s)) return { lat: 37.3826, lng: 127.1189 };
  if (/용인시\s*수지구/.test(s)) return { lat: 37.3223, lng: 127.097 };
  if (/강남구/.test(s)) return { lat: 37.5172, lng: 127.0473 };
  return { lat: 37.5665, lng: 126.978 };
}

/** 서버 랜덤 추천(services에 없을 때 직접 호출) */
async function postRandomRecommendationsDirect(body) {
  const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!API_BASE) return { items: [] };
  const r = await fetch(`${API_BASE}/recommendations/random`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) return { items: [] };
  const data = await r.json().catch(() => ({}));
  return data || { items: [] };
}

export default function LoadingRouteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 모드/파라미터
  const mode = String(params.mode || "");
  const moodsFromParams = useMemo(
    () => parseJsonArray(params.moodsKo || params.moods),
    [params]
  );
  const region = useMemo(() => String(params.region ?? ""), [params]);

  // 임의 좌표(seed) 허용
  const seedLat = Number(params.lat);
  const seedLng = Number(params.lng);
  const hasSeed = Number.isFinite(seedLat) && Number.isFinite(seedLng);

  // first 복구 (+ 좌표/무드 보정)
  const first = useMemo(() => {
    try {
      const raw = decodeURIComponent(String(params.first || ""));
      const o = JSON.parse(raw || "{}");

      let lat = Number(o.latitude ?? o.lat);
      let lng = Number(o.longitude ?? o.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        if (hasSeed) {
          lat = seedLat; lng = seedLng;
        } else if (region) {
          const g = guessCenterFromRegion(region);
          lat = g.lat; lng = g.lng;
        }
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      return {
        location_id: Number(o.location_id),
        location_name: String(o.location_name ?? ""),
        category: o.category ? String(o.category) : undefined,
        address: String(o.address ?? ""),
        lat,
        lng,
        moods: parseJsonArray(o.moods).filter(Boolean), // 상세에서 가져온 무드 있을 수도 있음
      };
    } catch {
      return null;
    }
  }, [params.first, hasSeed, seedLat, seedLng, region]);

  // 서버가 moods>=1 강제라 최소 1개 보장
  const safeMoods = useMemo(() => {
    const fromFirst = Array.isArray(first?.moods) ? first.moods : [];
    const merged = (fromFirst.length ? fromFirst : moodsFromParams)
      .filter((x) => typeof x === "string" && x.trim());
    return (merged.length ? merged : ["분위기 좋은"]).slice(0, 3);
  }, [first?.moods, moodsFromParams]);

  const [err, setErr] = useState("");

  useEffect(() => {
    let canceled = false;

    async function run() {
      const minDelay = new Promise((r) => setTimeout(r, 600));

      if (!first) {
        setErr("처음 선택한 장소 정보가 유효하지 않아요. 뒤로 가서 다시 시도해 주세요.");
        return;
      }

      // center 최종 결정
      const center = (() => {
        if (Number.isFinite(first.lat) && Number.isFinite(first.lng)) {
          return { lat: first.lat, lng: first.lng };
        }
        if (hasSeed) return { lat: seedLat, lng: seedLng };
        if (region) return guessCenterFromRegion(region);
        return { lat: 37.5665, lng: 126.978 };
      })();

      // 공통 request
      const base = {
        moods: safeMoods, // ✅ 빈 배열 금지
        exclude_location_ids: first.location_id ? [first.location_id] : [],
        exclude_categories: first.category ? [first.category] : [],
        center,
      };

      // 1) 반경 확장 / 카테고리 제한 완화
      const tries = [
        { ...base, region, radius_km: 3 },
        { ...base, region, radius_km: 5 },
        { ...base, region, radius_km: 8, exclude_categories: [] },
        { ...base, radius_km: 8, exclude_categories: [] }, // region 제외
      ];

      let merged = [];
      for (const t of tries) {
        if (canceled) return;
        try {
          const res = await postRouteNext(t);
          const arr = Array.isArray(res?.items) ? res.items : [];
          merged = merged.concat(arr);
          if (merged.length >= 2) break;
        } catch {}
      }

      // 2) 부족하면 랜덤 추천으로 보충 (무드 조건 없는 엔드포인트)
      if (merged.length < 2) {
        try {
          // 다양성 위해 radius 확대 버전까지 시도
          const rnd1 = await postRandomRecommendationsDirect({
            center,
            radius_km: 5,
            exclude_location_ids: first.location_id ? [first.location_id] : [],
            exclude_categories: [],
          });
          const rnd2 = await postRandomRecommendationsDirect({
            center,
            radius_km: 8,
            exclude_location_ids: first.location_id ? [first.location_id] : [],
            exclude_categories: [],
          });
          const r1 = Array.isArray(rnd1?.items) ? rnd1.items : [];
          const r2 = Array.isArray(rnd2?.items) ? rnd2.items : [];
          merged = merged.concat(r1, r2);
        } catch {}
      }

      // 중복 제거 + 좌표 없는 항목 제외 + 최대 2개
      const seen = new Set();
      const uniq = [];
      for (const it of merged) {
        const id = it?.location_id ?? `${it?.location_name}-${it?.category}`;
        if (!id || seen.has(id)) continue;
        const lat = Number(it?.latitude ?? it?.lat);
        const lng = Number(it?.longitude ?? it?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        seen.add(id);
        uniq.push(it);
        if (uniq.length >= 2) break;
      }

      if (uniq.length < 2) {
        const mocks = [
          {
            location_id: 101,
            location_name: "이너프",
            category: "카페",
            latitude: 37.2689,
            longitude: 127.1377,
            rating_avg: 4.3,
            address: "경기도 수원시 영통구 영통동 반달로 54",
          },
          {
            location_id: 102,
            location_name: "나무그늘 카페",
            category: "카페",
            latitude: (base.center?.lat ?? 37.5665) - 0.002,
            longitude: (base.center?.lng ?? 126.978) - 0.002,
            rating_avg: 4.7,
            address: region || "경기도 수원시",
          },
        ];
      
        for (const m of mocks) {
          if (uniq.length >= 2) break;
          const mid = m.location_id ?? `${m.location_name}-${m.category}`;
          if (!seen.has(mid)) {
            seen.add(mid);
            uniq.push(m);
          }
        }
      }

      await minDelay;
      if (canceled) return;

      router.replace({
        pathname: "/route-builder/summary",
        params: {
          first: String(params.first || ""),
          region,
          moodsKo: JSON.stringify(safeMoods),
          prefetched: encodeURIComponent(JSON.stringify(uniq)),
        },
      });
    }

    run();
    return () => { canceled = true; };
  }, [first, safeMoods, region, hasSeed, seedLat, seedLng, router, params.first]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={{ flex: 1, alignItems: "center", paddingTop: 143 }}>
        <Text className="text-title-1 font-pretendardExtraBold">루트 생성 중이에요.</Text>
        <Text className="mt-2 text-heading-3 text-gray700 font-pretendardMedium">
          딱 맞는 루트를 추천해드릴게요!
        </Text>
        <Text className="text-heading-3 text-gray700 font-pretendardMedium">
          잠시만 기다려 주세요.
        </Text>

        <MonkeyLoadingVideo height={300} mirror />

        {!!err && (
          <Text
            style={{
              marginTop: 16,
              color: "#EF4444",
              paddingHorizontal: 24,
              textAlign: "center",
            }}
          >
            {err}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}