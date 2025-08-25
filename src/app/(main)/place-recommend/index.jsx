import { router } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import CategoryCard from "../../../components/home/CategoryCard";
import Header from "../../../components/shared/Header";

const { width } = Dimensions.get("window");
const CARD_GAP = 16; // 카드 간격 및 2x2와 긴 카드 사이 간격 통일

const categories = [
  {
    id: 1,
    image: require("../../../assets/images/cafe.png"),
    title: "카페",
    description: "카페인 수혈!",
  },
  {
    id: 2,
    image: require("../../../assets/images/activity.png"),
    title: "활동",
    description: "다양한 체험과 활동",
  },
  {
    id: 3,
    image: require("../../../assets/images/shopping.png"),
    title: "쇼핑",
    description: "내 마음에 쏙 들어!",
  },
  {
    id: 4,
    image: require("../../../assets/images/eat.png"),
    title: "먹거리",
    description: "맛있는 행복",
  },
];

const PlaceRecommendScreen = () => {
  const handleCategoryPress = (category) => {
    router.push({
      pathname: "/(main)/place-recommend/sub",
      params: { categoryId: category.id, categoryTitle: category.title },
    });
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Header
        title="장소 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/(main)/(tabs)/home")}
      />

      <View style={styles.container}>
        <Text style={styles.title}>포슬감자님 반가워요.</Text>
        <Text style={styles.subtitle}>오늘은 어디를 탐험해볼까요?</Text>

        {/* 2x2 카드 그리드 */}
        <View style={styles.grid}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              image={category.image}
              title={category.title}
              description={category.description}
              gap={CARD_GAP}
              onPress={() => handleCategoryPress(category)}
            />
          ))}
        </View>

        {/* 2x2 밑에 들어가는 긴 카드 */}
        <View style={[styles.longCard, { marginTop: CARD_GAP }]}>
          <Text style={styles.longCardTitle}>추천받기</Text>
          <Text style={styles.longCardDesc}>
            가고 싶은 곳이 없다면 랜덤 추천을 받아보세요!
          </Text>
          <Text style={styles.longCardDesc}>
            우연한 계기가 운명의 장소가 될 수 있어요.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: width * 0.1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: CARD_GAP, // 2x2 카드 그룹과 긴 카드 사이 간격
  },
  longCard: {
    backgroundColor: "#F3F8E8",
    borderWidth: 1,
    borderColor: "#B3B56C",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.11,
    shadowRadius: 6,
    elevation: 3,
  },
  longCardTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  longCardDesc: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default PlaceRecommendScreen;

