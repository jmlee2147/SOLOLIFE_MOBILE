import React from "react";
import { View } from "react-native";
import Button from "../../../../components/shared/Button";
import Header from "../../../../components/shared/Header";

const HomeScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <Header
        title="홈"
        leftIcon="notification"         // Icon.jsx에 정의된 아이콘 이름
        onLeftPress={() => console.log("뒤로가기")}
        rightIcon="menu"    // Icon.jsx에 정의된 아이콘 이름
        onRightPress={() => console.log("설정 클릭")}
      />

      <Button title="여기 갈래요" variant="primary" size="medium" />

      
    </View>
  );
};

export default HomeScreen;