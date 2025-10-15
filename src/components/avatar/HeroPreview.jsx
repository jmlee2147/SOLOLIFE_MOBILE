// components/appearance/HeroPreview.jsx
import { getCharacterSpriteById } from "@assets/characters";
import { OBJECTS } from "@assets/objects";
import { CANVAS, SLOT_LAYOUT, SLOT_SIZES } from "@assets/slots/layout";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

/**
 * props:
 *  - slots = { characterId, slotBg1, slotBg23: [] }
 *  - size: number | undefined  // (선택) 최종 높이. 미지정 시 CANVAS.height 사용
 *  - owned: boolean            // 기본 true
 */
export default function HeroPreview({ slots, size, style, owned = true }) {
  const characterId = slots?.characterId ?? null;
  const slotBg1 = slots?.slotBg1 ?? null;                  // bg1-only
  const slotBg23 = Array.isArray(slots?.slotBg23) ? slots.slotBg23.slice(0, 2) : [];

  // ── 소스 매핑
  const charSrc = characterId ? getCharacterSpriteById(characterId, owned) : null;
  const srcBg1  = slotBg1 && OBJECTS[slotBg1]?.group === "bg1-only" ? OBJECTS[slotBg1].src : null;
  const srcBg23_0 = slotBg23[0] && OBJECTS[slotBg23[0]]?.group === "bg23" ? OBJECTS[slotBg23[0]].src : null;
  const srcBg23_1 = slotBg23[1] && OBJECTS[slotBg23[1]]?.group === "bg23" ? OBJECTS[slotBg23[1]].src : null;

  // ── 스케일(옵션): size가 들어오면 CANVAS.height 대비 스케일
  const scale = size ? size / CANVAS.height : 1;

  // 절대 배치 스타일 생성기
  const slotStyle = (key) => {
    const sz = SLOT_SIZES[key];     // { w, h }
    const lt = SLOT_LAYOUT[key];    // { left/right, top/bottom, z }
    const pos = {};
    if (lt.left  !== undefined) pos.left  = lt.left;
    if (lt.right !== undefined) pos.right = lt.right;
    if (lt.top   !== undefined) pos.top   = lt.top;
    if (lt.bottom!== undefined) pos.bottom= lt.bottom;
    return [
      styles.abs,
      { width: sz.w, height: sz.h, zIndex: lt.z ?? 1 },
      pos,
    ];
  };

  return (
    // 바깥 컨테이너는 스케일된 실제 렌더 크기
    <View style={[{ width: CANVAS.width * scale, height: CANVAS.height * scale }, style]}>
      {/* 안쪽은 원본 캔버스 좌표계로 두고 전체를 scale */}
      <View style={{ width: CANVAS.width, height: CANVAS.height, transform: [{ scale }] }}>
        {/* z=1~3: 배경 오브젝트 */}
        {srcBg23_0 ? <Image source={srcBg23_0} style={slotStyle("bg2")} resizeMode="contain" /> : null}
        {srcBg23_1 ? <Image source={srcBg23_1} style={slotStyle("bg3")} resizeMode="contain" /> : null}
        {srcBg1    ? <Image source={srcBg1}    style={slotStyle("bg1")} resizeMode="contain" /> : null}

        {/* z=4: 캐릭터 */}
        {charSrc ? (
          <Image source={charSrc} style={slotStyle("character")} resizeMode="contain" />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: "absolute" },
});