import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import FloatingButton from "../../../../components/journey/FloatingButton";
import LogBoardCard from "../../../../components/journey/LogBoardCard";
import LogListCard from "../../../../components/journey/LogListCard";
import SortDropdown from "../../../../components/journey/SortDropdown";
import Icon from "../../../../components/shared/Icon";

const CHARACTER = require("../../../../assets/images/explorer.png");

// 데모 목업
const MOCK_MY = Array.from({ length: 6 }).map((_, i) => ({
  id: `my-${i}`,
  thumbnail: require("../../../../assets/images/sample.png"),
  title: "기록 제목",
  placeText: "칸나, 칸나, 칸나",
  dateText: "2025.07.28",
  visibility: i % 2 ? "public" : "private",
  commentsCount: 0,
  reactionsCount: 0,
  liked: i === 1,
}));

const MOCK_OTHERS = Array.from({ length: 10 }).map((_, i) => ({
  id: `oth-${i}`,
  profileImage: require("../../../../assets/images/explorer.png"),
  authorName: i % 2 ? "배고픈여우" : "배고픈판다",
  thumbnail: require("../../../../assets/images/sample.png"),
  title: "주말 기록",
  placeText: i % 2 ? "55데시벨, 부타센세" : "55데시벨, 맥도날드",
  dateText: "2025.08.31",
  excerpt: "오늘은 카페에서 하루 종일 공부하고, 저녁엔 햄버거를 먹었다...",
  liked: i === 2,
}));

const MOCK_REELS = [
  {
    id: "reel-1",
    thumbnail: require("../../../../assets/images/sample.png"),
    title: "기록 제목",
  },
  {
    id: "reel-2",
    thumbnail: require("../../../../assets/images/sample.png"),
    title: "기록 제목",
  },
  {
    id: "reel-3",
    thumbnail: require("../../../../assets/images/sample.png"),
    title: "기록 제목",
  },
  {
    id: "reel-4",
    thumbnail: require("../../../../assets/images/sample.png"),
    title: "기록 제목",
  },
];

