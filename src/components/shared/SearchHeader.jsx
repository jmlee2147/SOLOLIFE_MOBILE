import React from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import Icon from "./Icon";

export default function SearchHeader({ query, setQuery, onSubmit, onBack }) {
  return (
    <View style={styles.container}>
      {/* 좌측 뒤로가기 */}
      <Pressable onPress={onBack} hitSlop={10} style={styles.iconWrapper}>
        <Icon name="previous" width={22} height={22} />
      </Pressable>

      {/* 검색창 */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="위치 검색하기"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => {
            Keyboard.dismiss();
            onSubmit?.();
          }}
          autoFocus
          placeholderTextColor="#AFAFAF"
        />
        {query?.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={10}>
            <Icon name="close" width={18} height={18} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    height: 42,
    backgroundColor: "#fff",
  },
  iconWrapper: { paddingRight: 16 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    height: 42,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 16,
    paddingVertical: 0,
    color: "#000",
    textAlignVertical: "center",  
    includeFontPadding: false, 
  }
});