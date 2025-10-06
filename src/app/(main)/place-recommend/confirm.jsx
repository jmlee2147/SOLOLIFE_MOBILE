import { Images } from "@assets/images";
import MapView from "@components/map/MapView";
import Header from "@components/shared/Header";
import Icon from "@components/shared/Icon";
import BottomSheet, {
  BottomSheetScrollView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");

export default function RouteBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const MAP_PLACEHOLDER = Images.placeholder.map;

  const [liked, setLiked] = useState(false);

  // 영업시간/상태(넘어오면 사용, 없으면 null)
  const openNow =
    String(params?.openNow ?? "").toLowerCase() === "true"
      ? true
      : String(params?.openNow ?? "").toLowerCase() === "false"
      ? false
      : null;
  const hoursText = params?.hoursText ? String(params.hoursText) : null;

  // props 기반 데이터 구성
  const placeId = useMemo(
    () => Number(params.placeId) || Date.now(),
    [params.placeId]
  );
  const placeName = String(params.placeName ?? "선택한 장소");
  const category = String(params.category ?? "");
  const addressStr = String(params.region ?? params.address ?? "");
  const center = useMemo(
    () => ({
      lat: Number(params.lat ?? 37.248492),
      lng: Number(params.lng ?? 127.076754),
    }),
    [params.lat, params.lng]
  );

  // 사진 배열 처리
  const photos = useMemo(() => {
    try {
      if (!params?.photos) return [];
      const rawStr = decodeURIComponent(String(params.photos));
      const parsed = JSON.parse(rawStr);
      return (Array.isArray(parsed) ? parsed : [])
        .map((p) => (typeof p === "string" ? p : p?.url || p?.src || null))
        .filter(Boolean);
    } catch {
      return [];
    }
  }, [params?.photos]);

  // 무드 데이터
  const moodsKo = useMemo(() => {
    try {
      const m = params?.moodsKo;
      const arr = m ? JSON.parse(String(m)) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, [params?.moodsKo]);

  // 길찾기
  const openNaverDirections = async ({ lat, lng, name, mode = "walk" }) => {
    const encodedName = encodeURIComponent(name || "");
    const appUrl = `nmap://route/${mode}?dlat=${lat}&dlng=${lng}&dname=${encodedName}&appname=com.example.myapp`;
    const webUrl = `https://map.naver.com/v5/directions/-/-/${lng},${lat},${encodedName}`;
    try {
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  // BottomSheet 설정
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["40%", "55%"], []);
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 100,
    overshootClamping: true,
    stiffness: 500,
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="close"
        onRightPress={() => router.push("/home")}
      />

      <View style={{ paddingHorizontal: 25, paddingTop: 5, marginBottom: 14 }}>
        <Text className="text-title-1 font-pretendardExtraBold">
          좋은 선택이에요.
        </Text>
        <Text className="text-heading-3 font-pretendardMedium text-gray700">
          “{placeName}” 을 탐험 장소로 결정하셨군요!
        </Text>
      </View>

      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <MapView lat={center.lat} lng={center.lng} name={placeName} />
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        animationConfigs={animationConfigs}
        enableDynamicSizing={false}
        backgroundStyle={{
          backgroundColor: "#FFF",
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.11,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 0 },
        }}
        handleIndicatorStyle={{
          backgroundColor: "#D9D9D9",
          width: 78,
          height: 3,
          borderRadius: 50,
        }}
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 25,
            paddingTop: 18,
            paddingBottom: 40,
          }}
        >
          {/* 1) 제목 + 하트 */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              className="text-heading-1 font-pretendardSemiBold"
              numberOfLines={1}
              style={{ flex: 1 }}
            >
              {placeName}
            </Text>
            <Pressable onPress={() => setLiked((v) => !v)} hitSlop={8}>
              <Icon
                name={liked ? "heart" : "heart_outline"}
                width={25}
                height={25}
              />
            </Pressable>
          </View>

          {/* 2) 카테고리 */}
          {!!category && (
            <Text
              className="mt-1 text-body-2 font-pretendardMedium text-gray700"
              numberOfLines={1}
            >
              {category}
            </Text>
          )}

          {/* 3) 주소 */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Icon name="location_outline" width={20} height={20} />
            {!!addressStr && (
              <Text
                className="mt-1 ml-1 text-body-1 font-pretendardMedium text-gray700"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {addressStr}
              </Text>
            )}
          </View>

          {/* 4) 영업 시간 정보 */}
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}
          >
            <Icon name="time" width={20} height={20} />
            <Text
              className="ml-1 text-body-1 font-pretendardMedium text-gray700"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {hoursText ? (
                <>
                  {hoursText}
                  {typeof openNow === "boolean" && (
                    <Text
                      style={{
                        color: openNow ? "#62974F" : "#DC2626",
                        fontWeight: "600",
                      }}
                    >
                      {"  •  "}
                      {openNow ? "영업 중" : "영업 종료"}
                    </Text>
                  )}
                </>
              ) : typeof openNow === "boolean" ? (
                <Text
                  style={{
                    color: openNow ? "#62974F" : "#DC2626",
                    fontWeight: "600",
                  }}
                >
                  {openNow ? "영업 중" : "영업 종료"}
                </Text>
              ) : (
                "아직 정보가 없어요."
              )}
            </Text>
          </View>

          {/* 5) 길찾기 / 공유 버튼 */}
          <View
            style={{
              flexDirection: "row",
              gap: 5,
              marginTop: 10,
            }}
          >
            <Pressable
              onPress={() =>
                openNaverDirections({
                  lat: center.lat,
                  lng: center.lng,
                  name: placeName,
                  mode: "walk",
                })
              }
              style={{
                backgroundColor: "#62974F",
                borderRadius: 99,
                height: 30,
                width: 64,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="text-white text-body-2 font-pretendardSemiBold">
                길찾기
              </Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                try {
                  const msg =
                    `${placeName}\n` +
                    `${addressStr || ""}\n\n` +
                    `지도 보기: https://map.naver.com/v5/?c=${center.lng},${center.lat},15,0,0,0`;
                  await Share.share({ message: msg });
                } catch {}
              }}
              style={{
                borderRadius: 99,
                borderWidth: 1,
                borderColor: "#D4D4D4",
                height: 30,
                width: 64,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="text-black text-body-2 font-pretendardMedium">
                공유
              </Text>
              <Icon
                name="share"
                width={17}
                height={17}
                style={{ marginLeft: 3 }}
              />
            </Pressable>
          </View>

          {/* 6) 썸네일 3장 */}
          <View style={styles.thumbRow}>
            {[0, 1, 2].map((i) => {
              const uri = photos[i];
              if (uri) {
                return (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                );
              }
              return (
                <View
                  key={i}
                  style={[
                    styles.thumb,
                    { alignItems: "center", justifyContent: "center" },
                  ]}
                >
                  <Image
                    source={MAP_PLACEHOLDER}
                    style={{ width: "60%", height: "60%", opacity: 0.9 }}
                    resizeMode="contain"
                  />
                </View>
              );
            })}
          </View>

          {/* 7) CTA  */}
          <View style={{ marginTop: 44 }}>
            <LinearGradient
              colors={["#64BC2E", "#2E7A45"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 11, padding: 1 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 10,
                  backgroundColor: "#fff",
                  paddingVertical: 11,
                  paddingHorizontal: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text className="text-heading-2 font-pretendardSemiBold">
                    이 장소를 포함한
                  </Text>
                  <Text className="text-heading-2 font-pretendardSemiBold">
                    탐험루트를 만들어볼까요?
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    const firstPayload = {
                      location_id: placeId,
                      location_name: placeName,
                      category,
                      address: addressStr,
                      latitude: center.lat,
                      longitude: center.lng,
                      rating_avg: params?.rating_avg ?? undefined,
                      photos,
                    };

                    router.push({
                      pathname: "/route-builder",
                      params: {
                        first: encodeURIComponent(JSON.stringify(firstPayload)),
                        region: addressStr,
                        moodsKo: JSON.stringify(moodsKo),
                      },
                    });
                  }}
                  style={styles.ctaCircle}
                >
                  <Icon name="next_circle" width={53} height={53} />
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mapContainer: { flex: 1, backgroundColor: "#E5E7EB" },
  headerRow: { flexDirection: "row", alignItems: "center" },
  titleRatingWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 5 },
  openMapBtn: {
    paddingHorizontal: 13.5,
    paddingVertical: 3,
    borderRadius: 40,
    backgroundColor: "#62974F",
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    flexDirection: "row",
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#D4D4D4",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  thumb: {
    flex: 1,
    width: 100,
    aspectRatio: 1,
    backgroundColor: "#E2E2E2",
    overflow: "hidden",
    borderRadius: 6,
  },
  ctaCircle: {
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
