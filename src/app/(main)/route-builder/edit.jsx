import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View
} from "react-native";
import EditStepCard from "../../../components/route/EditStepCard";
import Button from "../../../components/shared/Button";
import Header from "../../../components/shared/Header";
import { EDIT_CATEGORY_MAP } from "../../../config/category.config";
import { postReplaceOne } from "../../../services/api";

// 목업 데이터
const MOCK_PLACES = [
  {
    location_id: 1,
    location_name: "55데시벨",
    category: "카페",
    address: "경기도 수원시 영통구",
    latitude: 37.248492,
    longitude: 127.076754,
    rating_avg: 4.5,
    photos: [],
  },
  {
    location_id: 2,
    location_name: "66데시벨",
    category: "카페",
    address: "경기도 수원시 영통구",
    latitude: 37.2512,
    longitude: 127.0719,
    rating_avg: 4.5,
    photos: [],
  },
  {
    location_id: 3,
    location_name: "77데시벨",
    category: "카페",
    address: "경기도 수원시 영통구",
    latitude: 37.6512,
    longitude: 127.0386,
    rating_avg: 4.5,
    photos: [],
  },
];
const EDIT_CATEGORY_LABELS = Object.keys(EDIT_CATEGORY_MAP);

function getReplaceCategories(selectedLabels, fallbackPrimary) {
  const labels = Array.isArray(selectedLabels) ? selectedLabels : [selectedLabels].filter(Boolean);
  const out = [];

  for (const label of labels) {
    const arr = EDIT_CATEGORY_MAP[label];
    if (Array.isArray(arr)) out.push(...arr);
  }

  // 아무것도 못 만들었으면 폴백 1차 카테고리라도 사용
  if (out.length === 0 && fallbackPrimary) out.push(fallbackPrimary);

  // 중복 제거
  return Array.from(new Set(out));
}

// 백엔드 → 카드 매핑 유틸 (summary 쪽과 동일 컨벤션)
function mapApiItemToCard(item) {
  const photo = Array.isArray(item?.photos) && item.photos[0];
  const imageSource =
    photo && typeof photo === "string" && /^https?:\/\//i.test(photo)
      ? { uri: photo }
      : require("../../../assets/images/sample.png");

  const lat = Number(item?.latitude ?? item?.lat);
  const lng = Number(item?.longitude ?? item?.lng);

  return {
    id: item?.location_id ?? String(Math.random()),
    location_id: item?.location_id,
    title: item?.location_name ?? "이름없음",
    rating: item?.rating_avg ?? undefined,
    categories: item?.category ? [item.category] : [],
    address: item?.address ?? "",
    imageSource,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    raw: item,
  };
}

