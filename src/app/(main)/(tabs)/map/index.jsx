import BottomSheet, {
  BottomSheetFlashList,
  BottomSheetView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView from "../../../../components/map/MapView";
import Icon from "../../../../components/shared/Icon";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN;

export default function MapScreen() {
  const [searchResults, setSearchResults] = useState([]);
  const [likedPlaces, setLikedPlaces] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());

  // 바텀시트 ref
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["35%", "60%"], []);

  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 100,
    overshootClamping: true,
    restDisplacementThreshold: 0.1,
    restSpeedThreshold: 0.1,
    stiffness: 500,
  });

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

  // 지도 마커 (좋아요 + 검색 결과 합치기)
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

  // 카드 리스트 데이터
  const cards = useMemo(
    () => [...searchResults, ...likedPlaces].slice(0, 10),
    [searchResults, likedPlaces]
  );

  // FlashList item 렌더러
  const renderItem = useCallback(({ item }) => {
    return (
      <View style={styles.card}>
        <Image
          source={require("../../../../assets/images/sample.png")}
          style={styles.cardImage}
        />
        <Text
          className="text-heading-3 font-pretendardSemiBold mt-[5px]"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text className="text-caption font-pretendardRegular text-gray700">
          수원 영통구 영통동
        </Text>
      </View>
    );
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* 안드로이드 status bar */}
      {Platform.OS === "android" && (
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
      )}

      {/* 지도 */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
        <MapView markers={markers} />
      </View>

      {/* 검색창 오버레이 */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topContainer}>
          <View style={styles.searchBox}>
            <TextInput
              placeholder="장소 검색하기"
              onSubmitEditing={(e) => handleSearch(e.nativeEvent.text)}
              style={styles.searchInput}
            />
            <Icon name="search_outline" width={20} height={20} />
          </View>
          <View style={styles.chipsRow}>
            {["카페", "활동", "쇼핑", "먹거리"].map((cat) => (
              <Pressable
                key={cat}
                onPress={() => handleSearch(cat)}
                style={styles.chip}
              >
                <Text className="text-body-2 font-pretendardMedium text-gray700">
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>

      {/* 바텀시트 */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
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
        <BottomSheetView style={{ paddingHorizontal: 25, paddingTop: 20 }}>
          <Text className="text-heading-2 font-pretendardSemiBold mb-[11px]">
            현재 위치에서 많이 찾는 장소
          </Text>

          <BottomSheetFlashList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={cards}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            estimatedItemSize={140}
            contentContainerStyle={{ paddingRight: 25 }}
            style={{ height: 170 }}
          />
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject },
  topContainer: {
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 35,
    paddingLeft: 18,
    paddingRight: 25,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#AFAFAF",
    shadowColor: "#000",
    shadowOpacity: 0.11,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  chipsRow: { flexDirection: "row", marginTop: 8 },
  chip: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#AFAFAF",
    width: 70,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.11,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  card: { width: 100, marginRight: 20 },
  cardImage: { width: "100%", height: 100, borderRadius: 5 },
});
