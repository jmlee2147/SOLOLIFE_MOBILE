import React from 'react';
import { View } from 'react-native';
import '../../global.css';
import Icon from '../shared/ui/Icon';

export default function App() {
  return (
    <View className="items-center justify-center flex-1 bg-yellowTertiary">
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 20 }}>
      <Icon name="home" width={30} height={30} />
      <Icon name="map" width={30} height={30} />
      <Icon name="journey" width={30} height={30} />
      <Icon name="heart" width={30} height={30} />
      <Icon name="profile" width={30} height={30} />
      <Icon name="gallery" width={30} height={30} />
    </View>
    </View>
  );
}