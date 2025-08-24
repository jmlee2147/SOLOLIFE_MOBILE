// components/shared/Button.jsx
import { tw } from "nativewind";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const Button = ({
  title,
  onPress,
  variant = "primary", // primary | secondary | disabled
  size = "medium",     // small | medium | large
  icon: Icon,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "primary":
        return "bg-greenPrimary text-white";
      case "secondary":
        return "bg-greenSecondarytext-black";
      case "disabled":
        return "bg-gray100 text-gray-500";
      default:
        return "bg-green-600 text-white";
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return "px-3 py-2 text-sm";
      case "medium":
        return "px-4 py-3 text-base";
      case "large":
        return "px-5 py-4 text-lg";
      default:
        return "px-4 py-3 text-base";
    }
  };

  const [bgClass, textClass] = getVariantStyle().split(" ");

  return (
    <TouchableOpacity
      onPress={variant === "disabled" ? null : onPress}
      style={tw`${bgClass} ${getSizeStyle()} rounded-lg flex-row items-center justify-center`}
      activeOpacity={0.7}
    >
      {Icon && <View style={tw`mr-2`}><Icon /></View>}
      <Text style={tw`font-semibold ${textClass}`}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;