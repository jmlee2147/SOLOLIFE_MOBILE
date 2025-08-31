import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import Icon from "./Icon";

export default function AppDialog({
  visible,
  title,
  description,              
  showDontShow = false,     
  dontShowChecked = false,   
  onToggleDontShow,          
  confirmLabel = "확인",
  cancelLabel = "닫기",
  onConfirm,
  onCancel,
  dismissOnBackdrop = true,  // 배경 터치로 닫기 여부
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <Pressable
        className="items-center justify-center flex-1 px-6 bg-black/50"
        onPress={dismissOnBackdrop ? onCancel : undefined}
      >
        {/* 카드 */}
        <Pressable
          onPress={() => {}}
          className="w-full max-w-[560px] rounded-[10px] bg-white"
          style={{
            paddingTop: 27,
            paddingBottom: 22,
            paddingLeft: 22,
            paddingRight: 22,
          }}
          accessibilityRole="dialog"
          accessibilityLabel={title}
        >
          {/* 제목 */}
          <Text className="mb-2 text-heading-1 font-pretendardSemiBold">
            {title}
          </Text>

          {/* 설명 */}
          {description ? (
            <Text className="mb-[21px] text-body-1 text-gray700">{description}</Text>
          ) : null}

          {/* 다시 보지 않기 */}
          {showDontShow ? (
            <TouchableOpacity
              className="flex-row items-center mb-5"
              onPress={onToggleDontShow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: dontShowChecked }}
            >
              <View
                className={[
                  "w-[13px] h-[13px] mr-1 border-[1.5px] items-center justify-center",
                  dontShowChecked ? "bg-black border-black" : "bg-white border-gray500",
                ].join(" ")}
              >
                {dontShowChecked && (
                  <Icon name="checkbox" width={10} height={9} />
                )}
              </View>
              <Text className="text-heading-3 font-pretendardMedium text-gray500">다시 보지 않기</Text>
            </TouchableOpacity>
          ) : null}

          {/* 버튼 */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onConfirm}
              className="items-center justify-center flex-1 h-[50px] rounded-[10px] bg-green500"
            >
              <Text className="text-white text-heading-3 font-pretendardSemiBold">
                {confirmLabel}
              </Text>
            </Pressable>

            <Pressable
              onPress={onCancel}
              className="items-center justify-center flex-1 h-[50px] rounded-[10px] bg-green500"
            >
              <Text className="text-white text-heading-3 font-pretendardSemiBold">
                {cancelLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}