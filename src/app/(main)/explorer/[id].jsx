import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import Button from "../../../components/shared/Button";
import Icon from "../../../components/shared/Icon";

// 데모 데이터
const MOCK_DETAIL = {
  id: "oth-1",
  author: "여우별",
  title: "카페 투어",
  date: "2025.08.09",
  tags: ["어두운", "조용한", "어두운"],
  places: [
    {
      id: "p1",
      name: "경희대 국제캠퍼스",
      address: "경기도 기흥구 덕영대로 1732",
      rating: 4,
    },
    {
      id: "p2",
      name: "경희대 국제캠퍼스",
      address: "경기도 기흥구 덕영대로 1732",
      rating: 3.5,
    },
  ],
  body: "카페 투어를 다녀왔어요. 분위기가 너무 좋고, 커피도 맛있었답니다.\n다음에도 꼭 다시 가고 싶어요!\n특히, 조용한 분위기에서 책 읽기 좋아하는 분들께 추천드려요. 또한, 다양한 디저트 메뉴도 있어서 친구들과 함께 가기에도 좋답니다. \n이번 주말에 또 방문할 계획이에요! 여러분도 꼭 한번 가보세요! 정말 후회하지 않을 거예요.",
  reactions: { fun: 3, happy: 28, surprise: 5, sad: 0 },
  comments: [
    {
      id: "c1",
      author: "집가고 싶은 나",
      text: "I was a ghost, I was alone, hah 어두워진, hah, 알걸속에 (Ah) Given the throne, I didn't know how to believe I was the queen that I'm meant to be I lived two lives",
    },
    { id: "c2", author: "집가고 싶은 나", text: "한줄 평 남김…" },
  ],
};

function StarRow({ value }) {
  // value: 0~5, .5 허용
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const diff = value - i;
    const type = diff >= 1 ? "full" : diff >= 0.5 ? "half" : "empty";
    return (
      <Icon
        key={i}
        name="star"
        width={15}
        height={15}
        color={type === "empty" ? "#E0A4A4" : "#EE7A13"}
        // 필요하면 half 아이콘 따로 쓰기; 지금은 색만 바꿔 간단히
        style={{ marginLeft: i === 0 ? 0 : 3 }}
      />
    );
  });
  return <View style={{ flexDirection: "row" }}>{stars}</View>;
}

