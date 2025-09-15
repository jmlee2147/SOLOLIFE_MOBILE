import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import Icon from "../shared/Icon";

// ANDROID에서 LayoutAnimation 활성화
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 현재 value를 맨 앞으로 보고, 나머지 옵션을 순환해 뒤에 나열
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
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  // 헤더(라벨) 실제 치수
  const [headerW, setHeaderW] = useState(0);
  const [headerH, setHeaderH] = useState(0);
  const measured = headerH > 0;      // 헤더가 한 번이라도 측정되었는지
  const HEADER_MIN_H = 30;

  // 화살표 회전만 Animated로 (부드럽게)
  const arrow = useRef(new Animated.Value(0)).current; // 0:닫힘, 1:열림

  const currentLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? options[0]?.label ?? "",
    [value, options]
  );
  const rest = useMemo(() => rotateFrom(options, value), [options, value]);

  // 열고 닫을 때: 레이아웃 애니메이션 + 화살표 회전
  const toggle = () => {
    if (disabled) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((p) => !p);
  };

  useEffect(() => {
    Animated.timing(arrow, {
      toValue: open ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true, // 회전 애니메이션만 -> OK
    }).start();
  }, [open, arrow]);

  const arrowRotate = arrow.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // 1) 최초 렌더: 헤더 측정용 간단한 Pill (닫힘 형태)
  if (!measured) {
    return (
      <View style={[styles.anchor, style]}>
        <Pressable
          style={[styles.headerPill, { minHeight: HEADER_MIN_H, opacity: disabled ? 0.5 : 1 }]}
          onLayout={(e) => {
            setHeaderW(e.nativeEvent.layout.width);
            setHeaderH(e.nativeEvent.layout.height);
          }}
          onPress={toggle}
          disabled={disabled}
        >
          <Text style={styles.headerText}>{currentLabel}</Text>
          <Icon name="down_arrow" width={14} height={14} style={{ marginLeft: 6 }} />
        </Pressable>
      </View>
    );
  }

  // 2) 측정 이후: 카드(절대 배치) + 헤더 자리 유지 스페이서
  return (
    <View style={[styles.anchor, style, { width: headerW }]}>
      {/* 레이아웃 유지용 스페이서: 헤더 높이만 차지 */}
      <View style={{ height: Math.max(headerH, HEADER_MIN_H), minWidth: headerW }} />

      {/* 절대배치 카드 (폭 = 헤더 폭 = 라벨 길이 기반) */}
      <View style={[styles.cardContainer, { width: headerW }]}>
        <View style={[styles.cardSurface, { minHeight: Math.max(headerH, HEADER_MIN_H) }]}>
          {/* 헤더 */}
          <Pressable
            style={[styles.cardHeader, { opacity: disabled ? 0.5 : 1 }]}
            onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
            onPress={toggle}
            disabled={disabled}
            android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
          >
            <Text style={styles.headerText} numberOfLines={1}>{currentLabel}</Text>
            <Animated.View style={{ marginLeft: 6, transform: [{ rotate: arrowRotate }] }}>
              <Icon name="down_arrow" width={14} height={14} />
            </Animated.View>
          </Pressable>

          {/* 옵션 리스트: LayoutAnimation으로 자연스럽게 나타났다 사라짐 */}
          {open && (
            <View style={styles.options}>
              {rest.map((o) => (
                <Pressable
                  key={o.value}
                  style={styles.optionItem}
                  onPress={() => {
                    onChange?.(o.value);
                    // 선택 후 닫기
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText} numberOfLines={1}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "relative",
    alignSelf: "flex-start", // 부모 row 안에서 내용 폭만큼만 차지
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
    fontWeight: "500",
  },

  options: {
    paddingHorizontal: 15,
    paddingTop: 3,
    paddingBottom: 6,
  },
  optionItem: {
    paddingVertical: 6,
  },
  optionText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "500",
    color: "#AFAFAF",
  },
});