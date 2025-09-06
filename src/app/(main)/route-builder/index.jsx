import * as Linking from 'expo-linking';
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
  useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView from "../../../components/map/MapView";
import Header from "../../../components/shared/Header";
import Icon from "../../../components/shared/Icon";

export default function RouteBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width, height } = useWindowDimensions();

  // 길찾기 실행 함수
  const openNaverDirections = async ({ lat, lng, name, mode = "walk" }) => {
    const encodedName = encodeURIComponent(name || "");
    let appUrl = `nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${encodedName}&appname=com.example.myapp`;
    if (mode === "walk") appUrl = `nmap://route/walk?dlat=${lat}&dlng=${lng}&dname=${encodedName}&appname=com.example.myapp`;
    if (mode === "transit") appUrl = `nmap://route/publicTransit?dlat=${lat}&dlng=${lng}&dname=${encodedName}&appname=com.example.myapp`;
  
    const webUrl = `https://map.naver.com/v5/directions/-/-/${lng},${lat},${encodedName}`;
    try {
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  // 실제로는 params에서 받아오는 값 사용
  const placeName = String(params.placeName ?? "55 데시벨");
  const center = useMemo(
    () => ({
      lat: Number(params.lat ?? 37.248492),
      lng: Number(params.lng ?? 127.076754),
    }),
    [params.lat, params.lng]
  );

  const insets = useSafeAreaInsets();

  // 바텀시트 위치: 0(완전 펼침) ~ peekY(CTA가 가려지는 지점)
  const sheetY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);
  
  // 시트 전체 높이, CTA 좌표/높이 측정
  const [sheetH, setSheetH] = useState(0);
  const [ctaBox, setCtaBox] = useState({ y: 0, h: 0 });

  // CTA가 완전히 가려질 때까지 내릴 수 있는 거리
  const peekY = Math.max(0, sheetH - ctaBox.y + insets.bottom + 2);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(sheetY, {
        toValue: 0,
        duration: 300,     // 조금 더 부드럽게
        useNativeDriver: true,
      }).start();
    }, 0);              // ← 0.4초 뒤에 시작
  
    return () => clearTimeout(timer);
  }, [sheetY]);

  // 드래그 제스처
  const panResponder = React.useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => { sheetY.stopAnimation(v => (dragStartY.current = v)); },
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
          stiffness: 220, damping: 28, mass: 0.9,
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

      {/* 지도 영역: 타이틀 아래 4px 간격 + 남은 공간 전부 */}
      <View style={styles.mapArea}>
        <View style={styles.mapCard}>
          <View style={styles.mapInner}>
            {/* MapView는 수정 금지. 부모가 공간을 제공하도록 flex로 감쌈 */}
            <View style={{ flex: 1 }}>
              <MapView lat={center.lat} lng={center.lng} name={placeName}/>
            </View>

            {/* 지도 위 FAB(예시) */}
            <Pressable style={styles.fabSmall} onPress={() => { /* 현재위치 이동 등 */ }}>
              <Text style={{ fontWeight: "600" }}>🧭</Text>
            </Pressable>

            {/* 지도 위 바텀시트 (맨 아래에서 슥 올라옴) */}
            <Animated.View
              pointerEvents="box-none"
              style={[styles.sheetWrap, { transform: [{ translateY: sheetY }] }]}
              {...panResponder.panHandlers}           // ⬅️ 여기!
            >
              <View
                  style={styles.sheetCard}
                  onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
                {/* 그립바 */}
                <View style={styles.handle} />

                {/* 장소 요약 + 액션(같은 줄) */}
                <View style={styles.placeHeaderRow}>
                  {/* 왼쪽: 제목 + 평점 */}
                  <View style={styles.titleRatingWrap}>
                    <Text className="text-heading-2 text-[#244DD3] font-pretendardSemiBold">
                      {placeName}
                    </Text>
                    <View className="flex-row items-center ml-[9px]">
                      <Icon name="star" width={16} height={16} />
                      <Text className="ml-[2px] text-yellow900 text-body-2 font-pretendardMedium">4.5</Text>
                    </View>
                  </View>

                  {/* 오른쪽: 길찾기 / 공유 */}
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
                            `경기도 수원시 영통구\n\n` +
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

                {/* 아래 줄: 카테고리/주소 */}
                <Text className="mt-1 text-body-2 font-pretendardMedium text-gray700">카페, 디저트</Text>
                <Text className="mt-1 text-body-2 font-pretendardMedium text-gray700">경기도 수원시 영통구</Text>

                {/* 썸네일 3개 (샘플) */}
                <View style={styles.thumbRow}>
                  <Image source={require("../../../assets/images/sample.png")} style={styles.thumb} />
                  <Image source={require("../../../assets/images/cafe.png")} style={styles.thumb} />
                  <Image source={require("../../../assets/images/shopping.png")} style={styles.thumb} />
                </View>

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
                    onPress={() => router.push("/route-builder/confirm")}
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
  // 타이틀 블록
  titleBlock: { paddingHorizontal: 25, paddingTop: 5, marginBottom: 4 }, // ← 아래 여백 4px
  title: { marginBottom: 6, letterSpacing: -0.3 },

  // 지도 영역(남은 공간 전부 차지)
  mapArea: { flex: 1 }, // ← 핵심: 타이틀 아래부터 화면 끝까지
  mapCard: { flex: 1 },
  mapInner: {
    flex: 1,                 // ← 핵심: 내부도 전부 확장
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    position: "relative",
    minHeight: 414,          // WebView가 flex 스타일을 무시할 경우 대비 최소 높이
  },

  // 지도 위 FAB
  fabSmall: {
    position: "absolute",
    left: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  // 바텀시트
  sheetWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetCard: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  titleRatingWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,           
    paddingRight: 12,
    minWidth: 0,       
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  openMapBtn: {
    marginLeft: "auto",
    paddingHorizontal: 13.5,
    paddingVertical: 3,
    borderRadius: 40,
    backgroundColor: "#6A8042",
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

  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 67,
    marginBottom: 36,
  }
});