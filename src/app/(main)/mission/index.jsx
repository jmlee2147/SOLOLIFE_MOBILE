import { Images } from "@assets/images";
import Header from "@components/shared/Header";
import { usePointsStore } from "@store/points.store";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MissionScreen() {
  const insets = useSafeAreaInsets();

  // mock counts
  const progressingCount = 0;
  const doneCount = 0;
  const router = useRouter();

  const { points, loadPoints } = usePointsStore();

  React.useEffect(() => {
    loadPoints?.();
  }, []);

  const [activeTab, setActiveTab] = React.useState("progress");

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header */}
      <Header
        leftIcon="previous"
        onLeftPress={() => router.push("/home")}
        rightIcon="notification"
        // onRightPress={() => router.push("/home")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* 보유 포인트 */}
        <View style={{ paddingHorizontal: 25, marginTop: 20 }}>
          <View style={styles.pointChip}>
            <Text className="text-body-2 font-pretendardRegular">
              보유 포인트
            </Text>
          </View>
          <View style={styles.pointRow}>
            <Image
              source={Images.common.point}
              style={{
                width: 31,
                height: 31,
                marginRight: 4,
                alignSelf: "center",
              }}
              resizeMode="contain"
            />
            <Text style={styles.pointValue}>
              {Number(points ?? 0).toLocaleString()}
            </Text>
            <Text style={styles.pointUnit}> p</Text>
          </View>
        </View>

        {/* 진행/완료 카드 */}
        <View style={{ paddingHorizontal: 15, marginTop: 35 }}>
          <View style={styles.dualCard}>
            <View
              style={[
                styles.dualCol,
                {
                  borderRightWidth: StyleSheet.hairlineWidth,
                  borderRightColor: "#AFAFAF",
                },
              ]}
            >
              <Text className="mb-3 text-body-2 font-pretendardRegular text-gray700">
                진행중인 미션
              </Text>
              <Text className="text-heading-2 font-pretendardSemiBold">
                {progressingCount}
              </Text>
            </View>
            <View style={styles.dualCol}>
              <Text className="mb-3 text-body-2 font-pretendardRegular text-gray700">
                완료한 미션
              </Text>
              <Text className="text-heading-2 font-pretendardSemiBold">
                {doneCount}
              </Text>
            </View>
          </View>
        </View>

        {/* 오늘의 미션 */}
        <View style={{ paddingHorizontal: 16, marginTop: 11 }}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.grayChip}>
                <Text className="text-body-2 font-pretendardRegular">
                  오늘의 미션
                </Text>
              </View>
            </View>

            <MissionRow title="루트 만들고 저장하기" point={3} />
            <MissionRow title="여정 기록 작성하기" point={5} topDivider />
            <MissionRow title="뽑기 진행하기" point={1} topDivider />
          </View>
        </View>

        {/* 탭 영역 */}
        <View style={{ marginTop: 60, marginBottom: 16 }}>
          <View style={styles.tabsRow}>
            <Pressable
              style={[
                styles.tabItem,
                activeTab === "progress" && styles.tabItemActive,
              ]}
              onPress={() => setActiveTab("progress")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "progress" && styles.tabTextActive,
                ]}
              >
                미션
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tabItem,
                activeTab === "done" && styles.tabItemActive,
              ]}
              onPress={() => setActiveTab("done")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "done" && styles.tabTextActive,
                ]}
              >
                완료한 미션
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 리스트 - 진행중 예시 or 완료한 미션 */}
        {activeTab === "progress" ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <MissionTileProgressCard
              title="장소 추천 1회 받기"
              progressRatio={1}
              point={10}
              subtitle="탐험 준비 완료!"
            />
            <MissionTileProgressCard
              title="루트 추천 1회 받기"
              progressRatio={0.4}
              point={10}
              subtitle="루트 탐색자"
            />
            <MissionTileProgressCard
              title="장소 1곳 찜하기"
              progressRatio={0.35}
              point={10}
              subtitle="내가 좋아하는 장소"
            />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <MissionTileDoneCard
              title="장소 추천 1회 받기"
              subtitle="탐험 준비 완료!"
            />
            <MissionTileDoneCard
              title="루트 완성"
              point={8}
              subtitle="탐험 완료!"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MissionRow({ title, point, topDivider = false }) {
  return (
    <View>
      {topDivider && <View style={styles.rowDivider} />}
      <View style={styles.row}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.pointPill}>
          <Text className="text-body-3 font-pretendardSemiBold text-green900">
            {point}p
          </Text>
        </View>
      </View>
    </View>
  );
}

