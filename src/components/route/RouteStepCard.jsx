import React from "react";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Icon from "../shared/Icon";

const BASE_W = 343;
const BASE_H = 115;
const IMG_W_RATIO = 92 / 343; // 오른쪽 이미지 비율
const BADGE = 24; // 뱃지 지름

const BADGE_COLORS = ["#62974F", "#B3B56C", "#DBDCC1"];

export default function RouteStepCard({
  step = 1,
  title = "",
  rating,
  categories = [],
  address = "",
  imageSource,
  style,
  horizontalPadding = 25,

  onPressDirections,
  onPressShare,
}) {
  const { width: screenW } = useWindowDimensions();

  // 카드 폭(최대 343) = 화면 - 좌우 패딩*2
  const cardW = Math.min(BASE_W, screenW - horizontalPadding * 2);
  const cardH = (BASE_H / BASE_W) * cardW;
  const imgW  = cardW * (92 / 343);                  // 가로 폭 = 카드 폭 비례
  const imgH  = cardW * IMG_W_RATIO;

  const stepNum = Number(step) || 1;
  const badgeColor = BADGE_COLORS[(Math.max(1, stepNum) - 1) % BADGE_COLORS.length];

  return (
    <View style={[styles.card, { width: cardW, height: cardH }, style]}>
      {/* 왼쪽 정보 영역 */}
      <View style={styles.left}>
        {/* 1줄: 뱃지 + 제목 + 평점 */}
        <View style={styles.firstRow}>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text className="text-white font-pretendardMedium text-body-2">{step}</Text>
          </View>

          <Text className="font-pretendardSemiBold text-[#244DD3] text-heading-2 ml-[15px]" numberOfLines={1}>
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
          <Text className="mb-1 text-gray700 text-body-2" numberOfLines={1} style={styles.indent}>
            {categories.join(", ")}
          </Text>
        )}

        {/* 3줄: 주소 (동일 들여쓰기) */}
        {!!address && (
          <Text className="text-gray700 text-body-2" numberOfLines={1} style={styles.indent}>
            {address}
          </Text>
        )}

        {/* 하단 액션 버튼(길찾기 / 공유) — 레이아웃만 추가 */}
        <View style={styles.actionsRow}>
          <Pressable onPress={onPressDirections} style={[styles.actionBtn, styles.primaryBtn]}>
            <Text className="text-white font-pretendardMedium text-body-2">길찾기</Text>
          </Pressable>

          <Pressable onPress={onPressShare} style={[styles.actionBtn, styles.outlineBtn]}>
            <Text className="text-gray800 font-pretendardMedium text-body-2">공유</Text>
            <Icon name="share" width={16} height={16} />
          </Pressable>
        </View>
      </View>

      {/* 오른쪽 이미지: 카드 맨 위에서 시작 + 높이 비율 고정 */}
      <View style={{ width: imgW, height: imgH, alignSelf: "flex-start" }}>
        <Image source={imageSource} style={{ width: imgW, height: imgH }} resizeMode="cover" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
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
    marginBottom: 4,
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: "#62974F",
    alignItems: "center",
    justifyContent: "center",
  },
 
  indent: {
    marginLeft: BADGE + 15,
  },

  actionsRow: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: BADGE + 15,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  primaryBtn: {
    backgroundColor: "#62974F",
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: "#D4D4D4",
    backgroundColor: "#FFFFFF",
  },
});