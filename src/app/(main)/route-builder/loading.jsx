import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import MonkeyLoadingVideo from "../../../components/animation/MonkeyLoading"; // ⬅️ 추가
import { postRouteNext } from "../../../services/api";

const parseJsonArray = (v) => {
  try {
    const a = JSON.parse(String(v ?? "[]"));
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
};

export default function LoadingRouteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // confirm/index에서 넘어온 값 복구
  const moods = useMemo(
    () => parseJsonArray(params.moodsKo || params.moods),
    [params]
  );
  const region = useMemo(() => String(params.region ?? ""), [params]);

  // 필수: first (URI-encoded JSON)
  const first = useMemo(() => {
    try {
      const raw = decodeURIComponent(String(params.first || ""));
      const o = JSON.parse(raw);
      const lat = Number(o.latitude ?? o.lat);
      const lng = Number(o.longitude ?? o.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        location_id: Number(o.location_id),
        location_name: String(o.location_name ?? ""),
        category: o.category ? String(o.category) : undefined,
        address: String(o.address ?? ""),
        lat,
        lng,
      };
    } catch {
      return null;
    }
  }, [params.first]);

  const [err, setErr] = useState("");

  useEffect(() => {
    let canceled = false;

    async function run() {
      if (!first) {
        setErr(
          "처음 선택한 장소 정보가 유효하지 않아요. 뒤로 가서 다시 시도해 주세요."
        );
        return;
      }

      const minDelay = new Promise((r) => setTimeout(r, 600));

      const base = {
        moods,
        exclude_location_ids: first.location_id ? [first.location_id] : [],
        exclude_categories: first.category ? [first.category] : [],
        center: { lat: first.lat, lng: first.lng },
      };
      const tries = [
        { ...base, region, radius_km: 3 },
        { ...base, region, radius_km: 5 },
        { ...base, region, radius_km: 8, exclude_categories: [] },
        { ...base, radius_km: 8, exclude_categories: [] }, // no region
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

      const seen = new Set();
      const uniq = [];
      for (const it of merged) {
        const id = it?.location_id ?? `${it?.location_name}-${it?.category}`;
        if (seen.has(id)) continue;
        seen.add(id);
        uniq.push(it);
        if (uniq.length >= 2) break;
      }

      await minDelay;
      if (canceled) return;

      router.replace({
        pathname: "/route-builder/summary",
        params: {
          first: String(params.first || ""),
          region,
          moodsKo: JSON.stringify(moods),
          prefetched: JSON.stringify(uniq),
        },
      });
    }

    run();
    return () => {
      canceled = true;
    };
  }, [first, moods, region, router, params.first]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={{ flex: 1, alignItems: "center", paddingTop: 143 }}>
        <Text className="text-title-1 font-pretendardExtraBold">
          루트 생성 중이에요.
        </Text>
        <Text className="mt-2 text-heading-3 text-gray700 font-pretendardMedium">
          딱 맞는 루트를 추천해드릴게요!
        </Text>
        <Text className="text-heading-3 text-gray700 font-pretendardMedium">
          잠시만 기다려 주세요.
        </Text>

        {/* 이미지 → mp4 비디오로 교체 */}
        <MonkeyLoadingVideo
          // 필요 시 커스텀 경로: source={require("../../../assets/videos/monkey-walk.mp4")}
          height={300}
          mirror
        />

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