function MissionTileProgressCard({
  title,
  subtitle,
  progressRatio = 0,
  point = 0,
}) {
  const ratio = Math.max(0, Math.min(1, progressRatio));
  return (
    <View style={styles.tileWrap}>
      {!!subtitle && (
        <Text className="text-body-2 font-pretendardRegular text-gray700">
          {subtitle}
        </Text>
      )}
      <Text className="mb-2 text-heading-3 font-pretendardSemiBold">{title}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
      </View>
      <View style={styles.pointCircle}>
        <Text className="text-heading-3 font-pretendardSemiBold text-green900">
          {point} P
        </Text>
      </View>
    </View>
  );
}

function MissionTileDoneCard({ title, subtitle, point }) {
  return (
    <View style={styles.tileWrap}>
      {!!subtitle && (
        <Text className="text-body-2 font-pretendardRegular text-gray700">
          {subtitle}
        </Text>
      )}
      <Text className="mb-2 text-heading-3 font-pretendardSemiBold">{title}</Text>
      <View style={[styles.progressBar, { backgroundColor: "#E4E9E4" }]}>
        <View
          style={[
            styles.progressFill,
            { width: "100%", backgroundColor: "#AFAFAF" },
          ]}
        />
      </View>
      <View style={[styles.pointCircle, { borderColor: "#AFAFAF" }]}>
        <Text className=" text-heading-3 font-pretendardSemiBold text-gray500">완료</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  pointChip: {
    alignSelf: "flex-start",
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },
  pointRow: { flexDirection: "row", alignItems: "center" },
  pointValue: {
    fontSize: 36,
    lineHeight: 36,
    fontFamily: "Pretendard-ExtraBold",
    includeFontPadding: false,
  },
  pointUnit: {
    fontSize: 20,
    lineHeight: 20,
    fontFamily: "Pretendard-SemiBold",
    marginLeft: 4,
    includeFontPadding: false,
  },

  dualCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4D4D4",
    backgroundColor: "#fff",
    flexDirection: "row",
    overflow: "hidden",
  },
  dualCol: { flex: 1, alignItems: "center", paddingVertical: 18 },
  dualTitle: { fontSize: 14, color: "#666", fontFamily: "Pretendard-Medium" },
  dualCount: { marginTop: 6, fontSize: 24, fontFamily: "Pretendard-ExtraBold" },

  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4D4D4",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  grayChip: {
    backgroundColor: "#F4F4F4",
    height: 22,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  doneChip: {
    backgroundColor: "#F4F4F4",
    height: 22,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  doneChipText: {
    fontSize: 12,
    color: "#757575",
    fontFamily: "Pretendard-SemiBold",
  },

  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    color: "#111",
    fontFamily: "Pretendard-Medium",
  },
  pointPill: {
    backgroundColor: "#C9DCC1",
    height: 26,
    width: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pointPillText: {
    fontSize: 12,
    color: "#2E7D32",
    fontFamily: "Pretendard-SemiBold",
  },

  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E4",
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    position: "relative",
  },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: "#111" },
  tabText: { fontSize: 16, color: "#AFAFAF", fontFamily: "Pretendard-Medium" },
  tabTextActive: { color: "#111" },

  tileWrap: {
    // backgroundColor: "#fff000",
    paddingHorizontal: 11,
    marginBottom: 28,
  },
  progressBar: {
    height: 10,
    marginRight: 100,
    borderRadius: 999,
    backgroundColor: "#E6E9E4",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#62974F",
    borderRadius: 999,
  },
  pointCircle: {
    position: "absolute",
    right: 0,
    top: 2,
    width: 49,
    height: 49,
    borderRadius: 999,
    backgroundColor: "#FCFFFA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#62974F",
  },
  pointCircleText: {
    fontSize: 14,
    color: "#2E7D32",
    fontFamily: "Pretendard-ExtraBold",
  },
});
