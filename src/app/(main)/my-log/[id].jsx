import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Button from "../../../components/shared/Button";
import Icon from "../../../components/shared/Icon";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;
const TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN;

/* ---------- small ui ---------- */
function StarRow({ value }) {
  if (value == null) return null;
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const diff = value - i;
    const type = diff >= 1 ? "full" : diff >= 0.5 ? "half" : "empty";
    return (
      <Icon
        key={i}
        name="star"
        width={15}
        height={15}
        color={type === "empty" ? "#E0A4A4" : "#EE7A13"}
        style={{ marginLeft: i === 0 ? 0 : 3 }}
      />
    );
  });
  return <View style={{ flexDirection: "row" }}>{stars}</View>;
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/* ---------- caches & utils ---------- */
const USER_CACHE = new Map(); // userId(Number) -> { name }
const LOC_CACHE = new Map(); // locationId(Number) -> { name, address, thumb }

function raceTimeout(promise, ms = 1500) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

// 새로 받은 places(next)가 비어있는 name을 갖고 오면 기존(prev)의 값을 유지해 flicker 방지
function mergePlaces(prev, next) {
  const byId = new Map(prev.map((p) => [String(p.id), p]));
  return next.map((n) => {
    const key = String(n.id);
    const old = byId.get(key);
    if (!old) return n;
    return {
      id: n.id,
      name: n.name || old.name, // ⬅️ 비면 이전 값 유지
      address: n.address || old.address, // ⬅️ 비면 이전 값 유지
      rating: n.rating ?? old.rating,
      thumb: n.thumb || old.thumb,
    };
  });
}

/* ---------- API ---------- */
async function getLogbook(logbookId, { signal } = {}) {
  if (!API_BASE) throw new Error("API base missing");
  const url = `${API_BASE.replace(/\/+$/, "")}/logbooks/${logbookId}`;
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`logbook ${res.status}: ${body}`);
  }
  return res.json();
}

