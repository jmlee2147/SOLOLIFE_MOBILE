import { Images } from "@assets/images";
import Icon from "@components/shared/Icon";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import NumberedPin from "./NumberedPin";

const MAP_PLACEHOLDER = Images.placeholder.map;
const PIN_COLORS = [
  "rgba(98,151,79,0.7)", // 1
  "rgba(17,124,115,0.7)", // 2
  "rgba(0,25,106,0.7)", // 3
];

// ===== 핀/라인 정렬 상수 (외부 라인 그릴 때도 쓰려고 export) =====
export const PIN_SIZE = 26;
// 스페이서 폭 = 핀 지름 + 좌우 여유(각 7px)
const LEFT_GAP = 20;
// 핀 중심 X = 스페이서 정중앙
export const PIN_CENTER_X = LEFT_GAP / 2;

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
  const { width } = useWindowDimensions();
  const [imgError, setImageError] = useState(false);

  // 카드 폭은 화면-양옆 padding(최대 343 느낌 유지)
  const cardW = Math.min(343, width - horizontalPadding * 2);
  const imgW = cardW * (92 / 343);
  const imgH = imgW; // 정사각 이미지

  const pinColor = PIN_COLORS[(Math.max(1, step) - 1) % PIN_COLORS.length];

  return (
    <View style={[styles.card, { width: cardW }, style]}>
      {/* 좌측: 핀 (선은 외부에서 그릴 수 있게 분리) */}
      <View style={{ width: LEFT_GAP, height: "100%", position: "relative" }}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: (LEFT_GAP - PIN_SIZE) / 2, // 스페이서 내부 중앙 정렬
            zIndex: 3,
            elevation: 3,
          }}
        >
          <NumberedPin
            number={step}
            color={pinColor}
            strokeColor="#FFFFFF"
            size={PIN_SIZE}
          />
        </View>
      </View>

      {/* 중앙: 텍스트 영역 */}
      <View style={styles.left}>
        <View style={styles.firstRow}>
          <Text
            className="font-pretendardSemiBold text-[#244DD3] text-heading-2"
            numberOfLines={1}
            style={{ flexShrink: 1 }}
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

        {!!categories?.length && (
          <Text className="mb-1 text-gray700 text-body-2" numberOfLines={1}>
            {categories.join(", ")}
          </Text>
        )}

        {!!address && (
          <Text className="text-gray700 text-body-2" numberOfLines={1}>
            {address}
          </Text>
        )}
      </View>

      {/* 우측: 이미지 + 바로 아래 버튼들(오른쪽 정렬) */}
      <View style={[styles.rightCol, { width: imgW }]}>
        <View
          style={{
            width: imgW,
            height: imgH,
            backgroundColor: "#E2E2E2",
            overflow: "hidden",
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!imageSource || imgError ? (
            <Image
              source={MAP_PLACEHOLDER}
              resizeMode="contain"
              style={{ width: "70%", height: "70%", opacity: 0.9 }}
            />
          ) : (
            <Image
              source={imageSource}
              resizeMode="cover"
              style={{ width: imgW, height: imgH }}
              onError={() => setImageError(true)}
            />
          )}
        </View>

        <View style={styles.actionsRowRight}>
          <Pressable onPress={onPressDirections} style={[styles.actionBtn]}>
            <Text className="mr-0 font-pretendardMedium text-body-2">길찾기</Text>
          </Pressable>
          <Pressable onPress={onPressShare} style={[styles.actionBtn]}>
            <Text className="font-pretendardMedium text-body-2">
              공유
            </Text>
            <Icon name="share" width={16} height={16} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start", // 핀과 제목이 같은 수평선상으로
    backgroundColor: "#FFF",
    overflow: "visible",
    paddingBottom: 10, // 카드 하단 여유
    backgroundColor: "transparent",
  },
  left: {
    flex: 1,
    justifyContent: "flex-start",
    marginLeft: 10, // 핀 스페이서 다음 간격
    paddingTop: 2, // 미세 상단 정렬
  },
  firstRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  rightCol: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    marginLeft: 10,
  },
  actionsRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10, // 이미지와 버튼 사이 간격
    alignSelf: "flex-end", // 우측 정렬
  },
  actionBtn: {
    width: 64,
    height: 30,
    borderWidth: 1,
    borderColor: "#D4D4D4",
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
  },
});
