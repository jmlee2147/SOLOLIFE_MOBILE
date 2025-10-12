import { Images } from "@assets/images";
import AppDialog from "@components/shared/AppDialog";
import Icon from "@components/shared/Icon";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useToast } from "@providers/ToastProvider";
import MaskedView from "@react-native-masked-view/masked-view";
import { consumePendingToast, peekPendingToast } from "@utils/toastNext";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router, useFocusEffect, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
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
import { pickColors, pickEffects } from "../../../../theme/phase";

// 테마 + 이펙트
import Rain from "@components/effects/Rain";
import Snow from "@components/effects/Snow";
import Stars from "@components/effects/Stars";
import { useThemeX } from "@providers/ThemeProvider";

import AsyncStorage from "@react-native-async-storage/async-storage";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN?.trim();

const { width: SCREEN_W } = Dimensions.get("window");
const HEADER_HEIGHT = 44;

function useTodayTheme() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    async function run() {
      if (!API_BASE_URL) {
        console.warn("[today] ❌ API_BASE_URL missing");
        setError(new Error("API_BASE_URL missing"));
        setLoading(false);
        return;
      }

      try {
        // ✅ 위치 권한 요청
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Location permission denied");
        }

        // ✅ 현재 위치 얻기
        const { coords } = await Location.getCurrentPositionAsync({});
        let lat = coords.latitude;
        let lng = coords.longitude;
        console.log("[today] 📍 User coords:", lat, lng);

        if (lat === 37.785834 && lng === -122.406417) {
          console.log("[today] ⚙️ Expo mock detected → override to Suwon");
          lat = 37.2636;
          lng = 127.0286;
        }

        // ✅ 토큰 우선순위: TEST_TOKEN > AsyncStorage("jwt")
        let token = TEST_TOKEN;
        if (!token) {
          try {
            token = await AsyncStorage.getItem("jwt");
          } catch (e) {
            console.warn("[today] AsyncStorage getItem error:", e);
          }
        }

        const url = `${API_BASE_URL}/today?lat=${lat}&lng=${lng}`;
        console.log("[today] ▶️ Fetch start:", url);

        const r = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: ctrl.signal,
        });

        console.log("[today] 📡 Status:", r.status);
        const json = await r.json().catch(() => ({}));
        console.log("[today] 📦 Response JSON:", json);

        if (!r.ok) {
          if (r.status === 401) throw new Error("Unauthorized");
          console.warn("[today] ⚠️ Non-OK response:", r.status);
        }

        if (alive) {
          setData(json || null);
          setLoading(false);
        }
      } catch (e) {
        console.error("[today] ❗ Error during fetch:", e);
        if (alive) {
          setError(e);
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, []);

  return { data, loading, error };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [showDialog, setShowDialog] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  const { showToast } = useToast();
  const pathname = usePathname();

  const bottomSheetRef = useRef(null);
  const snapPoints = React.useMemo(() => ["31%", "82%"], []);

  const {
    data: today,
    loading: todayLoading,
    error: todayError,
  } = useTodayTheme();

  // 🔹 테마 상태 (백엔드 /weather/brief + 로컬 시간대 분기)
  const theme = useThemeX(); // { condition, subphase, colors, effects, provider, updatedAt }

  // 🔹 테스트용 강제 오버라이드 (야매)
  const DEV_OVERRIDE = true; // true로 바꾸면 테스트 모드
  if (DEV_OVERRIDE) {
    // ① 날씨 상태 고르기
    const cond = "SUNNY"; // SUNNY | CLOUDY | RAIN | SNOW
    // ② 시간대 직접 지정
    // SUNNY → morning | day | night
    // CLOUDY → am | pm
    // RAIN → all
    // SNOW → am | pm
    const sub = "night";

    theme.condition = cond;
    theme.subphase = sub;
    theme.colors = pickColors(cond, sub); // 팔레트 자동
    theme.effects = pickEffects(cond, sub); // 이펙트 자동
  }

  const isDarkBG =
    theme?.condition === "SUNNY" ||
    theme?.condition === "RAIN" ||
    (theme?.condition === "CLOUDY" && theme?.subphase === "pm") ||
    (theme?.condition === "SNOW" && theme?.subphase === "pm");

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
      return () => {
        mounted = false;
      };
    }, [pathname, showToast])
  );

  return (
    <View style={{ flex: 1 }}>
      {/* 🔹 전역 배경 그라데이션 */}
      <LinearGradient
        colors={theme?.colors ?? ["#B9E09D", "#419833"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* 🔹 날씨 이펙트 */}
      {theme?.effects?.showStars ? <Stars count={40} /> : null}
      {theme?.effects?.showRain ? <Rain count={96} /> : null}
      {theme?.effects?.showSnow ? <Snow count={48} /> : null}

      <StatusBar
        style={isDarkBG ? "light" : "dark"}
        translucent
        backgroundColor="transparent"
      />

      {/* 상단 히어로 영역 (고정) */}
      <View
        style={[
          styles.hero,
          {
            paddingTop: insets.top + HEADER_HEIGHT + 12,
            width: SCREEN_W,
            minHeight: 320 + insets.top,
          },
        ]}
      >
        {/* 말풍선 */}
        <View style={styles.speech}>
          <Text className="text-heading-3 font-pretendardSemiBold">
            포슬감자님 오늘 기분은 어떠세요?
          </Text>
          <View style={styles.speechTail} />
        </View>

        {/* 마스코트 */}
        <Image
          source={Images.backgrounds.main}
          style={styles.mascot}
          resizeMode="contain"
        />

        {/* 프로필/진행도/오른쪽 알약 버튼 */}
        <View style={styles.heroBottomCol}>
          <Text
            style={{ color: isDarkBG ? "#FFFFFF" : "#6B6B6B" }}
            className="text-title-2 font-pretendardExtraBold"
          >
            포슬감자
          </Text>
          <Text
            style={{ color: isDarkBG ? "#FFFFFF" : "#6B6B6B" }}
            className="text-body-1 font-pretendardMedium"
          >
            LV 3 용감한 탐험가
          </Text>

          {/* 진행도 */}
          <View style={styles.progressWrap}>
            <View style={styles.progressFill} />
          </View>

          {/* 알약 버튼들 */}
          <View style={styles.pillsRow}>
            <Pill
              label="미션"
              icon={Images.common.medal}
              onPress={() => router.push("/(fullscreen)/mission")}
            />
            <Pill label="출석체크" icon={Images.common.check} />
            <Pill
              label="찜 / 저장"
              icon={Images.common.bookmark}
              onPress={() => router.push("/storage")}
            />
          </View>
        </View>
      </View>

      {/* 진짜 BottomSheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        backgroundStyle={{
          backgroundColor: "#FFF",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          // 원래 흰 시트처럼 살짝 뜨는 그림자 느낌
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
        }}
        handleIndicatorStyle={{
          backgroundColor: "#E7ECEF",
          width: 60,
          height: 5,
          borderRadius: 999,
        }}
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 80, // 하단 여백
          }}
        >
          {/* CTA 카드 */}
          <CtaFilled
            title="장소 추천받기"
            subtitle="혼자가기 좋은 장소를 추천해 드려요."
            image={Images.common.ctaPlace}
            imageOffsetX={-15}
            imageOffsetY={25}
            imageScale={0.9}
            onPress={() => router.push("/place-recommend")}
            badgeText="지금 시작하기"
          />

          {/* CTA 카드 2 (테두리 그라데이션) */}
          <CtaOutline
            title="루트 추천받기"
            subtitle="혼자가기 좋은 루트를 추천해 드려요."
            image={Images.common.ctaRoute}
            imageOffsetX={-70}
            imageOffsetY={-20}
            imageScale={0.95}
            onPress={() => router.push("/route-recommend")}
          />

          {/* 바로가기 4개 */}
          <View style={styles.shortcutsRow}>
            <Shortcut
              icon={Images.common.check}
              label="출석체크"
              onPress={() => {}}
            />
            <Shortcut
              icon={Images.common.bookmark}
              label="찜 / 저장"
              onPress={() => {}}
            />
            <Shortcut
              icon={Images.common.collection}
              label="캐릭터 도감"
              onPress={() => router.push("/character-book")}
            />
            <Shortcut
              icon={Images.places.activity}
              label="꾸미기"
              onPress={() => router.push("/customize")}
            />
          </View>

          <View style={{ height: 1, backgroundColor: "#F4F4F4" }} />

          {/* ───────── 미션 모아보기 섹션 ───────── */}
          <View style={{ paddingHorizontal: 25, marginTop: 55 }}>
            {/* 헤더 */}
            <View style={styles.sectionHeader}>
              <Text className="text-title-3 font-pretendardSemiBold">
                미션 모아보기
              </Text>
              <Pressable
                hitSlop={8}
                onPress={() => router.push("/(fullscreen)/mission")}
              >
                <Text className="text-body-2 font-pretendardMedium">
                  더보기
                </Text>
              </Pressable>
            </View>

            {/* 보유 포인트 */}
            <View style={missionStyles.pointWrap}>
              <View style={missionStyles.Chip}>
                <Text className="text-body-2 font-pretendardMedium">
                  보유 포인트
                </Text>
              </View>
              <View style={missionStyles.pointRow}>
                <Image
                  source={Images.common.point}
                  style={{ width: 32, height: 32, marginRight: 4 }}
                  resizeMode="contain"
                />
                <Text style={missionStyles.pointValue}>100000</Text>
                <Text style={missionStyles.pointUnit}> p</Text>
              </View>
            </View>

            {/* 오늘의 미션 */}
            <View style={{ marginTop: 34 }}>
              <View style={missionStyles.Chip}>
                <Text className="text-body-2 font-pretendardMedium">
                  오늘의 미션
                </Text>
              </View>

              <View style={missionStyles.todayCard}>
                {/* 상단 라벨 영역 */}
                <View style={missionStyles.todayHead}>
                  <Text className="text-body-2 font-pretendardMedium text-gray500">
                    아무 장소 찜하기 누르기
                  </Text>
                  <View style={missionStyles.doneChip}>
                    <Text className="text-body-3 font-pretendardSemiBold text-gray500">
                      참여 완료
                    </Text>
                  </View>
                </View>

                {/* 항목들 */}
                <MissionRow title="루트 만들고 저장하기" point="3" />
                <MissionRow title="여정 기록 작성하기" point="5" />
                <MissionRow title="뽑기 진행하기" point="1" />
              </View>
            </View>

            {/* 진행중 미션 */}
            <View style={{ marginTop: 18 }}>
              <View style={missionStyles.Chip}>
                <Text className="text-body-2 font-pretendardMedium">
                  진행중 미션
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 12 }}
              >
                {/* 완료 카드 */}
                <MissionTileDone title="장소 추천 1회 받기" />
                {/* 진행 카드들 */}
                <MissionTileProgress
                  title="루트 추천 2회 받기"
                  progress="1/2"
                />
                <MissionTileProgress
                  title="루트 추천 3회 받기"
                  progress="0/3"
                />
              </ScrollView>
            </View>
          </View>
          {/* ───────── /미션 모아보기 섹션 ───────── */}

          <View
            style={{ height: 1, backgroundColor: "#F4F4F4", marginTop: 53 }}
          />

          <View style={{ paddingHorizontal: 25, marginTop: 64 }}>
            <Text className="text-heading-1 font-pretendardSemiBold">
              오늘의 테마 추천
            </Text>
            <Pressable
              disabled={!today?.location}
              onPress={() => {
                const loc = today?.location;
                if (!loc) return;
                router.push({
                  pathname: "/(main)/place-recommend/detail/[id]",
                  params: {
                    id: String(loc.location_id),
                    // 상세 화면에서 초기 데이터로 활용 가능하면 아래 전달
                    initial: encodeURIComponent(
                      JSON.stringify({
                        location_id: Number(loc.location_id),
                        location_name: loc.location_name,
                        address: loc.address ?? "",
                        category: loc.category ?? "",
                        photos: loc.thumbnail_url ? [loc.thumbnail_url] : [],
                      })
                    ),
                  },
                });
              }}
              style={styles.banner}
            >
              {/* 배너 이미지: location.thumbnail_url 없거나 로딩이면 placeholder */}
              <Image
                source={
                  todayLoading
                    ? Images.backgrounds.fallback
                    : today?.location?.thumbnail_url
                    ? { uri: today.location.thumbnail_url }
                    : Images.backgrounds.fallback
                }
                style={styles.bannerImg}
                resizeMode="cover"
              />

              <View style={styles.bannerOverlay}>
                <View style={{ width: "90%", flexShrink: 1 }}>
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "Pretendard-SemiBold",
                      fontSize: 20,
                      lineHeight: 26,
                      flexWrap: "wrap",
                    }}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {todayLoading
                      ? "오늘의 분위기를 불러오는 중..."
                      : today?.theme_phrase ||
                        "오늘은 나를 위한 특별한 시간을 가져보는 건 어떠세요?"}
                  </Text>
                </View>
                {!!today?.location && (
                  <Text
                    className="text-white text-body-3 font-pretendardMedium"
                    numberOfLines={1}
                  >
                    {today.location.location_name}
                    {today.location.category
                      ? ` · ${today.location.category}`
                      : ""}
                    {Array.isArray(today.location.keywords) &&
                    today.location.keywords.length > 0
                      ? ` · #${today.location.keywords.slice(0, 2).join(" #")}`
                      : ""}
                  </Text>
                )}
                {todayError && (
                  <Text
                    className="text-white text-caption font-pretendardRegular"
                    numberOfLines={1}
                  >
                    네트워크가 불안정해요. 나중에 다시 시도해주세요.
                  </Text>
                )}
              </View>
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 25, marginTop: 48 }}>
            <Text className="text-heading-1 font-pretendardSemiBold">
              다른 탐험가들의 선택
            </Text>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 16 }}
            >
              <PlaceCard title="한강공원" source={Images.backgrounds.sample} />
              <PlaceCard title="한강공원" source={Images.backgrounds.sample} />
              <PlaceCard title="한강공원" source={Images.backgrounds.sample} />
            </ScrollView>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>

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

