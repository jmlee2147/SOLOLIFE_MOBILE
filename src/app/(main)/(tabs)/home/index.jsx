import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import Button from "../../../../components/shared/Button";
import Header from "../../../../components/shared/Header";

const HomeScreen = () => {
  const handlePress = () => console.log("버튼 클릭됨");

  return (
    // 전체 배경색 적용
    <View style={{ flex: 1, backgroundColor: "#FFFADD" }}>
      
      {/* Header는 고정, 흰색 배경 */}
      <Header
        title="홈"
        leftIcon="notification"
        onLeftPress={() => console.log("알림")}
        rightIcon="menu"
        onRightPress={() => console.log("메뉴")}
      />

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20}}>
        <Text className="mb-2 text-title-1 font-pretendardExtraBold">
          포슬감자님 반가워요.
        </Text>
        <Text className="text-gray300 text-heading-3 font-pretendardSemiBold">
          오늘은 어디를 탐험해볼까요?
        </Text>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
          <Button
            title="장소 추천받기"
            size="medium"
            variant="primary"
            onPress={() => router.push("/place-recommend")}
          />
          <Button title="루트 추천받기" size="medium" variant="secondary" onPress={handlePress} />
          <Button title="루트 만들기" size="medium" variant="disabled" onPress={handlePress} />
        </View>
      </View>
    </View>
  );
};

export default HomeScreen;