export default function ExplorerPostDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // 필요 시 id로 fetch
  const data = MOCK_DETAIL; // TODO: id로 실제 데이터 로딩

  const [quickText, setQuickText] = useState("");
  const [focused, setFocused] = useState(false);
  const dateStr = useMemo(() => data?.date ?? "", [data]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 상단바: 뒤로가기 / 작성자 / 옵션 */}
      <View
        style={{
          height: 42,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 25,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ padding: 4 }}
        >
          <Icon name="previous" width={22} height={22} />
        </Pressable>
        <Text
          numberOfLines={1}
          className="text-heading-3 font-pretendardSemiBold"
          style={{ marginLeft: 10, flex: 1 }}
        >
          {data.author}
        </Text>
        <Pressable onPress={() => {}} hitSlop={8} style={{ padding: 4 }}>
          <Icon name="options" width={20} height={20} />
        </Pressable>
      </View>

      <View
        style={{
          height: 10,
          backgroundColor: "#F4F4F4",
          marginTop: 12,
          marginHorizontal: -20,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1,
            height: 4,
          }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 제목 */}
          <View
            style={{
              paddingHorizontal: 25,
              paddingVertical: 20,
              backgroundColor: "#fff",
              borderBottomWidth: 1,
              borderBottomColor: "#D4D4D4",
            }}
          >
            <Text className="text-body-1 font-pretendardMedium">
              {data.title}
            </Text>
          </View>

          {/* 날짜 + 태그 */}
          <View
            style={{
              paddingHorizontal: 25,
              paddingVertical: 20,
              marginBottom: 12.5,
              borderBottomWidth: 1,
              borderBottomColor: "#D4D4D4",
              backgroundColor: "#fff",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Icon name="time" width={24} height={24} />
              <Text
                className="text-body-1 font-pretendardMedium text-gray700"
                style={{ marginLeft: 7 }}
              >
                {dateStr}
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}
            >
              {data.tags.map((t, i) => (
                <View
                  key={`${t}-${i}`}
                  style={{
                    paddingHorizontal: 11,
                    height: 25,
                    borderRadius: 12,
                    backgroundColor: "#FFF",
                    borderWidth: 1,
                    borderColor: "#D4D4D4",
                    justifyContent: "center",
                    marginRight: 5,
                  }}
                >
                  <Text className="text-heading-3 font-pretendardSemiBold text-gray700">
                    {t}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 방문 장소 리스트 */}
          <View
            style={{
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#D4D4D4",
              paddingBottom: 16,
            }}
          >
            {data.places.map((p, idx) => (
              <View
                key={p.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 7.5,
                }}
              >
                <Icon name="location" width={20} height={20} color="#93B56C" />
                <View style={{ flex: 1, marginLeft: 5 }}>
                  <Text
                    className="text-body-1 font-pretendardMedium"
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                  <Text
                    className="text-gray700 text-body-3 font-pretendardRegular"
                    numberOfLines={1}
                  >
                    {p.address}
                  </Text>
                </View>
                <StarRow value={p.rating} />
              </View>
            ))}
          </View>

          {/* 본문 */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <Text
              className="text-body-1 font-pretendardRegular"
              style={{ lineHeight: 22 }}
            >
              {data.body}
            </Text>
          </View>

          <View
            style={{
              height: 10,
              backgroundColor: "#F4F4F4",
              marginTop: 12,
              marginHorizontal: -20,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 1,
                height: 4,
              }}
            />
          </View>

          {/* 반응 바(상단 고정 라인) */}
          <View
            style={{
              paddingTop: 10,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#D4D4D4",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                paddingHorizontal: 10,
              }}
            >
              {[
                { key: "fun", label: "재밌어요", icon: "funny" },
                { key: "happy", label: "기뻐요", icon: "happy" },
                { key: "surprise", label: "놀라워요", icon: "surprise" },
                { key: "sad", label: "슬퍼요", icon: "sad" },
              ].map((r) => (
                <View key={r.key} style={{ alignItems: "center" }}>
                  <Icon name={r.icon} width={24} height={24} />
                  <Text
                    className="text-body-3 font-pretendardMedium"
                    style={{ marginTop: 4 }}
                  >
                    {r.label}
                  </Text>
                </View>
              ))}
            </View>

            <Text
              className="text-gray700 text-body-3 font-pretendardRegular"
              style={{ textAlign: "right", marginTop: 13, paddingRight: 25 }}
            >
              {data.reactions.happy}명이 반응했어요
            </Text>
          </View>

          {/* 한줄 입력 */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <Text
              className="text-body-1 font-pretendardMedium"
              style={{ marginBottom: 8 }}
            >
              한줄 입력
            </Text>

            <View
              style={{
                padding: 12,
                borderRadius: 5,
                backgroundColor: "#F4F4F4",
              }}
            >
              <TextInput
                value={quickText}
                onChangeText={setQuickText}
                placeholder="한줄로 남겨보세요"
                placeholderTextColor="#6B6B6B"
                multiline
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                  minHeight: 44,
                  fontFamily: "Pretendard-Regular",
                  fontSize: 14,
                  lineHeight: 20,
                }}
              />
              <View style={{ alignItems: "flex-end", marginTop: 8 }}>
                <Button
                  title="입력하기"
                  variant={quickText.trim() ? "primary" : "disabled"}
                  size="small"
                  onPress={() => {
                    if (!quickText.trim()) return;
                    // TODO: 등록 처리
                    setQuickText("");
                  }}
                />
              </View>
            </View>
          </View>

          {/* 댓글 목록 */}
          <View
            style={{ paddingHorizontal: 16, paddingTop: 14}}
          >
            {data.comments.map((c) => (
              <View key={c.id} style={{ marginBottom: 32 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 35,
                      height: 35,
                      borderRadius: 17,
                      backgroundColor: "#D9D9D9",
                      marginRight: 7,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="user" width={18} height={18} />
                  </View>
                  <Text className="text-body-2 font-pretendardMedium text-gray700">
                    {c.author}
                  </Text>
                </View>
                <Text
                  className="text-body-2 font-pretendardMedium text-gray700"
                >
                  {c.text}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
