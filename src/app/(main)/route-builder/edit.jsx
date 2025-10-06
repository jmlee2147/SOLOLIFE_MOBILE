import EditStepCard from "@components/route/EditStepCard";
import Button from "@components/shared/Button";
import Header from "@components/shared/Header";
import Icon from "@components/shared/Icon";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, Text, View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { TextInput } from "react-native-gesture-handler";
import { EDIT_CATEGORY_MAP } from "../../../config/category.config";
import { postReplaceOne /*, reorderJourneyLocations */ } from "../../../services/api";

/* ---------------- mock ---------------- */
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

/* ---------------- helpers ---------------- */
function getReplaceCategories(selectedLabels, fallbackPrimary) {
  const labels = Array.isArray(selectedLabels)
    ? selectedLabels
    : [selectedLabels].filter(Boolean);
  const out = [];
  for (const label of labels) {
    const arr = EDIT_CATEGORY_MAP[label];
    if (Array.isArray(arr)) out.push(...arr);
  }
  if (out.length === 0 && fallbackPrimary) out.push(fallbackPrimary);
  return Array.from(new Set(out));
}

function mapApiItemToCard(item) {
  const photos = Array.isArray(item?.photos) ? item.photos : [];
  const photoUris = photos
    .map((p) =>
      typeof p === "string" ? p : p?.url || p?.uri || p?.src || null
    )
    .filter(Boolean);
  const firstUri = photoUris[0] || null;
  const imageSource = firstUri ? { uri: firstUri } : null;

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
    raw: { ...item, photos: photoUris },
  };
}

