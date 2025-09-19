import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Icon from "./Icon";

export default function Toast({
  id,
  type = "info",
  message,
  subText,
  duration = 1600,
  onClose,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // 처음 등장 (자연스럽게 나타남)
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // duration 지나면 hide
    if (duration !== Infinity && duration > 0) {
      const t = setTimeout(() => handleHide(), duration);
      return () => clearTimeout(t);
    }
  }, []);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 10,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onClose?.(id);
      }
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {type !== "default" && (
        <Icon
          name={type === "success" ? "success" : "warn"}
          size={22}
          style={{ marginRight: 10 }}
        />
      )}
      <View style={styles.textRow}>
        <Text className="text-white text-body-2 font-pretendardMedium">
          {message}
        </Text>
        {subText ? (
          <Text className="text-yellow900 text-body-2 font-pretendardMedium">
            {subText}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: "#2E2E2E",
    marginBottom: 8,
  },
  textRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});