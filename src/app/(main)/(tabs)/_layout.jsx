import { Tabs } from "expo-router";
import { View } from "react-native";
import Icon from "../../../components/shared/Icon";

const TabsLayout = () => {
  return (
    <>      
      <Tabs
        initialRouteName="home"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#6A8042",
          tabBarInactiveTintColor: "#AFAFAF",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            height: 62,
            borderTopWidth: 0,
            paddingHorizontal: 40,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: "Pretendard-Regular",
            marginTop: 2,
          },
          tabBarItemStyle: {
            flex: 0,
            marginHorizontal: 10,
            alignItems: "center",
          }
        }}
      >
        <Tabs.Screen
          name="journey"
          options={{
            tabBarLabel: "여정기록",
            tabBarIcon: ({ focused }) => (
                <View
                    style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.11,
                    shadowRadius: 6,
                    elevation: 4, // Android 전용
                    }}
                >
                    {focused ? (
                    <Icon name="journey" width={24} height={24} />
                    ) : (
                    <Icon name="journey_inactive" width={24} height={24} />
                    )}
                </View>
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            tabBarLabel: "지도",
            tabBarIcon: ({ focused }) => (
                <View
                    style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.11,
                    shadowRadius: 6,
                    elevation: 4, // Android 전용
                    }}
                >
                    {focused ? (
                    <Icon name="map" width={24} height={24} />
                    ) : (
                    <Icon name="map_inactive" width={24} height={24} />
                    )}
                </View>
            ),
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            tabBarLabel: "홈",
            tabBarIcon: ({ focused }) => (
                <View
                    style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.11,
                    shadowRadius: 6,
                    elevation: 4, // Android 전용
                    }}
                >
                    {focused ? (
                    <Icon name="home" width={24} height={24} />
                    ) : (
                    <Icon name="home_inactive" width={24} height={24} />
                    )}
                </View>
            ),
          }}
        />
        <Tabs.Screen
          name="heart"
          options={{
            tabBarLabel: "공감",
            tabBarIcon: ({ focused }) => (
                <View
                    style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.11,
                    shadowRadius: 6,
                    elevation: 4, // Android 전용
                    }}
                >
                    {focused ? (
                    <Icon name="heart" width={24} height={24} />
                    ) : (
                    <Icon name="heart_inactive" width={24} height={24} />
                    )}
                </View>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            tabBarLabel: "프로필",
            tabBarIcon: ({ focused }) => (
                <View
                    style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.11,
                    shadowRadius: 6,
                    elevation: 4, // Android 전용
                    }}
                >
                    {focused ? (
                    <Icon name="profile" width={24} height={24} />
                    ) : (
                    <Icon name="profile_inactive" width={24} height={24} />
                    )}
                </View>
            ),
          }}
        />      
      </Tabs>
    </>
  );
};

export default TabsLayout;