import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");
const cardWidth = (width - 24 * 2 - 12) / 2;

const DEFAULT_BG = "#F4F4F4";
const PRESSED_BG = "#FDFFFA";

const CategoryCard = ({ image, title, description, style }) => {
  const [pressed, setPressed] = useState(false);
  const timerRef = useRef(null);

  const handlePress = () => {
    // 눌림색이 눈에 보이도록 아주 살짝 딜레이 후 이동
    timerRef.current = setTimeout(() => {
      router.push(`/place-recommend/${title.toLowerCase()}`);
    }, 90);
  };

  return (
    <View style={[styles.outerCard, style, { width: cardWidth }]}>
      <TouchableOpacity
        activeOpacity={1}                 // 투명도 변화 끔 (색상만 바꾸려는 의도)
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={handlePress}
        style={[
          styles.innerCard,
          pressed && styles.innerCardPressed, // 배경색만 변경
        ]}
      >
        <Image source={image} style={styles.image} resizeMode="contain" />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerCard: {
    borderWidth: 0,
    borderColor: "#B3B56C",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",           // 모서리 안으로 깔끔히
  },
  innerCard: {
    backgroundColor: DEFAULT_BG,  // 기본 배경
    borderRadius: 12,
    padding: width * 0.05,        // ⬅️ 기존 사이즈/레이아웃 그대로
    borderWidth: 1,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 6,
    elevation: 3,
  },
  innerCardPressed: {
    backgroundColor: PRESSED_BG,  // 눌렀을 때 배경색만 바꿈
    borderWidth: 1,
    borderColor: "#6A8042",
  },
  image: {
    width: "100%",
    height: width * 0.25,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: width * 0.045,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: width * 0.035,
    fontWeight: "500",
    color: "#555",
  },
});

export default CategoryCard;