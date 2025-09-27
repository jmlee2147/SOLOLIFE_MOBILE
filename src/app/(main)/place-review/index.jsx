import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Button from "../../../components/shared/Button";
import Icon from "../../../components/shared/Icon";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL.trim() || "";

// 개발 편의용 테스트 토큰 (env에 없으면 폴백)
const ENV_TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN?.trim();

function sanitizeToken(t) {
  return String(t || "")
    .trim()
    .replace(/^Bearer\s+/i, "");
}
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function isExpired(token) {
  const p = decodeJwtPayload(token);
  if (!p?.exp) return false; // exp 없으면 만료 체크 스킵(서버가 거를 것)
  const now = Math.floor(Date.now() / 1000);
  return p.exp <= now;
}

export default function ReviewWriteScreen() {
  const router = useRouter();
  const { placeId, placeName, address, logbookId } = useLocalSearchParams();

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]); // [{ uri, ... }]

  const CHARACTER = require("../../../assets/images/explorer.png");

  // --- 권한 & 이미지 선택 헬퍼 ---
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
    if (asset?.uri) setImages((prev) => [...prev, asset]);
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
    if (picked.length) setImages((prev) => [...prev, ...picked]);
  }, []);

  const removeImage = useCallback((uri) => {
    setImages((prev) => prev.filter((it) => it.uri !== uri));
  }, []);

  // 토큰 확보: 저장된 jwt → 만료/없으면 테스트 토큰 폴백
  const ensureToken = useCallback(async () => {
    let stored = await AsyncStorage.getItem("jwt");
    stored = sanitizeToken(stored);
    if (stored && !isExpired(stored)) return stored;

    const fallback = sanitizeToken(ENV_TEST_TOKEN || "");
    if (!fallback) throw new Error("로그인이 필요합니다. (테스트 토큰 없음)");
    // 상세/다른 화면에서도 동일 토큰 쓰게 저장
    try {
      await AsyncStorage.setItem("jwt", fallback);
    } catch {}
    return fallback;
  }, []);

  const onSubmit = useCallback(async () => {
    try {
      const locationIdNum = Number(placeId);
      if (!Number.isFinite(locationIdNum)) {
        Alert.alert("리뷰 작성", "잘못된 장소입니다.");
        return;
      }
      if (!rating) {
        Alert.alert("리뷰 작성", "별점을 선택해 주세요.");
        return;
      }
      if (!content?.trim()) {
        Alert.alert("리뷰 작성", "리뷰 내용을 입력해 주세요.");
        return;
      }

      const contentArray = content
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const token = await ensureToken();

      const body = {
        location_id: locationIdNum,
        rating: Math.max(1, Math.min(5, Number(rating))),
        content: contentArray.length ? contentArray : [content.trim()],
        logbook_id: Number.isFinite(Number(logbookId)) ? Number(logbookId) : 0, // ✅ 여기
      };

      const res = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sanitizeToken(token)}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (
          res.status === 401 ||
          String(data?.error).toLowerCase().includes("invalid token")
        ) {
          await AsyncStorage.removeItem("jwt");
          Alert.alert("리뷰 작성 실패", "로그인이 필요합니다. (토큰 무효)");
          return;
        }
        Alert.alert(
          "리뷰 작성 실패",
          data?.error || `오류가 발생했습니다. (HTTP ${res.status})`
        );
        return;
      }

      router.back();
    } catch (e) {
      Alert.alert(
        "리뷰 작성 실패",
        e?.message || "알 수 없는 오류가 발생했습니다."
      );
    }
  }, [placeId, rating, content, logbookId, ensureToken, router]);
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
          {!!address && (
            <Text
              className="text-gray700 text-body-2 font-pretendardRegular"
              numberOfLines={1}
              style={{ marginTop: 2 }}
            >
              {address}
            </Text>
          )}
        </View>
      </View>
      <View
        style={{
          height: 10,
          backgroundColor: "#F4F4F4",
          marginTop: 17,
          marginBottom: 21,
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

      {/* 본문 영역: 스크롤 가능 + 하단 바 공간 확보 */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 25,
          paddingBottom: 120, // 하단 바에 안 가리도록 여유
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 질문 + 마스코트 */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
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
          <Text className="text-title-2 font-pretendardExtraBold">
            {rating}
          </Text>
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

        {/* 리뷰 입력 */}
        <View style={{ marginTop: 16 }}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="리뷰 입력"
            placeholderTextColor="#6B6B6B"
            multiline
            textAlignVertical="top"
            style={{
              paddingHorizontal: 17,
              paddingVertical: 12,
              backgroundColor: "#F4F4F4",
              borderRadius: 5,
              fontSize: 14,
              lineHeight: 14 * 1.4,
              color: "#000",
              minHeight: 160,
            }}
          />
        </View>

        {/* 선택된 이미지 미리보기 (있을 때만) */}
        {images.length > 0 && (
          <View style={{ marginTop: 19 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((img) => (
                <View
                  key={img.uri}
                  style={{
                    position: "relative",
                    marginRight: 10,
                    paddingTop: 8, // 버튼 공간 확보
                    paddingRight: 8, // 버튼 공간 확보
                    overflow: "visible",
                  }}
                >
                  {/* 이미지는 별도 래퍼로 radius 클리핑 */}
                  <View style={{ overflow: "hidden" }}>
                    <Image
                      source={{ uri: img.uri }}
                      style={{
                        width: 120,
                        height: 120,
                        backgroundColor: "#D9D9D9",
                      }}
                    />
                  </View>

                  {/* 닫기 버튼 */}
                  <Pressable
                    onPress={() => removeImage(img.uri)}
                    hitSlop={8}
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2, // iOS
                      elevation: 2, // Android
                    }}
                  >
                    <Icon name="close" width={14} height={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* NOTE: 현재 리뷰 API에는 사진 필드가 없음. 사진 업로드는 별도 엔드포인트 필요 */}
      </ScrollView>

      {/* 하단 바 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 25,
        }}
      >
        {/* 카메라 */}
        <Pressable
          onPress={onPressCamera}
          hitSlop={10}
          style={{ marginLeft: 9 }}
        >
          <Icon name="camera_outline" width={24} height={24} />
        </Pressable>

        {/* 가운데 공간 */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Pressable onPress={onPressGallery} hitSlop={10}>
            <Icon name="gallery_outline" width={24} height={24} />
          </Pressable>
        </View>

        {/* 오른쪽 버튼 */}
        <Button title="작성 완료" size="medium" onPress={onSubmit} />
      </View>
    </SafeAreaView>
  );
}
