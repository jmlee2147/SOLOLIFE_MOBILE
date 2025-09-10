import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView from "../../../components/map/MapView";
import Header from "../../../components/shared/Header";
import Icon from "../../../components/shared/Icon";

export default function RouteBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // 결과 페이지에서 건네준 값들로 일관되게 세팅
  const placeId = useMemo(() => Number(params.placeId) || Date.now(), [params.placeId]);
  const placeName = useMemo(() => String(params.placeName ?? "선택한 장소"), [params.placeName]);
  const category = useMemo(() => String(params.category ?? ""), [params.category]);
  const addressStr = useMemo(
    () => String(params.region ?? params.address ?? ""), // region 우선, 없으면 address
    [params.region, params.address]
  );
  const center = useMemo(
    () => ({
      lat: Number(params.lat ?? 37.248492),
      lng: Number(params.lng ?? 127.076754),
    }),
    [params.lat, params.lng]
  );

  // (선택) 사진 배열이 넘어온다면 사용 (JSON 문자열 가정)
  const photos = useMemo(() => {
    try {
      const raw = params.photos ? JSON.parse(String(params.photos)) : [];
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }, [params.photos]);

  // 사용자가 이전 단계에서 고른 무드
  const moodsKo = useMemo(() => {
    try {
      const m = params?.moodsKo;
      const arr = m ? JSON.parse(String(m)) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, [params?.moodsKo]);

  // 길찾기 실행
  const openNaverDirections = async ({ lat, lng, name, mode = "walk" }) => {
    const encodedName = encodeURIComponent(name || "");
    let appUrl = `nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${encodedName}&appname=com.example.myapp`;
    if (mode === "walk")
      appUrl = `nmap://route/walk?dlat=${lat}&dlng=${lng}&dname=${encodedName}&appname=com.example.myapp`;
    if (mode === "transit")
      appUrl = `nmap://route/publicTransit?dlat=${lat}&dlng=${lng}&dname=${encodedName}&appname=com.example.myapp`;

    const webUrl = `https://map.naver.com/v5/directions/-/-/${lng},${lat},${encodedName}`;
    try {
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  // 바텀시트
  const sheetY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);
  const [sheetH, setSheetH] = useState(0);
  const [ctaBox, setCtaBox] = useState({ y: 0, h: 0 });
  const peekY = Math.max(0, sheetH - ctaBox.y + insets.bottom + 2);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(sheetY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 0);
    return () => clearTimeout(timer);
  }, [sheetY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          sheetY.stopAnimation((v) => (dragStartY.current = v));
        },
        onPanResponderMove: (_e, g) => {
          const next = Math.min(Math.max(dragStartY.current + g.dy, 0), peekY);
          sheetY.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          const end = dragStartY.current + g.dy + g.vy * 80;
          const snapToPeek = end > peekY * 0.5 || g.vy > 0.6;
          Animated.spring(sheetY, {
            toValue: snapToPeek ? peekY : 0,
            useNativeDriver: true,
            stiffness: 220,
            damping: 28,
            mass: 0.9,
          }).start();
        },
      }),
    [peekY]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Header
        title="장소 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      {/* 타이틀 블록 */}
      <View style={styles.titleBlock}>
        <Text className="text-title-1 font-pretendardExtraBold" style={styles.title}>
          좋은 선택이에요.
        </Text>
        <Text className="text-heading-3 font-pretendardMedium text-gray700">
          “{placeName}” 을 탐험 장소로 결정하셨군요!
        </Text>
      </View>

      {/* 지도 */}
      <View style={styles.mapArea}>
        <View style={styles.mapCard}>
          <View style={styles.mapInner}>
            <View style={{ flex: 1 }}>
              <MapView lat={center.lat} lng={center.lng} name={placeName} />
            </View>

            {/* 지도 위 바텀시트 */}
            <Animated.View
              pointerEvents="box-none"
              style={[styles.sheetWrap, { transform: [{ translateY: sheetY }] }]}
              {...panResponder.panHandlers}
            >
              <View style={styles.sheetCard} onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
                <View className="items-center" style={styles.handle} />

                {/* 상단: 제목 + 액션 */}
                <View style={styles.placeHeaderRow}>
                  <View style={styles.titleRatingWrap}>
                    <Text className="text-heading-2 text-[#244DD3] font-pretendardSemiBold">
                      {placeName}
                    </Text>
                    {/* 평점이 넘어오면 표시 (없으면 숨김) */}
                    {params?.rating_avg != null && (
                      <View className="flex-row items-center ml-[9px]">
                        <Icon name="star" width={16} height={16} />
                        <Text className="ml-[2px] text-yellow900 text-body-2 font-pretendardMedium">
                          {String(params.rating_avg)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.headerActions}>
                    <Pressable
                      onPress={() =>
                        openNaverDirections({
                          lat: center.lat,
                          lng: center.lng,
                          name: placeName,
                          mode: "walk",
                        })
                      }
                      style={styles.openMapBtn}
                      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    >
                      <Text className="text-white text-body-2 font-pretendardMedium">길찾기</Text>
                    </Pressable>

                    <Pressable
                      onPress={async () => {
                        try {
                          const msg =
                            `${placeName}\n` +
                            `${addressStr || ""}\n\n` + // ✅ CHANGED: 하드코딩 제거
                            `지도 보기: https://map.naver.com/v5/?c=${center.lng},${center.lat},15,0,0,0`;
                          await Share.share({ message: msg });
                        } catch {}
                      }}
                      style={styles.shareBtn}
                      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    >
                      <Text className="text-body-2 font-pretendardMedium mr-[3px]">공유</Text>
                      <Icon name="share" width={17} height={17} />
                    </Pressable>
                  </View>
                </View>

                {/* 카테고리/주소 (있을 때만) */}
                {!!category && (
                  <Text className="mt-1 text-body-2 font-pretendardMedium text-gray700">{category}</Text>
                )}
                {!!addressStr && (
                  <Text className="mt-1 text-body-2 font-pretendardMedium text-gray700">{addressStr}</Text>
                )}

                {/* 썸네일 3개: 넘어온 사진 우선, 없으면 샘플 */}
                <View style={styles.thumbRow}>
                  {[0, 1, 2].map((i) => {
                    const uri = photos[i];
                    const src = uri ? { uri } : require("../../../assets/images/sample.png");
                    return <Image key={i} source={src} style={styles.thumb} resizeMode="cover" />;
                  })}
                </View>

                {/* CTA */}
                <View
                  style={styles.ctaRow}
                  onLayout={(e) => {
                    const { y, height } = e.nativeEvent.layout;
                    setCtaBox({ y, h: height });
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 16 }}>
                    <Text className="text-heading-2 font-pretendardSemiBold">이 장소를 포함한</Text>
                    <Text className="text-heading-2 font-pretendardSemiBold">탐험루트를 만들어볼까요?</Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      // first payload를 실제 params 기반으로
                      const firstPayload = {
                        location_id: placeId,
                        location_name: placeName,
                        category,
                        address: addressStr,
                        latitude: center.lat,
                        longitude: center.lng,
                        rating_avg: params?.rating_avg ?? undefined,
                        photos: photos, // 넘어왔다면 같이 전달
                      };

                      router.push({
                        pathname: "/route-builder", // index.jsx
                        params: {
                          first: encodeURIComponent(JSON.stringify(firstPayload)),
                          region: addressStr, // region 역할로 활용
                          moodsKo: JSON.stringify(moodsKo),
                        },
                      });
                    }}
                    style={styles.ctaCircle}
                    android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
                    accessibilityRole="button"
                    accessibilityLabel="다음"
                  >
                    <Icon name="next_circle" width={53} height={53} />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: { paddingHorizontal: 25, paddingTop: 5, marginBottom: 4 },
  title: { marginBottom: 6, letterSpacing: -0.3 },
  mapArea: { flex: 1 },
  mapCard: { flex: 1 },
  mapInner: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    position: "relative",
    minHeight: 414,
  },
  sheetWrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
  sheetCard: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 13, shadowOffset: { width: 0, height: 0 } },
      android: { elevation: 8 },
    }),
  },
  handle: {
    alignSelf: "center",
    width: 78,
    height: 3,
    borderRadius: 50,
    backgroundColor: "#D9D9D9",
    marginBottom: 25,
  },
  placeHeaderRow: { flexDirection: "row", alignItems: "center" },
  titleRatingWrap: { flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 12, minWidth: 0 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  openMapBtn: {
    marginLeft: "auto",
    paddingHorizontal: 13.5,
    paddingVertical: 3,
    borderRadius: 40,
    backgroundColor: "#62974F",
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    flexDirection: "row",
    marginLeft: "auto",
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#D4D4D4",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  thumb: { flex: 1, height: 120, width: 120, backgroundColor: "#F3F4F6" },
  ctaRow: { flexDirection: "row", alignItems: "center", marginTop: 67, marginBottom: 36 },
  ctaCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
});