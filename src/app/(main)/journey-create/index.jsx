// app/journey-create/index.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import AddPlaceCard from "../../../components/journey/AddPlaceCard";
import Header from "../../../components/shared/Header";
import Icon from "../../../components/shared/Icon";
import SpeechBubble from "../../../components/shared/SpeechBubble";

const H_PADDING = 25;
const CHARACTER = require("../../../assets/images/explorer.png");

// ====== 환경변수 (백엔드 베이스) ======
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

// ---- Draft storage (공용 누적 저장) ----
// places 스키마 예: { id: number, name: string, address: string, category?: string, rating?: number, locationId?: number }
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

// ====== 썸네일 헬퍼 (GET /locations/{id}) ======
async function fetchCoverThumb(locationId) {
  const idNum = Number(locationId);
  if (!Number.isFinite(idNum)) {
    console.log("[journey] thumb skip: non-numeric id", locationId);
    return null;
  }
  if (!API_BASE) {
    console.log("[journey] thumb skip: no API_BASE");
    return null;
  }

  const url = `${API_BASE.replace(/\/+$/, "")}/locations/${idNum}`;
  console.log("[journey] thumb GET", idNum, url);

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    console.log("[journey] thumb status", idNum, res.status);
    if (!res.ok) {
      const body = await res.text().catch(() => "(no body)");
      console.log("[journey] thumb error body", idNum, body?.slice(0, 400));
      return null;
    }

    const data = await res.json();
    // 여기! 백엔드에서 주는 키 그대로 우선순위 적용
    let raw =
      data?.thumbnail_url || // 1순위
      data?.fallback_photo_url || // 2순위 (예비)
      null;

    if (!raw) {
      console.log("[journey] thumb no image field", idNum);
      return null;
    }

    // 절대/상대 URL 정규화
    const absolute = /^https?:\/\//i.test(raw)
      ? raw
      : `${API_BASE.replace(/\/+$/, "")}/${String(raw).replace(/^\/+/, "")}`;

    if (!/^https?:\/\//i.test(absolute)) {
      console.log("[journey] invalid URL after resolve", idNum, absolute);
      return null;
    }

    console.log("[journey] thumb picked", idNum, absolute);
    return absolute;
  } catch (e) {
    console.log("[journey] thumb fetch error", idNum, String(e));
    return null;
  }
}

export default function JourneyCreateStep1() {
  const { width } = useWindowDimensions();
  const router = useRouter();

  const [places, setPlaces] = useState([]);
  // 썸네일 캐시: { [locationId or id]: url }
  const [thumbs, setThumbs] = useState({});

  // 화면이 포커스될 때마다 드래프트를 읽어와서 렌더
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const data = await loadDraft();
        if (alive) setPlaces(data);
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  // places가 바뀌면 각 place의 locationId(or id)로 썸네일 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      const tasks = (places || []).map(async (p) => {
        const key = p.locationId ?? p.id;
        if (!key || thumbs[key]) return;
        const url = await fetchCoverThumb(key);
        if (alive && url) {
          setThumbs((m) => ({ ...m, [key]: url }));
        }
      });
      await Promise.allSettled(tasks);
      console.log(
        "[journey] thumbs fetched for",
        (places || []).length,
        "items"
      );
    })();
    return () => {
      alive = false;
    };
  }, [places]);

  const BUBBLE_MAX_W = useMemo(() => width - H_PADDING * 2, [width]);

  const handleDelete = useCallback((id) => {
    setPlaces((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveDraft(next);
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 헤더 */}
      <Header
        title="여정기록 일지"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      {/* 상단 안내 */}
      <View
        style={{
          paddingHorizontal: 20,
          marginTop: 13,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Image
          source={CHARACTER}
          style={{
            width: 46,
            height: 46,
            resizeMode: "contain",
            marginRight: 8,
          }}
        />
        <View>
          <Text className="text-gray700 text-body-2 font-pretendardMedium">
            어떤 곳을 방문하셨나요?
          </Text>
          <Text className="text-gray700 text-body-2 font-pretendardMedium">
            방문 장소를 알려주세요.
          </Text>
        </View>
      </View>

      {/* 방문 장소 추가하기 카드 (검색 진입) */}
      <View
        style={{
          marginTop: 33,
          marginHorizontal: 15,
          backgroundColor: "#F4F4F4",
          borderRadius: 10,
          paddingTop: 8,
          paddingBottom: 21,
          paddingHorizontal: 10,
        }}
      >
        <Text className="text-heading-3 font-pretendardSemiBold">
          방문 장소 추가하기
        </Text>

        <Pressable
          onPress={() => router.push("/journey-create/search-place")}
          style={{
            marginTop: 16,
            height: 43,
            borderRadius: 35,
            backgroundColor: "#fff",
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
          }}
          hitSlop={10}
        >
          <Text style={{ flex: 1, fontSize: 16, color: "#AFAFAF" }}>
            장소 검색하기
          </Text>
          <Icon name="search_outline" width={21} height={20} />
        </Pressable>
      </View>

      {/* 저장된(누적) 장소 리스트 */}
      {places.length > 0 && (
        <View style={{ marginHorizontal: H_PADDING }}>
          {/* 회색 구분바 + 위쪽 그라데이션 */}
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

          {places.map((p, idx) => {
            const key = p.locationId ?? p.id;
            const thumb = thumbs[key]; // 썸네일 캐시에서 꺼냄
            return (
              <AddPlaceCard
                key={p.id}
                name={p.name}
                category={p.category}
                address={p.address}
                rating={p.rating}
                thumb={thumb} // ← 여기!
                onDelete={() => handleDelete(p.id)}
                style={{ marginBottom: idx === places.length - 1 ? 0 : 14 }}
              />
            );
          })}
        </View>
      )}

      {/* 하단 플로팅 CTA */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
        }}
      >
        {/* 장소가 하나라도 있으면 말풍선 숨김 */}
        {places.length === 0 && (
          <SpeechBubble
            text="장소를 추가하면 포인트를 받을 수 있어요!"
            paddingH={25}
            paddingV={4}
            style={{ marginBottom: 9, maxWidth: BUBBLE_MAX_W }}
          />
        )}

        <Pressable
          onPress={() => {
            router.push("/journey-create/compose");
          }}
          hitSlop={10}
        >
          <Icon name="next_circle" width={53} height={53} />
        </Pressable>
        <Text className="mt-[6px] text-heading-3 font-pretendardSemiBold text-green500">
          다음
        </Text>
      </View>
    </SafeAreaView>
  );
}
