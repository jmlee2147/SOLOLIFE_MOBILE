import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Icon from "../shared/Icon";

const rotateFrom = (options, value) => {
  const i = options.findIndex((o) => o.value === value);
  if (i < 0) return options;
  const rotated = [...options.slice(i + 1), ...options.slice(0, i)];
  return rotated.filter((o) => o.value !== value);
};

export default function SortDropdown({
  value,
  onChange,
  options = [
    { label: "추천순", value: "recommended" },
    { label: "인기순", value: "popular" },
    { label: "최신순", value: "latest" },
  ],
  style,
}) {
  const [open, setOpen] = useState(false);

  const [headerW, setHeaderW] = useState(0);
  const [headerH, setHeaderH] = useState(0);
  const [optionsHMeasured, setOptionsHMeasured] = useState(0);
  const measured = headerH > 0;
  const HEADER_MIN_H = 30;

  const progress = useRef(new Animated.Value(0)).current; // 0:닫힘, 1:열림

  const currentLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? options[0]?.label ?? "",
    [value, options]
  );
  const rest = useMemo(() => rotateFrom(options, value), [options, value]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // height 보간 필요
    }).start();
  }, [open]);

  // 옵션영역 높이(0 -> 측정값)
  const optionsH = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, optionsHMeasured || 0],
  });

  const cardH = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.max(headerH, HEADER_MIN_H), Math.max(headerH, HEADER_MIN_H) + (optionsHMeasured || 0)],
  });

  const arrowRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // 1) 최초 렌더: 헤더 측정
  if (!measured) {
    return (
      <View style={[styles.anchor, style]}>
        <Pressable
          style={[styles.headerPill, { minHeight: HEADER_MIN_H }]}
          onLayout={(e) => {
            setHeaderW(e.nativeEvent.layout.width);
            setHeaderH(e.nativeEvent.layout.height);
          }}
          onPress={() => setOpen(true)}
        >
          <Text style={styles.headerText}>{currentLabel}</Text>
          <Icon name="down_arrow" width={14} height={14} style={{ marginLeft: 6 }} />
        </Pressable>
      </View>
    );
  }

  // 2) 단일 블록(카드) 확장: 부모엔 헤더 높이만 스페이서로 남김 → 레이아웃 안 밀림
  return (
    <View style={[styles.anchor, style, { width: headerW }]}>
      {/* 레이아웃 자리: 헤더 높이만 차지 */}
      <View style={{ height: Math.max(headerH, HEADER_MIN_H), minWidth: headerW }} />

      {/* 절대배치된 '단일 카드' */}
      <Animated.View style={[styles.cardContainer, { height: cardH, width: headerW }]}>
        <View style={styles.cardSurface}>
          {/* 헤더 */}
          <Pressable
            style={styles.cardHeader}
            onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
            onPress={() => setOpen((p) => !p)}
            android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
          >
            <Text style={styles.headerText}>{currentLabel}</Text>
            <Animated.View style={{ marginLeft: 6, transform: [{ rotate: arrowRotate }] }}>
              <Icon name="down_arrow" width={14} height={14} />
            </Animated.View>
          </Pressable>

          {/* 옵션 영역: 같은 카드 안에서 '확장' */}
          <Animated.View
            style={{ height: optionsH, overflow: "hidden" }}
            pointerEvents={open ? "auto" : "none"}
          >
            {/* 실제 높이 측정을 위한 내용 래퍼 */}
            <View
              style={styles.options}
              onLayout={(e) => setOptionsHMeasured(e.nativeEvent.layout.height)}
            >
              {rest.map((o) => (
                <Pressable
                  key={o.value}
                  style={styles.optionItem}
                  onPress={() => {
                    onChange?.(o.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "relative",
    alignSelf: "flex-start",
    zIndex: 10,
  },

  cardContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 20,
    elevation: 20,
  },

  cardSurface: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#111",
  },

  /** 헤더(카드 상단 고정) */
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 6,
    minHeight: 30,
    // backgroundColor: "#FFF112",
  },

  // 초기 측정용 단독 헤더(닫힘 상태 외형 동일)
  headerPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#111",
  },

  headerText: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: 500,
  },

  options: {
    paddingHorizontal: 15,
    paddingTop: 3,
  },
  optionItem: {
    marginTop: 7,
    marginBottom: 9,
  },
  optionText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 500,
    color: "#AFAFAF",
  },
});