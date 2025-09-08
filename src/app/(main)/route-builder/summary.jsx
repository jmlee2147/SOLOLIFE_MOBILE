import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, View } from "react-native";
import MapView from "../../../components/map/MapView";
import RouteStepCard from "../../../components/route/RouteStepCard";
import Button from "../../../components/shared/Button";
import Header from "../../../components/shared/Header";

const MOCK_ROUTE = [
  {
    id: 1,
    title: "55데시벨",
    rating: 4.5,
    categories: ["카페", "디저트"],
    address: "경기도 수원시 영통구",
    imageSource: require("../../../assets/images/sample.png"),
    lat: 37.248492,
    lng: 127.076754,
  },
  {
    id: 2,
    title: "앤드카페",
    rating: 4.2,
    categories: ["카페"],
    address: "경기도 수원시 영통구",
    imageSource: require("../../../assets/images/cafe.png"),
    lat: 37.2512,
    lng: 127.0719,
  },
  {
    id: 3,
    title: "북서울꿈의숲",
    rating: 4.7,
    categories: ["공원"],
    address: "서울 강북구",
    imageSource: require("../../../assets/images/activity.png"),
    lat: 37.6512,
    lng: 127.0386,
  },
];

export default function RouteSummaryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="루트 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      {/* 지도 */}
      <View style={{ height: 212,marginBottom: 41, }}>
        <MapView markers={MOCK_ROUTE.map((p, i) => ({ ...p, label: `${i + 1}` }))} />
      </View>

      {/* 스텝 카드 리스트 */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_ROUTE.map((place, i) => (
          <View key={place.id} style={{ marginBottom: 18, paddingHorizontal: 25 }}>
            <RouteStepCard
              step={i + 1}
              title={place.title}
              rating={place.rating}
              categories={place.categories}
              address={place.address}
              imageSource={place.imageSource}
            />

          {i < MOCK_ROUTE.length - 1 && (
            <View
              style={{
              height: 1,
              backgroundColor: "#D4D4D4",
              marginTop: 18, // 카드와 선 사이 간격
              }}
            />
          )}
          </View>
        ))}
      </ScrollView>

      {/* 하단 버튼 */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 25,
          paddingVertical: 12,
          backgroundColor: "#fff",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <Button 
          title="루트 수정하기"
          size="small"
          variant="secondary"
          onPress={() => router.push("/route-builder/edit")}
        />
        <Button
          title="루트 저장하기"
          size="medium"
          variant="primary"
          onPress={() => router.push("/route-builder/save")}
        />
      </View>
    </SafeAreaView>
  );
}