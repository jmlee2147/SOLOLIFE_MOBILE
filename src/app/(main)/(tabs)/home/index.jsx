// app/(main)/(tabs)/home/index.jsx  (경로는 네 구조에 맞춰서)
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppDialog from "../../../../components/shared/AppDialog";
import Header from "../../../../components/shared/Header";
import Icon from "../../../../components/shared/Icon";

const HERO_BG = require("../../../../assets/images/background.png");
const MASCOT  = require("../../../../assets/images/main_background.png");
const SAMPLE1 = require("../../../../assets/images/sample.png");
const SAMPLE2 = require("../../../../assets/images/shopping.png");

const { width: SCREEN_W } = Dimensions.get("window");
const HEADER_HEIGHT = 44;

export default function HomeScreen() {
  const [showDialog, setShowDialog] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F5F7" }}>
      {/* 투명 오버레이 헤더 */}
      <Header
        title="홈"
        leftIcon="notification"
        onLeftPress={() => {}}
        rightIcon="menu"
        onRightPress={() => {}}
        backgroundColor="#B9E09D"
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
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 히어로 영역 */}
        <View style={styles.heroWrap}>
        <LinearGradient
          colors={["#B9E09D", "#419833"]} // 상→하 (스샷 느낌의 그린 톤)
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.heroBg,
            { width: SCREEN_W, paddingTop: insets.top + HEADER_HEIGHT + 10 },
          ]}
        >
            {/* 말풍선 */}
            <View style={styles.speech}>
              <Text style={styles.speechText}>포슬감자님 오늘 기분은 어떠세요?</Text>
              <View style={styles.speechTail} />
            </View>

            {/* 캐릭터 */}
            <Image source={MASCOT} style={styles.mascot} resizeMode="contain" />

            {/* 프로필/레벨/출석체크 */}
            <View style={styles.profileCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nickname}>포슬감자</Text>
                <Text style={styles.level}>LV 3 용감한 탐험가</Text>
                <View style={styles.progressBarWrap}>
                  <View style={[styles.progressBarFill, { width: "60%" }]} />
                </View>
              </View>

              <Pressable style={styles.checkinBtn}>
                <Icon name="gift" width={16} height={16} color="#ffffff" />
                <Text style={styles.checkinText}>출석체크</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* 기능 버튼 그리드 */}
        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <View style={styles.grid}>
            <FeatureBtn
              icon={<Icon name="place" width={22} height={22} />}
              label="장소 추천"
              onPress={() => router.push("/place-recommend")}
            />
            <FeatureBtn
              icon={<Icon name="route" width={22} height={22} />}
              label="루트 추천"
              onPress={() => setShowDialog(true)}
            />
            <FeatureBtn
              icon={<Icon name="route_add" width={22} height={22} />}
              label="루트 만들기"
              onPress={() => {}}
            />
            <FeatureBtn
              icon={<Icon name="bookmarrk" width={22} height={22} />}
              label="찜/북마크"
              onPress={() => {}}
            />
            <FeatureBtn
              icon={<Icon name="mission" width={22} height={22} />}
              label="미션"
              onPress={() => {}}
            />
            <FeatureBtn
              icon={<Icon name="badge" width={22} height={22} />}
              label="뱃지"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* 진행 중인 퀘스트 */}
        <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>진행 중인 퀘스트</Text>
            <Pressable hitSlop={8}><Text style={styles.more}>더보기</Text></Pressable>
          </View>

          <View style={styles.questCard}>
            <QuestItem title="카페 방문하고 여정기록 작성하기" progress="1/3" />
            <QuestItem title="카페 방문하고 여정기록 작성하기" progress="1/3" />
            <QuestItem title="카페 방문하고 여정기록 작성하기" progress="1/3" />
          </View>
        </View>

        {/* 다른 탐험가들의 선택 (가로 스크롤 카드) */}
        <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
          <Text style={styles.sectionTitle}>다른 탐험가들의 선택</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 12 }}
          >
            <PlaceCard title="한강공원" source={SAMPLE1} />
            <PlaceCard title="한강공원" source={SAMPLE1} />
            <PlaceCard title="한강공원" source={SAMPLE1} />
          </ScrollView>
        </View>

        {/* 오늘의 테마 추천 */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <Text style={styles.sectionTitle}>오늘의 테마 추천</Text>
          <View style={styles.banner}>
            <Image source={SAMPLE2} style={styles.bannerImg} resizeMode="cover" />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>무더운 여름</Text>
              <Text style={styles.bannerSub}>빙수 한 그릇 어떤가요?</Text>
              <Text style={styles.bannerMeta}>콘셉: 혼카, 훈박지</Text>
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

/* ---------- 서브 컴포넌트 ---------- */
function FeatureBtn({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.featureBtn}>
      <View style={styles.featureIcon}>{icon}</View>
      <Text style={styles.featureLabel} numberOfLines={1}>{label}</Text>
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
        <Icon name="pin" width={14} height={14} color="#fff" />
        <Text style={styles.placeTitle} numberOfLines={1}>{title}</Text>
      </View>
    </View>
  );
}

