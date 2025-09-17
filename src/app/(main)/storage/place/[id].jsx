import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Header from "../../../../components/shared/Header";

const { width } = Dimensions.get("window");
const GAP = 20;
const H_PADDING = 25;
const COLS = 3;
const ITEM_W = (width - H_PADDING * 2 - GAP * (COLS - 1)) / COLS;

const SAMPLE = require("../../../../assets/images/sample.png");

// 데모: 폴더 안 사진들 (URI 배열로 바꿔 붙이면 됨)
const MOCK_PHOTOS = Array.from({ length: 12 }, (_, i) => ({
  id: `ph-${i}`,
  src: SAMPLE,
  title: ["55데시벨", "소공원", "칸나", "아뜨비", "홍라드", "카페아라"][i % 6],
  category: "카페",
  address: "수원 영통구 영통동",
}));

export default function PlaceCollectionDetailScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams();

  const photos = useMemo(() => MOCK_PHOTOS, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff"}}>
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header
        title={`${title ?? "폴더"}(${photos.length})`}
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      <FlatList
        data={photos}
        keyExtractor={(it) => it.id}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingTop: 23, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable style={{ width: ITEM_W }}>
            <Image source={item.src} style={styles.photo} resizeMode="cover" />
            <View style={styles.metaRow}>
              <Text className="text-heading-3 font-pretendardSemiBold" numberOfLines={1}>{item.title}</Text>
              <Text className="text-body-3 font-pretendardRegular text-gray700">{item.category}</Text>
            </View>
            <Text className="text-caption font-pretendardRegular text-gray700 mb-[30px]" numberOfLines={1}>
              {item.address}
            </Text>
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: ITEM_W,
    height: ITEM_W,
    backgroundColor: "#EEE",
  },
  metaRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

});