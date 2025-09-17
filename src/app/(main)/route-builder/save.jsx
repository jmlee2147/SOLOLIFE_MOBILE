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

const BASE_URL = "http://16.176.24.53:4000";

export default function RouteSaveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  /** ---------- 파라미터 파싱 ---------- */
  const routeNameDefault = params?.defaultName
    ? String(params.defaultName)
    : "";

  const defaultThumbs = useMemo(() => {
    // summary에서 넘겨주면(JSON string of URIs) 저장할 때 함께 보관
    try {
      const arr = JSON.parse(params?.thumbs || "[]");
      // 문자열 URI면 {uri} 형태로 맞춰줌
      return Array.isArray(arr)
        ? arr.slice(0, 3).map((t) => (typeof t === "string" ? { uri: t } : t))
        : [];
    } catch {
      return [];
    }
  }, [params?.thumbs]);

  const placeSummaryFromParams = useMemo(() => {
    // summary에서 placeSummary를 넘겨줄 수도 있음
    if (
      typeof params?.placeSummary === "string" &&
      params.placeSummary.trim()
    ) {
      return params.placeSummary.trim();
    }
    // 또는 placeNames(JSON array)로 넘어오면 3개까지 합쳐서 생성
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
  // builder에서 전달된 장소 ID들 파싱 (array / JSON string / comma string 모두 허용)
  function getSelectedLocationIds() {
    const raw = params?.locationIds ?? params?.locations ?? null;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((x) =>
          typeof x === "object" ? Number(x.location_id ?? x.id) : Number(x)
        )
        .filter((n) => Number.isFinite(n));
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((x) =>
            typeof x === "object" ? Number(x.location_id ?? x.id) : Number(x)
          )
          .filter((n) => Number.isFinite(n));
      }
    } catch {}
    return String(raw)
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
  }

  async function ensureToken() {
    // 저장 전에 토큰이 없으면 dev 계정으로 로그인
    let token = await AsyncStorage.getItem("jwt");
    if (token) return token;

    // 1) email+password 시도
    let r = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "test" }),
    });
    let data = await r.json().catch(() => ({}));
    if (r.ok && data?.token) {
      await AsyncStorage.setItem("jwt", data.token);
      return data.token;
    }

    // 2) username+password로도 한 번 더 시도(백엔드 구현체에 따라 다름)
    r = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test", password: "test" }),
    });
    data = await r.json().catch(() => ({}));
    if (r.ok && data?.token) {
      await AsyncStorage.setItem("jwt", data.token);
      return data.token;
    }

    throw new Error(data?.error || "로그인 실패");
  }

  /** ---------- 태그 제어 ---------- */
  const toggleTag = (t) => {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const addTag = () => {
    const v = inputTag.trim();
    if (!v) return;
    if (!selectedTags.includes(v)) {
      setSelectedTags((p) => [...p, v]);
    }
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

      // 1) 토큰 확보
      const token = await ensureToken();

      // 2) /journeys 요청 바디 구성
      const body = {
        journey_title: title,
        locations: ids.map((id, idx) => ({
          location_id: Number(id),
          sequence_number: idx + 1, // 전달 순서대로 보존
        })),
        // NOTE: selectedTags는 명세에 없으므로 전송 생략
      };

      // 3) 여정 생성
      const res = await fetch(`${BASE_URL}/journeys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.error ||
          (res.status === 401
            ? "로그인이 필요합니다."
            : `저장에 실패했어요. (HTTP ${res.status})`);
        throw new Error(msg);
      }

      const journeyId = String(data?.journey_id);
      if (!journeyId) throw new Error("서버 응답에 journey_id가 없습니다.");

      // ----- 여기서 저장소 카드용 메타를 로컬에 기록 -----
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
        placeSummary: placeSummaryParam,
      };
      try {
        await AsyncStorage.setItem(
          `journey_meta_${journeyId}`,
          JSON.stringify(meta)
        );
      } catch (e) {
        console.warn("[save] set journey_meta failed:", e?.message);
      }

      // 5) 성공 → 저장소/루트 상세로 이동
      router.replace({
        pathname: "/home",
        params: { id: journeyId },
      });
    } catch (e) {
      Alert.alert(
        "루트 저장 실패",
        e?.message || "알 수 없는 오류가 발생했어요."
      );
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
        <View style={styles.section}>
          <Text className="text-heading-1 font-pretendardSemiBold">
            루트 이름을 작성해주세요.
          </Text>

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
        <View style={styles.section}>
          <Text className="text-heading-1 font-pretendardSemiBold">
            루트 태그 선택
          </Text>

          {/* 직접 입력 */}
          <TextInput
            value={inputTag}
            onChangeText={setInputTag}
            placeholder="태그 입력"
            placeholderTextColor="#BDBDBD"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={addTag}
          />

          {/* 선택된 태그 */}
          {selectedTags.length > 0 && (
            <View
              style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap" }}
            >
              {selectedTags.map((t) => (
                <Pressable
                  key={`sel-${t}`}
                  onPress={() => toggleTag(t)}
                  style={[styles.pill, styles.pillActive]}
                  android_ripple={{
                    color: "rgba(0,0,0,0.06)",
                    borderless: true,
                  }}
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
  section: {
    paddingHorizontal: 25,
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
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
