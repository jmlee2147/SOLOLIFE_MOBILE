import React from 'react';
import { Text, View } from 'react-native';
import '../../global.css';

export default function App() {
  return (
    <View className="items-center justify-center flex-1 bg-yellowTertiary">
      <Text className="text-black font-pretendardExtraBold text-title-1">
        Title1
      </Text>
      <Text className="text-grayDark font-pretendardExtraBold text-title-2">
        Title2
      </Text>
      <Text className="text-grayLight font-pretendardSemiBold text-title-3">
        Title3
      </Text>
      <Text className="text-greenPrimary font-pretendardSemiBold text-heading-1">
        H1
      </Text>
      <Text className="text-greenSecondary font-pretendardSemiBold text-heading-2">
        H2
      </Text>
      <Text className="text-greenTertiary font-pretendardMedium text-heading-3">
        H3
      </Text>
      <Text className="text-yellowPrimary font-pretendardMedium text-button-1">
        Button1
      </Text>
      <Text className="text-yellowSecondary font-pretendardMedium text-button-2">
        Button2
      </Text>
    </View>
  );
}