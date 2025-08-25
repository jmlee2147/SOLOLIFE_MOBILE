import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Header from "../../../components/shared/Header";

export default function CategoryScreen() {
  const { category } = useLocalSearchParams(); // URL에서 key 가져오기

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header
        title="장소 추천받기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />
      <View style={styles.container}>
        <Text style={styles.text}>여기는 {category} 페이지입니다.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 20, fontWeight: "600" },
});