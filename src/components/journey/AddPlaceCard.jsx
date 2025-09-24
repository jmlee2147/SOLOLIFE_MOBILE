import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../shared/Icon";

const SAMPLE_IMAGE = require("../../assets/images/sample.png");

export default function AddPlaceCard({
  image,
  name,
  category,
  address,
  rating,
  thumb,
  onDelete,
  onPress,
  style,
}) {
  console.log("[AddPlaceCard] rating prop =", rating, typeof rating);

  const numericRating =
    typeof rating === "number"
      ? rating
      : parseFloat(
          String(rating)
            .replace(",", ".")
            .replace(/[^\d.]/g, "")
        ); // '4,5' -> 4.5

  const showBadge = Number.isFinite(numericRating) && numericRating > 0;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, style]}
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
    >
      {/* 좌측 이미지 */}
      <Image
        source={{ uri: thumb }}
        style={styles.image}
        resizeMode="cover"
        onLoad={() => console.log("[AddPlaceCard] img loaded")}
        onError={(e) => console.log("[AddPlaceCard] img error", e?.nativeEvent)}
      />

      {/* 우측 정보 */}
      <View style={styles.right}>
        {/* 제목 */}
        <Text
          className="text-heading-2 font-pretendardSemiBold"
          numberOfLines={1}
          style={styles.title}
        >
          {name}
        </Text>

        {/* 카테고리 + 주소 (맨 아래) */}
        <View style={styles.bottomInfo}>
          <Text
            className="text-gray700 text-body-2 font-pretendardMedium"
            numberOfLines={1}
          >
            {category}
          </Text>
          <Text
            className="text-gray700 text-body-2 font-pretendardMedium"
            numberOfLines={1}
            style={styles.address}
          >
            {address}
          </Text>
        </View>

        {/* 삭제 버튼 (맨 오른쪽 위) */}
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Icon
            name="close"
            width={20}
            height={20}
            color="#AFAFAF"
            style={{ marginLeft: 2 }}
          />
        </Pressable>

        {/* 평점 뱃지 (맨 오른쪽 아래) */}
        {showBadge && (
          <View style={styles.ratingBadge}>
            <Icon name="star" width={16} height={16} color="#62974F" />
            <Text className="mx-[2px] mr-[13px] text-body-2 font-pretendardMedium text-green500">
              {numericRating}
            </Text>
            <Icon
              name="left_arrow"
              width={11}
              height={11}
              color="#62974F"
              flip
              strokeWidth={4}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    width: 343,
    height: 88,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  image: {
    width: 91,
    height: 88,
    backgroundColor: "#EEE",
  },
  right: {
    flex: 1,
    position: "relative", // 삭제 버튼 / 평점 절대 배치용 기준
    paddingLeft: 10, // 이미지와 제목 사이 여백
    paddingRight: 12,
  },
  title: {
    marginRight: 0, // 삭제 버튼 영역 비워주기
    // backgroundColor: "#aadd11",
  },
  deleteBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  bottomInfo: {
    position: "absolute",
    left: 10,
    bottom: 0,
  },
  ratingBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 5,
    paddingRight: 2.6,
    paddingVertical: 2.5,
    borderRadius: 3,
    backgroundColor: "#dbdcc1",
  },
  address: {
    paddingRight: 63, // 평점 뱃지 영역 비워주기
  },
});
