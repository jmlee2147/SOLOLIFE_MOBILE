// src/shared/ui/ButtonDemo.jsx
import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import scale from '../../utils/scale';
import Button from './Button';

const { hs, vs, fs, rp } = scale;

const variants = ['primary', 'secondary', 'disabled'];
const sizes = ['large', 'medium', 'small'];

export default function ButtonDemo() {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: hs(20), paddingVertical: vs(20) }}>
      <Text style={{ fontSize: fs(24), marginBottom: vs(12), fontFamily: 'Pretendard-SemiBold' }}>
        Button Demo
      </Text>

      {variants.map((variant) => (
        <View key={variant} style={{ marginBottom: vs(20) }}>
          <Text style={{ fontSize: fs(16), marginBottom: vs(8) }}>{variant.toUpperCase()}</Text>
          <View>
            {sizes.map((size) => (
              <View key={`${variant}-${size}`} style={{ marginBottom: vs(10) }}>
                <Button
                  title="다시 추천받기"
                  variant={variant}
                  size={size}
                  onPress={() => Alert.alert('Pressed', `${variant} • ${size}`)}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={{ height: vs(20) }} />
    </ScrollView>
  );
}