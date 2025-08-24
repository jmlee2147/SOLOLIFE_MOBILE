import React from "react";
import { View } from "react-native";
import Button from "../../../../components/shared/Button";
import Header from "../../../../components/shared/Header";

const HomeScreen = () => {
  const handlePress = () => {
    console.log("버튼 클릭됨");
  };

  
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFADD" }}>
      <Header
        title="홈"
        leftIcon="notification"         
        onLeftPress={() => console.log("알림")}
        rightIcon="menu"    
        onRightPress={() => console.log("메뉴")}
      />

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
          <Button title="다시 추천받기" size="large" variant="primary" onPress={handlePress} />
          <Button title="다시 추천받기" size="medium" variant="secondary" onPress={handlePress} />
          <Button title="다시 추천받기" size="small" variant="disabled" onPress={handlePress} />
      </View>
    </View>
  );
};

export default HomeScreen;