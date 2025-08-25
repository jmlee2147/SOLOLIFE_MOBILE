import { useLocalSearchParams, router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Header from "../../../../components/shared/Header";

const PlaceRecommendSubScreen = () => {
  const { categoryId, categoryTitle } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Header
        title={categoryTitle ? String(categoryTitle) : "추천 카테고리"}
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/(main)/(tabs)/home")}
      />
      <View style={styles.container}>
        <Text style={styles.title}>선택한 카테고리</Text>
        <Text style={styles.row}>ID: {categoryId ? String(categoryId) : '-'}</Text>
        <Text style={styles.row}>제목: {categoryTitle ? String(categoryTitle) : '-'}</Text>
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
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default PlaceRecommendSubScreen;