async function getUser(userId, { signal } = {}) {
  const uid = Number(userId);
  if (!API_BASE || !Number.isFinite(uid)) return null;
  if (USER_CACHE.has(uid)) return USER_CACHE.get(uid);

  const url = `${API_BASE.replace(/\/+$/, "")}/users/${uid}`;
  try {
    const res = await fetch(url, {
      signal,
      headers: {
        Accept: "application/json",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const name =
      data?.nickname || data?.display_name || data?.name || `작성자 #${uid}`;
    const packed = { name };
    USER_CACHE.set(uid, packed);
    return packed;
  } catch {
    return null;
  }
}

async function getLocation(locationId, { signal } = {}) {
  const lid = Number(locationId);
  if (!API_BASE || !Number.isFinite(lid)) return null;
  if (LOC_CACHE.has(lid)) return LOC_CACHE.get(lid);

  const url = `${API_BASE.replace(/\/+$/, "")}/locations/${lid}`;
  try {
    const res = await fetch(url, {
      signal,
      headers: {
        Accept: "application/json",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    });
    if (!res.ok) return null;
    // ⚙️ 원문 확보 → 한 줄 로그 → 파싱
    const text = await res.text();
    // ⬇️ 개발환경에서만 한 줄로 찍기 (길이 제한)
    if (__DEV__) {
      const oneLine = text.replace(/\s+/g, " ");
      console.log("[locations] GET", lid, oneLine.slice(0, 600));
    }
    const data = text ? JSON.parse(text) : {};
    const root = data?.location || data || {};
    const packed = {
      name: root.location_name || root.title || root.name || "",
      address: root.address || root.formatted_address || root.addr || "",
      thumb:
        root.thumbnail_url ||
        root.cover?.thumbnail_url ||
        root.images?.[0]?.thumbnail_url ||
        root.cover?.url ||
        "",
    };
    LOC_CACHE.set(lid, packed);
    return packed;
  } catch {
    return null;
  }
}

/** detail.places 우선, 없으면 fallback으로 location_id 사용 */
async function resolvePlaces(detail, { signal } = {}) {
  // 1) 배열 우선
  if (Array.isArray(detail?.places) && detail.places.length > 0) {
    const uniq = [];
    const seen = new Set();
    for (const p of detail.places) {
      const id = Number(p?.locationId ?? p?.location_id);
      if (!Number.isFinite(id) || seen.has(id)) continue;
      seen.add(id);
      uniq.push({ locationId: id, rating: Number(p?.rating) || null });
    }
    if (uniq.length === 0) return [];

    // 메타 병렬 fetch (첫 항목은 바로, 이후는 타임아웃 레이스)
    const metas = await Promise.all(
      uniq.map(async (p, idx) => {
        const loader =
          idx === 0
            ? getLocation(p.locationId, { signal })
            : raceTimeout(getLocation(p.locationId, { signal }), 1500); // ⬅️ 오타 fix: reaceTimeout -> raceTimeout
        const meta = await loader;
        return { ...p, meta };
      })
    );

    return metas.map((it) => ({
      id: String(it.locationId),
      name: it.meta?.name || "",
      address: it.meta?.address || "",
      rating: it.rating ?? null,
      thumb: it.meta?.thumb || "",
    }));
  }

  // 2) 단일 location_id fallback
  const fallbackId = Number(detail?.location_id);
  if (Number.isFinite(fallbackId)) {
    const meta = await raceTimeout(getLocation(fallbackId, { signal }), 1500);
    return [
      {
        id: String(fallbackId),
        name: meta?.name || "",
        address: meta?.address || "",
        rating: null,
        thumb: meta?.thumb || "",
      },
    ];
  }

  return [];
}

/* ---------- Page ---------- */
export default function MyLogDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // StrictMode 더블 런 방지
  const didRunRef = useRef(false); // ⬅️ 추가

  // 라우트 파라미터 정규화 (+ 리스트에서 넘어온 낙관값)
  const id = String(params?.id ?? "").replace(/[^0-9]/g, "");
  const optimisticTitle = typeof params?.t === "string" ? params.t : "";
  const optimisticDate = typeof params?.d === "string" ? params.d : "";
  const optimisticThumb = typeof params?.thumb === "string" ? params.thumb : "";

  // 상태
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [title, setTitle] = useState(optimisticTitle);
  const [createdAt, setCreatedAt] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("탐험가");
  const [places, setPlaces] = useState([]); // [{id, name, address, rating?, thumb?}]
  const [placesLoading, setPlacesLoading] = useState(true); // ⬅️ 추가: flicker 억제
  const [images, setImages] = useState(
    optimisticThumb ? [optimisticThumb] : []
  );
  const [tags, setTags] = useState([]);

  // 입력창
  const [quickText, setQuickText] = useState("");

  useEffect(() => {
    if (!id) return;

    // StrictMode에서 동일 effect 두 번 실행되는 문제 차단
    if (didRunRef.current) return; // ⬅️ 추가
    didRunRef.current = true; // ⬅️ 추가

    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setPlacesLoading(true); // ⬅️ 추가

        // 1) 로그북 상세 — 도착 즉시 기본 정보 렌더
        const detail = await getLogbook(id, { signal: ac.signal });

        setTitle(detail?.entry_title || optimisticTitle || "(제목 없음)");
        setCreatedAt(detail?.created_at || detail?.updated_at || "");
        setBody(detail?.entry_content || "");
        const imgs = Array.isArray(detail?.image_urls) ? detail.image_urls : [];
        if (imgs.length > 0) setImages(imgs);
        else if (optimisticThumb) setImages([optimisticThumb]);

        // 2) 작성자 + 3) 장소 배열/단일 동시 처리
        const userPromise = (async () => {
          const userId = Number(detail?.user_id);
          if (!Number.isFinite(userId)) return null;
          const u = await raceTimeout(
            getUser(userId, { signal: ac.signal }),
            1500
          );
          return u; // { name }
        })();

        const placesPromise = resolvePlaces(detail, { signal: ac.signal });

        const [userMeta, placesArr] = await Promise.all([
          userPromise,
          placesPromise,
        ]);

        if (userMeta?.name) setAuthorName(userMeta.name);
        else setAuthorName((v) => v || "탐험가");

        // 🔒 flicker 방지: 비어있는 name으로 기존 값을 덮지 않도록 merge
        setPlaces((prev) => mergePlaces(prev, placesArr));
        setPlacesLoading(false); // ⬅️ 추가

        // 장소 썸네일로 대표 이미지 보강(이미 이미지가 없고, 장소 thumb가 있으면)
        if ((!imgs || imgs.length === 0) && !optimisticThumb) {
          const firstThumb = placesArr.find((p) => p.thumb)?.thumb;
          if (firstThumb) setImages([firstThumb]);
        }

        // 태그(서버 제공 시 매핑)
        setTags(Array.isArray(detail?.keywords) ? detail.keywords : []);

        setLoading(false);
      } catch (e) {
        if (!ac.signal.aborted) {
          setErr("기록을 불러오지 못했어요.");
          setPlacesLoading(false);
          setLoading(false);
        }
      }
    })();

    return () => ac.abort();
  }, [id, optimisticTitle, optimisticThumb]);

  const dateStr = useMemo(() => {
    if (createdAt) return fmtDate(createdAt);
    return optimisticDate || "";
  }, [createdAt, optimisticDate]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 상단바 */}
      <View
        style={{
          height: 42,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 25,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ padding: 4 }}
        >
          <Icon name="previous" width={22} height={22} />
        </Pressable>
        <Text
          numberOfLines={1}
          className="text-heading-3 font-pretendardSemiBold"
          style={{ marginLeft: 10, flex: 1 }}
        >
          {authorName || "탐험가"}
        </Text>
        <Pressable onPress={() => {}} hitSlop={8} style={{ padding: 4 }}>
          <Icon name="options" width={20} height={20} />
        </Pressable>
      </View>

      <View
        style={{
          height: 10,
          backgroundColor: "#F4F4F4",
          marginTop: 12,
          marginHorizontal: -20,
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

      {loading ? (
        images.length === 0 && !title ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator />
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.select({ ios: "padding", android: undefined })}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 110 }}
              showsVerticalScrollIndicator={false}
            >
              {images[0] ? (
                <Image
                  source={{ uri: images[0] }}
                  style={{
                    width: "100%",
                    height: 220,
                    backgroundColor: "#eee",
                  }}
                  resizeMode="cover"
                />
              ) : null}

              <View
                style={{
                  paddingHorizontal: 25,
                  paddingVertical: 20,
                  backgroundColor: "#fff",
                  borderBottomWidth: 1,
                  borderBottomColor: "#D4D4D4",
                }}
              >
                <Text className="text-body-1 font-pretendardMedium">
                  {title || "(제목 없음)"}
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 25,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#D4D4D4",
                  backgroundColor: "#fff",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Icon name="time" width={24} height={24} />
                  <Text
                    className="text-body-1 font-pretendardMedium text-gray700"
                    style={{ marginLeft: 7 }}
                  >
                    {dateStr}
                  </Text>
                </View>
              </View>

              {/* 로딩 중엔 장소 섹션 자체를 안 그림 → 깜빡임 최소화 */}
              {placesLoading ? (
                <View style={{ paddingVertical: 24 }}>
                  <ActivityIndicator />
                </View>
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
        )
      ) : err ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <Text className="text-body-1 font-pretendardMedium">{err}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 110 }}
            showsVerticalScrollIndicator={false}
          >
            {/* 대표 이미지 */}
            {images[0] ? (
              <Image
                source={{ uri: images[0] }}
                style={{ width: "100%", height: 220, backgroundColor: "#eee" }}
                resizeMode="cover"
              />
            ) : null}

            {/* 제목 */}
            <View
              style={{
                paddingHorizontal: 25,
                paddingVertical: 20,
                backgroundColor: "#fff",
                borderBottomWidth: 1,
                borderBottomColor: "#D4D4D4",
              }}
            >
              <Text className="text-body-1 font-pretendardMedium">
                {title || "(제목 없음)"}
              </Text>
            </View>

            {/* 날짜 + 태그 */}
            <View
              style={{
                paddingHorizontal: 25,
                paddingVertical: 20,
                marginBottom: 12.5,
                borderBottomWidth: 1,
                borderBottomColor: "#D4D4D4",
                backgroundColor: "#fff",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Icon name="time" width={24} height={24} />
                <Text
                  className="text-body-1 font-pretendardMedium text-gray700"
                  style={{ marginLeft: 7 }}
                >
                  {dateStr}
                </Text>
              </View>

              {/* tags */}
              {tags.length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  {tags.map((t, i) => (
                    <View
                      key={`${t}-${i}`}
                      style={{
                        paddingHorizontal: 11,
                        height: 25,
                        borderRadius: 12,
                        backgroundColor: "#FFF",
                        borderWidth: 1,
                        borderColor: "#D4D4D4",
                        justifyContent: "center",
                        marginRight: 5,
                      }}
                    >
                      <Text className="text-heading-3 font-pretendardSemiBold text-gray700">
                        {t}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 방문 장소 — 여러 개 지원 */}
            {places.length > 0 && !placesLoading && (
              <View
                style={{
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#D4D4D4",
                  paddingBottom: 16,
                }}
              >
                {places.map((p) => (
                  <View
                    key={p.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 7.5,
                    }}
                  >
                    <Icon
                      name="location"
                      width={20}
                      height={20}
                      color="#93B56C"
                    />
                    <View style={{ flex: 1, marginLeft: 5 }}>
                      <Text
                        className="text-body-1 font-pretendardMedium"
                        numberOfLines={1}
                      >
                        {p.name || "(장소)"}{" "}
                        {/* mergePlaces 덕분에 비어있는 값으로는 덮이지 않음 */}
                      </Text>
                      {!!p.address && (
                        <Text
                          className="text-gray700 text-body-3 font-pretendardRegular"
                          numberOfLines={1}
                        >
                          {p.address}
                        </Text>
                      )}
                    </View>
                    <StarRow value={p.rating} />
                  </View>
                ))}
              </View>
            )}

            {/* 본문 */}
            {!!body && (
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  minHeight: 220,
                }}
              >
                <Text
                  className="text-body-1 font-pretendardRegular"
                  style={{ lineHeight: 22 }}
                >
                  {body}
                </Text>
              </View>
            )}

            <View
              style={{
                height: 10,
                backgroundColor: "#F4F4F4",
                marginTop: 12,
                marginHorizontal: -20,
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

            {/* 반응 바 (placeholder) */}
            <View
              style={{
                paddingTop: 10,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#D4D4D4",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  paddingHorizontal: 10,
                }}
              >
                {[
                  { key: "fun", label: "재밌어요", icon: "funny" },
                  { key: "happy", label: "기뻐요", icon: "happy" },
                  { key: "surprise", label: "놀라워요", icon: "surprise" },
                  { key: "sad", label: "슬퍼요", icon: "sad" },
                ].map((r) => (
                  <View key={r.key} style={{ alignItems: "center" }}>
                    <Icon name={r.icon} width={24} height={24} />
                    <Text
                      className="text-body-3 font-pretendardMedium"
                      style={{ marginTop: 4 }}
                    >
                      {r.label}
                    </Text>
                  </View>
                ))}
              </View>
              <Text
                className="text-gray700 text-body-3 font-pretendardRegular"
                style={{ textAlign: "right", marginTop: 13, paddingRight: 25 }}
              >
                0명이 반응했어요
              </Text>
            </View>

            {/* 한줄 입력 */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <Text
                className="text-body-1 font-pretendardMedium"
                style={{ marginBottom: 8 }}
              >
                한줄 입력
              </Text>

              <View
                style={{
                  padding: 12,
                  borderRadius: 5,
                  backgroundColor: "#F4F4F4",
                }}
              >
                <TextInput
                  value={quickText}
                  onChangeText={setQuickText}
                  placeholder="한줄로 남겨보세요"
                  placeholderTextColor="#6B6B6B"
                  multiline
                  style={{
                    minHeight: 20,
                    fontFamily: "Pretendard-Regular",
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                />
                <View style={{ alignItems: "flex-end", marginTop: 8 }}>
                  <Button
                    title="입력하기"
                    variant={quickText.trim() ? "primary" : "disabled"}
                    size="small"
                    onPress={() => {
                      if (!quickText.trim()) return;
                      // TODO: 등록 처리
                      setQuickText("");
                    }}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
