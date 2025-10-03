import { Images } from "@assets/images";
import { hs } from "@utils/scale";
import React, { memo, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Icon from "../shared/Icon";

const MAP_PLACEHOLDER = Images.placeholder.map;

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
  // 영업 상태/시간
  openNow = null, // true | false | null(모름)
  hoursText = "아직 정보가 없어요.",
}) {
  const [imageError, setImageError] = useState(false);
  const normalize = (v) => String(v).replace(/^#/, "").trim().toLowerCase();
  const highlightSet = useMemo(
    () => new Set((highlightedTags || []).map((x) => normalize(x))),
    [highlightedTags]
  );

  // "~" 포맷이 들어와도 안전하게 "-"로 통일
  const displayHours = useMemo(
    () => String(hoursText || "아직 정보가 없어요.").replace(/\s*~\s*/g, " - "),
    [hoursText]
  );

  return (
    <View
      className="bg-[#FFFFFF] rounded-[10px]"
      style={{
        width: 317,
        height: 479,
        borderWidth: 1,
        borderColor: "#D4D4D4",
      }}
    >
      {/* 이미지 영역 */}
      <View
        className="overflow-hidden"
        style={{
          marginTop: 0,
          marginBottom: 17,
          marginHorizontal: 0,
          height: 277,
          backgroundColor: "#E2E2E2",
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {imageError || !imageSource ? (
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
              <Text
                className="text-heading-1 font-pretendardSemiBold text-[#244DD3]"
                numberOfLines={1}
              >
                {title}
              </Text>

              {rating != null && (
                <View
                  className="flex-row items-center"
                  style={{ marginLeft: hs(6) }}
                >
                  <Icon name="star" width={16} height={16} />
                  <Text className="text-yellow900 text-body-2 font-pretendardMedium ml-[1px]">
                    {String(rating)}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          <Pressable onPress={onToggleLike} hitSlop={8} className="ml-2">
            <Icon
              name={liked ? "heart" : "heart_outline"}
              width={24}
              height={24}
            />
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
          <View className="flex-row items-center mt-1 ml-[-6px]">
            <Icon name="location_outline" width={24} height={24} />
            <Text
              className="text-gray700 text-body-2 font-pretendardMedium ml-[3px]"
              style={{ flexShrink: 1 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {address}
            </Text>
          </View>
        )}

        {/* 오늘 영업시간 한 줄 요약 + 상태 */}
        <View className="flex-row items-center mt-1 ml-[-6px]">
          <Icon name="time" width={24} height={24} />
          <Text
            className="mt-[2px] text-gray700 text-body-2 font-pretendardMedium ml-[3px]"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ flexShrink: 1 }}
          >
            {displayHours}
            {openNow !== null && (
              <Text
                style={{
                  color: openNow ? "#62974F" : "#DC2626",
                  fontWeight: "600",
                }}
              >
                {"  •  "}
                {openNow ? "영업 중" : "영업 종료"}
              </Text>
            )}
          </Text>
        </View>

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
                    color: isHL ? "#EE7A13" : "#6B6B6B",
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
