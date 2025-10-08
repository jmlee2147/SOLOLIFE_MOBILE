import { Images } from "@assets/images";
import Header from "@components/shared/Header";
import Icon from "@components/shared/Icon";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    DeviceEventEmitter,
    Image,
    ImageBackground,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function RouteRecommendScreen() {
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

    const sub = DeviceEventEmitter.addListener(
      "location:selected",
      (payload) => {
        if (!payload) return;
        setLabel(payload.label || "선택된 위치");
        lastCoordsRef.current = {
          latitude: Number(payload.latitude),
          longitude: Number(payload.longitude),
        };
      }
    );

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
            timeInterval: 15000,
            distanceInterval: 50,
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
        if (mounted) setLabel("위치를 불러오지 못했어요.");
      }
    };

    run();
    return () => {
      mounted = false;
      watcherRef.current?.remove?.();
      watcherRef.current = null;
      sub?.remove?.();
    };
  }, []);

  const goLocationSearch = () =>
    router.push("/place-recommend/location-search");

  const goStartFromPlace = () => router.push("/route-recommend/place-search"); // 기존 ‘시작 장소 선택하기’ 흐름

  const goAutoRoute = () => {
    router.push({
      pathname: "/route-builder",
      params: {
        mode: "random",
        lat: lastCoordsRef.current?.latitude,
        lng: lastCoordsRef.current?.longitude,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header rightIcon="close" onRightPress={() => router.push("/home")} />
      <View style={styles.container}>
        <Text className="mb-[6px] text-title-1 font-pretendardExtraBold">
          맞춤 루트를 만들어 드릴게요!
        </Text>
        <Text className="mb-8 text-heading-3 font-pretendardMedium text-gray700">
          포슬감자님께 딱 어울리는 루트를 만들어 드려요.
        </Text>

        {/* 위치 표시 */}
        <Pressable style={styles.locPill} onPress={goLocationSearch}>
          <Icon name="location" width={24} height={24} color="#62974F" />
          <View style={{ marginLeft: 6, flex: 1 }}>
            <Text
              numberOfLines={1}
              className="text-[18px] font-pretendardMedium text-green900"
            >
              {label}
            </Text>
          </View>
        </Pressable>

        {/* 보조 힌트 */}
        <Pressable
          onPress={goLocationSearch}
          style={{ alignSelf: "flex-start", marginTop: 0, marginBottom: 24 }}
        >
          <ImageBackground
            source={Images.common.bubble} // ← 네가 주는 PNG 경로
            resizeMode="stretch"
            style={{
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 12,
              minWidth: 107, // 필요 시 조정
              minHeight: 28, // 필요 시 조정
            }}
          >
            <View style={{ transform: [{ translateY: 3 }] }}>
              <Text
                className="text-body-2 font-pretendardMedium text-green500"
              >
                탐험 장소가 맞나요?
              </Text>
            </View>
          </ImageBackground>
        </Pressable>

        {/* 카드: 시작 장소 선택하기 */}
        <Pressable style={styles.ovalCard} onPress={goStartFromPlace}>
          <View style={styles.imageBox}>
            <Image
              source={Images.common.map}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
          <View style={styles.cardTextCol}>
            <Text
              style={styles.cardTitle}
              className="text-black text-heading-3 font-pretendardSemiBold"
            >
              시작 장소 선택하기
            </Text>
            <Text
              style={styles.cardDesc}
              className="text-body-2 font-pretendardMedium text-gray700 mt-[6px]"
            >
              선택한 장소를 기반으로{"\n"}맞춤 루트를 만들어 드릴게요.
            </Text>
          </View>
        </Pressable>

        {/* 카드: 루트 추천받기 */}
        <Pressable style={styles.ovalCard} onPress={goAutoRoute}>
          <View style={styles.imageBox}>
            <Image
              source={Images.common.thumbs}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
          <View style={styles.cardTextCol}>
            <Text
              style={styles.cardTitle}
              className="text-black text-heading-3 font-pretendardSemiBold"
            >
              루트 추천받기
            </Text>
            <Text
              style={styles.cardDesc}
              className="text-body-2 font-pretendardMedium text-gray700 mt-[6px]"
            >
              생각해 둔 장소가 없다면{"\n"}추천을 받아보세요.
            </Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 5 },
  locPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  hintBubble: {
    alignSelf: "flex-start",
    marginLeft: 8,
    marginTop: 5,
    marginBottom: 33,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#2E7A45",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  // 오벌 카드 공통
  ovalCard: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    width: 363,
    height: 167,
    paddingHorizontal: 40,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#D4D4D4",
  },
  imageBox: {
    width: 113,
    height: 113,
    // backgroundColor: "#E2E2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 113,
    height: 113,
  },
  cardTextCol: {
    flex: 1,
    alignItems: "center", // 가운데 정렬 (가로)
    justifyContent: "center", // 세로 가운데 정렬
  },
  cardTitle: {
    fontSize: 18,
    textAlign: "center", // 텍스트 가운데
  },
  cardDesc: {
    fontSize: 14,
    textAlign: "center", // 텍스트 가운데
    marginTop: 4,
    lineHeight: 20,
  },
});
