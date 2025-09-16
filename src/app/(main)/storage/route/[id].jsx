import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../../../components/shared/Button";
import Header from "../../../../components/shared/Header";
import Icon from "../../../../components/shared/Icon";

const SAMPLE_PLACES = [
  {
    id: "p1",
    name: "국립현대미술관",
    category: "미술관",
    address: "서울시 00구 00길",
    rating: 4.5,
    thumb: require("../../../../assets/images/sample.png"),
    tags: ["#핫플", "#감성적", "#조용한", "#밝은", "#실내"],
  },
  {
    id: "p2",
    name: "리움미술관",
    category: "미술관",
    address: "서울시 00구 00길",
    rating: 4.5,
    thumb: require("../../../../assets/images/sample.png"),
    tags: ["#핫플", "#감성적", "#조용한", "#밝은", "#실내"],
  },
  {
    id: "p3",
    name: "해움미술관",
    category: "미술관",
    address: "서울시 00구 00길",
    rating: 4.5,
    thumb: require("../../../../assets/images/sample.png"),
    tags: ["#핫플", "#감성적", "#조용한", "#밝은", "#실내"],
  },
];

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="루트 저장소"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      <View style={{ paddingHorizontal: 25, paddingTop: 10 }}>
        <Text className="text-title-1 font-pretendardExtraBold mb-[6px]">
          전시투어
        </Text>
        <Text className="text-heading-3 font-pretendardSemiBold text-gray700">
          2025.08.12 저장된 루트
        </Text>
      </View>

      {/* 장소 리스트 */}
      <FlatList
        data={SAMPLE_PLACES}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <View style={styles.placeRow}>
            <Image source={item.thumb} style={styles.thumb} />
            <View style={styles.placeInfo}>
              {/* 상단: 이름 + 별점 */}
              <View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text className="text-heading-2 font-pretendardSemiBold text-[#244DD3] mr-[9px]">
                    {item.name}
                  </Text>
                  <Icon name="star" width={16} height={16} />
                  <Text className="text-body-2 font-pretendardMedium text-yellow900 ml-[1px]">
                    {item.rating}
                  </Text>
                </View>
                <Text className="text-body-2 font-pretendardMedium text-gray700 mt-[13px]">
                  {item.category}
                </Text>
              </View>

              <Text className="text-body-3 font-pretendardRegular text-gray700">
                {item.tags.join(" ")}
              </Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: "#D4D4D4",
              marginVertical: 8,
              marginHorizontal: -25,
            }}
          />
        )}
        contentContainerStyle={{ padding: 20 }}
      />

      {/* 버튼들 */}
      <View style={styles.bottomRow}>
        <Button title="순서 편집하기" size="small" variant="secondary" />
        <Button title="네이버 지도 연결하기" size="medium" variant="primary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  placeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF",
  },
  thumb: {
    width: 166,
    height: 166,
    backgroundColor: "#D9D9D9",
  },
  tags: {
    fontSize: 11,
    color: "#999",
  },
  placeName: {
    fontSize: 16,
    fontFamily: "Pretendard-SemiBold",
    color: "#1565C0",
  },
  placeInfo: {
    flex: 1,
    minHeight: 166,
    marginLeft: 10,
    justifyContent: "space-between",
  },
  tags: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  rating: { marginLeft: 6, fontSize: 13, color: "#FF6F00" },
  category: { fontSize: 13, color: "#444" },
  address: { fontSize: 12, color: "#666" },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  editBtn: {
    flex: 1,
    marginRight: 8,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5F1E8",
    alignItems: "center",
    justifyContent: "center",
  },
  editText: {
    color: "#2A7A3A",
    fontSize: 14,
    fontFamily: "Pretendard-SemiBold",
  },
  mapBtn: {
    flex: 1,
    marginLeft: 8,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2A7A3A",
    alignItems: "center",
    justifyContent: "center",
  },
  mapText: { color: "#fff", fontSize: 14, fontFamily: "Pretendard-SemiBold" },
});