/* 서브 컴포넌트: 그대로 */
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
  const isDecorate = label === "꾸미기";
  const iconSize = isDecorate ? 52 : 42; // 원래보다 약간 키움

  return (
    <Pressable onPress={onPress} style={styles.shortcut}>
      <View style={styles.shortcutIconWrap}>
        <Image
          source={icon}
          style={{ width: iconSize, height: iconSize }}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.shortcutLabel}>{label}</Text>
    </Pressable>
  );
}

function QuestItem({ title, progress }) {
  return (
    <View style={styles.questRow}>
      <Text style={styles.questText} numberOfLines={1}>
        {title}
      </Text>
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
        <Text style={styles.placeTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
}

function CtaFilled({
  title,
  subtitle,
  image,
  onPress,
  badgeText,
  imageOffsetX = 8,
  imageOffsetY = 0,
  imageScale = 1.1,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ marginHorizontal: 20, marginTop: 14 }}
    >
      {/* “지금 시작하기” 배지 */}
      {!!badgeText && (
        <View style={ctaStyles.badgeWrap}>
          {/* 보더 그라데이션 */}
          <LinearGradient
            colors={["#64BC2E", "#2E7A45"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={ctaStyles.badgeBorder}
          >
            {/* 흰 배경 + 텍스트 */}
            <View style={ctaStyles.badgeInner}>
              {/* 텍스트 그라데이션 */}
              <MaskedView
                maskElement={
                  <Text
                    style={[
                      ctaStyles.badgeText,
                      { backgroundColor: "transparent" },
                    ]}
                  >
                    {badgeText}
                  </Text>
                }
              >
                <LinearGradient
                  colors={["#64BC2E", "#2E7A45"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[ctaStyles.badgeText, { opacity: 0 }]}>
                    {badgeText}
                  </Text>
                </LinearGradient>
              </MaskedView>
            </View>
          </LinearGradient>
        </View>
      )}
      <LinearGradient
        colors={["#45AC67", "#2A7A3A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ctaStyles.cardGrad}
      >
        {/* 오른쪽 이미지: 레이아웃 비참여(absolute), 텍스트 아래 레이어 */}
        <View pointerEvents="none" style={ctaStyles.imageAbs}>
          <Image
            source={image}
            style={[
              ctaStyles.image,
              {
                transform: [
                  { translateX: imageOffsetX },
                  { translateY: imageOffsetY },
                  { scale: imageScale },
                ],
              },
            ]}
            resizeMode="cover"
          />
        </View>

        {/* 텍스트: 위 레이어 */}
        <View style={ctaStyles.textBlock}>
          <Text className="text-white text-heading-2 font-pretendardSemiBold">
            {title}
          </Text>
          <Text className="text-white text-body-3 font-pretendardRegular">
            {subtitle}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function CtaOutline({
  title,
  subtitle,
  image,
  onPress,
  imageOffsetX = 8,
  imageOffsetY = 0,
  imageScale = 1.1,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ marginHorizontal: 20, marginTop: 11 }}
    >
      <LinearGradient
        colors={["#6BD58E", "#2A7A3A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ctaStyles.cardBorderGrad}
      >
        <View style={ctaStyles.cardBorderInner}>
          {/* 오른쪽 이미지: 절대배치(아래 레이어) */}
          <View pointerEvents="none" style={ctaStyles.imageAbs}>
            <Image
              source={image}
              style={[
                ctaStyles.image,
                {
                  transform: [
                    { translateX: imageOffsetX },
                    { translateY: imageOffsetY },
                    { scale: imageScale },
                  ],
                },
              ]}
              resizeMode="cover"
            />
          </View>

          {/* 텍스트: 위 레이어 */}
          <View style={ctaStyles.textBlock}>
            <Text className="text-black text-heading-2 font-pretendardSemiBold">
              {title}
            </Text>
            <Text className="text-black text-body-3 font-pretendardRegular">
              {subtitle}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function MissionRow({ title, point }) {
  return (
    <View style={missionStyles.row}>
      <Text
        className="text-body-2 font-pretendardMedium"
        numberOfLines={1}
        style={{ flex: 1 }}
      >
        {title}
      </Text>
      <View style={missionStyles.pointPill}>
        <Text className="text-body-3 font-pretendardSemiBold text-green900">
          {point} p
        </Text>
      </View>
    </View>
  );
}

function MissionTileDone({ title }) {
  return (
    <View style={[missionStyles.tile, missionStyles.tileDone]}>
      <Text
        className="text-white text-heading-2 font-pretendardSemiBold"
        numberOfLines={2}
      >
        {title}
      </Text>
      <View style={missionStyles.tileCheckCircle}>
        <Icon name="circle_check" width={46} height={46} color="#fff" />
      </View>
    </View>
  );
}

function MissionTileProgress({ title, progress }) {
  return (
    <View style={[missionStyles.tile, missionStyles.tileDefault]}>
      <Text
        className="text-black text-heading-2 font-pretendardSemiBold"
        numberOfLines={2}
      >
        {title}
      </Text>
      <Text style={missionStyles.tileProgress}>{progress}</Text>
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
    left: 25,
    top: 78,
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
  mascot: {
    width: 343,
    height: 260,
    alignSelf: "center",
    marginTop: 15,
  },

  heroBottomCol: {
    marginTop: -20,
    flexDirection: "column",
    alignItems: "flex-start",
    paddingBottom: 100,
    gap: 6,
  },
  progressWrap: {
    marginTop: 4,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.33)",
    borderRadius: 999,
    overflow: "hidden",
    width: "50%",
    alignSelf: "stretch",
  },
  progressFill: {
    height: "100%",
    width: "33%",
    backgroundColor: "#EE7A13",
    borderRadius: 999,
  },

  pillsRow: {
    marginTop: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    marginTop: 27,
    marginBottom: 43,
    marginHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shortcut: { alignItems: "center", width: (SCREEN_W - 25) / 4 },
  shortcutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  shortcutLabel: {
    fontSize: 14,
    color: "#6B6B6B",
    fontFamily: "Pretendard-Medium",
  },

  /* Sections */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Pretendard-SemiBold",
    color: "#111",
  },
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
  questText: {
    flex: 1,
    fontSize: 13,
    color: "#3A3F3B",
    fontFamily: "Pretendard-Medium",
  },
  questProgress: {
    marginLeft: 8,
    fontSize: 13,
    color: "#3A3F3B",
    fontFamily: "Pretendard-SemiBold",
  },

  placeCard: {
    width: 175,
    height: 225,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#DDD",
    marginRight: 10,
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
  placeTitle: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Pretendard-SemiBold",
    flex: 1,
  },

  banner: {
    width: "100%",
    height: 189,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 16,
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
  bannerSub: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Pretendard-Medium",
    marginTop: 2,
  },
  bannerMeta: {
    color: "#fff",
    fontSize: 11,
    opacity: 0.9,
    marginTop: 6,
    fontFamily: "Pretendard-Medium",
  },
});

const ctaStyles = StyleSheet.create({
  /* Filled */
  cardGrad: {
    borderRadius: 10,
    overflow: "hidden",
    minHeight: 86,
    paddingLeft: 18,
    paddingVertical: 18,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  textBlock: {
    zIndex: 2,
  },

  /* Gradient Border */
  cardBorderGrad: {
    borderRadius: 10,
    padding: 2, // 테두리 두께
  },
  cardBorderInner: {
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    minHeight: 86,
    paddingLeft: 18,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },

  /* 오른쪽 이미지: 절대배치(레이아웃 비참여) + 카드 안에서 클리핑 */
  imageAbs: {
    position: "absolute",
    right: 0,
    top: -40,
    bottom: -40,
    width: 180, // 필요 시 160~200 사이로 조절
    // overflow: "hidden",
    zIndex: 1,
  },

  /* 오른쪽 이미지 클리핑 (라운드 카드 경계 안에서 잘리도록) */
  imageClip: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  image: {
    width: "200%",
    height: "100%",
  },

  /* 배지 */
  badgeWrap: {
    position: "absolute",
    left: 14,
    top: -12, // 카드에 살짝 걸치도록
    zIndex: 3,
  },

  badgeBorder: {
    padding: 1, // 테두리 두께
    borderRadius: 999,
  },

  badgeInner: {
    backgroundColor: "#FFF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#2C6E3A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Pretendard-SemiBold",
  },
});

const missionStyles = StyleSheet.create({
  /* 포인트 */
  pointWrap: { marginTop: 26 },
  Chip: {
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F4",
    height: 24,
    width: 88,
    borderRadius: 999,
    marginBottom: 8,
  },
  pointChipText: {
    color: "#6F766F",
    fontSize: 12,
    fontFamily: "Pretendard-SemiBold",
  },
  pointRow: { flexDirection: "row", alignItems: "center" },
  pointValue: {
    fontSize: 34,
    lineHeight: 34 * 1.4,
    fontFamily: "Pretendard-ExtraBold",
  },
  pointUnit: {
    fontSize: 20,
    lineHeight: 20 * 1.4,
    color: "#111",
    fontFamily: "Pretendard-SemiBold",
  },

  /* “오늘의 미션” */
  smallChip: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F1EF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },

  todayCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4D4D4",
    paddingLeft: 28,
    paddingRight: 20,
    paddingVertical: 20,
    marginTop: 13,
    marginBottom: 34,
  },
  todayHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  todayHeadTitle: {
    color: "#9BA09B",
    fontSize: 14,
    fontFamily: "Pretendard-SemiBold",
  },
  doneChip: {
    backgroundColor: "#F4F4F4",
    height: 26,
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  doneChipText: {
    color: "#9BA09B",
    fontSize: 12,
    fontFamily: "Pretendard-SemiBold",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  rowTitle: {
    flex: 1,
  },
  pointPill: {
    backgroundColor: "#C9DCC1",
    height: 26,
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  pointPillText: {
    color: "#2F6A31",
    fontSize: 13,
    fontFamily: "Pretendard-Bold",
  },

  /* 진행중 미션 타일 */
  tile: {
    width: 140,
    height: 140,
    borderRadius: 10,
    marginRight: 16,
    padding: 14,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  tileDefault: { backgroundColor: "#FFFFFF" },
  tileDone: { backgroundColor: "#8CAF69" },
  tileTitle: {
    color: "#101210",
    fontSize: 16,
    fontFamily: "Pretendard-SemiBold",
  },
  tileTitleDone: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Pretendard-SemiBold",
  },
  tileProgress: {
    alignSelf: "flex-end",
    fontSize: 28,
    fontFamily: "Pretendard-ExtraBold",
    color: "#62974F",
  },
  tileCheckCircle: {
    alignSelf: "flex-end",
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
});
