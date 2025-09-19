import React from "react";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");
const GAP = 14;
const COLS = 2;
const H_PADDING = 24;
const ITEM_W = (width - H_PADDING * 2 - GAP * (COLS - 1)) / COLS;

const CategoryCard = ({ image, title, description, style, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, { width: ITEM_W }, style]}
    >
      {/* 왼쪽 아이콘 */}
      <Image source={image} style={styles.image} resizeMode="contain" />

      {/* 오른쪽 텍스트 */}
      <View style={styles.textCol}>
        <Text className="text-heading-2 font-pretendardSemiBold">
          {title}
        </Text>
        {!!description && (
          <Text className="text-body-3 font-pretendardRegular text-gray700">
            {description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    paddingHorizontal: 9,
    paddingVertical: 12,
    marginBottom: 12,
  },
  image: {
    width: 58,
    height: 58,
    marginRight: 4,
  },
  textCol: {
    flex: 1,
    justifyContent: "center",
  },
});

export default CategoryCard;