import React from 'react';
import { Dimensions, Text, TouchableOpacity } from 'react-native';
import scale from '../../utils/scale';

const { hs, vs, rp, fs } = scale;

const VARIANT_STYLES = {
  primary: { backgroundColor: '#62974F', textColor: '#FFFFFF' },
  secondary: { backgroundColor: '#DBDCC1', textColor: '#62974F' },
  disabled: { backgroundColor: '#F4F4F4', textColor: '#6B6B6B' },
};

const SIZE_STYLES = {
  large: { widthPx: 343, heightPx: 50 },
  medium: { widthPx: 228, heightPx: 55 },
  small: { widthPx: 104, heightPx: 55 },
};

// 아이폰16 기준 폰트
const BASE_FONT_SIZE = 16;

// 화면 크기 기반 스케일링
const { width: DEVICE_WIDTH } = Dimensions.get('window');
const FONT_ADJUST_FACTOR = DEVICE_WIDTH / 393; // iPhone 16 width 기준

const Button = ({
  title,
  variant = 'primary',
  size = 'medium',
  onPress,
  style,
  textStyle,
  activeOpacity = 0.8,
}) => {
  const { backgroundColor, textColor } = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;
  const { widthPx, heightPx } = SIZE_STYLES[size] ?? SIZE_STYLES.medium;
  const isDisabled = variant === 'disabled';

  // large/medium/small 모두 공통 폰트
  const adjustedFontSize = fs(BASE_FONT_SIZE, 0.5, false);

  return (
    <TouchableOpacity
      activeOpacity={isDisabled ? 1 : activeOpacity}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        {
          width: hs(widthPx),
          height: vs(heightPx),
          borderRadius: rp(10),
          backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            color: textColor,
            fontSize: adjustedFontSize,
            fontFamily: 'Pretendard-SemiBold',
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;