function formatYM(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}.${m}`;
}

export default function JourneyScreen() {
  const [tab, setTab] = useState("explorers");
  const [view, setView] = useState("list");

  // 드롭다운 상태 (탐험가 탭용)
  const [sort, setSort] = useState("latest");
  const [region, setRegion] = useState(null);
  const [category, setCategory] = useState(null);

  // 내 탭에서만 쓰는 월 네비 (탐험가 탭엔 숨김)
  const [month, setMonth] = useState(new Date());

  const [mineW, setMineW] = useState(0);
  const [expW, setExpW] = useState(0);
  const router = useRouter();

  // 옵션들
  const latestOptions = useMemo(
    () => [
      { label: "최신순", value: "latest" },
      { label: "인기순", value: "popular" },
    ],
    []
  );

  const regionOptions = useMemo(
    () => [
      { label: "지역별", value: null },
      { label: "전국", value: "all" },
      { label: "서울", value: "seoul" },
      { label: "경기", value: "gyeonggi" },
      { label: "인천", value: "incheon" },
      { label: "부산", value: "busan" },
    ],
    []
  );

  const categoryOptions = useMemo(
    () => [
      { label: "카테고리", value: null },
      { label: "카페", value: "cafe" },
      { label: "쇼핑", value: "shopping" },
      { label: "먹거리", value: "food" },
      { label: "체험", value: "activity" },
      { label: "전시", value: "exhibit" },
      { label: "독서/공부", value: "study" },
      { label: "산책", value: "walk" },
    ],
    []
  );

  const listData = useMemo(() => {
    const base = tab === "mine" ? MOCK_MY : MOCK_OTHERS;
    if (tab === "explorers") {
      const sorted = sort === "popular" ? [...base].reverse() : base; // 데모용 로직
      // region / category 필터도 여기에서 적용 가능
      return sorted;
    }
    return base;
  }, [tab, sort]);

  const goExplorerDetail = (item) => {
    router.push({
      pathname: "/explorer/[id]", // (tabs) 바깥으로 만든 상세 경로
      params: { id: String(item.id) }, // 문자열이어야 함
    });
  };

  // 릴스 카드 레이아웃
  const { width: SCREEN_W } = Dimensions.get("window");
  const CARD_W = 129;
  const CARD_H = 194;
  const GAP = 8;
  const SIDE = 20;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 탭 + 하단 라인 */}
      <View
        style={{ position: "relative", paddingHorizontal: 25, paddingTop: 8 }}
      >
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            backgroundColor: "#D4D4D4",
          }}
        />
        <View style={{ flexDirection: "row" }}>
          <Pressable
            onPress={() => setTab("mine")}
            style={{
              flex: 1,
              alignItems: "center",
              position: "relative",
              paddingBottom: 8,
            }}
            hitSlop={8}
          >
            <Text
              onLayout={(e) => setMineW(e.nativeEvent.layout.width)}
              className={[
                "text-heading-2 font-pretendardSemiBold",
                tab === "mine" ? "text-black" : "text-gray500",
              ].join(" ")}
            >
              내 여정 기록
            </Text>
            {tab === "mine" && (
              <View
                style={{
                  position: "absolute",
                  bottom: -1,
                  height: 3,
                  width: mineW,
                  backgroundColor: "#000",
                }}
              />
            )}
          </Pressable>

          <Pressable
            onPress={() => setTab("explorers")}
            style={{
              flex: 1,
              alignItems: "center",
              position: "relative",
              paddingBottom: 8,
            }}
            hitSlop={8}
          >
            <Text
              onLayout={(e) => setExpW(e.nativeEvent.layout.width)}
              className={[
                "text-heading-2 font-pretendardSemiBold",
                tab === "explorers" ? "text-black" : "text-gray500",
              ].join(" ")}
            >
              탐험가들의 기록
            </Text>
            {tab === "explorers" && (
              <View
                style={{
                  position: "absolute",
                  bottom: -1,
                  height: 3,
                  width: expW,
                  backgroundColor: "#000",
                }}
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* 상단 인트로/요약 */}
      {tab === "mine" ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={CHARACTER}
              style={{ width: 46, height: 46, resizeMode: "contain" }}
            />
            <View style={{ marginLeft: 6 }}>
              <Text className="text-gray700 text-body-2 font-pretendardMedium">
                포슬감자님,
              </Text>
              <Text className="text-gray700 text-body-2 font-pretendardMedium">
                오늘은 어떤 곳을 탐험하셨나요?
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", marginTop: 13 }}>
            {[
              { label: "작성한 기록", value: 10 },
              { label: "받은 감정", value: 5 },
              { label: "표시한 감정", value: 7 },
            ].map((s, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <Text className="text-heading-2 text-yellow900 font-pretendardSemiBold">
                  {s.value}
                </Text>
                <Text className="text-gray700 text-body-2  font-pretendardMedium mt-[5px]">
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={{
              height: 10,
              backgroundColor: "#F4F4F4",
              marginTop: 12,
              marginHorizontal: -20,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 1,
                height: 4,
              }}
            />
          </View>
        </View>
      ) : (
        <View style={{ paddingTop: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingBottom: 13,
              borderBottomWidth: 1,
              borderBottomColor: "#D4D4D4",
            }}
          >
            <Image
              source={CHARACTER}
              style={{ width: 46, height: 46, resizeMode: "contain" }}
            />
            <Text
              className="text-gray700 text-body-2 font-pretendardMedium"
              style={{ marginLeft: 6 }}
            >
              다른 탐험가들의 여정 기록을 살펴보세요!
            </Text>
          </View>

          {/* 릴스 캐러셀 */}
          <FlatList
            data={MOCK_REELS}
            keyExtractor={(it) => it.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SIDE,
              paddingVertical: 15,
              backgroundColor: "#F4F4F4",
              borderBottomWidth: 1,
              borderBottomColor: "#D4D4D4",
            }}
            ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
            snapToAlignment="start"
            decelerationRate="fast"
            snapToInterval={CARD_W + GAP}
            renderItem={({ item }) => (
              <Pressable onPress={() => {}} style={{ width: CARD_W }}>
                <View
                  style={{
                    width: CARD_W,
                    height: CARD_H,
                    borderRadius: 5,
                    overflow: "hidden",
                    backgroundColor: "#EDEDED",
                  }}
                >
                  <ImageBackground
                    source={item.thumbnail}
                    style={{ flex: 1 }}
                    imageStyle={{
                      width: CARD_W,
                      height: CARD_H,
                      resizeMode: "cover",
                    }}
                  >
                    <LinearGradient
                      colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"]}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 60,
                        paddingHorizontal: 10,
                        justifyContent: "flex-end",
                        paddingBottom: 8,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: "#fff",
                          fontFamily: "Pretendard-SemiBold",
                          fontSize: 14,
                        }}
                      >
                        {item.title}
                      </Text>
                    </LinearGradient>
                  </ImageBackground>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* 상단 컨트롤 줄 */}
      {tab === "mine" ? (
        // 내 여정 기록: 월 네비 + 보기 전환 + (기존) 캘린더 아이콘
        <View
          style={{
            paddingHorizontal: 15,
            paddingTop: 25,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
              hitSlop={10}
            >
              <Icon name="triangle" width={8} height={9} />
            </Pressable>
            <Text
              className="text-title-1 font-pretendardExtraBold"
              style={{ marginHorizontal: 10 }}
            >
              {formatYM(month)}
            </Text>
            <Pressable
              onPress={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
              hitSlop={10}
            >
              <Icon
                name="triangle"
                width={8}
                height={9}
                style={{ transform: [{ scaleX: -1 }] }}
              />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() => setView(view === "list" ? "board" : "list")}
              style={{ marginRight: 12 }}
              hitSlop={10}
            >
              <Icon
                name={view === "list" ? "grid" : "list"}
                width={22}
                height={22}
              />
            </Pressable>
            <Pressable onPress={() => {}} hitSlop={10}>
              <Icon
                name="calendar"
                width={34}
                height={34}
                strokeColor="#AFAFAF"
              />
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* 드롭다운 줄 */}
      {tab === "mine" ? (
        <View
          style={{ paddingHorizontal: 15, paddingTop: 8, paddingBottom: 25 }}
        >
          {/* 기존 1개짜리 정렬 */}
          <SortDropdown
            value={sort}
            onChange={(v) => setSort(v)}
            options={latestOptions}
          />
        </View>
      ) : (
        // 탐험가 탭: 최신순/지역별/카테고리 3개 나란히
        <View
          style={{
            paddingHorizontal: 15,
            paddingTop: 23,
            paddingBottom: 28,
            flexDirection: "row",
            alignItems: "center",
            columnGap: 8,
          }}
        >
          <SortDropdown
            value={sort}
            onChange={(v) => setSort(v)}
            options={latestOptions}
          />
          <SortDropdown
            value={region}
            onChange={(v) => setRegion(v)}
            options={regionOptions}
          />
          <SortDropdown
            value={category}
            onChange={(v) => setCategory(v)}
            options={categoryOptions}
          />

          <Pressable
            onPress={() => setView(view === "list" ? "board" : "list")}
            hitSlop={10}
            style={{ marginLeft: "auto" }}
          >
            <Icon
              name={view === "list" ? "grid" : "list"}
              width={22}
              height={22}
            />
          </Pressable>
        </View>
      )}

      {/* 리스트/보드 */}
      {view === "list" ? (
        <FlatList
          key="list"
          data={listData}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 110 }}
          ItemSeparatorComponent={() => <View style={{ height: 29 }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) =>
            tab === "mine" ? (
              <LogListCard
                isMine
                thumbnail={item.thumbnail}
                title={item.title}
                placeText={item.placeText}
                dateText={item.dateText}
                visibility={item.visibility}
                commentsCount={item.commentsCount}
                reactionsCount={item.reactionsCount}
                liked={item.liked}
                onPress={() => {}}
              />
            ) : (
              <LogListCard
                thumbnail={item.thumbnail}
                title={item.title}
                placeText={item.placeText}
                dateText={item.dateText}
                authorName={item.authorName}
                commentsCount={3}
                reactionsCount={5}
                bookmarked={item.liked}
                onPress={() => goExplorerDetail(item)}
              />
            )
          }
        />
      ) : (
        <FlatList
          key="board"
          data={MOCK_OTHERS}
          contentContainerStyle={{
            paddingHorizontal: tab === "explorers" ? 25 : 15,
            paddingBottom: 110,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <LogBoardCard
              profileImage={item.profileImage}
              authorName={item.authorName}
              thumbnail={item.thumbnail}
              title={item.title}
              placeText={item.placeText}
              dateText={item.dateText}
              excerpt={item.excerpt}
              liked={item.liked}
              onPress={() => goExplorerDetail(item)}
              style={{ width: "100%" }}
            />
          )}
        />
      )}

      {/* 플로팅 버튼 */}
      {tab === "mine" && (
        <FloatingButton
          onPress={() => router.push("/journey-create")}
          label="+100 EXP"
          showLabel
          bottom={24}
          right={15}
          size={50}
          bubbleOffsetX={0}
          bubbleOffsetY={10}
        />
      )}
    </SafeAreaView>
  );
}
