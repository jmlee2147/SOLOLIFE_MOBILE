import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../shared/Icon";

export default function LogBoardCard({
  isMine = false,              // 🔥 추가: 내 탭 여부
  profileImage,
  authorName,
  dateText,
  title,
  thumbnail,
  placeText,
  excerpt,
  bookmarked = false,
  commentsCount = 0,
  reactionsCount = 0,
  onPress,
  onToggleBookmark,
  onPressComment,
  onPressReaction,
  style,
  placeholderImage,
  placeholderBg = "#D9D9D9",
}) {
  return (
    <Pressable style={[styles.card, style]} onPress={onPress}>
      {/* 상단 프로필 영역 (내 탭이면 숨김) */}
      {!isMine && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrapper}>
              <Image source={profileImage} style={styles.profileImage} resizeMode="cover" />
            </View>
            <Text className="text-black text-body-2 font-pretendardMedium" numberOfLines={1}>
              {authorName}
            </Text>
            <Text className="text-black text-body-2 font-pretendardMedium"> | {dateText}</Text>
          </View>
          <Pressable onPress={onToggleBookmark} hitSlop={8}>
            <Icon name="bookmark" width={24} height={24} strokeColor="#AFAFAF" />
          </Pressable>
        </View>
      )}

      {/* 제목 */}
      <Text className="mb-3 text-black text-heading-1 font-pretendardSemiBold" numberOfLines={1}>
        {title}
      </Text>

      {/* 대표 이미지 */}
      <View style={styles.thumbnail}>
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
              <Image source={placeholderImage} style={{ width: 344, height: 218 }} resizeMode="contain" />
            )}
          </View>
        )}
      </View>

      {/* 장소 */}
      {!!placeText && (
        <View style={styles.placeRow}>
          <Icon name="location" width={16} height={16} />
          <Text className="ml-1 text-black text-body-1 font-pretendardMedium" numberOfLines={1}>
            {placeText}
          </Text>
        </View>
      )}

      {/* 내용 요약 (3줄 고정) */}
      {!!excerpt && (
        <Text className="mb-3 text-gray700 text-body-3" numberOfLines={3}>
          {excerpt}
        </Text>
      )}

      {/* 하단 반응 영역 */}
      <View style={styles.footer}>
        <Pressable style={styles.action} onPress={onPressComment}>
          <Icon name="comment_fill" width={16} height={16} />
          <Text className="ml-1 text-body-2 text-gray200">{commentsCount}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={onPressReaction}>
          <Icon name="smile" width={16} height={16} />
          <Text className="ml-1 text-body-2 text-gray200">{reactionsCount}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    // backgroundColor: "#fff000",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    //backgroundColor: "#cfffff", // 민트 구역
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 7,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    //backgroundColor: "#ee1414", // 빨간색 구역
  },
  avatarWrapper: {
    width: 28, // 원하는 사이즈
    height: 28,
    borderRadius: 14, // width/2
    overflow: "hidden", // 동그라미 바깥은 안 보이게
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#ffffff",
    backgroundColor: "#eee", // 기본 배경 (없을 때)
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  thumbnail: { width: "100%", height: 218 },
  thumb: { width: "100%", height: "100%" },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#d6d6d6",
    marginTop: 12,
    marginBottom: 11,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#989898",
    gap: 10,
    marginLeft: "auto",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#e7e7e7",
    marginBottom: 9,
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 11,
  },
});
