import React from 'react';
import { Tabs } from 'expo-router';
import { Image, Text } from 'react-native';

const TabLabel = ({ label, color, focused }) => (
  <Text className="text-[10px] font-pretendardMedium" style={{ color, opacity: focused ? 1 : 0.8 }}>
    {label}
  </Text>
);

const icon = (source) => ({ color, size, focused }) => (
  <Image
    source={source}
    style={{ width: size, height: size, tintColor: color, opacity: focused ? 1 : 0.8 }}
    resizeMode="contain"
  />
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#121212',
        tabBarInactiveTintColor: '#AFAFAF',
      }}
    >
      <Tabs.Screen
        name="Journey"
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="여정" color={color} focused={focused} />,
          tabBarIcon: icon(require('../../shared/assets/icons/journey.png')),
        }}
      />
      <Tabs.Screen
        name="Map"
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="지도" color={color} focused={focused} />,
          tabBarIcon: icon(require('../../shared/assets/icons/map.png')),
        }}
      />
      <Tabs.Screen
        name="Home"
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="홈" color={color} focused={focused} />,
          tabBarIcon: icon(require('../../shared/assets/icons/home.png')),
        }}
      />
      <Tabs.Screen
        name="Heart"
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="공감" color={color} focused={focused} />,
          tabBarIcon: icon(require('../../shared/assets/icons/heart.png')),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="프로필" color={color} focused={focused} />,
          tabBarIcon: icon(require('../../shared/assets/icons/profile.png')),
        }}
      />
    </Tabs>
  );
}
