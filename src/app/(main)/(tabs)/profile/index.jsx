import { Images } from "@assets/images";
import Header from "@components/shared/Header";
import Icon from "@components/shared/Icon";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
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
import Svg, { Path } from "react-native-svg";
// 임시 프로필 데이터 (필요시 props/state로 교체)
const PROFILE = {
  name: "포슬감자",
  title: "LV 3 용감한 탐험가",
  avatar: Images.common.profile,
  point: 100,
  goal: 200,
};

// 출석 더미 (UI 전용)
const DAYS = [
  { date: "10/20", checked: true, reward: "50P" },
  { date: "10/21", checked: true },
  { date: "10/22", checked: true },
  { date: "10/23", checked: true },
  { date: "10/24", checked: true, reward: "50P" },
  { date: "10/25", checked: true, reward: "50P" },
  { date: "10/26", checked: true },
];

// SVG path (viewBox: 363 x 204)
const PATH_D =
  "M-12 25.6136C-12 25.6136 140.488 -22.6921 177.343 25.614C214.198 73.9202 319.695 22.214 319.695 75.0752C319.695 158.46 25.7764 41.445 34.5295 117.458C40.6227 170.373 183.573 104.604 195.31 164.449C210.052 239.62 363 169.056 363 169.056";

// 0~1 진행 위치(스탬프 배치 포인트)
const TICKS = [0.08, 0.17, 0.31, 0.47, 0.62, 0.86, 0.95];

function AttendancePathSVG({
  d = "",
  viewBoxW = 363,
  viewBoxH = 204,
  height = 250,
  ticks = [],
  stroke = "#62974F",
  strokeWidth = 8.29238,
  renderBubble = () => null,
  bubbleSize = 62,
}) {
  const [layout, setLayout] = React.useState({ w: 0, h: 0 });
  const [positions, setPositions] = React.useState([]);
  const pathRef = React.useRef(null);

  // ticks 가드
  const list = Array.isArray(ticks) ? ticks : [];

  // 레이아웃 이후 Path 길이/좌표 계산 (react-native-svg Path 메서드 사용)
  React.useEffect(() => {
    let mounted = true;
    async function measure() {
      try {
        if (!pathRef.current || !layout.w || !layout.h) return;
        const total = await pathRef.current.getTotalLength?.();
        if (!total || !Number.isFinite(total)) return;
        const pts = list.map((t) => {
          const clamped = Math.max(0, Math.min(1, t));
          const p = pathRef.current.getPointAtLength?.(clamped * total);
          return p ? { x: p.x, y: p.y } : { x: 0, y: 0 };
        });
        if (mounted) setPositions(pts);
      } catch (e) {
        console.warn("[AttendancePathSVG] measure fail", e?.message);
      }
    }
    measure();
    return () => {
      mounted = false;
    };
  }, [d, list, layout.w, layout.h]);

  const rawScaleX = layout.w / viewBoxW || 0;
  const rawScaleY = layout.h / viewBoxH || 0;
  const scale = Math.min(rawScaleX, rawScaleY);
  const offsetX = (layout.w - viewBoxW * scale) / 2;
  const offsetY = (layout.h - viewBoxH * scale) / 2;

  return (
    <View
      onLayout={(e) => {
        const { width, height: h } = e.nativeEvent.layout;
        if (width && h) setLayout({ w: width, h });
      }}
      style={{ height }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          ref={pathRef}
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </Svg>

      {positions.map((pt, idx) => {
        const x = offsetX + pt.x * scale;
        const y = offsetY + pt.y * scale;
        return (
          <View
            key={idx}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: [
                { translateX: -bubbleSize / 2 },
                { translateY: -bubbleSize / 2 },
              ],
            }}
            pointerEvents="box-none"
          >
            {typeof renderBubble === "function" ? renderBubble({ idx }) : null}
          </View>
        );
      })}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const progress = useMemo(() => PROFILE.point / PROFILE.goal, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* ===== 헤더 ===== */}
      <Header
        leftIcon="previous"
        onLeftPress={() => router.push("/home")}
        rightIcon="notification"
        // onRightPress={() => router.push("/home")}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: 25,
          paddingBottom: (insets?.bottom || 0) + 32,
          backgroundColor: "#fff",
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== 아바타 ===== */}
        <View style={styles.avatarWrap}>
          <Image source={PROFILE.avatar} style={styles.avatar} />
          <View style={styles.cameraBadge}>
            <Icon name="camera" width={23} height={23} />
          </View>
        </View>

        {/* ===== 이름/레벨 ===== */}
        <Text className="text-title-2 font-pretendardExtraBold">
          {PROFILE.name}
        </Text>
        <Text className="text-heading-3 font-pretendardSemiBold">
          {PROFILE.title}
        </Text>

        {/* ===== 진행바 ===== */}
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(0, Math.min(1, progress)) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {PROFILE.point}/{PROFILE.goal}
          </Text>
        </View>

        {/* ===== 출석 카드 ===== */}
        <View style={styles.card}>
          <View style={styles.cardChip}>
            <Text className="text-body-2 font-pretendardRegular">
              출석 체크
            </Text>
          </View>

          <AttendancePathSVG
            d={PATH_D}
            viewBoxW={363}
            viewBoxH={204}
            height={250}
            ticks={TICKS}
            stroke="#62974F"
            strokeWidth={8.29238}
            renderBubble={({ idx }) => (
              <DayBubble
                date={DAYS[idx]?.date}
                checked={!!DAYS[idx]?.checked}
                reward={DAYS[idx]?.reward}
                highlight={!!DAYS[idx]?.reward}
                dim={!DAYS[idx]?.checked}
              />
            )}
          />
        </View>

        {/* ===== 메뉴 리스트 ===== */}
        <View style={{ marginTop: 8 }}>
          <MenuRow label="기본 동네 설정" onPress={() => {}} />
          <MenuRow label="관심사 설정" onPress={() => {}} />
          <MenuRow label="알람 설정" onPress={() => {}} />
          <MenuRow label="내정보 관리" onPress={() => {}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DayBubble({ date, checked, reward, dim = false, highlight = false }) {
  return (
    <View style={[styles.dayWrap, dim && { opacity: 0.4 }]}>
      <View
        style={[
          styles.dayCircle,
          !checked && { backgroundColor: "#EEE" },
          highlight && { borderColor: "#42790E", borderWidth: 3.7 },
        ]}
      >
        <Icon
          name="camp"
          width={45}
          height={33}
          color={reward ? "#B0CBA7" : "#D4D4D4"} // 보상 있으면 주황, 없으면 기본 초록
        />
        {!!reward && (
          <View style={styles.rewardBadge}>
            <Text className="text-body-2 font-pretendardSemiBold text-green900">
              {reward}
            </Text>
          </View>
        )}
        {/* 날짜를 원 내부에 표시 */}
        <Text
          className="text-body-3"
          style={{ color: reward ? "#B0CBA7" : "#D4D4D4" }}
        >
          {date}
        </Text>
      </View>
    </View>
  );
}

function MenuRow({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.menuRow}>
      <Text className="text-body-0 font-pretendardLight">{label}</Text>
    </Pressable>
  );
}