export default function RouteEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // summary.jsx에서 넘겨준 현재 루트(3개) / center / region
  // - routeItems: JSON.stringify([{location_id, location_name, category, latitude, longitude, ...}])
  // - center: JSON.stringify({lat, lng})  (교체 API 기준 좌표)
  // - region: string (있으면 사용)
  const routeItems = useMemo(() => {
    try {
      const a = params?.routeItems ? JSON.parse(String(params.routeItems)) : [];
      return Array.isArray(a) && a.length ? a : MOCK_PLACES;
    } catch {
      return MOCK_PLACES;
    }
  }, [params?.routeItems]);

  const center = useMemo(() => {
    try {
      const c = params?.center ? JSON.parse(String(params.center)) : null;
      if (c && Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng))) {
        return { lat: Number(c.lat), lng: Number(c.lng) };
      }
    } catch {}
    // 폴백: 첫 장소 좌표
    const f = routeItems?.[0];
    return f?.latitude && f?.longitude
      ? { lat: Number(f.latitude), lng: Number(f.longitude) }
      : { lat: 37.2421, lng: 127.0719 };
  }, [params?.center, routeItems]);

  const region = typeof params?.region === "string" ? params.region : "";

  // 선택한 카드 id (최대 2개)
  const [selectedIds, setSelectedIds] = useState([]);
  // 선택한 키워드(무제한) — 지금은 백엔드 스펙에 직접 쓰지 않지만, 필요 시 넘길 수 있게 유지
  const [selectedPills, setSelectedPills] = useState([]);

  // 로딩 표시 (다음 버튼 누르고 교체 중)
  const [submitting, setSubmitting] = useState(false);

  const cards = useMemo(() => {
    // routeItems는 summary가 들고 있던 원자료(백엔드 응답형)라고 가정
    return routeItems.map(mapApiItemToCard);
  }, [routeItems]);

  const toggleCard = (id) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev; // 최대 2개 제한
      return [...prev, id];
    });
  };

  const togglePill = (label) => {
    setSelectedPills((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const canProceed = useMemo(() => selectedIds.length > 0, [selectedIds.length]);

  // 교체 API 호출 → 새 루트 구성 → summary로 이동
  // 교체 1개 요청 (선호 카테고리들을 순서대로 시도)
async function requestReplaceForCard({ card, center, region, selectedPills }) {
  const tryOnce = async (category, withRegion = true) => {
    const body = {
      category, // 사용자가 고른 EDIT_CATEGORY를 그대로 보냄
      exclude_location_ids: [Number(card.location_id)].filter(Boolean),
      center,                // {lat, lng}
      radius_km: 3,
      ...(withRegion ? { region } : {}), // region 포함/제외 토글
    };
    const res = await postReplaceOne(body);
    const it = Array.isArray(res?.items) && res.items[0] ? res.items[0] : null;
    return it;
  };

  // 1) 선택한 카테고리들 순서대로 시도 (region 포함)
  for (const cat of selectedPills) {
    const found = await tryOnce(cat, true);
    if (found) return found;
  }
  // 2) 선택한 카테고리들 순서대로 시도 (region 제거)
  for (const cat of selectedPills) {
    const found = await tryOnce(cat, false);
    if (found) return found;
  }
  // 3) 마지막 폴백: 원래 카드 카테고리로 시도 (있다면)
  const fallbackCat = card.categories?.[0] || card.raw?.category || "";
  if (fallbackCat) {
    const found = (await tryOnce(fallbackCat, true)) || (await tryOnce(fallbackCat, false));
    if (found) return found;
  }

  return null;
}

const handleNext = async () => {
  if (!canProceed || submitting) return;

  if (!selectedPills.length) {
    Alert.alert("안내", "교체할 상위 카테고리를 하나 이상 선택해 주세요.");
    return;
  }

  const selectedCards = cards.filter((c) => selectedIds.includes(String(c.location_id)));
  if (selectedCards.length === 0) return;

  setSubmitting(true);
  try {
    const original = [...cards];
    const replacedByIndex = {};

    // 선택한 상위 라벨들을 하위 카테고리로 확장(공통 부분)
    const baseTargets = getReplaceCategories(selectedPills); // 중복 제거된 배열을 반환하도록 구현되어 있어야 함

    await Promise.all(
      selectedCards.map(async (card) => {
        const idx = cards.findIndex((c) => String(c.location_id) === String(card.location_id));
        if (idx < 0) return;

        // 카드의 1차 카테고리(폴백용)
        const cardPrimaryCat = card.categories?.[0] || card.raw?.category || "";

        // 카드별로 최종 시도 순서 구성: 선택 라벨 확장 → (마지막에) 폴백 카테고리
        const targets = Array.from(new Set([
          ...baseTargets,
          ...(cardPrimaryCat ? [cardPrimaryCat] : []),
        ]));

        let picked = null;
        for (const cat of targets) {
          const body = {
            category: cat,                                   // 실제 하위 카테고리 하나씩 시도
            exclude_location_ids: [Number(card.location_id)].filter(Boolean),
            center,                                          // {lat, lng}
            radius_km: 3,
            // region: region || undefined, // 필요시만 사용
          };

          try {
            const res = await postReplaceOne(body);
            const item = Array.isArray(res?.items) && res.items[0] ? res.items[0] : null;
            if (item) {
              picked = mapApiItemToCard(item);
              break; // 첫 성공으로 종료
            }
          } catch (_) {
            // 다음 카테고리 계속 시도
          }
        }

        if (picked) replacedByIndex[idx] = picked;
      })
    );

    const finalThree = original.map((c, i) => replacedByIndex[i] || c);

    // summary로 넘길 직렬화
    const newFirst = finalThree[0];
    const newPrefetched = finalThree.slice(1, 3).map((c) => c.raw || ({
      location_id: c.location_id,
      location_name: c.title,
      category: c.categories?.[0] || "",
      address: c.address || "",
      latitude: c.lat,
      longitude: c.lng,
      photos: [],
      rating_avg: c.rating ?? null,
    }));

    const firstPayload = {
      location_id: newFirst.location_id,
      location_name: newFirst.title,
      category: newFirst.categories?.[0] || "",
      address: newFirst.address || "",
      latitude: newFirst.lat,
      longitude: newFirst.lng,
      photos: [],
      rating_avg: newFirst.rating ?? null,
    };

    router.push({
      pathname: "/route-builder/summary",
      params: {
        first: encodeURIComponent(JSON.stringify(firstPayload)),
        prefetched: JSON.stringify(newPrefetched),
        region: region || "",
        center: JSON.stringify(center),
        selectedPills: JSON.stringify(selectedPills),
        edited: "1",
      },
    });
  } catch (e) {
    Alert.alert("오류", e?.message || "교체 추천에 실패했어요. 잠시 후 다시 시도해주세요.");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="루트 수정하기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* 상단 타이틀 */}
        <View style={{ paddingHorizontal: 25, paddingTop: 8 }}>
          <Text className="text-title-2 font-pretendardExtraBold">
            변경할 장소를 선택해주세요.
          </Text>
          <Text className="mt-[6px] text-gray700 text-heading-3 font-pretendardMedium">
            최대 2개까지 선택 가능해요.
          </Text>
        </View>

        {/* 카드 리스트 (실제 추천 3곳) */}
        <View style={{ marginTop: 26 }}>
          {cards.map((p) => {
            const selected = selectedIds.includes(String(p.location_id));
            return (
              <View key={String(p.location_id)} style={{ paddingHorizontal: 25, marginBottom: 10 }}>
                <EditStepCard
                  title={p.title}
                  rating={p.rating}
                  categories={p.categories}
                  address={p.address}
                  imageSource={p.imageSource}
                  selected={selected}
                  onPress={() => toggleCard(String(p.location_id))}
                />
              </View>
            );
          })}
        </View>

        {/* 구분 여백 */}
        <View style={{ height: 26 }} />

        {/* 키워드 섹션 */}
        <View style={{ paddingHorizontal: 25 }}>
          <Text className="text-[22px] font-pretendardExtraBold">
            선호하는 키워드를 모두 선택해주세요.
          </Text>

          <View className="flex-row flex-wrap mt-[10px]">
            {EDIT_CATEGORY_LABELS.map((label) => {
              const active = selectedPills.includes(label);
              return (
                <Pressable
                  key={label}
                  onPress={() => togglePill(label)}
                  className={[
                    "px-[22px] py-[11px] mr-[10px] mb-[13px] rounded-full",
                    active ? "bg-green500" : "bg-[#F3F4F6]",
                  ].join(" ")}
                  android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
                >
                  <Text
                    className={[
                      "text-heading-3 font-pretendardMedium",
                      active ? "text-white" : "text-gray500",
                    ].join(" ")}
                  >
                    {label}
                  </Text>
                  {active && (
                    <View className="absolute w-3 h-3 rounded-full bg-yellow900 -top-1 -right-1" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 25,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: "#fff",
        }}
      >
        <Button
          title={submitting ? "추천 받는 중..." : "다음"}
          size="large"
          variant={canProceed ? "primary" : "disabled"}
          onPress={handleNext}
          disabled={!canProceed || submitting}
          loading={submitting}
        />
      </View>
    </SafeAreaView>
  );
}