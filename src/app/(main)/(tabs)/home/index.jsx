import { Images } from "@assets/images";
import { useToast } from "@providers/ToastProvider";
import { consumePendingToast, peekPendingToast } from "@utils/toastNext";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppDialog from "@components/shared/AppDialog";
import Icon from "@components/shared/Icon";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const HEADER_HEIGHT = 44;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [showDialog, setShowDialog] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  const { showToast } = useToast();
  const pathname = usePathname(); // 현재 라우트 경로

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        const pending = await peekPendingToast();
        if (!pending) return;
        if (!pending.targetRoute || pending.targetRoute === pathname) {
          const toast = await consumePendingToast();
          if (mounted && toast) showToast(toast);
        }
      })();
      return () => { mounted = false; };
    }, [pathname, showToast])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#B9E09D" }}>
      {/* 전체 스크롤 */}
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <ScrollView
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
      >
        <View style={{ height: insets.top }} />
        {/* HERO */}
        <LinearGradient
          colors={["#B9E09D", "#419833"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.hero,
            { 
              paddingTop: insets.top + HEADER_HEIGHT + 12,
              width: SCREEN_W,
              minHeight: 320 + insets.top,},
          ]}
        >
          {/* 말풍선 */}
          <View style={styles.speech}>
            <Text className="text-heading-3 font-pretendardSemiBold">포슬감자님 오늘 기분은 어떠세요?</Text>
            <View style={styles.speechTail} />
          </View>

          {/* 마스코트 */}
          <Image source={Images.backgrounds.main} style={styles.mascot} resizeMode="contain" />

          {/* 프로필 + 진행도 + 오른쪽 알약 버튼들 */}
          <View style={styles.heroBottomRow}>
            <View style={{ flex: 1, paddingRight: 75 }}>
              <Text className="text-white text-title-2 font-pretendardExtraBold">포슬감자</Text>
              <Text className="text-white text-heading-3 font-pretendardSemiBold">LV 3 용감한 탐험가</Text>
              <View style={styles.progressWrap}>
                <View style={[styles.progressFill, { width: "60%" }]} />
              </View>
            </View>

            <View style={styles.pillsCol}>
              <Pill label="미션" 
                    icon={Images.common.mission}
                    onPress={() => router.push("/(fullscreen)/mission")}/>
              <Pill label="저장소"
                    icon={Images.common.bookmark}
                    onPress={() => router.push("/storage")}
              />
              <Pill label="출석체크" icon={Images.common.check}/>
            </View>
          </View>

          {/* 시트와의 겹침 여백 */}
          <View style={{ height: 16 }} />
        </LinearGradient>

        {/* 흰 시트 */}
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {/* CTA 카드 */}
          <Pressable
            onPress={() => router.push("/place-recommend")}
            style={[styles.ctaCard, styles.ctaFilled]}
          >
            <Image source={Images.common.ctaPlace} style={styles.ctaThumb} />
            <View style={{ flex: 1 }}>
              <Text className="text-white text-heading-1 font-pretendardSemiBold">장소 추천받기</Text>
              <Text className="text-white text-body-2 font-pretendardMedium">혼자 가기 좋은 장소를 추천해 드려요.</Text>
            </View>
            <View style={styles.arrowCircleFilled}>
              <Icon name="previous" width={20} height={20} flip color="#FFF" />
            </View>
          </Pressable>

          {/* CTA 카드 2 */}
          <Pressable
            onPress={() => router.push("/route-recommend")}
            style={[styles.ctaCard, styles.ctaOutline]}
          >
            <Image source={Images.common.ctaRoute} style={styles.ctaThumb} />
            <View style={{ flex: 1 }}>
              <Text className="text-black text-heading-1 font-pretendardSemiBold">루트 추천받기</Text>
              <Text className="text-black text-body-2 font-pretendardMedium">혼자 가기 좋은 루트를 추천해 드려요.</Text>
            </View>
            <View style={styles.arrowCircleOutline}>
              <Icon name="previous" width={20} height={20} flip color="#2A7A3A" />
            </View>
          </Pressable>

          {/* 바로가기 4개 */}
          <View style={styles.shortcutsRow}>
            <Shortcut icon={Images.common.check} label="출석체크" onPress={() => {}} />
            <Shortcut icon={Images.common.mission} label="미션" onPress={() => {}} />
            <Shortcut icon={Images.common.bookmark} label="찜/북마크" onPress={() => {}} />
            <Shortcut icon={Images.common.badge} label="뱃지" onPress={() => {}} />
          </View>

          {/* 섹션들 */}
          <View style={{ paddingHorizontal: 14, marginTop: 50 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>진행 중인 퀘스트</Text>
              <Pressable hitSlop={8}>
                <Text style={styles.more}>더보기</Text>
              </Pressable>
            </View>
            <View style={styles.questCard}>
              <QuestItem title="카페 방문하고 여정기록 작성하기" progress="1/3" />
              <QuestItem title="카페 방문하고 여정기록 작성하기" progress="1/3" />
              <QuestItem title="카페 방문하고 여정기록 작성하기" progress="1/3" />
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
            <Text style={styles.sectionTitle}>다른 탐험가들의 선택</Text>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 12 }}
            >
              <PlaceCard title="한강공원" source={Images.backgrounds.sample} />
              <PlaceCard title="한강공원" source={Images.backgrounds.sample} />
              <PlaceCard title="한강공원" source={Images.backgrounds.sample} />
            </ScrollView>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <Text style={styles.sectionTitle}>오늘의 테마 추천</Text>
            <View style={styles.banner}>
              <Image source={Images.backgrounds.sample} style={styles.bannerImg} resizeMode="cover" />
              <View style={styles.bannerOverlay}>
                <Text style={styles.bannerTitle}>무더운 여름</Text>
                <Text style={styles.bannerSub}>빙수 한 그릇 어떤가요?</Text>
                <Text style={styles.bannerMeta}>혼칼, 혼박지!</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 다이얼로그 */}
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

