import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import AddPlaceCard from "../../../../components/journey/AddPlaceCard";
import LogBoardCard from "../../../../components/journey/LogBoardCard";
import LogListCard from "../../../../components/journey/LogListCard";
import SortDropdown from "../../../../components/journey/SortDropdown";

const JourneyScreen = () => {
  const [sort, setSort] = useState("recommended"); // 추천순, 인기순
  const [category, setCategory] = useState(null);  // 카테고리 필터

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff", paddingHorizontal: 25 }}
      contentContainerStyle={{ paddingVertical: 16 }}
    >
      {/* 드롭다운 영역 */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        <SortDropdown value={sort} onChange={setSort} />
        {/* 카테고리도 같은 컴포넌트 재사용 가능 */}
        <SortDropdown
          value={category}
          onChange={setCategory}
          options={[
            { label: "카테고리", value: null },
            { label: "카페", value: "cafe" },
            { label: "쇼핑", value: "shopping" },
            { label: "먹거리", value: "food" },
            { label: "체험", value: "activity" },
            { label: "전시", value: "exhibit" },
            { label: "독서/공부", value: "study" },
            { label: "산책", value: "walk" },
          ]}
        />
      </View>

      <AddPlaceCard
        name="55데시벨"
        category="카페, 디저트"
        address="경기도 수원시 영통구"
        rating={5}
        onDelete={() => console.log("delete")}
        onPress={() => console.log("press")}
        style={{ marginBottom: 16 }}
      />

      {/* 보드형 카드 */}
      <LogBoardCard
        profileImage={require("../../../../assets/images/explorer.png")}
        authorName="배고픈판다"
        thumbnail={require("../../../../assets/images/sample.png")}
        title="주말 기록"
        placeText="55데시벨, 맥도날드"
        dateText="2025.08.31"
        excerpt="오늘은 카페에서 하루 종일 공부하고, 저녁엔 햄버거를 먹었다..."
        liked
        onPress={() => console.log("보드카드 눌림")}
      />

      <LogBoardCard
        profileImage={require("../../../../assets/images/explorer.png")}
        authorName="배고픈여우"
        thumbnail={require("../../../../assets/images/sample.png")}
        title="주말 기록"
        placeText="55데시벨, 부타센세"
        dateText="2025.08.31"
        excerpt="오늘은 카페에서 하루 종일 공부하고, 저녁엔 햄버거를 먹었다..."
        onPress={() => console.log("보드카드 눌림")}
      />

      {/* 내 기록 리스트형 */}
      <View style={{ marginTop: 16 }}>
        <LogListCard
          isMine
          thumbnail={require("../../../../assets/images/sample.png")}
          title="내 기록 카드"
          placeText="카페 게이트"
          dateText="2025.08.31"
          visibility="private"
          commentsCount={2}
          reactionsCount={10}
          liked
          onPress={() => console.log("내 기록 눌림")}
        />
      </View>

      {/* 다른 탐험가 기록 리스트형 */}
      <View style={{ marginTop: 16 }}>
        <LogListCard
          thumbnail={require("../../../../assets/images/sample.png")}
          title="탐험가 기록 카드"
          placeText="카페 칸나"
          dateText="2025.08.30"
          authorName="포슬감자"
          commentsCount={3}
          reactionsCount={5}
          bookmarked
          onPress={() => console.log("탐험가 기록 눌림")}
        />
      </View>
    </ScrollView>
  );
};

export default JourneyScreen;