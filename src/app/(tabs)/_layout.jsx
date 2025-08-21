import { Tabs } from "expo-router";
import { Image, StyleSheet } from "react-native";

//  탭 아이콘 헬퍼 함수
const getTabIcon = (name, focused) => {
    switch (name) {
        case "Journey":
            return focused
                ? require("../../assets/icons/journey.png")
                : require("../../assets/icons/journey-inactive.png");
        case "Map":
            return focused
                ? require("../../assets/icons/map.png")
                : require("../../assets/icons/map-inactive.png");
        case "Home":
            return focused
                ? require("../../assets/icons/home.png")
                : require("../../assets/icons/home-inactive.png");
        case "Heart":
            return focused
                ? require("../../assets/icons/heart.png")
                : require("../../assets/icons/heart-inactive.png");
        case "Profile":
            return focused
                ? require("../../assets/icons/profile.png")
                : require("../../assets/icons/profile-inactive.png");

    }
}

const TabsLayout = () => {
  return (
    <>      
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#888888",
          tabBarStyle: {
            backgroundColor: "#000000",
            height: 62,
            borderTopWidth: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: "Bookk-Myungjo",
            letterSpacing: -1,
            marginTop: 6,
          },
        }}
      >
        <Tabs.Screen
          name="Journey/index"
          options={{
            tabBarLabel: "여정",
            tabBarIcon: ({ focused }) => (
                <Image
                    source={getTabIcon("Journey", focused)}
                    style={{ width: 24, height: 24 }}
                />
            ),
          }}
        />
        <Tabs.Screen
          name="Map/index"
          options={{
            tabBarLabel: "지도",
            tabBarIcon: ({ focused }) => (
                <Image
                    source={getTabIcon("Map", focused)}
                    style={{ width: 24, height: 24 }}
                />
            ),
          }}
        />
        <Tabs.Screen
          name="Home/index"
          options={{
            tabBarLabel: "홈",
            tabBarIcon: ({ focused }) => (
                <Image
                    source={getTabIcon("Home", focused)}
                    style={{ width: 24, height: 24 }}
                />
            ),
            
          }}
        />
        <Tabs.Screen
          name="Heart/index"
          options={{
            tabBarLabel: "공감",
            tabBarIcon: ({ focused }) => (
                <Image
                    source={getTabIcon("Heart", focused)}
                    style={{ width: 24, height: 24 }}
                />
            ),
        
          }}
        />

        <Tabs.Screen
          name="Profile/index"
          options={{
            tabBarLabel: "프로필",
            tabBarIcon: ({ focused }) => (
                <Image
                    source={getTabIcon("Profile", focused)}
                    style={{ width: 24, height: 24 }}
                />
            ),
        
          }}
        />      
      </Tabs>
    </>
  );
};

const styles = StyleSheet.create({
  gradient: {
    position: "absolute",
    bottom: 77, // 탭바 높이만큼 띄우기
    left: 0,
    right: 0,
    height: 30, // 그라데이션 높이 조절
    zIndex: 10,
  },
});

export default TabsLayout;