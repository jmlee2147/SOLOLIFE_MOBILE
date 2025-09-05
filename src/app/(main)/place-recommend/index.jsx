import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import CategoryCard from "../../../components/place/CategoryCard";
import Header from "../../../components/shared/Header";
import Icon from "../../../components/shared/Icon";
import { CATEGORY } from "../../../config/category.config";

const CARD_GAP = 16;

const categories = [
  { key: "cafe", image: require("../../../assets/images/cafe.png") },
  { key: "activity", image: require("../../../assets/images/activity.png") },
  { key: "shopping", image: require("../../../assets/images/shopping.png") },
  { key: "food", image: require("../../../assets/images/eat.png") },
];

export default function PlaceRecommendScreen() {
  const router = useRouter();

  // == 위치 상태 ==
  const [label, setLabel] = useState("위치를 불러오고 있어요...");
  const lastCoordsRef = useRef(null);
  const watcherRef = useRef(null);

  // 거리 계산(Haversine, m 단위)
  const distanceM = (a, b) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  };

  const reverseToLabel = async (coords) => {
    try {
      const [geo] = await Location.reverseGeocodeAsync(coords);
      const pretty =
        [geo?.city || geo?.region, geo?.district, geo?.name]
          .filter(Boolean)
          .join(" ") ||
        `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      setLabel(pretty);
    } catch {
      setLabel(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
    }
  };
  
  useEffect(() => {
    let mounted = true;
  
    const run = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (mounted) setLabel("위치 권한 거부됨");
          return;
        }
  
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          if (mounted) setLabel("위치 서비스 꺼짐");
          return;
        }
  
        // 초기 좌표
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 10000,
          timeout: 8000,
        });
        lastCoordsRef.current = initial.coords;
        if (mounted) await reverseToLabel(initial.coords);
  
        // 변화 감시
        watcherRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15000,   // 최소 15초 간격
            distanceInterval: 50,  // 50m 이상 이동 시 업데이트
          },
          async (loc) => {
            const prev = lastCoordsRef.current;
            const cur = loc.coords;
            if (!prev || distanceM(prev, cur) >= 50) {
              lastCoordsRef.current = cur;
              if (mounted) await reverseToLabel(cur);
            }
          }
        );
      } catch {
        if (mounted) setLabel("위치를 불러오지 못했습니다");
      }
    };
  
    run();
    return () => {
      mounted = false;
      watcherRef.current?.remove?.();
      watcherRef.current = null;
    };
  }, []);

  const handleCategoryPress = (catKey) => {
    const cfg = CATEGORY[catKey];
    if (cfg?.keywords?.length) {
      console.log("go keywords");
      router.push({ pathname: "/place-recommend/keywords", params: { category: catKey }});
    }
    else {
      console.log("go subcategory");
      router.push({ pathname: "/place-recommend/[category]", params: { category: catKey }});
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Header
        title="장소 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />
      <View style={styles.container}>
        <Text className="mb-2 text-title-1 font-pretendardExtraBold">포슬감자님 반가워요.</Text>
        <Text className="mb-8 text-heading-3 font-pretendardMedium text-gray700">오늘은 어디를 탐험해볼까요?</Text>
        
        {/* 위치 표시 필터 */}
        <View style={styles.locPill}>
          <Icon name="location" width={24} height={24} color="#EE7A13" />
          <View style={{ marginLeft: 6, flex: 1 }}>
            <Text numberOfLines={1}
                  className="text-[18px] font-pretendardMedium text-green900">
              {label}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {categories.map(( { key, image }) => (
            <CategoryCard
              key={key}
              image={image}
              title={CATEGORY[key].label}
              description={CATEGORY[key].desc}
              gap={CARD_GAP}
              onPress={() => handleCategoryPress(key)}
            />
          ))}
        </View>

        <View style={[styles.longCard, { marginTop: -16 }]}>
          <Text style={styles.longCardTitle}>추천받기</Text>
          <Text style={styles.longCardDesc}>가고 싶은 곳이 없다면 랜덤 추천을 받아보세요!</Text>
          <Text style={styles.longCardDesc}>우연한 계기가 운명의 장소가 될 수 있어요.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 18 },
  locPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B3B56C",     
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginBottom: 32,
    },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: CARD_GAP },
  longCard: { backgroundColor: "#F4F4F4", borderRadius: 12, padding: 20 },
  longCardTitle: { fontSize: 18, fontWeight: "500", marginBottom: 8, textAlign: "center" },
  longCardDesc: { fontSize: 14, fontWeight: "500", textAlign: "center" },
});