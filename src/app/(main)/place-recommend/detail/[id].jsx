// src/app/(main)/place-recommend/[id].jsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import Button from "../../../../components/shared/Button";
import Header from "../../../../components/shared/Header";
import Icon from "../../../../components/shared/Icon";

const { width: SCREEN_W } = Dimensions.get("window");

// MOCK DATA
const MOCK = {
  "1": {
    id: "1",
    name: "55 데시벨",
    rating: 4.5,
    categories: ["카페", "디저트"],
    images: [
      require("../../../../assets/images/sample.png"),
      require("../../../../assets/images/cafe.png"),
      require("../../../../assets/images/shopping.png"),
      require("../../../../assets/images/eat.png"),
    ],
    tags: ["어두운", "조용한"],
    address: "경기도 수원시 영통구",
    hours: "10:00 - 21:00",
    phone: "031-1234-5678",
    price: "100만원",
    reviews: [
      {
        id: "r1",
        user: "집가고 싶은 나",
        rating: 4,
        content:
          "I was a ghost, I was alone, hah 어두워진, hah, 앞길속에 ... Given the throne...",
      },
      { id: "r2", user: "감자튀김", rating: 5, content: "조용해서 작업하기 좋았어요." },
    ],
    coords: { lat: 37.251, lng: 127.071 },
  },
};
// -----------

export default function PlaceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const place = useMemo(() => MOCK[String(id)] ?? MOCK["1"], [id]);

  const [liked, setLiked] = useState(false);
  const [tab, setTab] = useState("review"); // 'review' | 'route'
  const scrollX = useRef(new Animated.Value(0)).current;

  const IMG_W = SCREEN_W;
  const IMG_H = Math.round((SCREEN_W * 9) / 16) + 80; // 시안 대비 여유

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        title="장소 상세"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 이미지 캐러셀 */}
        <View style={{ width: IMG_W, height: IMG_H }}>
          <Animated.FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={place.images}
            keyExtractor={(_, i) => `img-${i}`}
            renderItem={({ item }) => (
              <Image
                source={item}
                resizeMode="cover"
                style={{ width: IMG_W, height: IMG_H }}
              />
            )}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          />
          {/* 페이지 표시 1/4 */}
          <View
            style={{
              position: "absolute",
              right: 21,
              bottom: 20,
              paddingHorizontal: 16,
              paddingVertical: 4,
              borderRadius: 16,
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          >
            <Text className="text-white text-body-3 font-pretendardRegular">
              {/* current index 계산 */}
              {Math.min(
                place.images.length,
                Math.max(
                  1,
                  Math.round(
                    (scrollX?._value ?? 0) / IMG_W + 1 // 초기값 보정
                  )
                )
              )}{" "}
              / {place.images.length}
            </Text>
          </View>
        </View>

        {/* 타이틀/평점/찜 */}
        <View className="px-[25px] pt-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-black text-title-1 font-pretendardExtraBold">{place.name}</Text>
            <Pressable onPress={() => setLiked((v) => !v)} hitSlop={8}>
              <Icon name={liked ? "heart" : "heart_outline"} width={25} height={25} />
            </Pressable>
          </View>

          <View className="flex-row items-center">
            <Text className="text-gray700 text-body-1 font-pretendardMedium">
              {place.categories.join(", ")}
            </Text>
            <View className="flex-row items-center ml-2">
              <Icon name="star" width={14} height={14} />
              <Text className="ml-[2px] text-[14px] font-pretendardSemiBold text-[#EE7A13]">
                {place.rating}
              </Text>
            </View>
          </View>

          {/* 키워드 칩 */}
          <View className="flex-row flex-wrap mt-2">
            {place.tags.map((t, i) => (
              <View
                key={`${t}-${i}`}
                className="px-3 py-[6px] mr-2 mb-2 rounded-full bg-gray100"
              >
                <Text className="text-gray700">{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 정보 목록 */}
        <View style={{ marginTop: 12 }}>
          {place.address && (
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Icon name="location_outline" width={24} height={24} />
              </View>
              <Text className="text-gray700 font-pretendardMedium text-body-1">{place.address}</Text>
            </View>
          )}

          {place.hours && (
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Icon name="time" width={24} height={24} />
              </View>
              <Text className="text-gray700 font-pretendardMedium text-body-1">{place.hours}</Text>
            </View>
          )}

          {place.phone && (
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Icon name="phone" width={24} height={24} />
              </View>
              <Text className="text-gray700 font-pretendardMedium text-body-1">{place.phone}</Text>
            </View>
          )}

          {place.price && (
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Icon name="price" width={24} height={24} />
              </View>
              <Text className="text-gray700 font-pretendardMedium text-body-1">{place.price}</Text>
            </View>
          )}
        </View>

        {/* 탭 */}
        <View className="px-4 mt-5">
          <View className="flex-row">
            <Pressable onPress={() => setTab("review")}>
              <Text
                className={[
                  "mr-5 pb-1 text-[16px] font-pretendardSemiBold",
                  tab === "review" ? "text-black" : "text-gray400",
                ].join(" ")}
              >
                리뷰
              </Text>
            </Pressable>
            <Pressable onPress={() => setTab("route")}>
              <Text
                className={[
                  "pb-1 text-[16px] font-pretendardSemiBold",
                  tab === "route" ? "text-black" : "text-gray400",
                ].join(" ")}
              >
                관련 여정
              </Text>
            </Pressable>
          </View>

          {/* 탭 바 */}
          <View className="h-[1px] bg-gray200 mt-2" />

          {tab === "review" ? (
            <View className="mt-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray700">최신순</Text>
                <Pressable onPress={() => {}}>
                  <Text className="text-[#3B5B2E]">리뷰작성하기</Text>
                </Pressable>
              </View>

              {/* 리뷰 리스트 */}
              <View className="mt-3">
                {place.reviews.map((r) => (
                  <View
                    key={r.id}
                    className="py-4 border-b border-gray200"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="w-8 h-8 mr-2 rounded-full bg-gray200" />
                        <Text className="text-gray800">{r.user}</Text>
                      </View>
                      <Text>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</Text>
                    </View>
                    {!!r.content && (
                      <Text className="mt-2 text-gray700">{r.content}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View className="py-8">
              <Text className="text-gray600">관련 여정이 아직 없어요.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 하단 CTA */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: "#fff",
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: -2 },
            },
            android: { elevation: 12 },
          }),
        }}
      >
        <Button
          title="여기 갈래요"
          size="large"        
          variant="primary"       
          onPress={() =>
            router.push({
              pathname: "/route-builder",
              params: {
                placeId: place.id,
                placeName: place.name,
                lat: place.coords?.lat ?? "",
                lng: place.coords?.lng ?? "",
              },
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 8,
    // backgroundColor: "#aaa123",
  },
  iconBox: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 3,
    // backgroundColor: "#E5E7EB",
  },
});