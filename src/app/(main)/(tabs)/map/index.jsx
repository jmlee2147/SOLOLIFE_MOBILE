import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView from "../../../../components/map/MapView";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN;

export default function MapScreen() {
  const [searchResults, setSearchResults] = useState([]);
  const [likedPlaces, setLikedPlaces] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());

  // 바텀시트
  const sheetY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);
  const [sheetH, setSheetH] = useState(0);
  const PEEK = 150;
  const peekY = Math.max(0, sheetH - PEEK);

  useEffect(() => {
    // 초기 위치를 접힌 상태로
    if (sheetH > 0) {
      requestAnimationFrame(() => {
        sheetY.setValue(peekY);
      });
    }
  }, [sheetH, peekY]);

  const panResponder = useRef(
    PanResponder.create({
      // 세로 드래그만 캡처
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dy) > Math.abs(g.dx) && Math.abs(g.dy) > 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        sheetY.stopAnimation((v) => (dragStartY.current = v));
      },
      onPanResponderMove: (_e, g) => {
        // 0(완전 펼침) ~ peekY(접힘) 사이로 고정
        const next = Math.min(Math.max(dragStartY.current + g.dy, 0), peekY);
        sheetY.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        // 속도 반영한 예측 값으로 스냅 결론
        const projected = dragStartY.current + g.dy + g.vy * 120;
        const threshold = peekY / 2;
        const to = projected > threshold ? peekY : 0; // peek(접힘) ↔ 0(펼침)
        Animated.spring(sheetY, {
          toValue: to,
          useNativeDriver: true,
          stiffness: 220,
          damping: 28,
          mass: 0.9,
        }).start();
      },
    })
  ).current;
  // 좋아요 목록 불러오기
  useEffect(() => {
    async function fetchLikes() {
      try {
        const res = await fetch(`${API_BASE_URL}/me/locations/likes`, {
          headers: { Authorization: `Bearer ${TEST_TOKEN}` },
        });
        const data = await res.json();
        const ids = data.items.map((it) => it.location.location_id);
        setLikedIds(new Set(ids));
        setLikedPlaces(
          data.items.map((it) => ({
            id: String(it.location.location_id),
            lat: it.location.latitude,
            lng: it.location.longitude,
            name: it.location.location_name,
            liked: true,
          }))
        );
      } catch (err) {
        console.error("좋아요 목록 불러오기 실패", err);
      }
    }
    fetchLikes();
  }, []);

  // 검색
  async function handleSearch(q) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/locations/search?q=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${TEST_TOKEN}` } }
      );
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch (err) {
      console.error("검색 실패", err);
    }
  }

  // 지도 마커 데이터
  const markers = useMemo(() => {
    const searchMarkers = searchResults.map((p, i) => ({
      id: String(p.location_id),
      lat: p.latitude,
      lng: p.longitude,
      name: p.location_name,
      label: String(i + 1),
      liked: likedIds.has(p.location_id),
    }));
    return [...likedPlaces, ...searchMarkers];
  }, [searchResults, likedPlaces, likedIds]);

  return (
    <View style={{ flex: 1 }}>
      {Platform.OS === "android" && (
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
      )}

      {/* 지도 */}
      <View style={StyleSheet.absoluteFill}>
        <MapView markers={markers} />
      </View>

      {/* 오버레이 */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* 상단 검색창 */}
        <View style={styles.topContainer}>
          <TextInput
            placeholder="장소 검색하기"
            onSubmitEditing={(e) => handleSearch(e.nativeEvent.text)}
            style={styles.search}
          />
          <View style={styles.chipsRow}>
            {["카페", "활동", "쇼핑", "먹거리"].map((cat) => (
              <Pressable
                key={cat}
                onPress={() => handleSearch(cat)}
                style={styles.chip}
              >
                <Text>{cat}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 바텀시트 */}
        <Animated.View
          style={[styles.bottomSheet, { transform: [{ translateY: sheetY }] }]}
          onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>현재 위치에서 많이 찾는 장소</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[...searchResults, ...likedPlaces].slice(0, 6).map((p) => (
              <View key={p.id} style={styles.card}>
                <Image
                  source={require("../../../../assets/images/sample.png")}
                  style={styles.cardImage}
                />
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.cardAddr}>수원 영통구 영통동</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject },
  topContainer: {
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  search: {
    backgroundColor: "#fff",
    borderRadius: 35,
    paddingLeft: 18,
    paddingVertical: 15,
    elevation: 3,
  },
  chipsRow: { flexDirection: "row", marginTop: 8 },
  chip: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#AFAFAF",
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFF",
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 20,
    elevation: 8,
  },
  handle: {
    alignSelf: "center",
    width: 78,
    height: 3,
    borderRadius: 50,
    backgroundColor: "#D9D9D9",
    marginBottom: 15,
  },
  sheetTitle: { fontWeight: "600", fontSize: 16, marginBottom: 12 },
  card: { width: 100, marginRight: 20 },
  cardImage: { width: "100%", height: 100, borderRadius: 5 },
  cardTitle: { fontWeight: "600", marginTop: 6 },
  cardAddr: { color: "#666" },
});
