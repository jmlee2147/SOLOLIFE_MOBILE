import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "./Icon";

const Header = ({
  title,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  backgroundColor = "#FFFFFF", // 기본 배경
  titleColor = "#000000",      // 타이틀 색상
  iconColor = "#000000",       // 아이콘 색상
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* 좌측 아이콘 */}
      {leftIcon ? (
        <TouchableOpacity
          onPress={onLeftPress}
          style={styles.iconWrapper}
          activeOpacity={1}
        >
          <Icon name={leftIcon} width={24} height={24} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      {/* 가운데 타이틀 */}
      <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
        {title}
      </Text>

      {/* 우측 아이콘 */}
      {rightIcon ? (
        <TouchableOpacity
          onPress={onRightPress}
          style={styles.iconWrapper}
          activeOpacity={1}
        >
          <Icon name={rightIcon} width={24} height={24} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    alignItems: "center",
  },
  iconPlaceholder: {
    width: 40,
  },
});

export default Header;