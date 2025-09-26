import React, { useRef } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../shared/Icon";

export default function LogListCard({
  isMine = false,
  thumbnail,
  title,
  placeText,
  dateText,
  authorName,
  visibility = "public",
  liked = false,
  bookmarked = false,
  commentsCount = 0,
  reactionsCount = 0,
  onPress,
  onPressOptions,
  onToggleLike,
  onToggleBookmark,
  style,
  placeholderImage,
  placeholderBg = "#D9D9D9",
}) {
  const optionsRef = useRef(null);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, style]}
      accessibilityRole="button"
    >
      <View style={styles.thumbWrap}>
        {thumbnail ? (
          <Image source={thumbnail} resizeMode="cover" style={styles.thumb} />
        ) : (
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: placeholderBg,
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            {placeholderImage && (
              <Image
                source={placeholderImage}
                style={{ width: 70, height: 70 }}
                resizeMode="contain"
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* 제목 + 액션 */}
        <View style={styles.titleRow}>
          <Text
            className="flex-1 text-heading-2 font-pretendardSemiBold"
            numberOfLines={1}
          >
            {title}
          </Text>

          {isMine ? (
            <Pressable
              ref={optionsRef}
              onPress={() => {
                // 아이콘의 절대좌표를 측정해서 부모로 전달
                optionsRef.current?.measureInWindow?.((x, y, w, h) => {
                  onPressOptions?.({ x, y, w, h });
                });
              }}
              hitSlop={8}
            >
              <Icon name="options" width={24} height={24} />
            </Pressable>
          ) : (
            <Pressable onPress={onToggleBookmark} hitSlop={8}>
              <Icon
                name="bookmark"
                width={24}
                height={24}
                strokeColor="#AFAFAF"
              />
            </Pressable>
          )}
        </View>

        {/* 위치 */}
        <View style={styles.placeRow}>
          <Icon name="location" width={16} height={16} />
          <Text
            className="ml-1 text-body-2 text-gray700 font-pretendardMedium"
            numberOfLines={1}
          >
            {(placeText ?? "").trim() || "알 수 없는 탐험지"}
          </Text>
        </View>

        {/* 하단 행 */}
        <View style={styles.footer}>
          {isMine ? (
            <Text
              className="text-body-3 font-pretendardRegular text-gray700"
              numberOfLines={1}
            >
              {visibility === "public" ? "공개" : "비공개"} | {dateText}
            </Text>
          ) : (
            <Text
              className="text-body-3 font-pretendardRegular text-gray700"
              numberOfLines={1}
            >
              {authorName} | {dateText}
            </Text>
          )}

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.actionItem}>
              <Icon name="comment_fill" width={16} height={16} />
              <Text className="ml-1 text-body-2 text-gray500 font-pretendardMedium">
                {commentsCount}
              </Text>
            </View>
            <View style={styles.actionItem}>
              <Icon name="smile" width={16} height={16} />
              <Text className="ml-1 text-body-2 text-gray500 font-pretendardMedium">
                {reactionsCount}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const TH = 98;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 108,
  },
  thumbWrap: {
    width: TH,
    marginRight: 11,
    position: "relative",
    alignSelf: "stretch",
  },
  thumb: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  content: { flex: 1 },
  placeRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  titleRow: { flexDirection: "row", alignItems: "center" },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionItem: { flexDirection: "row", alignItems: "center", marginLeft: 10 },
});