/* ---------- 스타일 ---------- */
const styles = StyleSheet.create({
  heroWrap: { backgroundColor: "#EAF5EA" },
  heroBg: {
    height: 420,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  speech: {
    position: "absolute",
    left: 20,
    top: 18,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  speechText: { fontSize: 14, fontFamily: "Pretendard-SemiBold", color: "#111" },
  speechTail: {
    position: "absolute",
    left: 14,
    bottom: -6,
    width: 12, height: 12,
    backgroundColor: "#fff",
    transform: [{ rotate: "45deg" }],
  },
  mascot: { alignSelf: "center", width: 324, height: 260 },

  profileCard: {
    width: "100%",
    minHeight: 84,
    // backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nickname: { fontSize: 24, fontFamily: "Pretendard-ExtraBold", color: "#FFF" },
  level: { marginTop: 2, fontSize: 12, color: "#FFF", fontFamily: "Pretendard-Medium" },
  progressBarWrap: {
    marginTop: 8,
    height: 10,
    backgroundColor: "rgba(255, 255, 255, 0.33)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: "#FFF", borderRadius: 999 },

  checkinBtn: {
    marginLeft: "auto",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkinText: { color: "#fff", fontSize: 14, fontFamily: "Pretendard-SemiBold" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureBtn: {
    width: (SCREEN_W - 20 * 2 - 12 * 3) / 3, // 4열
    height: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#F6F7F6",
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  featureLabel: { fontSize: 12, color: "#263238", fontFamily: "Pretendard-SemiBold" },

  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
    width: 180, height: 120, borderRadius: 14, overflow: "hidden",
    backgroundColor: "#DDD", marginRight: 12,
  },
  placeImg: { width: "100%", height: "100%" },
  placeGrad: {
    position: "absolute", left: 0, right: 0, bottom: 0, height: 70,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  placeMetaRow: {
    position: "absolute", left: 10, right: 10, bottom: 8,
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  placeTitle: {
    color: "#fff", fontSize: 13, fontFamily: "Pretendard-SemiBold", flex: 1,
  },

  banner: { width: "100%", height: 180, borderRadius: 16, overflow: "hidden", marginTop: 10 },
  bannerImg: { width: "100%", height: "100%" },
  bannerOverlay: { position: "absolute", left: 16, bottom: 14 },
  bannerTitle: {
    color: "#fff", fontSize: 18, fontFamily: "Pretendard-SemiBold",
    textShadowColor: "rgba(0,0,0,0.35)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  bannerSub: {
    color: "#fff", fontSize: 13, fontFamily: "Pretendard-Medium", marginTop: 2,
  },
  bannerMeta: {
    color: "#fff", fontSize: 11, opacity: 0.9, marginTop: 6, fontFamily: "Pretendard-Medium",
  },
});