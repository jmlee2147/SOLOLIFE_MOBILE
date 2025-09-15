import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import Button from "../../../components/shared/Button";
import Icon from "../../../components/shared/Icon";

// ---- 기존 장소 드래프트 ----
const DRAFT_KEY = "journey_draft_places_v1";

// ---- 글쓰기 드래프트/저장 키 ----
const POST_DRAFT_KEY = "journey_post_draft_v1";
const POSTS_KEY = "journey_posts_v1";

async function loadDraftPlaces() {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
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

function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}. ${m}. ${d}`;
}

export default function ComposeScreen() {
  const router = useRouter();

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

  // 📸 이미지 상태
  const [images, setImages] = useState([]); // [{uri, width, height, fileName?, mimeType?}...]

  // 초기 로드: 장소 드래프트 + 포스트 드래프트
  useEffect(() => {
    (async () => {
      const [pl, draft] = await Promise.all([loadDraftPlaces(), loadPostDraft()]);
      setPlaces(pl);

      if (draft) {
        setTitle(draft.title ?? "");
        setBody(draft.body ?? "");
        setTags(Array.isArray(draft.tags) ? draft.tags : []);
        setIsPrivate(!!draft.isPrivate);
        if (draft.date) setDate(new Date(draft.date));
        if (Array.isArray(draft.images)) setImages(draft.images);
      }
    })();
  }, []);

  // 변경 시 글쓰기 드래프트 자동 저장(간단)
  useEffect(() => {
    const draft = { title, body, tags, isPrivate, date: date.toISOString(), images };
    savePostDraft(draft);
  }, [title, body, tags, isPrivate, date, images]);

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = useCallback((t) => {
    setTags((prev) => prev.filter((x) => x !== t));
  }, []);

  const onPressSave = useCallback(async () => {
    const post = {
      id: `${Date.now()}`,
      date: date.toISOString(),
      title: title.trim(),
      body: body.trim(),
      tags,
      isPrivate,
      places,
      images,
    };

    await savePost(post);
    await clearPostDraft();
    router.replace("/journey-create");
  }, [date, title, body, tags, isPrivate, places, images, router]);

  // 카메라/갤러리 구현

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
      allowsMultipleSelection: true, // iOS 14+/Web에서 동시 선택 가능
      selectionLimit: 10,            // 플랫폼에 따라 1로 fallback 될 수 있음
      quality: 0.9,
      exif: false,
    });

    if (result.canceled) return;

    // Expo SDK 54의 ImagePicker는 result.assets 배열을 반환
    const picked = result.assets?.filter((a) => !!a?.uri) ?? [];
    if (picked.length === 0) return;

    setImages((prev) => [...prev, ...picked]);
  }, []);

  const removeImage = useCallback((uri) => {
    setImages((prev) => prev.filter((it) => it.uri !== uri));
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* 상단 바: 뒤로가기 + 날짜 + 메뉴(선택) */}
        <View
          style={{
            height: 42,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 25,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 4 }}>
            <Icon name="previous" width={24} height={24} />
          </Pressable>

          <Pressable
            onPress={() => {}}
            style={{ flexDirection: "row", alignItems: "center", marginLeft: 16 }}
            hitSlop={8}
          >
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

        {/* 제목 입력 */}
        <View style={{ paddingHorizontal: 25 }}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="여정의 제목을 입력해주세요."
            placeholderTextColor="#D4D4D4"
            style={{
              borderRadius: 0,
              height: 63,
              paddingHorizontal: 0,
              backgroundColor: "#fff",
            }}
            className="text-body-1 font-pretendardMedium"
          />
        </View>

        <View style={{ height: 1, backgroundColor: "#D4D4D4" }} />

        {/* 장소 카드 리스트 */}
        <View style={{ marginTop: 20, paddingLeft: 16, paddingRight: 25 }}>
          {places.map((p) => (
            <View
              key={p.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 7.5,
              }}
            >
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

              {/* 우측 평점 칩 */}
              <View
                style={{
                  height: 25,
                  paddingLeft: 5,
                  paddingRight: 4,
                  borderRadius: 3,
                  backgroundColor: "#DBDCC1",
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
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 25,
              paddingTop: 25,
              paddingBottom: 140, // 하단 툴바 공간
              backgroundColor: "#fff",
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* 이미지 미리보기 (있을 때만) */}
            {images.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {images.map((img) => (
                    <View key={img.uri} style={{ marginRight: 10, position: "relative" }}>
                      <Image
                        source={{ uri: img.uri }}
                        style={{ width: 96, height: 96, backgroundColor: "#F2F2F2" }}
                      />
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

            <View
              style={{
                height: 1,
                backgroundColor: "#D4D4D4",
                marginTop: 25,
                marginHorizontal: -25,
                alignSelf: "stretch",
              }}
            />

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
              {/* 태그 칩 */}
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
          {/* 아이콘 3개 */}
          <Pressable onPress={onPressCamera} hitSlop={10} style={{ paddingLeft: 9 }}>
            <Icon name="camera_outline" width={24} height={24} />
          </Pressable>

          <Pressable onPress={onPressGallery} hitSlop={10} style={{ marginLeft: 39 }}>
            <Icon name="gallery_outline" width={24} height={24} />
          </Pressable>

          {/* 공개/비공개 토글 */}
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

          {/* 저장하기 버튼 (공통 Button) */}
          <Button title="저장하기" variant="primary" size="small" onPress={onPressSave} />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}