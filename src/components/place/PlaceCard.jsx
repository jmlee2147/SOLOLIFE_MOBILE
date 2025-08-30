import React, { memo } from "react";
import { Image, Platform, Pressable, Text, View } from "react-native";
import { fs, hs, vs } from "../../utils/scale";
import Icon from "../shared/Icon";

function PlaceCard({
  imageSource,
  title,
  rating,
  categories = [],
  address,
  tags = [],
  liked = false,
  onToggleLike = () => {},
  onPressTitle = () => {},
}) {
  return (
    <View
      className="bg-[#FDFFFA] rounded-[10px]"
      style={[
        { 
            width: hs(316),
            height: vs(470),
            borderWidth: 1,
            borderColor: "#6A8042",
        },
        Platform.select({
          ios: {
            shadowColor: "#204500",
            shadowOpacity: 0.25,
            shadowRadius: hs(4),
            shadowOffset: { width: 0, height: 0 },
          },
          android: { elevation: 4 },
        }),
      ]}
    >
      {/* 이미지 */}
      <View
        className="overflow-hidden rounded-[6px]"
        style={{
          marginTop: vs(13),
          marginBottom: vs(16),
          marginHorizontal: hs(15),
          height: vs(286),
        }}
      >
        <Image source={imageSource} resizeMode="cover" className="w-full h-full" />
      </View>

      {/* 본문 */}
      <View className="flex-1" style={{ paddingHorizontal: hs(16), paddingTop: vs(12) }}>
        {/* 제목 + 평점 + 좋아요 */}
        <View className="flex-row items-center justify-between">
            <Pressable onPress={onPressTitle} hitSlop={8} className="flex-1">
                <View className="flex-row items-center">
                <Text style={{ fontSize: fs(20), fontWeight: "600", color: "#244DD3" }}>
                    {title}
                </Text>

                {rating != null && (
                    <View className="flex-row items-center" style={{ marginLeft: hs(6) }}>
                    <Icon name="star" width={fs(16)} height={fs(16)} />
                    <Text
                        className="text-yellow900"
                        style={{ fontSize: fs(14), fontWeight: "600", marginLeft: hs(1) }}
                    >
                        {String(rating)}
                    </Text>
                    </View>
                )}
                </View>
            </Pressable>

            <Pressable onPress={onToggleLike} hitSlop={8} className="ml-2">
                <Icon name={liked ? "heart" : "heart_outline"} size={fs(24)} />
            </Pressable>
        </View>

        {/* 카테고리 */}
        {categories.length > 0 && (
          <Text className="mt-2 text-gray700" style={{ fontSize: fs(14) }}>
            {categories.join(", ")}
          </Text>
        )}

        {/* 주소 */}
        {address && (
          <Text className="mt-1 text-gray700" style={{ fontSize: fs(14) }}>
            {address}
          </Text>
        )}

        {/* 태그 */}
        {tags.length > 0 && (
          <View className="mt-7">
            <Text className="text-gray700" style={{ fontSize: fs(13), lineHeight: vs(18) }}>
              {tags.map((t) => `#${t}`).join(" ")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default memo(PlaceCard);