import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

const guidelineWidth = 393;
const guidelineHeight = 852;

const runOnIOS = Platform.OS === 'ios';

export const widthScale = (size) => {
  return Math.floor((width / guidelineWidth) * 100) / 100 * size * (runOnIOS ? 1 : 1);
};

export const verticalScale = (size) => {
  return Math.floor((height / guidelineHeight) * 100) / 100 * size;
};

export const moderateScale = (size, factor = 0.5) => {
  return size + (widthScale(size) - size) * factor;
};