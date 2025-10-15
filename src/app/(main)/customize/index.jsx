import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { characters } from "@assets/characters";
import { CHARACTERS, getCharacterImageKey } from "@assets/characters/CHARACTERS";
import { OBJECTS } from "@assets/objects";
import { CANVAS } from "@assets/slots/layout";

import AvatarBundle from "@components/avatar/AvatarBundle";
import Button from "@components/shared/Button";
import Header from "@components/shared/Header";
import { selectableObjectsFor } from "@utils/slots";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";

// 🔗 API
import { getAppearance, getMyAssets, getMyCharacters, putAppearance } from "@services/api";
import { useAppearanceStore } from "@store/appearance.store";
import { customizeToApiPayload } from "@utils/appearance.adapters";

const TABS = ["bg1", "bg2", "bg3", "character"];
const TAB_LABEL = { bg1: "배경1", bg2: "배경2", bg3: "배경3", character: "캐릭터" };

// 🔹 server character_id -> file 키 매핑 헬퍼
const ID_TO_FILE = CHARACTERS.reduce((m, c) => ((m[c.id] = c.file), m), {});

// 🔹 API 응답 → 커스터마 로컬 슬롯으로 변환
function apiToCustomizeSlots(api) {
  const charFile = api?.current_character_id ? ID_TO_FILE[api.current_character_id] : null;
  const bg1 = api?.current_assets?.["bg1-only"] ?? null;
  const bg23 = Array.isArray(api?.current_assets?.bg23) ? api.current_assets.bg23.slice(0, 2) : [];
  return {
    bg1: bg1 || "tent",                 // 안전 기본값
    bg2: bg23[0] || "tree",
    bg3: bg23[1] || "tree",
    character: charFile || "base_explorer_male",
  };
}

