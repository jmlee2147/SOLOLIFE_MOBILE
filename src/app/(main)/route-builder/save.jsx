import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Button from "../../../components/shared/Button";
import Header from "../../../components/shared/Header";
import { MOODS } from "../../../config/category.config";
import { useToast } from "../../../providers/ToastProvider";
import { setPendingToast } from "../../../utils/toastNext";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN?.trim();

function sanitizeToken(t) {
  return String(t || "").trim().replace(/^Bearer\s+/i, "");
}

export default function RouteSaveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showToast } = useToast();

  /** ---------- 파라미터 파싱 ---------- */
  const routeNameDefault = params?.defaultName ? String(params.defaultName) : "";

  const defaultThumbs = useMemo(() => {
    try {
      const arr = JSON.parse(params?.thumbs || "[]");
      return Array.isArray(arr)
        ? arr.slice(0, 3).map((t) => (typeof t === "string" ? { uri: t } : t))
        : [];
    } catch {
      return [];
    }
  }, [params?.thumbs]);

  const placeSummaryFromParams = useMemo(() => {
    if (typeof params?.placeSummary === "string" && params.placeSummary.trim()) {
      return params.placeSummary.trim();
    }
    try {
      const names = JSON.parse(params?.placeNames || "[]");
      if (Array.isArray(names) && names.length) {
        return names.slice(0, 3).join("-");
      }
    } catch {}
    return "";
  }, [params?.placeSummary, params?.placeNames]);

  /** ---------- 입력 상태 ---------- */
  const [routeName, setRouteName] = useState(routeNameDefault);
  const [inputTag, setInputTag] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [saving, setSaving] = useState(false);

  const suggestions = useMemo(() => MOODS ?? [], []);

  /** ---------- 유틸 ---------- */
  function getSelectedLocationIds() {
    const raw = params?.locationIds ?? params?.locations ?? null;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((x) => (typeof x === "object" ? Number(x.location_id ?? x.id) : Number(x)))
        .filter((n) => Number.isFinite(n));
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((x) => (typeof x === "object" ? Number(x.location_id ?? x.id) : Number(x)))
          .filter((n) => Number.isFinite(n));
      }
    } catch {}
    return String(raw)
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
  }

  async function ensureToken() {
    const t = sanitizeToken(TEST_TOKEN);
    try {
      await AsyncStorage.setItem("jwt", t); // 상세 화면에서도 동일 토큰 사용
    } catch {}
    return t;
  }

  /** ---------- 태그 제어 ---------- */
  const toggleTag = (t) => {
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const addTag = () => {
    const v = inputTag.trim();
    if (!v) return;
    if (!selectedTags.includes(v)) setSelectedTags((p) => [...p, v]);
    setInputTag("");
    Keyboard.dismiss();
  };

  const canSave = routeName.trim().length > 0;

  /** ---------- 저장 ---------- */
  async function handleSave() {
    const title = routeName.trim();
    const ids = getSelectedLocationIds();

    if (!title) {
      Alert.alert("루트 저장", "루트 이름을 입력해 주세요.");
      return;
    }
    if (!ids.length) {
      Alert.alert("루트 저장", "선택된 장소가 없습니다.");
      return;
    }

    try {
      setSaving(true);

      // 1) 토큰
      const token = await ensureToken();

      // 2) 바디
      const body = {
        journey_title: title,
        locations: ids.map((id, idx) => ({
          location_id: Number(id),
          sequence_number: idx + 1,
        })),
        // selectedTags는 현재 명세에 없으므로 미전송
      };

      // 3) 요청
      const res = await fetch(`${BASE_URL}/journeys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sanitizeToken(token)}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || String(data?.error).toLowerCase().includes("invalid token")) {
          await AsyncStorage.removeItem("jwt");
          throw new Error("로그인이 필요합니다. (토큰 무효)");
        }
        const msg =
          data?.error ||
          (res.status === 401 ? "로그인이 필요합니다." : `저장에 실패했어요. (HTTP ${res.status})`);
        throw new Error(msg);
      }

      const journeyId = String(data?.journey_id);
      if (!journeyId) throw new Error("서버 응답에 journey_id가 없습니다.");

      // 4) 메타 저장 (상세 화면 카드용)
      const thumbsParam = (() => {
        try {
          return JSON.parse(params?.thumbs ?? "[]");
        } catch {
          return [];
        }
      })();
      const placeSummaryParam =
        typeof params?.placeSummary === "string" ? params.placeSummary : "";
      const meta = {
        thumbs: Array.isArray(thumbsParam) ? thumbsParam : [],
        placeSummary: placeSummaryParam || placeSummaryFromParams || "",
        title,
      };
      try {
        await AsyncStorage.setItem(`journey_meta_${journeyId}`, JSON.stringify(meta));
      } catch (e) {
        console.warn("[save] set journey_meta failed:", e?.message);
      }

      // 5) 토스트 예약 + 라우팅
      await setPendingToast({
        type: "success",
        message: "루트 저장 완료!",
        subText: "저장소에 추가됨",
        duration: 3000,
        targetRoute: "/home",
      });

      router.replace("/home");

      // 바로 상세로 가고 싶으면 아래 주석 해제
      // router.replace({
      //   pathname: "/(main)/routes/[id]",
      //   params: {
      //     id: journeyId,
      //     title,
      //     placeSummary: meta.placeSummary,
      //     thumbs: JSON.stringify(meta.thumbs),
      //   },
      // });
    } catch (e) {
      Alert.alert("루트 저장 실패", e?.message || "알 수 없는 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  /** ---------- UI ---------- */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header
        title="루트 저장하기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      <View>
        {/* 루트 이름 */}
        <View className="px-[25px] pt-[20px]">
          <Text className="text-heading-1 font-pretendardSemiBold">루트 이름을 작성해주세요.</Text>

          <TextInput
            value={routeName}
            onChangeText={setRouteName}
            placeholder="무명의 루트"
            placeholderTextColor="#AFAFAF"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>

        {/* 태그 선택 */}
        <View className="px-[25px] pt-[20px]">
          <Text className="text-heading-1 font-pretendardSemiBold">루트 태그 선택</Text>

          <TextInput
            value={inputTag}
            onChangeText={setInputTag}
            placeholder="태그 입력"
            placeholderTextColor="#BDBDBD"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={addTag}
          />

          {selectedTags.length > 0 && (
            <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap" }}>
              {selectedTags.map((t) => (
                <Pressable
                  key={`sel-${t}`}
                  onPress={() => toggleTag(t)}
                  style={[styles.pill, styles.pillActive]}
                  android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
                >
                  <Text style={[styles.pillText, { color: "#fff" }]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* 하단 고정 버튼 */}
      <View style={styles.bottomBar}>
        <Button
          title={saving ? "저장 중..." : "루트 저장하기"}
          size="large"
          variant={canSave && !saving ? "primary" : "disabled"}
          onPress={() => {
            if (!canSave || saving) return;
            handleSave();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

/** ---------- styles ---------- */
const styles = StyleSheet.create({
  input: {
    marginTop: 12,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#F4F4F4",
    marginBottom: 64,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 10,
    marginBottom: 10,
  },
  pillDefault: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pillActive: {
    backgroundColor: "#62974F",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
});