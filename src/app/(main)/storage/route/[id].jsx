import { Images } from "@assets/images";
import Button from "@components/shared/Button";
import Header from "@components/shared/Header";
import Icon from "@components/shared/Icon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const SAMPLE = Images.backgrounds.sample;

export default function RouteDetailScreen() {
  const params = useLocalSearchParams();
  const { id } = params;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [journey, setJourney] = useState(null);

  // ---------- params 우선 사용 ----------
  const paramTitle =
    typeof params.title === "string" && params.title.trim() ? params.title : "";
  const paramDate =
    typeof params.date === "string" && params.date.trim() ? params.date : "";
  const paramSummary =
    typeof params.placeSummary === "string" && params.placeSummary.trim()
      ? params.placeSummary
      : "";

  const paramThumbUris = useMemo(() => {
    try {
      const arr = JSON.parse(params.thumbs || "[]");
      return Array.isArray(arr) ? arr.slice(0, 3) : [];
    } catch {
      return [];
    }
  }, [params.thumbs]);

  const paramThumbs = useMemo(
    () => paramThumbUris.map((u) => ({ uri: u })),
    [paramThumbUris]
  );

  // ---------- meta & 상세 API 로드 ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) meta
        const raw = await AsyncStorage.getItem(`journey_meta_${id}`);
        if (mounted && raw) {
          try {
            setMeta(JSON.parse(raw));
          } catch {}
        }

        // 2) 상세
        const token = await AsyncStorage.getItem("jwt");
        const res = await fetch(`${BASE_URL}/journeys/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json().catch(() => ({}));
        if (mounted) {
          if (res.ok) setJourney(data);
          else console.warn("journey detail error:", data?.error || res.status);
        }
      } catch (e) {
        console.warn("detail exception:", e?.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // ---------- 화면에 표시할 타이틀/날짜/요약 ----------
  const titleText =
    paramTitle || meta?.title || journey?.journey_title || "무명의 루트";
  const dateText =
    paramDate ||
    (journey?.created_at
      ? `${new Date(journey.created_at).getFullYear()}.${String(
          new Date(journey.created_at).getMonth() + 1
        ).padStart(2, "0")}.${String(
          new Date(journey.created_at).getDate()
        ).padStart(2, "0")} 저장된 루트`
      : "저장된 루트");
  const summaryText = paramSummary || meta?.placeSummary || "";

  // ---------- 썸네일 3장 복원: params > meta > SAMPLE ----------
  const thumbs = useMemo(() => {
    if (paramThumbs.length) return paramThumbs.slice(0, 3);

    const fromMeta = Array.isArray(meta?.thumbs) ? meta.thumbs.slice(0, 3) : [];
    if (fromMeta.length) {
      return fromMeta.map((t) =>
        t && typeof t.uri === "string" && t.uri ? { uri: t.uri } : SAMPLE
      );
    }
    return [SAMPLE, SAMPLE, SAMPLE];
  }, [paramThumbs, meta]);

  // ---------- 리스트에 뿌릴 아이템 ----------
  const places = useMemo(() => {
    if (!journey || !Array.isArray(journey.locations)) return [];
    return journey.locations.map((jl, idx) => {
      const loc = jl.location || jl || {};
      return {
        id:
          String(loc.location_id ?? jl.location_id ?? jl.journey_location_id) ||
          String(idx),
        name: loc.location_name || jl.location_name || "이름없음",
        category: loc.category || jl.category || "",
        address: loc.address || jl.address || "",
        rating:
          loc.rating_avg ??
          jl.rating_avg ??
          (typeof loc.rating === "number" ? loc.rating : null),
        // 왼쪽 썸네일은 index.jsx에서 저장해 둔 thumbs[i]로 표시
        thumb: thumbs[idx] || SAMPLE,
        tags:
          Array.isArray(loc.keywords) && loc.keywords.length
            ? loc.keywords
            : [],
      };
    });
  }, [journey, thumbs]);

  // params만 있고 meta/상세가 아직이면 스피너, params라도 있으면 바로 렌더
  if (loading && !paramTitle && !paramDate && !paramThumbs.length) {
    return (
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        leftIcon="previous"
        onLeftPress={() => router.back()}
      />

      {/* 타이틀/날짜/요약 */}
      <View style={{ paddingHorizontal: 25, paddingTop: 10 }}>
        <Text className="text-title-1 font-pretendardExtraBold mb-[6px]">
          {titleText}
        </Text>
        <Text className="text-heading-3 font-pretendardSemiBold text-gray700">
          {dateText} 저장된 루트
        </Text>
      </View>

      {/* 장소 리스트 (UI 유지) */}
      <FlatList
        data={places}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <View style={styles.placeRow}>
            <Image source={item.thumb} style={styles.thumb} />
            <View style={styles.placeInfo}>
              {/* 상단: 이름 + 별점 */}
              <View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    className="text-heading-2 font-pretendardSemiBold text-[#244DD3] mr-[9px]"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ flexShrink: 1 }}
                  >
                    {item.name}
                  </Text>
                  <Icon name="star" width={16} height={16} />
                  <Text className="text-body-2 font-pretendardMedium text-yellow900 ml-[1px]">
                    {item.rating ?? "-"}
                  </Text>
                </View>
                <Text className="text-body-2 font-pretendardMedium text-gray700 mt-[13px]">
                  {item.category}
                </Text>
                {!!item.address && (
                  <Text className="text-body-3 font-pretendardRegular text-gray700 mt-[4px]">
                    {item.address}
                  </Text>
                )}
              </View>

              {item.tags?.length > 0 && (
                <Text className="text-body-3 font-pretendardRegular text-gray700">
                  {item.tags.join(" ")}
                </Text>
              )}
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      />

      {/* 버튼들 */}
      <View style={styles.bottomRow}>
        <Button title="순서 편집하기" size="small" variant="secondary" />
        <Button title="네이버 지도 연결하기" size="medium" variant="primary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  placeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF",
    marginBottom: 17,
  },
  thumb: {
    width: 166,
    height: 166,
    backgroundColor: "#D9D9D9",
  },
  placeInfo: {
    flex: 1,
    minHeight: 166,
    marginLeft: 10,
    justifyContent: "space-between",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
  },
});
