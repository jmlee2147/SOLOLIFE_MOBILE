import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Icon from "../shared/Icon";

const BASE_W = 343;
const BASE_H = 109;
const DEFAULT_BG = "#FFFFFF";
const PRESSED_BG = "#FDFFFA";
const DEFAULT_BORDER = "#D4D4D4";
const PRESSED_BORDER = "#62974F";
const MAP_PLACEHOLDER = require("../../assets/images/map_placeholder.png");

export default function EditStepCard({
  title = "",
  rating,
  categories = [],
  address = "",
  imageSource,
  onPress,
  disabled = false,
  style,
  horizontalPadding = 25,
}) {
  const { width: screenW } = useWindowDimensions();
  const cardW = Math.min(BASE_W, screenW - horizontalPadding * 2);
  const cardH = (BASE_H / BASE_W) * cardW;

  const [selected, setSelected] = useState(false);
  const [imgError, setImgError] = useState(false);

  const showFallback = !imageSource || imgError;

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={disabled}
      onPress={() => {
        setSelected(!selected);
        onPress?.();
      }}
    >
      <View
        style={[
          styles.shadowWrap,
          selected && styles.shadowActive, // 그림자 on
          { width: cardW, height: cardH },
          style,
        ]}
      >
        <View
          style={[
            styles.card,
            {
              width: cardW,
              height: cardH,
              backgroundColor: selected ? PRESSED_BG : DEFAULT_BG,
              borderColor: selected ? PRESSED_BORDER : DEFAULT_BORDER,
            },
            style,
          ]}
        >
          {/* 왼쪽 텍스트 영역 */}
          <View style={styles.left}>
            {/* 제목 + 평점 */}
            <View style={styles.firstRow}>
              <Text
                className="font-pretendardSemiBold text-[#244DD3] text-heading-2"
                numberOfLines={1}
              >
                {title}
              </Text>

              {rating != null && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginLeft: 6,
                  }}
                >
                  <Icon name="star" width={16} height={16} />
                  <Text className="text-yellow900 font-pretendardSemiBold text-body-2 ml-[2px]">
                    {String(rating)}
                  </Text>
                </View>
              )}
            </View>

            {/* 카테고리 */}
            {categories?.length > 0 && (
              <Text
                className="text-gray700 text-body-2 font-pretendardMedium"
                numberOfLines={1}
              >
                {categories.join(", ")}
              </Text>
            )}

            {/* 주소 */}
            {!!address && (
              <Text
                className="text-gray700 text-body-2 font-pretendardMedium"
                numberOfLines={1}
              >
                {address}
              </Text>
            )}
          </View>

          {/* 오른쪽 이미지 (회색 배경 + placeholder 폴백) */}
          <View style={styles.imageWrapper}>
            {showFallback ? (
              <Image
                source={MAP_PLACEHOLDER}
                resizeMode="contain"
                style={{ width: "70%", height: "70%", opacity: 0.9 }}
              />
            ) : (
              <Image
                source={imageSource}
                resizeMode="cover"
                style={styles.image}
                onError={() => setImgError(true)}
              />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    backgroundColor: "transparent",
  },
  shadowActive: {
    // iOS
    shadowColor: "#499C00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    // Android
    elevation: 5,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 1,
    overflow: "hidden",
  },
  left: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-start",
    paddingLeft: 12,
  },
  firstRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    marginBottom: 11,
  },
  imageWrapper: {
    width: 92,
    height: 92,
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#E2E2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
