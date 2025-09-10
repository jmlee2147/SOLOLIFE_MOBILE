// src/app/(main)/place-recommend/save.jsx
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import Button from "../../../components/shared/Button";
import Header from "../../../components/shared/Header";
import { MOODS } from "../../../config/category.config";

export default function RouteSaveScreen() {
  const router = useRouter();

  const [routeName, setRouteName] = useState("");
  const [inputTag, setInputTag] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const suggestions = useMemo(() => MOODS ?? [], []);

  const toggleTag = (t) => {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const addTag = () => {
    const v = inputTag.trim();
    if (!v) return;
    if (!selectedTags.includes(v)) {
      setSelectedTags((p) => [...p, v]);
    }
    setInputTag("");
    Keyboard.dismiss();
  };

  const canSave = routeName.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header
        title="루트 저장하기"
        leftIcon="previous"
        onLeftPress={() => router.back()}
        rightIcon="home_header"
        onRightPress={() => router.push("/home")}
      />

      <View>
        {/* 루트 이름 */}
        <View style={styles.section}>
          <Text className="text-heading-1 font-pretendardSemiBold">루트 이름을 작성해주세요.</Text>

          <TextInput
            value={routeName}
            onChangeText={setRouteName}
            placeholder="무명의 루트"
            placeholderTextColor="#AFAFAF"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>

        {/* 태그 선택 */}
        <View style={styles.section}>
          <Text className="text-heading-1 font-pretendardSemiBold">루트 태그 선택</Text>

          {/* 직접 입력 */}
          <TextInput
            value={inputTag}
            onChangeText={setInputTag}
            placeholder="태그 입력"
            placeholderTextColor="#BDBDBD"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={addTag}
          />

          {/* 선택된 태그 (있으면 위에 먼저 보여주기) */}
          {selectedTags.length > 0 && (
            <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap" }}>
              {selectedTags.map((t) => (
                <Pressable
                  key={`sel-${t}`}
                  onPress={() => toggleTag(t)}
                  style={[styles.pill, styles.pillActive]}
                  android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
                >
                  <Text style={[styles.pillText, { color: "#fff" }]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* 하단 고정 버튼 */}
      <View style={styles.bottomBar}>
        <Button
          title="루트 저장하기"
          size="large"
          variant={canSave ? "primary" : "disabled"}
          onPress={() => {
            if (!canSave) return;
            // TODO: 저장 로직 연동 시 여기서 API 호출
            router.push("/home");
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 25,
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  input: {
    marginTop: 12,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#F4F4F4",
    marginBottom: 64,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 10,
    marginBottom: 10,
  },
  pillDefault: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pillActive: {
    backgroundColor: "#62974F",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
});