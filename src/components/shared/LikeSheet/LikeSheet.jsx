import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  createLikeFolderUnique,
  getFolderLocations,
  getLikeFolders,
  renameFolder,
  toggleLocationInFolder,
} from "@services/api";
import React, { forwardRef, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Button from "../Button";
import Icon from "../Icon";

function pickCount(meta) {
  // 서버가 어떤 키를 주든 최대한 맞춰본다.
  // 예: location_count, locations_count, count, total 등
  const c =
    meta?.location_count ??
    meta?.locations_count ??
    meta?.count ??
    meta?.total ??
    0;
  return Number.isFinite(c) ? Number(c) : 0;
}

async function fetchFolderTotal(folderId) {
  try {
    // 페이지 1, size 1만 불러 개수만 확인
    const r = await getFolderLocations(folderId, 1, 1);
    // 서버 구현 따라 total, pagination.total, items.length 등 다양할 수 있음
    const total =
      r?.total ??
      r?.pagination?.total ??
      (Array.isArray(r?.items) ? r.items.length : 0);
    return Number.isFinite(total) ? total : 0;
  } catch {
    return 0;
  }
}

const LikeSheet = forwardRef(({ place, onClose, onConfirm }, ref) => {
  const snapPoints = useMemo(() => ["60%"], []);

  const [lists, setLists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState("");

  const renderBackdrop = (props) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
      opacity={0.5}
      enableTouchThrough={false}
    />
  );

  // 폴더 목록 + 개수 보강 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const items = await getLikeFolders();
        const mapped = (items || []).map((it) => ({
          id: String(it.folder_id ?? it.id),
          name: it.name,
          count: pickCount(it), // 1차: 제공되는 키 사용
        }));
        if (!alive) return;

        // 전부 0이면 서버가 개수 메타를 안 주는 케이스 → 폴더별로 총개수 보강
        const allZero = mapped.length > 0 && mapped.every((f) => (f.count ?? 0) === 0);
        if (allZero) {
          const totals = await Promise.all(
            mapped.map((f) => fetchFolderTotal(f.id))
          );
          if (!alive) return;
          setLists(mapped.map((f, i) => ({ ...f, count: totals[i] ?? 0 })));
        } else {
          setLists(mapped);
        }

        // 선택값 초기화(첫 폴더)
        if (!selected && mapped.length > 0) {
          setSelected(mapped[0].id);
        }
      } catch (e) {
        console.warn("[likeFolders] 목록 조회 실패:", e?.message || e);
        setLists([]);
      }
    })();

    // place 바뀔 때 편집 상태 초기화
    setEditingId(null);
    setTempName("");

    return () => {
      alive = false;
    };
    // place가 변경될 때마다 목록을 최신으로 보는 쪽이 UX에 유리
  }, [place]); // eslint-disable-line react-hooks/exhaustive-deps

  // 폴더 생성
  const handleAddFolder = async () => {
    try {
      const folder = await createLikeFolderUnique("새 폴더");
      const newFolder = {
        id: String(folder.folder_id ?? folder.id),
        name: folder.name || "새 폴더",
        count: 0,
      };
      setLists((prev) => [newFolder, ...prev]);
      setEditingId(newFolder.id);
      setTempName(newFolder.name);
      setSelected(newFolder.id);
    } catch (e) {
      if (e?.code === "LIKE_FOLDERS_NOT_SUPPORTED") {
        Alert.alert("폴더 기능 준비 중", "서버에서 폴더 기능이 아직 활성화되지 않았어요.");
      } else {
        Alert.alert("폴더 생성 실패", e?.message || "네트워크 오류");
      }
    }
  };

  // 폴더 이름 변경
  const handleRename = async (folderId, name) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) {
      setEditingId(null);
      setTempName("");
      return;
    }
    try {
      await renameFolder(folderId, trimmed);
      setLists((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, name: trimmed } : f))
      );
    } catch (e) {
      console.warn("[likeFolders] 이름 변경 실패:", e?.message || e);
      Alert.alert("이름 변경 실패", e?.message || "네트워크 오류");
    } finally {
      setEditingId(null);
      Keyboard.dismiss();
    }
  };

  // 저장: 시트 내부에서 직접 토글 호출 + 결과를 onConfirm에 전달
  const handleSave = async () => {
    const folderId =
      typeof selected === "object" ? selected.id || selected.folder_id : selected;
    const locationId =
      place?.locationId ?? place?.location_id ?? place?.id;

    if (!folderId || !locationId) {
      console.warn("⚠️ 저장 불가: folderId/locationId 없음", {
        folderId,
        locationId,
        place,
      });
      onClose?.();
      return;
    }

    try {
      console.log("💾 save →", { folderId, locationId });
      const res = await toggleLocationInFolder(Number(folderId), Number(locationId));
      const inFolder =
        typeof res?.inFolder === "boolean" ? res.inFolder : !!res?.saved;

      console.log("[LikeSheet] toggle in folder →", {
        folderId: String(folderId),
        locationId: Number(locationId),
        inFolder: !!inFolder,
      });

      // ✅ 로컬 카운트 즉시 반영(토글 후 최종 상태 기준)
      setLists((prev) =>
        prev.map((f) => {
          if (f.id !== String(folderId)) return f;
          const next = (f.count ?? 0) + (inFolder ? 1 : -1);
          return { ...f, count: Math.max(0, next) };
        })
      );

      // Provider로 payload 전달 (API 재호출 없음)
      onConfirm?.({
        folderId: String(folderId),
        locationId: Number(locationId),
        inFolder: !!inFolder,
      });
    } catch (e) {
      Alert.alert("저장 실패", e?.message || "네트워크 오류");
    } finally {
      onClose?.();
    }
  };

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.14,
        shadowRadius: 13,
        elevation: 5,
      }}
      handleIndicatorStyle={{
        backgroundColor: "#D4D4D4",
        width: 78,
        height: 3,
      }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView
        style={{
          flex: 1,
          paddingTop: 14,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
      >
        {/* 헤더 */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 6,
            paddingBottom: 32,
          }}
        >
          <Text className="text-title-3 font-pretendardSemiBold" numberOfLines={1}>
            {place?.title || "장소 추가"}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={{ position: "absolute", right: 0, top: 0, padding: 8 }}
          >
            <Icon name="close" width={24} height={24} />
          </Pressable>
        </View>

        {/* 새 리스트 만들기 */}
        <Pressable
          onPress={handleAddFolder}
          style={{
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: "#D4D4D4",
            paddingHorizontal: 17,
            height: 43,
            alignItems: "center",
            flexDirection: "row",
            marginBottom: 14,
          }}
        >
          <Icon name="plus_circle" width={24} height={24} />
          <Text className="ml-1 text-body-2 font-pretendardMedium text-gray700">
            새 리스트 만들기
          </Text>
        </Pressable>

        {/* 리스트 */}
        <View style={{ gap: 14, flex: 1 }}>
          {lists.map((l) => {
            const active = selected === l.id;
            const isEditing = editingId === l.id;
            return (
              <Pressable
                key={l.id}
                onPress={() => !isEditing && setSelected(l.id)}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 17,
                  height: 43,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: 1.5,
                  borderColor: active ? "#42790E" : "#F4F4F4",
                  backgroundColor: active ? "#FCFFFA" : "#F4F4F4",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  {isEditing ? (
                    <TextInput
                      value={tempName}
                      onChangeText={setTempName}
                      autoFocus
                      onBlur={() => handleRename(l.id, tempName)}
                      onSubmitEditing={() => handleRename(l.id, tempName)}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        fontFamily: "Pretendard-Medium",
                        color: "#111827",
                      }}
                    />
                  ) : (
                    <>
                      <Text className="text-heading-3 font-pretendardMedium text-[#111827]">
                        {l.name}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 6 }}>
                        <Icon
                          name="location"
                          width={14}
                          height={14}
                          color="#9CA3AF"
                          style={{ marginRight: 2 }}
                        />
                        <Text className="text-body-2 font-pretendardMedium text-gray500">
                          {l.count ?? 0}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
                <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                  <Icon
                    name={active ? "check_active" : "check_inactive"}
                    width={24}
                    height={24}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* 저장 버튼 */}
        <View
          style={{
            marginTop: 20,
            paddingTop: 20,
            marginHorizontal: -20,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Button title="저장" size="large" variant="primary" onPress={handleSave} />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default LikeSheet;