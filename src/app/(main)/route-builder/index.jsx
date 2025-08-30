import { useLocalSearchParams, useRouter } from "expo-router";
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import RouteStepCard from "../../../components/route/RouteStepCard";
import Header from '../../../components/shared/Header';

const RouteBuilderScreen  = () => {
    const router = useRouter();
    const { placeName } = useLocalSearchParams();
    return (
        <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <Header
                title="장소 추천받기"
                leftIcon="previous"
                onLeftPress={() => router.back()}
                rightIcon="home_header"
                onRightPress={() => router.push("/home")}
            />
            <View style={styles.container}>
                <Text className="mb-2 text-title-1 font-pretendardExtraBold">좋은 선택이에요.</Text>
                <Text className="mb-[10%] text-heading-3 font-pretendardMedium text-gray700">
                {placeName
                    ? `‘${placeName}’을 탐험 장소로 결정하셨군요!`
                    : "탐험 장소를 선택해 주세요."}
                </Text>
            </View>

            <RouteStepCard
                step={1}
                title="55데시벨"
                rating={4.5}
                categories={["카페", "디저트"]}
                address="경기도 수원시 영통구"
                imageSource={require("../../../assets/images/sample.png")}
                style={{ alignSelf: "center" }}
            />
        </View>
    )
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 18 },
});

export default RouteBuilderScreen;