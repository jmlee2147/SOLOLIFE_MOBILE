import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Icon from "./Icon";

export default function Toast({ type = "info", message, subText }) {
  return (
    <View style={styles.container}>
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
    </View>
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
    marginBottom: -34,
  },
  text: { color: "#fff", fontSize: 14 },
  subText: { color: "#F97316", fontSize: 12, marginTop: 2 },
  textRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
