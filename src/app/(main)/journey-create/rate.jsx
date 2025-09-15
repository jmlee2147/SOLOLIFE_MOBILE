import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Image,
    Pressable,
    SafeAreaView,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import Button from "../../../components/shared/Button";
import Icon from "../../../components/shared/Icon";

const H_PADDING = 25;
const CHARACTER = require("../../../assets/images/explorer.png");

// Draft strorage (공용 누적 저장)
const DRAFT_KEY = "journey_draft_places_v1";
async function loadDraft() {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
async function saveDraft(list) {
  try {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(list));
  } catch {}
}

function clamp01to5(n) {
  return Math.max(0, Math.min(5, n));
}
function parseInitRating(raw) {
  if (raw == null) return 0;
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseFloat(
    String(v)
      .replace(",", ".")
      .replace(/[^\d.]/g, "")
  );
  return Number.isFinite(n) ? clamp01to5(n) : 0;
}

export default function RateScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();

  // search-place에서 넘어오는 파라미터
  const { savedName, savedAddress, savedCategory, savedRating } =
    useLocalSearchParams();

  const placeName = useMemo(() => String(savedName ?? ""), [savedName]);
  const placeAddr = useMemo(() => String(savedAddress ?? ""), [savedAddress]);
  const placeCatg = useMemo(() => String(savedCategory ?? ""), [savedCategory]);

  const [rating, setRating] = useState(() => parseInitRating(savedRating));

  // 확정 시 드래프트에 저장 → index로 replace
  const onConfirm = async () => {
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: placeName,
      address: placeAddr,
      category: placeCatg,
      rating: clamp01to5(Number(rating) || 0),
    };

    const prev = await loadDraft();
    const deduped = prev.filter(
      (p) => !(p.name === item.name && p.address === item.address)
    );
    const next = [...deduped, item];
    await saveDraft(next);

    router.replace("/journey-create");
  };

  const isSkip = rating === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 커스텀 헤더 영역 (높이 42) */}
      <View
        style={{
          height: 42,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
        }}
      >
        {/* 이전 아이콘 */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ padding: 4, marginRight: 12 }}
        >
          <Icon name="previous" width={20} height={20} color="#000" />
        </Pressable>

        {/* 장소 텍스트 영역 */}
        <View style={{ flex: 1 }}>
          {/* 첫 줄: 아이콘 + 이름 */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Icon
              name="location"
              width={16}
              height={16}
              style={{ marginRight: 5 }}
            />
            <Text
              className="text-body-1 font-pretendardMedium"
              numberOfLines={1}
            >
              {placeName || "선택한 장소"}
            </Text>
          </View>

          {/* 두 번째 줄: 주소 */}
          {!!placeAddr && (
            <Text
              className="text-gray700 text-body-2 font-pretendardRegular"
              numberOfLines={1}
              style={{ marginTop: 2 }} // 아이콘+이름과 들여쓰기 맞추기
            >
              {placeAddr}
            </Text>
          )}
        </View>
      </View>

      <View
        style={{
          height: 10,
          backgroundColor: "#F4F4F4",
          marginTop: 17,
          marginBottom: 20,
          marginHorizontal: -H_PADDING,
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
          pointerEvents="none"
        />
      </View>

      {/* 질문 + 마스코트 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          paddingHorizontal: 20,
          paddingTop: 14,
        }}
      >
        <Image
          source={CHARACTER}
          style={{
            width: 46,
            height: 46,
            resizeMode: "contain",
            marginRight: 8,
            marginTop: 0,
          }}
        />
        <Text className="text-gray700 text-body-2 font-pretendardMedium">
          ‘{placeName || "이 장소"}’ 에 대해서{"\n"}어떻게 생각하시나요?
        </Text>
      </View>

      {/* 점수 숫자 */}
      <View style={{ alignItems: "center", marginTop: 22 }}>
        <Text className="text-title-2 font-pretendardExtraBold">{rating}</Text>
      </View>

      {/* 별점 5개 (Icon star 사용) */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 12,
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const active = rating >= i;
          return (
            <Pressable
              key={i}
              onPress={() => setRating(i)}
              hitSlop={10}
              style={{ paddingHorizontal: 3.5, paddingVertical: 6 }}
            >
              <Icon
                name="star"
                width={35}
                height={35}
                color={active ? "#FF4444" : "rgba(255,68,68,0.5)"}
              />
            </Pressable>
          );
        })}
      </View>

      {/* 얇은 구분선 */}
      <View
        style={{
          height: 1,
          backgroundColor: "#D4D4D4",
          marginTop: 37,
          marginHorizontal: 0,
        }}
      />

      {/* 하단 고정 영역 */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingTop: 0,
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        {/* 공통 버튼 */}
        <Button
          onPress={onConfirm}
          title={isSkip ? "건너뛰기" : "저장하기"}
          variant={isSkip ? "secondary" : "primary"} // ✅ 건너뛰기=secondary, 저장하기=primary
          size="large" // ✅ 큰 버튼 중앙 배치
        />
      </View>
    </SafeAreaView>
  );
}
