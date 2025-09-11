import React, { memo, useMemo, useState } from "react";
import { Image, Platform, Pressable, Text, View } from "react-native";
import { hs } from "../../utils/scale";
import Icon from "../shared/Icon";

const MAP_PLACEHOLDER = require("../../assets/images/map_placeholder.png");

function PlaceCard({
  imageSource,
  title,
  rating,
  categories = [],
  address,
  tags = [],
  highlightedTags = [],
  liked = false,
  onToggleLike = () => {},
  onPressTitle = () => {},
}) {
  const [imageError, setImageError] = useState(false);
  const normalize = (v) => String(v).replace(/^#/, "").trim().toLowerCase();
  const highlightSet = useMemo(
    () => new Set((highlightedTags || []).map(String)), 
    [highlightedTags]
  );

  return (
    <View
      className="bg-[#FFFFFF] rounded-[10px]"
      style={[
        {
          width: 317,
          height: 479,
          borderWidth: 1,
          borderColor: "#62974F",
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
      {/* 이미지 영역 */}
      <View
        className="overflow-hidden"
        style={{
          marginTop: 0,
          marginBottom: 17,
          marginHorizontal: 0,
          height: 277,
          backgroundColor: "#E2E2E2", // 로딩/에러 시 회색 배경
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {imageError || !imageSource ? (
          // 이미지 실패/없음 -> 회색 박스만
          <Image
            source={MAP_PLACEHOLDER}
            resizeMode="contain"
            style={{ width: "70%", height: "70%", opacity: 0.9 }}
          />
        ) : (
          <Image
            source={imageSource}
            resizeMode="cover"
            className="w-full h-full"
            onError={() => setImageError(true)}
          />
        )}
      </View>

      {/* 본문 */}
      <View className="flex-1" style={{ paddingHorizontal: 15 }}>
        {/* 제목 + 평점 + 좋아요 */}
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onPressTitle} hitSlop={8} className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-heading-1 font-pretendardSemiBold text-[#244DD3]">
                {title}
              </Text>

              {rating != null && (
                <View className="flex-row items-center" style={{ marginLeft: hs(6) }}>
                  <Icon name="star" width={16} height={16} />
                  <Text className="text-yellow900 text-body-2 font-pretendardMedium ml-[1px]">
                    {String(rating)}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          <Pressable onPress={onToggleLike} hitSlop={8} className="ml-2">
            <Icon name={liked ? "heart" : "heart_outline"} width={24} height={24} />
          </Pressable>
        </View>

        {/* 카테고리 */}
        {categories.length > 0 && (
          <Text className="mt-[7px] text-gray700 text-body-2 font-pretendardMedium">
            {categories.join(", ")}
          </Text>
        )}

        {/* 주소 */}
        {address && (
          <View className="flex-row items-center mt-1">
            <Icon name="location_outline" width={24} height={24} />
            <Text
              className="text-gray700 text-body-2 font-pretendardMedium ml-[-3px]"
              style={{
                flexShrink: 1,      // 길면 줄어들도록
                numberOfLines: 1,   // 한 줄로 제한
                ellipsizeMode: "tail", // ... 처리
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {address}
            </Text>
          </View>
        )}

        {/* 영업시간 */}
        
        {/* 태그 */}
        {tags.length > 0 && (
          <View
            style={{
              position: "absolute",
              bottom: 16,
              left: 15,
              right: 15,
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
            
            {tags.map((t, i) => {
              const label = String(t);
              const isHL = highlightSet.has(normalize(label));
              return (
                <Text
                  key={`${label}-${i}`}
                  className="text-body-2 font-pretendardMedium"
                  style={{
                    color: isHL ? "#62974F" : "#6B6B6B", // 하이라이트: 그린톤, 기본: 회색톤
                    marginRight: 5,
                  }}
                >
                  #{label}
                </Text>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

export default memo(PlaceCard);