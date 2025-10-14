import {
  CHARACTERS,
  THEME_LABELS,
  getCharacterImageKey,
} from "@assets/characters/CHARACTERS";
import { Images } from "@assets/images";
import Header from "@components/shared/Header";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

// (선택) 프로젝트에 Auth 컨텍스트가 있으면 사용
// import { useAuth } from "@providers/AuthProvider";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN?.trim();

/** 공통 fetch 유틸: 2xx 아닌 경우 throw */
async function fetchJSON(url, token, signal) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${text}`.trim());
  }
  return res.json();
}

export default function CharacterDexScreen() {
  const router = useRouter();
  // const { jwt } = useAuth() || {};
  const jwt = TEST_TOKEN; /* || jwt */

  // 로컬 정의 → 빠른 조인용 인덱스
  const localById = useMemo(() => {
    const m = new Map();
    CHARACTERS.forEach((c) => m.set(c.id, c));
    return m;
  }, []);

  // 서버에서 내려주는 전체/보유 목록
  const [serverAll, setServerAll] = useState(null); // [{ id, theme, gender }]
  const [serverOwned, setServerOwned] = useState(null); // [{ user_id, character_id, character: {...} }]
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 상단 탭 (필터)
  const tabs = useMemo(
    () => [
      { key: "all", label: "탐험가" },
      { key: "season", label: "계절" },
      { key: "hobby", label: "취미" },
      { key: "halloween", label: "할로윈" },
      { key: "christmas", label: "크리스마스" },
    ],
    []
  );
  const [activeTab, setActiveTab] = useState("all");

  // 실제 사용할 전체 목록: 서버 성공 시 서버 목록을 로컬과 조인, 실패 시 로컬로 폴백
  const allCharacters = useMemo(() => {
    if (Array.isArray(serverAll) && serverAll.length > 0) {
      // 서버 목록의 id를 기준으로 로컬 메타(file 등) 보강
      return serverAll
        .map((s) => {
          const local = localById.get(s.id);
          // 로컬 정의가 없으면(이미지/파일 매핑 불가) 렌더에서 건너뛸 수 있도록 그대로 둔다
          return { ...s, ...local };
        })
        .filter((c) => !!c?.id); // id 없는 건 제거
    }
    // 서버 실패 시: 로컬 전체
    return CHARACTERS;
  }, [serverAll, localById]);

  // 내가 해금한 ID 집합
  const ownedIdSet = useMemo(() => {
    if (Array.isArray(serverOwned)) {
      const ids = serverOwned
        .map((r) => r.character_id || r?.character?.id)
        .filter(Boolean);
      return new Set(ids);
    }
    // 서버 실패 시: 아무것도 해금 X (혹은 필요시 과거 하드코드 넣고 싶으면 여기)
    return new Set();
  }, [serverOwned]);

  // 테마별 그룹
  const grouped = useMemo(() => {
    const map = {};
    allCharacters.forEach((c) => {
      const theme = c.theme || "others";
      if (!map[theme]) map[theme] = [];
      map[theme].push(c);
    });
    return map;
  }, [allCharacters]);

  // 필터링
  const filtered = useMemo(() => {
    if (activeTab === "all") return allCharacters;
    return allCharacters.filter((c) => c.theme === activeTab);
  }, [activeTab, allCharacters]);

  // 진행도
  const unlockedCount = ownedIdSet.size;
  const totalCount = allCharacters.length;
  const progress = totalCount ? unlockedCount / totalCount : 0;

  // 최초 로드
  const abortRef = useRef(null);
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!jwt || !API_BASE_URL) {
        setErrorMsg(
          "API_BASE_URL 또는 JWT 없음(개발/테스트 환경 확인). 로컬 데이터로 표시."
        );
        return;
      }
      setLoading(true);
      setErrorMsg("");
      const abort = new AbortController();
      abortRef.current = abort;
      try {
        const [all, mine] = await Promise.all([
          fetchJSON(`${API_BASE_URL}/characters`, jwt, abort.signal),
          fetchJSON(`${API_BASE_URL}/characters/me`, jwt, abort.signal),
        ]);
        if (!mounted) return;
        setServerAll(Array.isArray(all) ? all : []);
        setServerOwned(Array.isArray(mine) ? mine : []);
      } catch (e) {
        if (e?.name === "AbortError") return;
        console.warn("[characters] fetch failed:", e?.message || e);
        setErrorMsg("캐릭터 정보를 불러오지 못했음. 로컬 데이터로 표시 중.");
        // 폴백: serverAll/serverOwned는 null 유지 → 위에서 로컬로 대체됨
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
      abortRef.current?.abort();
    };
  }, [jwt]);

  // 당겨서 새로고침
  const onRefresh = async () => {
    if (!jwt || !API_BASE_URL) return;
    setRefreshing(true);
    const abort = new AbortController();
    try {
      const [all, mine] = await Promise.all([
        fetchJSON(`${API_BASE_URL}/characters`, jwt, abort.signal),
        fetchJSON(`${API_BASE_URL}/characters/me`, jwt, abort.signal),
      ]);
      setServerAll(Array.isArray(all) ? all : []);
      setServerOwned(Array.isArray(mine) ? mine : []);
      setErrorMsg("");
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.warn("[characters][refresh] failed:", e?.message || e);
        setErrorMsg("새로고침 실패");
      }
    } finally {
      setRefreshing(false);
    }
  };

  // (옵션) 해금 액션 예시: POST /characters/{id}/unlock
  const unlockCharacter = async (characterId) => {
    if (!jwt || !API_BASE_URL) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/characters/${characterId}/unlock`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      // 성공 시, 내 목록 재조회
      const mine = await fetchJSON(`${API_BASE_URL}/characters/me`, jwt);
      setServerOwned(Array.isArray(mine) ? mine : []);
    } catch (e) {
      console.warn("[unlock] failed:", e?.message || e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Header
        title="캐릭터 도감"
        leftIcon="previous"
        onLeftPress={() => router.back()}
      />

      {/* 도감 완성도 카드 */}
      <View
        style={{
          marginHorizontal: 25,
          marginTop: 28,
          marginBottom: 25,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.11,
          shadowRadius: 3,
          elevation: 3,
        }}
      >
        <LinearGradient
          colors={["#64BC2E", "#2E7A45"]}
          start={[0, 0]}
          end={[1, 1]}
          style={{ borderRadius: 10, padding: 2 }}
        >
          <View
            style={{
              backgroundColor: "#FBFFF7",
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 11,
              paddingVertical: 8,
            }}
          >
            <Image
              source={Images.common.collection}
              style={{ width: 66, height: 66, marginRight: 14 }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Text className="text-heading-3 font-pretendardSemiBold text-green900">
                  도감 완성도
                </Text>
                <Text className="text-body-3 font-pretendardRegular text-green900">
                  {unlockedCount}/{totalCount}
                </Text>
              </View>
              <View
                style={{
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: "#F4F4F4",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${Math.max(
                      0,
                      Math.min(100, Math.round(progress * 100))
                    )}%`,
                    backgroundColor: "#62974F",
                    borderRadius: 999,
                  }}
                />
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* 탭 */}
      <View style={{ position: "relative" }}>
        <View
          style={{
            position: "absolute",
            left: 0,
            top: -15,
            bottom: 0,
            width: 28,
            backgroundColor: "#FFF",
            shadowColor: "#000",
            shadowOffset: { width: -1, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 1,
            elevation: 4,
            overflow: "hidden",
            zIndex: 1,
          }}
          pointerEvents="none"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 30,
            gap: 8,
            marginBottom: 16,
          }}
        >
          {tabs.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={{
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: activeTab === t.key ? "#62974F" : "#AFAFAF",
                backgroundColor: activeTab === t.key ? "#62974F" : "#FFFFFF",
                paddingHorizontal: 14,
                height: 34,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: activeTab === t.key ? "#FFF" : "#AFAFAF",
                  fontFamily: "Pretendard-Medium",
                  fontSize: 14,
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 오른쪽 페이드 */}
        <View
          style={{
            position: "absolute",
            right: 0,
            top: -15,
            bottom: 0,
            width: 28,
            backgroundColor: "white",
            shadowColor: "#000",
            shadowOffset: { width: -1, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 1,
            elevation: 4,
            overflow: "hidden",
          }}
          pointerEvents="none"
        />
      </View>

      {/* 캐릭터 목록 */}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#62974F"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 25,
          paddingBottom: 40,
          gap: 70,
        }}
      >
        {/* 에러/로딩 상태 간단 표기 (UI는 프로젝트 규칙에 맞게 바꿔) */}
        {!!errorMsg && (
          <Text
            style={{ color: "#C05621", marginBottom: 8, textAlign: "center" }}
          >
            {errorMsg}
          </Text>
        )}
        {loading && (
          <Text
            style={{ color: "#8C8C8C", marginBottom: 8, textAlign: "center" }}
          >
            불러오는 중…
          </Text>
        )}

        {["base", "season", "hobby", "halloween", "christmas"].map((theme) => {
          const chars = grouped[theme];
          // 현재 탭 필터에 걸린 항목이 없으면 스킵
          if (!chars.some((c) => filtered.includes(c))) return null;

          return (
            <View key={theme}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 15,
                }}
              >
                <Image
                  source={Images.gacha.textDashGreen}
                  style={{ width: 120, height: 8, marginRight: 30 }}
                  resizeMode="contain"
                />
                <Text
                  className="text-heading-2 font-pretendardSemiBold text-green900"
                  style={{ textAlign: "center" }}
                >
                  {THEME_LABELS[theme] || theme}
                </Text>
                <Image
                  source={Images.gacha.textDashGreen}
                  style={{
                    width: 120,
                    height: 8,
                    marginLeft: 30,
                    transform: [{ scaleX: -1 }],
                  }}
                  resizeMode="contain"
                />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  marginHorizontal: -6,
                }}
              >
                {chars.map((c) => {
                  // 로컬 매핑 정보가 없으면(이미지 키 불가능) 스킵
                  if (!c?.file) return null;

                  const owned = ownedIdSet.has(c.id);
                  const key = getCharacterImageKey(c.file, owned);
                  const img =
                    Images.characters[key] || Images.characters[c.file];

                  return (
                    <View
                      key={c.id}
                      style={{
                        width: "33.3333%",
                        paddingHorizontal: 9,
                        marginBottom: 4,
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={img}
                        style={{ width: 110, height: 110 }}
                        resizeMode="contain"
                      />
                      {/* (옵션) 미보유시 해금 버튼을 두고 싶다면: */}
                      {/* {!owned && (
                        <Pressable onPress={() => unlockCharacter(c.id)} style={{ marginTop: 6 }}>
                          <Text style={{ fontSize: 12, color: "#62974F" }}>해금</Text>
                        </Pressable>
                      )} */}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
