import React from "react";
import { Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Icon from "../shared/Icon"; // 경로: src/components/shared/Icon.jsx

const BASE_W = 343;
const BASE_H = 89;
const IMG_RATIO = 92 / 343; // 오른쪽 이미지 비율

export default function RouteStepCard({
  step = 1,
  title = "",
  rating,
  categories = [],
  address = "",
  imageSource,
  style,
  horizontalPadding = 25, // 화면 좌우 패딩(px-6 등과 맞춤)
}) {
  const { width: screenW } = useWindowDimensions();

  // 카드 폭(최대 343) = 화면 - 좌우 패딩*2
  const cardW = Math.min(BASE_W, screenW - horizontalPadding * 2);
  const cardH = (BASE_H / BASE_W) * cardW;
  const imgW = cardW * IMG_RATIO;

  return (
    <View style={[styles.card, { width: cardW, height: cardH }, style]}>
      {/* 왼쪽 정보 영역 */}
      <View style={styles.left}>
        {/* 1줄: 뱃지 + 제목 + ★ 평점 (카드 상단에 딱 붙음) */}
        <View style={styles.firstRow}>
          <View style={styles.badge}>
            <Text className="text-white font-pretendardMedium text-body-2">{step}</Text>
          </View>

          <Text
            className="font-pretendardSemiBold text-[#244DD3] text-heading-2 ml-[15px]"
            numberOfLines={1}
          >
            {title}
          </Text>

          {rating != null && (
            <View className="flex-row items-center ml-[6px]">
              <Icon name="star" width={16} height={16} />
              <Text className="text-yellow900 font-pretendardSemiBold text-body-2 ml-[2px]">
                {String(rating)}
              </Text>
            </View>
          )}
        </View>

        {/* 2줄: 카테고리 (뱃지 폭만큼 들여쓰기) */}
        {categories?.length > 0 && (
          <Text className="text-gray700 text-body-2 leading-[16px]" numberOfLines={1} style={styles.indent}>
            {categories.join(", ")}
          </Text>
        )}

        {/* 3줄: 주소 (동일 들여쓰기) */}
        {!!address && (
          <Text className="text-gray700 text-body-2 leading-[16px]" numberOfLines={1} style={styles.indent}>
            {address}
          </Text>
        )}
      </View>

      {/* 오른쪽 이미지: 카드 높이에 정확히 맞춤 */}
      <Image source={imageSource} style={{ width: imgW, height: cardH }} resizeMode="cover" />
    </View>
  );
}

const BADGE = 24; // 뱃지 지름

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  left: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-start",
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  firstRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: "#6A8042",
    alignItems: "center",
    justifyContent: "center",
  },
  // 뱃지(24) + 뱃지 오른쪽 여백(8)만큼 들여쓰기
  indent: {
    marginLeft: BADGE + 15,
  },
});