export default function CustomizeScreen({ initialSlots }) {
  const insets = useSafeAreaInsets();
  const setFromApi = useAppearanceStore((s) => s.setFromApi);
  const [saving, setSaving] = useState(false);

  // ── 로컬 편집 슬롯 (미리보기에 사용)
  const [slots, setSlots] = useState(
    initialSlots ?? {
      bg1: "tent",
      bg2: "tree",
      bg3: "tree",
      character: "base_explorer_male",
    }
  );

  const [tab, setTab] = useState("bg1");

  // ── 보유 데이터
  const [loadingOwn, setLoadingOwn] = useState(true);
  const [ownedCharIds, setOwnedCharIds] = useState(new Set());
  const [ownedAssetIds, setOwnedAssetIds] = useState(new Set());

  // ── 현재 착용 상태 불러와서 미리보기 초기화
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ap = await getAppearance(); // { current_character_id, current_assets: {...} }
        if (!alive) return;
        const next = apiToCustomizeSlots(ap);
        setSlots(next);                   // ✅ 미리보기를 서버 상태로 초기화
      } catch (e) {
        console.warn("[customize] appearance load error:", e?.message || e);
      } finally {
        if (alive) setLoadingCurrent(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ── 보유/미보유 하이드레이션
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [myChars, myAssets] = await Promise.all([
          getMyCharacters().catch(() => []),
          getMyAssets().catch(() => []),
        ]);
        if (!alive) return;
        setOwnedCharIds(new Set(myChars.map((x) => x.character_id)));
        setOwnedAssetIds(new Set(myAssets.map((x) => x.id)));
      } catch (e) {
        console.warn("[customize] own fetch error:", e?.message || e);
      } finally {
        if (alive) setLoadingOwn(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ── 슬롯별 후보 리스트 (+ owned 주입)
  const objectCandidates = useMemo(() => {
    const wrap = (arr) =>
      arr.map((it) => ({
        ...it,
        owned: ownedAssetIds.has(it.key),
        src: it.src ?? OBJECTS[it.key]?.src,
        label: it.label ?? OBJECTS[it.key]?.label ?? it.key,
      }));
    return {
      bg1: wrap(selectableObjectsFor("bg1")),
      bg2: wrap(selectableObjectsFor("bg2")),
      bg3: wrap(selectableObjectsFor("bg3")),
    };
  }, [ownedAssetIds]);

  // ── 캐릭터 후보 (+ owned 주입 / 회색 스킨 처리)
  const characterCandidates = useMemo(
    () =>
      CHARACTERS.map((c) => {
        const owned = ownedCharIds.has(c.id);
        const spriteKey = getCharacterImageKey(c.file, owned);
        return { key: c.file, src: characters[spriteKey], label: c.name, owned };
      }),
    [ownedCharIds]
  );

  const listData = tab === "character" ? characterCandidates : objectCandidates[tab];

  const onPick = (item) => {
    if (!item.owned) return;
    if (tab === "character") setSlots((s) => ({ ...s, character: item.key }));
    else setSlots((s) => ({ ...s, [tab]: item.key }));
  };

  const isSelected = (item) => (tab === "character" ? slots.character === item.key : slots[tab] === item.key);

  const reset = () =>
    setSlots({
      bg1: "pumpkin",
      bg2: "tree",
      bg3: "tulip",
      character: "base_explorer_male",
    });

  const save = async () => {
    try {
      setSaving(true);
      const payload = customizeToApiPayload(slots);
      const updated = await putAppearance(payload); // 서버 병합형 응답
      setFromApi(updated);                          // ✅ 전역상태 갱신 → 홈 즉시 반영
      router.back();
    } catch (e) {
      console.warn("[customize] save error:", e?.message || e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* 🔹 헤더 + 미리보기 영역 */}
      <View style={styles.topArea}>
        <LinearGradient colors={["#B9E09D", "#419833"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} />
        <View style={{ height: insets.top }} />
        <Header title="꾸미기" leftIcon="previous" onLeftPress={() => router.back()} backgroundColor="transparent" />

        {/* 미리보기 */}
        <View style={styles.previewWrap}>
          <View style={{ width: CANVAS.width, height: CANVAS.height }}>
            <AvatarBundle slots={slots} />
          </View>
        </View>
      </View>

      {/* 탭 */}
      <View style={styles.tabsRow}>
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <Pressable key={t} style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{TAB_LABEL[t]}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* 후보 리스트 */}
      <FlatList
        contentContainerStyle={styles.grid}
        numColumns={3}
        data={listData}
        keyExtractor={(it) => it.key}
        renderItem={({ item }) => <GridItem item={item} selected={isSelected(item)} onPress={() => onPick(item)} locked={!item.owned} />}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.column}
      />

      {/* 하단 버튼 */}
      <View style={styles.bottomRow}>
        <Button title="되돌리기" variant={saving ? "disabled" : "secondary"} size="small" onPress={reset} disabled={saving} />
        <Button title={saving ? "저장 중..." : "저장하기"} variant={saving ? "disabled" : "primary"} size="medium" onPress={save} disabled={saving} />
      </View>

      {/* 로딩 오버레이 */}
      {(loadingOwn || loadingCurrent) && (
        <View style={styles.loadingOverlay}>
          <Text style={{ color: "#2E4A31", opacity: 0.75 }}>
            {loadingCurrent ? "현재 착용 불러오는 중…" : "보유 아이템 불러오는 중…"}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ===== 서브 컴포넌트 ===== */
function GridItem({ item, selected, onPress, locked }) {
  return (
    <Pressable onPress={onPress} disabled={locked} style={[styles.card, selected && styles.cardSelected, locked && styles.cardLocked]}>
      <Image source={item.src ?? OBJECTS[item.key]?.src} style={styles.cardImage} resizeMode="contain" />
      <Text style={[styles.cardLabel, locked && styles.cardLabelLocked]} numberOfLines={1}>
        {item.label ?? OBJECTS[item.key]?.label ?? item.key}
      </Text>
      {locked && <View style={styles.lockMask} />}
    </Pressable>
  );
}

/* ===== 스타일 ===== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F9F5" },
  topArea: { position: "relative", paddingBottom: 18 },
  previewWrap: {
    borderRadius: 16,
    paddingTop: 28,
    paddingBottom: 17,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  tabsRow: { marginTop: 23, paddingHorizontal: 30, flexDirection: "row", gap: 10 },
  tabBtn: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 999, backgroundColor: "#F4F4F4" },
  tabBtnActive: { backgroundColor: "#62974F" },
  tabText: { color: "#42790E", fontSize: 16, fontWeight: "600", lineHeight: 16 * 1.4 },
  tabTextActive: { color: "#FFF" },
  grid: { paddingHorizontal: 30, paddingTop: 20, paddingBottom: 10, gap: 10 },
  column: { justifyContent: "space-between", marginBottom: 0 },
  card: {
    width: 104,
    height: 104,
    borderRadius: 10,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: { backgroundColor: "#FCFFFA", borderColor: "#64BC2E" },
  cardLocked: { opacity: 0.75 },
  cardImage: { width: 74, height: 70 },
  cardLabel: { fontSize: 14, fontWeight: "500" },
  cardLabelLocked: { color: "#99A59D" },
  lockMask: { position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.55)", borderRadius: 12 },
  bottomRow: { flexDirection: "row", gap: 12, paddingHorizontal: 25, paddingTop: 10 },
  loadingOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});