export default function RouteEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  /* 1) 데이터 준비: routeItems가 먼저, 그 다음 제목 초기값 */
  const routeItems = useMemo(() => {
    try {
      const a = params?.routeItems ? JSON.parse(String(params.routeItems)) : [];
      return Array.isArray(a) && a.length ? a : MOCK_PLACES;
    } catch {
      return MOCK_PLACES;
    }
  }, [params?.routeItems]);

  const initialRouteTitle = useMemo(() => {
    const fromParam =
      typeof params?.routeTitle === "string" ? params.routeTitle.trim() : "";
    if (fromParam) return fromParam;
    return routeItems?.[0]?.location_name || routeItems?.[0]?.title || "추천";
  }, [params?.routeTitle, routeItems]);

  /* 2) 제목을 state로 관리 + 인라인 편집 */
  const [routeTitle, setRouteTitle] = useState(initialRouteTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(initialRouteTitle);

  useEffect(() => {
    // params나 routeItems가 바뀌어 초기값이 달라지면 동기화
    setRouteTitle(initialRouteTitle);
    setTempTitle(initialRouteTitle);
  }, [initialRouteTitle]);

  const titleChanged = useMemo(
    () => (routeTitle || "").trim() !== (initialRouteTitle || "").trim(),
    [routeTitle, initialRouteTitle]
  );

  /* 3) 나머지 상태 */
  const center = useMemo(() => {
    try {
      const c = params?.center ? JSON.parse(String(params.center)) : null;
      if (c && Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng))) {
        return { lat: Number(c.lat), lng: Number(c.lng) };
      }
    } catch {}
    const f = routeItems?.[0];
    return f?.latitude && f?.longitude
      ? { lat: Number(f.latitude), lng: Number(f.longitude) }
      : { lat: 37.2421, lng: 127.0719 };
  }, [params?.center, routeItems]);

  const region = typeof params?.region === "string" ? params.region : "";
  const journeyId = params?.journeyId ? String(params.journeyId) : null;

  const [cards, setCards] = useState(() => routeItems.map(mapApiItemToCard));
  const [selectedIds, setSelectedIds] = useState([]); // 최대 2개
  const [selectedPills, setSelectedPills] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const originalOrder = useMemo(
    () => routeItems.map((it) => String(it.location_id)),
    [routeItems]
  );

  const orderChanged = useMemo(() => {
    const now = cards.map((c) => String(c.location_id));
    if (now.length !== originalOrder.length) return true;
    for (let i = 0; i < now.length; i++) {
      if (now[i] !== originalOrder[i]) return true;
    }
    return false;
  }, [cards, originalOrder]);

  const toggleCard = useCallback((id) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }, []);

  const togglePill = useCallback((label) => {
    setSelectedPills((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }, []);

  // 장소 선택 있거나, 순서만 바뀌었거나 → 버튼 활성화
  const canProceed = selectedIds.length > 0 || orderChanged || titleChanged;
  const showFooter = selectedIds.length > 0;
  

  async function requestReplaceForCard({ card, center, region, selectedPills }) {
    const tryOnce = async (category, withRegion = true) => {
      const body = {
        category,
        exclude_location_ids: [Number(card.location_id)].filter(Boolean),
        center,
        radius_km: 3,
        ...(withRegion ? { region } : {}),
      };
      const res = await postReplaceOne(body);
      return Array.isArray(res?.items) && res.items[0] ? res.items[0] : null;
    };
    for (const cat of selectedPills) {
      const found = await tryOnce(cat, true);
      if (found) return found;
    }
    for (const cat of selectedPills) {
      const found = await tryOnce(cat, false);
      if (found) return found;
    }
    const fallbackCat = card.categories?.[0] || card.raw?.category || "";
    if (fallbackCat) {
      const found =
        (await tryOnce(fallbackCat, true)) ||
        (await tryOnce(fallbackCat, false));
      if (found) return found;
    }
    return null;
  }

  const handleNext = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      let finalCards = [...cards];

      if (selectedIds.length > 0) {
        // ✅ 교체 플로우 (선택 카드가 있는 경우에만)
        if (!selectedPills.length) {
          Alert.alert("안내", "교체할 상위 카테고리를 하나 이상 선택해 주세요.");
          setSubmitting(false);
          return;
        }

        const ordered = [...cards]; // 현재 순서
        const replacedByIndex = {};
        const baseTargets = getReplaceCategories(selectedPills);

        await Promise.all(
          ordered
            .filter((c) => selectedIds.includes(String(c.location_id)))
            .map(async (card) => {
              const idx = ordered.findIndex(
                (c) => String(c.location_id) === String(card.location_id)
              );
              if (idx < 0) return;

              const cardPrimaryCat =
                card.categories?.[0] || card.raw?.category || "";
              const targets = Array.from(
                new Set([...baseTargets, ...(cardPrimaryCat ? [cardPrimaryCat] : [])])
              );

              let picked = null;
              for (const cat of targets) {
                try {
                  const res = await postReplaceOne({
                    category: cat,
                    exclude_location_ids: [Number(card.location_id)].filter(Boolean),
                    center,
                    radius_km: 3,
                  });
                  const item =
                    Array.isArray(res?.items) && res.items[0] ? res.items[0] : null;
                  if (item) {
                    picked = mapApiItemToCard(item);
                    break;
                  }
                } catch {}
              }
              if (picked) replacedByIndex[idx] = picked;
            })
        );

        finalCards = ordered.map((c, i) => replacedByIndex[i] || c);
      }
      // 👉 selectedIds.length === 0: 교체 없이 순서만 반영

      // summary로 전달
      const extractPhotos = (c) => {
        if (Array.isArray(c?.raw?.photos)) return c.raw.photos;
        if (c?.imageSource?.uri) return [c.imageSource.uri];
        return [];
      };

      const newFirst = finalCards[0];
      const firstPayload = {
        location_id: newFirst.location_id,
        location_name: newFirst.title,
        category: newFirst.categories?.[0] || "",
        address: newFirst.address || "",
        latitude: newFirst.lat,
        longitude: newFirst.lng,
        photos: extractPhotos(newFirst),
        rating_avg: newFirst.rating ?? null,
      };
      const newPrefetched = finalCards.slice(1, 3).map(
        (c) =>
          c.raw || {
            location_id: c.location_id,
            location_name: c.title,
            category: c.categories?.[0] || "",
            address: c.address || "",
            latitude: c.lat,
            longitude: c.lng,
            photos: extractPhotos(c),
            rating_avg: c.rating ?? null,
          }
      );

      router.push({
        pathname: "/route-builder/summary",
        params: {
          first: encodeURIComponent(JSON.stringify(firstPayload)),
          prefetched: JSON.stringify(newPrefetched),
          region: region || "",
          center: JSON.stringify(center),
          selectedPills: JSON.stringify(selectedPills),
          edited: "1",
          routeTitle: routeTitle, // ✅ 바뀐 이름 전달
        },
      });
    } catch (e) {
      Alert.alert("오류", e?.message || "처리에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Header / Footer ---------- */
  const ListHeader = () => (
    <View style={{ paddingHorizontal: 25, paddingTop: 8, paddingBottom: 18 }}>
      <Text className="text-heading-2 font-pretendardSemiBold">
        변경할 장소를 선택해주세요.
      </Text>
      <Text className="mt-[6px] text-gray700 text-body-3 font-pretendardRegular">
        드래그를 통해 순서만 변경도 가능해요.
      </Text>

      {/* 루트 이름 라인 (인라인 편집) */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 41 }}>
        {isEditingTitle ? (
          <TextInput
            value={tempTitle}
            onChangeText={setTempTitle}
            onBlur={() => {
              const next = (tempTitle || "").trim();
              if (next) setRouteTitle(next);
              setIsEditingTitle(false);
            }}
            autoFocus
            style={{
              flex: 1,
              fontFamily: "Pretendard-SemiBold",
              fontSize: 24,
              borderBottomWidth: 1,
              borderColor: "#D4D4D4",
              paddingVertical: 2,
            }}
            placeholder="루트 이름을 입력하세요."
            returnKeyType="done"
            onSubmitEditing={() => {
              const next = (tempTitle || "").trim();
              if (next) setRouteTitle(next);
              setIsEditingTitle(false);
            }}
          />
        ) : (
          <Pressable
            style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}
            onPress={() => setIsEditingTitle(true)}
          >
            <Text
              className="text-title-3 font-pretendardSemiBold"
              numberOfLines={1}
              style={{ flexShrink: 1 }}
            >
              {routeTitle}
            </Text>
            <Icon name="edit" width={24} height={24} style={{ marginLeft: 4 }} />
          </Pressable>
        )}
      </View>
    </View>
  );

  const ListFooter = () => (
    <View style={{ paddingHorizontal: 25, paddingTop: 0, paddingBottom: 50 }}>
      <View
        style={{
          height: 10,
          backgroundColor: "#F4F4F4",
          marginTop: 37,
          marginHorizontal: -25,
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
      <Text className="text-heading-2 font-pretendardSemiBold mt-[34px]">
        선호하는 키워드를 모두 선택해주세요.
      </Text>
      <Text className="mt-[6px] text-gray700 text-body-3 font-pretendardRegular">
        키워드에 맞게 장소를 다시 추천해 드릴게요.
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginTop: 16,
          marginBottom: 50,
        }}
      >
        {EDIT_CATEGORY_LABELS.map((label) => {
          const active = selectedPills.includes(label);
          return (
            <Pressable
              key={label}
              onPress={() => togglePill(label)}
              android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
              style={{
                paddingHorizontal: 22,
                paddingVertical: 11,
                borderRadius: 999,
                marginRight: 10,
                marginBottom: 13,
                backgroundColor: active ? "#FCFFFA" : "#F4F4F4",
                borderWidth: 1.5,
                borderColor: active ? "#42790E" : "transparent",
              }}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <Text
                className={[
                  "text-body-2 font-pretendardMedium",
                  active ? "text-green900" : "text-gray700",
                ].join(" ")}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  /* ---------- Row ---------- */
  const renderRow = ({ item, drag }) => {
    const selected = selectedIds.includes(String(item.location_id));
    return (
      <View
        style={{
          position: "relative",
          paddingHorizontal: 15,
          marginBottom: 14,
        }}
      >
        <EditStepCard
          title={item.title}
          rating={item.rating}
          categories={item.categories}
          address={item.address}
          imageSource={item.imageSource}
          selected={selected}
          onPress={() => toggleCard(String(item.location_id))}
        />
        {/* 오른쪽 드래그 핸들 */}
        <Pressable
          onLongPress={drag}
          delayLongPress={120}
          style={{
            position: "absolute",
            right: 10,
            top: 0,
            width: 32,
            height: 24,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
          hitSlop={8}
        >
          <View style={{ gap: 4 }}>
            <View style={{ width: 20, height: 2, backgroundColor: "#AFAFAF" }} />
            <View style={{ width: 20, height: 2, backgroundColor: "#AFAFAF" }} />
            <View style={{ width: 20, height: 2, backgroundColor: "#AFAFAF" }} />
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header leftIcon="previous" onLeftPress={() => router.back()} />

      {/* 단일 스크롤 컨테이너: DraggableFlatList */}
      <DraggableFlatList
        data={cards}
        keyExtractor={(it) => String(it.location_id)}
        renderItem={renderRow}
        onDragEnd={({ data }) => {
          setCards(data);
          // 서버 반영 필요 시 reorderJourneyLocations 호출
        }}
        activationDistance={10}
        contentContainerStyle={{ paddingBottom: showFooter ? 110 : 140 }}
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={showFooter ? <ListFooter /> : null}
      />

      {/* 하단 고정 버튼 */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 25,
          backgroundColor: "transparent",
        }}
      >
        <Button
          title={submitting ? "새 루트를 탐색 중..." : "다음"}
          size="large"
          variant={submitting ? "disabled" : canProceed ? "primary" : "disabled"}
          onPress={submitting ? undefined : handleNext}
          disabled={submitting || !canProceed}
          loading={submitting}
          style={{ opacity: submitting ? 0.9 : 1 }}
        />
      </View>
    </SafeAreaView>
  );
}