const ORANGE = "#E9A369";
const GREEN = "#5F8B48";

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#fff",
  },

  avatarWrap: { alignSelf: "center", marginTop: 6, marginBottom: 17 },
  avatar: {
    width: 173,
    height: 173,
    borderRadius: 208 / 2,
    backgroundColor: "#DDD",
  },
  cameraBadge: {
    position: "absolute",
    right: 12,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },

  name: { marginTop: 8, fontSize: 28, fontWeight: "800", color: "#111" },
  subtitle: { marginTop: 4, fontSize: 16, fontWeight: "600", color: "#444" },

  progressRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 11,
    backgroundColor: "rgba(255,152,88,0.33)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: 11, backgroundColor: "#EE7A13", borderRadius: 999 },
  progressLabel: { fontSize: 14, fontWeight: "600", color: "#555" },

  card: {
    marginHorizontal: -10,
    marginTop: 31,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4D4D4",
    paddingVertical: 12,
  },
  cardChip: {
    alignSelf: "flex-start",
    backgroundColor: "#F4F4F4",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 1,
    marginBottom: 6,
    marginLeft: 12,
  },

  dayWrap: { alignItems: "center" },
  dayCircle: {
    width: 62,
    height: 62,
    borderRadius: 50,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#E6E6E6",
    borderWidth: 1,
  },
  rewardBadge: {
    position: "absolute",
    bottom: -3,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
  },
  menuText: { fontSize: 16, color: "#111" },
});
