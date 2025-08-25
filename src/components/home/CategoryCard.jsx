import { router } from "expo-router";
import React from "react";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");
const cardWidth = (width - 24 * 2 - 12) / 2; 
// 좌우 padding 24, 카드 간격 12 → 2개 맞춤

const CategoryCard = ({ image, title, description, style }) => {
  const handlePress = () => {
    router.push(`/place-recommend/${title.toLowerCase()}`);
  };

  return (
    <View style={[styles.outerCard, style, { width: cardWidth }]}>
      <TouchableOpacity style={styles.innerCard} onPress={handlePress}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerCard: {
    borderWidth: 1,
    borderColor: "#B3B56C",
    borderRadius: 8,
    marginBottom: 16, // 세로 간격
  },
  innerCard: {
    backgroundColor: "#F3F8E8",
    borderRadius: 8,
    padding: width * 0.05, // 화면 크기 대비 padding
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.11,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: width * 0.25, // 반응형 높이
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