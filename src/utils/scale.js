import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

const guidelineWidth = 393;   // iPhone 16 기준 pt
const guidelineHeight = 852;

const runOnIOS = Platform.OS === 'ios';

// 기본 스케일러(입력: 그대로 pt/dp 단위로 가정)
export const widthScale = (size) => {
  return Math.floor((width / guidelineWidth) * 100) / 100 * size * (runOnIOS ? 1 : 1);
};

export const verticalScale = (size) => {
  return Math.floor((height / guidelineHeight) * 100) / 100 * size;
};

export const moderateScale = (size, factor = 0.5) => {
  return size + (widthScale(size) - size) * factor;
};
// 별칭(입력: 그대로 사용, px→pt 없음)
export const hs = (size) => widthScale(size);
export const vs = (size) => verticalScale(size);
export const ms = (size, factor = 0.5) => moderateScale(size, factor);

// 폰트 전용(접근성 반영 옵션)
export const fs = (size, factor = 0.5, respectFontScaling = false) => {
  const base = ms(size, factor);
  const fontScale = PixelRatio.getFontScale();
  return respectFontScaling ? base * fontScale : base;
};

// 픽셀 라운딩
export const rp = (value) => PixelRatio.roundToNearestPixel(value);

// default export도 제공
export default { widthScale, verticalScale, moderateScale, hs, vs, ms, fs, rp };