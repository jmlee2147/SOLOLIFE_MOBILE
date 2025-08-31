import React from "react";
import { ScrollView, View } from "react-native";
import LogBoardCard from "../../../../components/journey/LogBoardCard";
import LogListCard from "../../../../components/journey/LogListCard";

const JourneyScreen = () => {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff", paddingHorizontal: 25 }} >
      {/* 보드형 카드 */}
      <LogBoardCard
        profileImage={require("../../../../assets/images/explorer.png")}
        authorName="배고픈판다"
        thumbnail={require("../../../../assets/images/sample.png")}
        title="주말 기록"
        placeText="55데시벨, 맥도날드"
        dateText="2025.08.31"
        excerpt="오늘은 카페에서 하루 종일 공부하고, 저녁엔 햄버거를 먹었다. 햄버거 맛있겠다! 햄버거 맛있겠다! 햄버거 맛있겠다! 햄버거 맛있겠다! 헴바가 맛있겠다!!! 배고푸다"
        liked={true}
        bookmarked={false}
        onPress={() => console.log("보드카드 눌림")}
      />

      <LogBoardCard
        profileImage={require("../../../../assets/images/explorer.png")}
        authorName="배고픈여우"
        thumbnail={require("../../../../assets/images/sample.png")}
        title="주말 기록"
        placeText="55데시벨, 부타센세"
        dateText="2025.08.31"
        excerpt="오늘은 카페에서 하루 종일 공부하고, 저녁엔 햄버거를 먹었다. 햄버거 맛있겠다! 햄버거 맛있겠다! 햄버거 맛있겠다! 햄버거 맛있겠다! 헴바가 맛있겠다!!! 배고푸다"
        liked={true}
        bookmarked={false}
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
          isMine={false}
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