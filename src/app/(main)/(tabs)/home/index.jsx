// src/app/(main)/(tabs)/home/index.jsx
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppDialog from "../../../../components/shared/AppDialog";
import Header from "../../../../components/shared/Header";

const HERO_BG = require("../../../../assets/images/background.png");
const MASCOT  = require("../../../../assets/images/explorer.png");
const SAMPLE1 = require("../../../../assets/images/sample.png");
const SAMPLE2 = require("../../../../assets/images/shopping.png");

const { width: SCREEN_W } = Dimensions.get("window");
const HEADER_HEIGHT = 44; // 헤더 컨텐츠 높이(아이콘/타이틀 라인)

export default function HomeScreen() {
  const [showDialog, setShowDialog] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#FFC95C" }}>
      {/* 투명 오버레이 헤더 */}
      <Header
        title="홈"
        leftIcon="notification"
        onLeftPress={() => {}}
        rightIcon="menu"
        onRightPress={() => {}}
        backgroundColor="#ffffff"
        // Header가 style prop을 합쳐주도록 구현 필요
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          paddingTop: insets.top,
          height: insets.top + HEADER_HEIGHT,
          zIndex: 20,
        }}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 히어로: 배경 + 캐릭터 + 날짜/요일 → 풀블리드 */}
        <View style={styles.heroWrap}>
          <ImageBackground
            source={HERO_BG}
            resizeMode="cover"                
            style={[
              styles.heroBg,
              {
                width: SCREEN_W,             
                paddingTop: insets.top + HEADER_HEIGHT + 6, 
              },
            ]}
          >
            {/* 날짜/요일 */}
            <View style={styles.heroTextBlock}>
              <Text className="text-[18px] font-pretendardSemiBold">8/31</Text>
              <Text className="text-[28px] font-pretendardExtraBold mt-[-2px]">토요일</Text>
            </View>

            {/* 캐릭터 */}
            <Image source={MASCOT} style={styles.mascot} resizeMode="contain" />
          </ImageBackground>
        </View>

        {/* “오늘은 어디를 탐험해볼까요?” */}
        <View style={{ paddingHorizontal: 24, marginTop: 10 }}>
          <Text className="mb-4 text-heading-1 font-pretendardSemiBold">
            오늘은 어디를 탐험해볼까요?
          </Text>

          {/* 카드형 버튼 */}
          <Pressable onPress={() => router.push("/place-recommend")} style={styles.ctaCard}>
            <Text className="text-heading-2 font-pretendardSemiBold">장소 추천받기</Text>
            <Text className="text-body-3 text-gray600 mt-[2px]">
              혼자가기 좋은 장소를 추천해드려요.
            </Text>
            <View style={styles.arrowCircle}>
              <Text className="text-[16px] font-pretendardSemiBold">→</Text>
            </View>
          </Pressable>

          <Pressable onPress={() => setShowDialog(true)} style={[styles.ctaCard, { marginTop: 12 }]}>
            <Text className="text-heading-2 font-pretendardSemiBold">루트 추천받기</Text>
            <Text className="text-body-3 text-gray600 mt-[2px]">
              혼자가기 좋은 장소를 모아 루트를 만들어 드려요.
            </Text>
            <View style={styles.arrowCircle}>
              <Text className="text-[16px] font-pretendardSemiBold">→</Text>
            </View>
          </Pressable>
        </View>

        {/* 섹션: 다른 탐험가들의 선택 */}
        <View style={{ paddingHorizontal: 24, marginTop: 22 }}>
          <Text className="mb-8 text-heading-2 font-pretendardSemiBold">다른 탐험가들의 선택</Text>
          <View style={styles.imageCard}>
            <Image source={SAMPLE1} style={styles.imageFill} resizeMode="cover" />
            <Text style={styles.imageOverlayTitle}>다대포 해수욕장</Text>
          </View>
        </View>

        {/* 섹션: 오늘의 테마 추천 */}
        <View style={{ paddingHorizontal: 24, marginTop: 22 }}>
          <Text className="mb-8 text-heading-2 font-pretendardSemiBold">오늘의 테마 추천</Text>
          <View style={styles.imageCard}>
            <Image source={SAMPLE2} style={styles.imageFill} resizeMode="cover" />
            <View style={styles.imageOverlay}>
              <Text className="text-white text-heading-2 font-pretendardSemiBold">무더운 여름</Text>
              <Text className="text-white text-body-3 font-pretendardMedium mt-[2px]">
                빙수 한 그릇 어떤가요?
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 루트 추천받기 다이얼로그 */}
      <AppDialog
        visible={showDialog}
        title="장소를 추가하지 않고 넘어갈까요?"
        description="장소 추가 시 적립 기회가 있어요."
        showDontShow
        dontShowChecked={dontShow}
        onToggleDontShow={() => setDontShow((p) => !p)}
        onConfirm={() => setShowDialog(false)}
        onCancel={() => setShowDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heroBg: {
    height: 420,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  heroTextBlock: {
    position: "absolute",
    left: 24,
    top: 18,
  },
  mascot: {
    position: "absolute",
    right: 24,
    bottom: 28,
    width: 300,
    height: 300,
  },

  ctaCard: {
    position: "relative",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    marginBottom: 2,
  },
  arrowCircle: {
    position: "absolute",
    right: 14,
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F6F6F6",
    alignItems: "center",
    justifyContent: "center",
  },

  imageCard: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
  },
  imageFill: { width: "100%", height: "100%" },
  imageOverlayTitle: {
    position: "absolute",
    left: 16,
    bottom: 14,
    color: "#fff",
    fontSize: 18,
    fontFamily: "Pretendard-SemiBold",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  imageOverlay: { position: "absolute", left: 16, bottom: 14 },
});