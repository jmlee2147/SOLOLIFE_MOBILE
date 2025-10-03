import { Images } from "@assets/images";
import Button from "@components/shared/Button";
import Icon from "@components/shared/Icon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// ---- 기존 장소 드래프트 ----
const DRAFT_KEY = "journey_draft_places_v1";

// ---- 글쓰기 드래프트/저장 키 ----
const POST_DRAFT_KEY = "journey_post_draft_v1";
const POSTS_KEY = "journey_posts_v1";

const DEV_STICKY_SAVING = false;

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL; 
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN; 

// http(s)만 서버로 전달
function toHttpImageUrls(images = []) {
  return images
    .map((it) => String(it?.uri || ""))
    .filter((u) => /^https?:\/\//i.test(u));
}

async function loadDraftPlaces() {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function LoadingWritingOverlay({ message = "여정기록을 적고 있어요", monkeySource }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const animate = (v, delay) =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: 320,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: 320,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start();

  useEffect(() => {
    animate(dot1, 0);
    animate(dot2, 120);
    animate(dot3, 240);
  }, []);

  return (
    <View
      pointerEvents="auto"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.6)",
      }}
    >
      <View
        style={{
          alignItems: "center",
          paddingHorizontal: 18,
          paddingVertical: 16,
          borderRadius: 14,
          backgroundColor: "transparent",
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
          maxWidth: 320,
        }}
      >
        {monkeySource ? (
          <Image
            source={monkeySource}
            style={{ width: 180, height: 180 }}
            resizeMode="contain"
          />
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 10 }}>
          <Text className="text-body-1 font-pretendardMedium">{message}</Text>
          {[dot1, dot2, dot3].map((d, i) => (
            <Animated.View
              key={i}
              style={{
                opacity: d,
                marginLeft: i === 0 ? 4 : 0,
                transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }],
              }}
            >
              <Text style={{ fontSize: 18, color: "#1E1E1E" }}>.</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

async function loadPostDraft() {
  try {
    const raw = await AsyncStorage.getItem(POST_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
async function savePostDraft(draft) {
  try {
    await AsyncStorage.setItem(POST_DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}
async function clearPostDraft() {
  try {
    await AsyncStorage.removeItem(POST_DRAFT_KEY);
  } catch {}
}

async function savePost(finalPost) {
  try {
    const raw = await AsyncStorage.getItem(POSTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const next = [finalPost, ...list];
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(next));
  } catch {}
}

/**
 * 서버에 로그북 생성
 * 자동 리뷰 생성 트리거: entry_content + places[].location_id
 */
async function postLogbook({ title, body, isPrivate, places, images }) {
  if (!API_BASE) throw new Error("API base is empty");
  if (!TEST_TOKEN) throw new Error("Unauthorized: EXPO_PUBLIC_TEST_TOKEN missing");

  // places -> [{ location_id, rating }]
  let placePayload = (Array.isArray(places) ? places : [])
    .map((p) => {
      const locId = Number(p.location_id ?? p.locationId ?? p.id);
      if (!Number.isFinite(locId)) return null;
      const ratingNum = Number(p.rating);
      const hasRating = Number.isFinite(ratingNum);
      const rating = hasRating ? Math.max(1, Math.min(5, ratingNum)) : null;
      return hasRating ? { location_id: locId, rating } : { location_id: locId };
    })
    .filter(Boolean);

  const image_urls = toHttpImageUrls(images);

  const bodyJson = {
    entry_title: String(title || "").trim(),
    entry_content: String(body || "").trim(),
    is_public: !isPrivate,
    image_urls,
    ...(placePayload.length ? { places: placePayload } : {}),
    ...(placePayload.length ? { location_id: placePayload[0].location_id } : {}),
  };

  if (!bodyJson.entry_title) throw new Error("Title is required");

  const url = `${API_BASE.replace(/\/+$/, "")}/logbooks`;
  console.log("[compose] POST /logbooks body =", JSON.stringify(bodyJson));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TEST_TOKEN}`,
    },
    body: JSON.stringify(bodyJson),
  });

  if (!res.ok) {
    const errTxt = await res.text().catch(() => "");
    console.log("[compose] POST /logbooks error", res.status, errTxt?.slice(0, 300));
    throw new Error(`POST /logbooks ${res.status}`);
  }

  const data = await res.json();
  console.log("[compose] POST /logbooks ok", data);
  return data;
}

async function getLogbook(id) {
  const url = `${API_BASE.replace(/\/+$/, "")}/logbooks/${Number(id)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${TEST_TOKEN}`,
    },
  });
  if (!res.ok) throw new Error(`GET /logbooks/${id} ${res.status}`);
  return res.json();
}

async function patchLogbook(id, payload) {
  const url = `${API_BASE.replace(/\/+$/, "")}/logbooks/${Number(id)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TEST_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`PATCH /logbooks/${id} ${res.status}`);
  return res.json();
}

function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}. ${m}. ${d}`;
}

/** 리뷰 생성 확인 프로브(콘솔) */
async function probeReviewsBy({ locationId, logbookId }) {
  try {
    const h = { Accept: "application/json", Authorization: `Bearer ${TEST_TOKEN}` };

    if (locationId) {
      const r1 = await fetch(`${API_BASE}/reviews?locationId=${locationId}&order=created_at.desc&limit=3`, { headers: h });
      const j1 = await r1.json();
      console.log("[probe] by locationId", locationId, "total:", j1?.total, "first:", j1?.items?.[0]);
    }
    if (logbookId) {
      const r2 = await fetch(`${API_BASE}/reviews?logbookId=${logbookId}&order=created_at.desc&limit=3`, { headers: h });
      const j2 = await r2.json();
      console.log("[probe] by logbookId", logbookId, "total:", j2?.total, "first:", j2?.items?.[0]);
    }
  } catch (e) {
    console.log("[probe] error:", e?.message || e);
  }
}

export default function ComposeScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const isEdit = !!editId;
  const [saving, setSaving] = useState(false);

  // 날짜
  const [date, setDate] = useState(new Date());
  const dateStr = useMemo(() => formatDate(date), [date]);

  // 장소 리스트(드래프트)
  const [places, setPlaces] = useState([]);

  // 에디터 상태
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState([]); // ["어두운","조용한"] 등
  const [tagInput, setTagInput] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // 이미지 상태
  const [images, setImages] = useState([]); // [{uri, width, height, fileName?, mimeType?}...]

  // 초기 로드: 장소 드래프트 + (수정 모드면 서버 데이터)
  useEffect(() => {
    (async () => {
      const pl = await loadDraftPlaces();
      setPlaces(Array.isArray(pl) ? pl : []);
      console.log("[compose] draft places =", pl);

      if (isEdit) {
        try {
          const data = await getLogbook(editId);
          setTitle(String(data?.entry_title || ""));
          setBody(String(data?.entry_content || ""));
          setIsPrivate(!Boolean(data?.is_public));
          if (data?.created_at) setDate(new Date(data.created_at));
          // 서버 image_urls -> 로컬 미리보기 형태로 변환
          const imgs = Array.isArray(data?.image_urls)
            ? data.image_urls.filter(Boolean).map((u) => ({ uri: u }))
            : [];
          setImages(imgs);
          // 장소
          const pp = Array.isArray(data?.places)
            ? data.places.map((p) => ({
                id: p.locationId ?? p.location_id ?? p.id,
                locationId: p.locationId ?? p.location_id ?? p.id,
                rating: p.rating,
                name: p.name,
                address: p.address,
              }))
            : [];
          setPlaces((prev) => (pp.length ? pp : prev));
        } catch (e) {
          console.log("[compose] load edit error:", e?.message || e);
        }
        return; // 수정 모드에선 글 초안 복원 스킵
      }

      // 신규 작성일 때만 글 초안 복원
      const draft = await loadPostDraft();
      if (draft) {
        setTitle(draft.title ?? "");
        setBody(draft.body ?? "");
        setTags(Array.isArray(draft.tags) ? draft.tags : []);
        setIsPrivate(!!draft.isPrivate);
        if (draft.date) setDate(new Date(draft.date));
        if (Array.isArray(draft.images)) setImages(draft.images);
      }
    })();
  }, [isEdit, editId]);

  // 변경 시 글쓰기 드래프트 자동 저장
  useEffect(() => {
    if (isEdit) return;
    const draft = { title, body, tags, isPrivate, date: date.toISOString(), images };
    savePostDraft(draft);
  }, [title, body, tags, isPrivate, date, images, isEdit]);

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = useCallback((t) => {
    setTags((prev) => prev.filter((x) => x !== t));
  }, []);

  const ensureCameraPermission = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cam.status === "granted" && media.status === "granted";
  };
  const ensureLibraryPermission = async () => {
    const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return media.status === "granted";
  };

  const onPressCamera = useCallback(async () => {
    const ok = await ensureCameraPermission();
    if (!ok) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
      exif: false,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setImages((prev) => [...prev, asset]);
  }, []);

  const onPressGallery = useCallback(async () => {
    const ok = await ensureLibraryPermission();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.9,
      exif: false,
    });

    if (result.canceled) return;

    const picked = result.assets?.filter((a) => !!a?.uri) ?? [];
    if (picked.length === 0) return;

    setImages((prev) => [...prev, ...picked]);
  }, []);

  const removeImage = useCallback((uri) => {
    setImages((prev) => prev.filter((it) => it.uri !== uri));
  }, []);

  const onPressSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    if (DEV_STICKY_SAVING) return;

    try {
      if (isEdit) {
        // PATCH
        const patchPayload = {
          entry_title: String(title || "").trim(),
          entry_content: String(body || "").trim(),
          is_public: !isPrivate,
          image_urls: toHttpImageUrls(images),
        };
        console.log("[compose] PATCH /logbooks payload =", patchPayload);
        await patchLogbook(editId, patchPayload);
        router.replace({ pathname: "/(tabs)/journey", params: { justSaved: "edited" } });
      } else {
        // POST: places 드래프트를 API 스키마로 변환
        const payloadPlaces = (Array.isArray(places) ? places : [])
          .map((p) => {
            const locId = Number(p.location_id ?? p.locationId ?? p.id);
            if (!Number.isFinite(locId)) return null;
            const ratingNum = Number(p.rating);
            const hasRating = Number.isFinite(ratingNum);
            return hasRating
              ? { location_id: locId, rating: Math.max(1, Math.min(5, ratingNum)) }
              : { location_id: locId };
          })
          .filter(Boolean);

        console.log("[compose] payloadPlaces =", payloadPlaces);

        const data = await postLogbook({
          title,
          body,
          isPrivate,
          places: payloadPlaces, // 반드시 전달
          images,
        });

        // 자동 리뷰 생성 확인(콘솔)
        const firstLocId = payloadPlaces[0]?.location_id;
        await probeReviewsBy({ locationId: firstLocId, logbookId: data?.logbook_id });

        await clearPostDraft();
        router.replace({ pathname: "/(tabs)/journey", params: { justSaved: "created" } });
      }
    } catch (e) {
      console.log("[compose] save error", String(e?.message || e));
    } finally {
      if (!DEV_STICKY_SAVING) setSaving(false);
    }
  }, [saving, isEdit, editId, title, body, isPrivate, images, places, router]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* 상단 바 */}
        <View style={{ height: 42, flexDirection: "row", alignItems: "center", paddingHorizontal: 25 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 4 }}>
            <Icon name="previous" width={24} height={24} />
          </Pressable>

          <Pressable onPress={() => {}} style={{ flexDirection: "row", alignItems: "center", marginLeft: 16 }} hitSlop={8}>
            <Text className="text-body-1 font-pretendardMedium">{dateStr}</Text>
            <Icon name="down_arrow" width={14} height={14} style={{ marginLeft: 5 }} />
          </Pressable>

          <View style={{ flex: 1 }} />
          <Pressable onPress={() => {}} hitSlop={8} style={{ padding: 4 }}>
            <Icon name="options" width={24} height={24} />
          </Pressable>
        </View>

        <View
          style={{
            height: 10,
            backgroundColor: "#F4F4F4",
            marginTop: 12,
            marginHorizontal: -25,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: "absolute", left: 0, right: 0, top: 1, height: 4 }}
            pointerEvents="none"
          />
        </View>

        {/* 제목 입력 */}
        <View style={{ paddingHorizontal: 25 }}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="여정의 제목을 입력해주세요."
            placeholderTextColor="#D4D4D4"
            style={{ borderRadius: 0, height: 63, paddingHorizontal: 0, backgroundColor: "#fff" }}
            className="text-body-1 font-pretendardMedium"
          />
        </View>

        <View style={{ height: 1, backgroundColor: "#D4D4D4" }} />

        {/* 장소 카드 리스트(요약) */}
        <View style={{ marginTop: 20, paddingLeft: 16, paddingRight: 25 }}>
          {places.map((p) => (
            <View key={p.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 7.5 }}>
              <Icon name="location" width={24} height={24} />
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Text className="text-body-1 font-pretendardMedium" numberOfLines={1}>
                  {p.name}
                </Text>
                {!!p.address && (
                  <Text className="text-gray700 text-body-3 font-pretendardRegular" numberOfLines={1}>
                    {p.address}
                  </Text>
                )}
              </View>
              <View
                style={{
                  height: 25,
                  paddingLeft: 5,
                  paddingRight: 4,
                  borderRadius: 3,
                  backgroundColor: "#C9DCC1",
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: 70,
                }}
              >
                <Icon name="star" width={16} height={16} color="#62974F" />
                <Text className="text-body-2 font-pretendardMedium text-green500 ml-[2px] mr-[12px]">
                  {p.rating}
                </Text>
                <Icon name="left_arrow" width={11} height={11} color="#62974F" flip strokeWidth={4} />
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 1, backgroundColor: "#D4D4D4", marginTop: 21 }} />

        {/* 본문 + 태그 + 이미지 미리보기 */}
        <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 25,
              paddingTop: 25,
              paddingBottom: 140,
              backgroundColor: "#fff",
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* 이미지 미리보기 */}
            {images.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {images.map((img) => (
                    <View key={img.uri} style={{ marginRight: 10, position: "relative" }}>
                      <Image source={{ uri: img.uri }} style={{ width: 96, height: 96, backgroundColor: "#F2F2F2" }} />
                      <Pressable
                        onPress={() => removeImage(img.uri)}
                        hitSlop={8}
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: "rgba(0,0,0,0.6)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon name="close" width={14} height={14} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 본문 */}
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder={`오늘 탐험은 어떠셨나요?\n여정 일지를 자유롭게 작성해보세요.`}
              placeholderTextColor="#D4D4D4"
              multiline
              textAlignVertical="top"
              style={{
                minHeight: 210,
                borderRadius: 0,
                backgroundColor: "#FFF",
                fontFamily: "Pretendard-Regular",
                fontSize: 16,
                lineHeight: 22,
              }}
            />

            <View style={{ height: 1, backgroundColor: "#D4D4D4", marginTop: 25, marginHorizontal: -25, alignSelf: "stretch" }} />

            {/* 태그 입력 */}
            <View style={{ marginTop: 16 }}>
              <TextInput
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="태그 입력"
                placeholderTextColor="#C8C8C8"
                onSubmitEditing={addTag}
                style={{
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#F4F4F4",
                  paddingHorizontal: 16,
                  fontFamily: "Pretendard-Medium",
                  fontSize: 14,
                }}
              />
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
                {tags.map((t) => (
                  <View
                    key={t}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#F1F1F1",
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text className="text-body-2 font-pretendardMedium">{t}</Text>
                    <Pressable onPress={() => removeTag(t)} hitSlop={8} style={{ marginLeft: 6 }}>
                      <Icon name="close" width={14} height={14} color="#9A9A9A" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* 하단 툴바 */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingTop: 12,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#D4D4D4",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Pressable onPress={onPressCamera} hitSlop={10} style={{ paddingLeft: 9 }}>
            <Icon name="camera_outline" width={24} height={24} />
          </Pressable>

          <Pressable onPress={onPressGallery} hitSlop={10} style={{ marginLeft: 39 }}>
            <Icon name="gallery_outline" width={24} height={24} />
          </Pressable>

          <Pressable
            onPress={() => setIsPrivate((v) => !v)}
            hitSlop={8}
            style={{ flexDirection: "row", alignItems: "center", marginLeft: 39 }}
          >
            <Icon name="lock" width={24} height={24} />
            <Text className="text-body-2 font-pretendardMedium ml-[5px]">
              {isPrivate ? "비공개" : "공개"}
            </Text>
          </Pressable>

          <View style={{ flex: 1 }} />

          <Button
            title={saving ? (isEdit ? "수정 중..." : "저장 중...") : isEdit ? "수정 완료" : "저장하기"}
            variant="primary"
            size="small"
            onPress={onPressSave}
            disabled={saving}
          />
        </View>

        {saving && (
          <LoadingWritingOverlay
            message={isEdit ? "수정 내용을 저장하는 중이에요" : "여정기록을 저장하는 중이에요"}
            monkeySource={Images.monkey.write3x}
          />
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}