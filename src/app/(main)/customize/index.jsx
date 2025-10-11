import { characters } from "@assets/characters";
import {
    CHARACTERS,
    getCharacterImageKey,
} from "@assets/characters/CHARACTERS";
import { OBJECTS } from "@assets/objects";
import { CANVAS } from "@assets/slots/layout";
import AvatarBundle from "@components/avatar/AvatarBundle";
import Button from "@components/shared/Button";
import Header from "@components/shared/Header";
import { selectableObjectsFor } from "@utils/slots";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = ["bg1", "bg2", "bg3", "character"];
const TAB_LABEL = {
  bg1: "배경1",
  bg2: "배경2",
  bg3: "배경3",
  character: "캐릭터",
};

export default function CustomizeScreen({ initialSlots }) {
  const insets = useSafeAreaInsets();

  const [slots, setSlots] = useState(
    initialSlots ?? {
      bg1: "tent",
      bg2: "tree",
      bg3: "tree",
      character: "base_explorer_male",
    }
  );
  const [tab, setTab] = useState("bg1");

  // 슬롯별 후보 리스트
  const objectCandidates = useMemo(
    () => ({
      bg1: selectableObjectsFor("bg1"),
      bg2: selectableObjectsFor("bg2"),
      bg3: selectableObjectsFor("bg3"),
    }),
    []
  );

  // 캐릭터 후보
  const characterCandidates = useMemo(
    () =>
      CHARACTERS.map((c, idx) => {
        const owned = idx < 8;
        const key = getCharacterImageKey(c.file, owned);
        return { key: c.file, src: characters[key], label: c.name, owned };
      }),
    []
  );

  const listData =
    tab === "character" ? characterCandidates : objectCandidates[tab];

  const onPick = (item) => {
    if (tab === "character") {
      if (!item.owned) return;
      setSlots((s) => ({ ...s, character: item.key }));
    } else {
      setSlots((s) => ({ ...s, [tab]: item.key }));
    }
  };

  const isSelected = (item) =>
    tab === "character"
      ? slots.character === item.key
      : slots[tab] === item.key;

  const reset = () =>
    setSlots({
      bg1: "pumpkin",
      bg2: "tree",
      bg3: "tulip",
      character: "base_explorer_male",
    });
  const save = () => console.log("[customize] saved:", slots);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* 🔹 헤더 + 미리보기 영역 (탭 위까지만 그라데이션) */}
      <View style={styles.topArea}>
        <LinearGradient
          colors={["#B9E09D", "#419833"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={{ height: insets.top }} />
        {/* 헤더 */}
        <Header
          title="꾸미기"
          leftIcon="previous"
          onLeftPress={() => router.back()}
          backgroundColor="transparent"
        />

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
            <Pressable
              key={t}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {TAB_LABEL[t]}
              </Text>
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
        renderItem={({ item }) => (
          <GridItem
            item={item}
            selected={isSelected(item)}
            onPress={() => onPick(item)}
            locked={tab === "character" ? !item.owned : false}
          />
        )}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.column} // ★ 가로 간격 적용
      />

      {/* 🔹 하단 버튼 */}
      <View style={styles.bottomRow}>
        <Button
          title="되돌리기"
          variant="secondary"
          size="small"
          onPress={reset}
        />
        <Button
          title="저장하기"
          variant="primary"
          size="medium"
          onPress={save}
        />
      </View>
    </View>
  );
}

/* ===== 서브 컴포넌트 ===== */
function GridItem({ item, selected, onPress, locked }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      style={[
        styles.card,
        selected && styles.cardSelected,
        locked && styles.cardLocked,
      ]}
    >
      <Image
        source={item.src ?? OBJECTS[item.key]?.src}
        style={styles.cardImage}
        resizeMode="contain"
      />
      <Text
        style={[styles.cardLabel, locked && styles.cardLabelLocked]}
        numberOfLines={1}
      >
        {item.label ?? OBJECTS[item.key]?.label ?? item.key}
      </Text>
      {locked && <View style={styles.lockMask} />}
    </Pressable>
  );
}

/* ===== 스타일 ===== */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F7F9F5", // 탭 아래 영역 배경
  },

  // 🔹 탭 위까지 그라데이션 적용되는 상단 영역
  topArea: {
    position: "relative",
    paddingBottom: 18, // 탭과의 간격
  },

  headerRow: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backArrow: { fontSize: 22, color: "#2C3E2E", width: 24 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#1d2b1f",
  },

  previewWrap: {
    borderRadius: 16,
    paddingTop: 28,
    paddingBottom: 17,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  tabsRow: {
    marginTop: 23,
    paddingHorizontal: 30,
    flexDirection: "row",
    gap: 10,
  },
  tabBtn: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#F4F4F4",
  },
  tabBtnActive: { backgroundColor: "#62974F" },
  tabText: {
    color: "#42790E",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 16 * 1.4,
  },
  tabTextActive: { color: "#FFF" },

  grid: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 10,
  },
  column: {
    justifyContent: "space-between", // ★ 열 사이 동일 간격
    marginBottom: 0, // ★ 행 사이 간격
  },

  card: {
    width: 104, // 기존 계산 유지
    height: 104,
    borderRadius: 10,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: { backgroundColor: "#FCFFFA", borderColor: "#64BC2E" },
  cardLocked: { opacity: 0.8 },
  cardImage: { width: 74, height: 70 },
  cardLabel: { fontSize: 14, fontWeight: 500 },
  cardLabelLocked: { color: "#99A59D" },
  lockMask: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
  },

  bottomRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  bottomBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhost: { backgroundColor: "#DCE9D8" },
  btnGhostText: { color: "#2E4A31", fontWeight: "700" },
  btnPrimary: { backgroundColor: "#6EA96A" },
  btnPrimaryText: { color: "white", fontWeight: "700" },
});