/* 서브 컴포넌트 */
function Pill({ label, icon, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.pill}>
      {icon && (
        <Image
          source={icon}
          style={{ width: 24, height: 24, marginRight: 1 }}
          resizeMode="contain"
        />
      )}
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

function Shortcut({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.shortcut}>
      <View style={styles.shortcutIconWrap}>
        <Image source={icon} style={{ width: 40, height: 40 }} resizeMode="contain" />
      </View>
      <Text style={styles.shortcutLabel}>{label}</Text>
    </Pressable>
  );
}

function QuestItem({ title, progress }) {
  return (
    <View style={styles.questRow}>
      <Text style={styles.questText} numberOfLines={1}>{title}</Text>
      <Text style={styles.questProgress}>{progress}</Text>
    </View>
  );
}

function PlaceCard({ title, source }) {
  return (
    <View style={styles.placeCard}>
      <Image source={source} style={styles.placeImg} resizeMode="cover" />
      <View style={styles.placeGrad} />
      <View style={styles.placeMetaRow}>
        <Icon name="location" width={14} height={14} color="#fff" />
        <Text style={styles.placeTitle} numberOfLines={1}>{title}</Text>
      </View>
    </View>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  /* HERO */
  hero: {
    paddingHorizontal: 25,
    justifyContent: "flex-end",
  },
  speech: {
    position: "absolute",
    left: 20,
    top: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  speechTail: {
    position: "absolute",
    left: 14,
    bottom: -6,
    width: 12,
    height: 12,
    backgroundColor: "#fff",
    transform: [{ rotate: "45deg" }],
  },
  mascot: { width: 320, height: 230, alignSelf: "center" },

  heroBottomRow: { flexDirection: "row", alignItems: "flex-end", paddingBottom: 37 },
  nickname: { fontSize: 22, color: "#fff", fontFamily: "Pretendard-ExtraBold" },
  level: { marginTop: 2, fontSize: 12, color: "#FFF", fontFamily: "Pretendard-Medium" },
  progressWrap: {
    marginTop: 6,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.33)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#FFF", borderRadius: 999 },

  pillsCol: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 7,
  },
  pill: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 999,
    paddingHorizontal: 12,  
    height: 36,
    flexDirection: "row",  
    alignItems: "center",
  },
  pillText: { fontSize: 14, color: "#FFF", fontFamily: "Pretendard-SemiBold" },

  /* SHEET (스크롤뷰 내부의 흰 영역) */
  sheet: {
    marginTop: -40, // 히어로 위로 겹치기
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 10,
    // 살짝 떠보이는 그림자 느낌
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
  },
  sheetHandle: {
    alignSelf: "center",
    width: 60,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E7ECEF",
    marginTop: 10,
    marginBottom: 8,
  },

  /* CTA */
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 12,
  },
  ctaThumb: { width: 44, height: 44, marginRight: 12, borderRadius: 8 },

  ctaFilled: { backgroundColor: "#2A7A3A" },

  badgeNow: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F7EA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeNowText: { color: "#2A7A3A", fontSize: 10, fontFamily: "Pretendard-SemiBold" },
  arrowCircleFilled: {
    width: 33,
    height: 33,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#fff",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  ctaOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2A7A3A",
  },
  arrowCircleOutline: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#2A7A3A",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  /* Shortcuts */
  shortcutsRow: {
    marginTop: 34,
    marginBottom: 8,
    marginHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shortcut: { alignItems: "center", width: (SCREEN_W - 40) / 4 },
  shortcutIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  shortcutLabel: { fontSize: 14, color: "#6B6B6B", fontFamily: "Pretendard-Medium" },

  /* Sections */
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 16, fontFamily: "Pretendard-SemiBold", color: "#111" },
  more: { fontSize: 12, color: "#8C8C8C", fontFamily: "Pretendard-Medium" },

  questCard: {
    marginTop: 10,
    backgroundColor: "#F3F5F0",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  questRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  questText: { flex: 1, fontSize: 13, color: "#3A3F3B", fontFamily: "Pretendard-Medium" },
  questProgress: { marginLeft: 8, fontSize: 13, color: "#3A3F3B", fontFamily: "Pretendard-SemiBold" },

  placeCard: {
    width: 180,
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#DDD",
    marginRight: 12,
  },
  placeImg: { width: "100%", height: "100%" },
  placeGrad: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  placeMetaRow: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  placeTitle: { color: "#fff", fontSize: 13, fontFamily: "Pretendard-SemiBold", flex: 1 },

  banner: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 8,
  },
  bannerImg: { width: "100%", height: "100%" },
  bannerOverlay: { position: "absolute", left: 16, bottom: 14 },
  bannerTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Pretendard-SemiBold",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bannerSub: { color: "#fff", fontSize: 13, fontFamily: "Pretendard-Medium", marginTop: 2 },
  bannerMeta: { color: "#fff", fontSize: 11, opacity: 0.9, marginTop: 6, fontFamily: "Pretendard-Medium" },
});