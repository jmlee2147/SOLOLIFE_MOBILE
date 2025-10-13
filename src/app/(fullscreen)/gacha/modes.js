import { Images, getTreasureSources } from "@assets/images";
import TreasureOpening from "@components/animation/TreasureOpening";
import React from "react";
import { Image } from "react-native";

export const GACHA_MODES = {
  character: {
    id: "character",
    title: "캐릭터 뽑기",
    cta: "캐릭터 뽑기",
    cost: 100,
    bgSource: Images.gacha.character,
    banner: { text: "~10/31 이벤트 기간 동안에만 만날 수 있어요!" },
    centerRender: ({ opened }) =>
      opened && (
        <Image
          source={require("@assets/characters/photo_explorer_female.png")}
          style={{ width: 300, height: 300 }}
          resizeMode="contain"
        />
      ),
    // ← 좌측 위젯: 배경 뽑기로 이동
    switchers: [
      {
        label: "배경뽑기",
        icon: Images.gacha.widgets.scroll,
        to: "background",
        iconMarginBottom: -8,
      },
    ],
    anim: {
      Component: TreasureOpening,
      getSources: () => getTreasureSources("default"),
      props: { size: 280, hideChestAfterOpen: true },
    },
    idleImage: Images.gacha.treasure.static,
    idleSize: { width: 320, height: 320 },
  },

  background: {
    id: "background",
    title: "배경 뽑기",
    cta: "배경 뽑기",
    cost: 50,
    bgSource: Images.gacha.background,
    centerRender: ({ opened }) =>
      opened && (
        <Image
          source={require("@assets/characters/photo_explorer_female.png")}
          style={{ width: 320, height: 320 }}
          resizeMode="contain"
        />
      ),
    // ← 좌측 위젯: 캐릭터 뽑기로 이동
    switchers: [
      {
        label: "캐릭터 뽑기",
        icon: Images.gacha.widgets.treasure,
        to: "character",
        iconMarginBottom: -16,
      },
    ],

    anim: {
        Component: TreasureOpening,
        getSources: () => getTreasureSources("default"),
        props: { size: 280, hideChestAfterOpen: true },
      },
    idleImage: Images.gacha.scroll.static, // 정지 이미지
    idleSize: { width: 376, height: 266 },
  },

  halloween: {
    id: "halloween",
    title: "할로윈 이벤트",
    cta: "뽑기",
    cost: 100,
    bgSource: Images.gacha.halloween,
    banner: { text: "~10/31 이벤트 기간 동안에만 만날 수 있어요!" },
    chestVariant: "pumpkin",
    overlay: { start: 0.35, colors: ["rgba(0,0,0,0.05)", "rgba(0,0,0,0.45)"] },
    centerRender: ({ opened }) =>
      opened && (
        <Image
          source={Images.gacha.halloween}
          style={{ width: 320, height: 320 }}
          resizeMode="contain"
        />
      ),
    // ← 좌측 위젯: 두 개 다 보임
    switchers: [
      {
        label: "캐릭터 뽑기",
        icon: Images.gacha.widgets.chest,
        to: "character",
      },
      {
        label: "배경뽑기",
        icon: Images.gacha.widgets.scroll,
        to: "background",
      },
    ],
    active: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 9, 1); // 10/1
      const end = new Date(now.getFullYear(), 9, 31, 23, 59, 59);
      return now >= start && now <= end;
    },
    banner: { text: "~10/31 이벤트 기간 동안에만 만날 수 있어요!" },
  },
};

const HALLOWEEN_BANNER = {
  text: "~10/31 이벤트 기간 동안에만 만날 수 있어요!",
};
export const getModeConfig = (modeId) => {
  const base =
    GACHA_MODES[modeId] && (GACHA_MODES[modeId].active?.() ?? true)
      ? GACHA_MODES[modeId]
      : GACHA_MODES.character;
  const isHalloween = GACHA_MODES.halloween.active?.() ?? false;
  return {
    ...base,
    banner: base.banner ?? (isHalloween ? HALLOWEEN_BANNER : undefined),
  };
};
