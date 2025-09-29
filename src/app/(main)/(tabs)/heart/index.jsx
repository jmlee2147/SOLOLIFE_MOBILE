import BottomSheet, {
  BottomSheetFlashList,
  BottomSheetView,
  useBottomSheetSpringConfigs
} from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo, useRef } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function TabSecondPage() {
  const bottomSheetRef = useRef(null);

  const handleSheetChanges = useCallback((index, position, type) => {
    console.log("handleSheetChanges", index, position, type);
  }, []);

  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 100,
    overshootClamping: true,
    restDisplacementThreshold: 0.1,
    restSpeedThreshold: 0.1,
    stiffness: 500,
  });

  const data = useMemo(
    () =>
      Array(50)
        .fill(0)
        .map((_, index) => `index-${index}`),
    []
  );

  const snapPoints = useMemo(() => ["25%", "50%"], []);

  const handleSnapPress = useCallback((index) => {
    bottomSheetRef.current?.snapToIndex(index);
  }, []);
  const handleClosePress = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const renderItem = useCallback(({ item }) => {
    return (
      <View style={styles.itemContainer}>
        <Text>{item}</Text>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      <Button title="Snap To 50%" onPress={() => handleSnapPress(1)} />
      <Button title="Snap To 25%" onPress={() => handleSnapPress(0)} />
      <Button title="Close" onPress={handleClosePress} />

      <BottomSheet
        ref={bottomSheetRef}
        index={0} // 시작 인덱스
        onChange={handleSheetChanges}
        snapPoints={snapPoints}
        animationConfigs={animationConfigs}
        enableDynamicSizing={false}
      >
        <BottomSheetFlashList
          data={data}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          estimatedItemSize={43.3}
        />
        <BottomSheetView style={styles.contentContainer}>
          <Text>Awesome 🎉</Text>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: "center",
  },
  itemContainer: {
    padding: 6,
    margin: 6,
    backgroundColor: "#eee",
  },
});