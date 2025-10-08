// 공통 집계
export const Images = {
  common: {
    badge: require("./common/badge.png"),
    bookmark: require("./common/bookmark.png"),
    check: require("./common/check.png"),
    coin: require("./common/coin.png"),
    ctaPlace: require("./common/cta_place.png"),
    ctaRoute: require("./common/cta_route.png"),
    hat: require("./common/hat.png"),
    medal: require("./common/medal.png"),
    mission: require("./common/mission.png"),
    thumbs: require("./common/thumbs.png"),
    map: require("./common/map.png"),
    bubble: require("./common/bubble.png"),
  },

  backgrounds: {
    main: require("./backgrounds/main_background.png"),
    sample: require("./backgrounds/sample.png"),
  },

  gacha: {
    jewels: require("./gacha/jewels.png"),
    textDash: require("./gacha/text_dash.png"),

    treasure: {
      closed: require("./gacha/treasure/treasure_close.png"),
      half: require("./gacha/treasure/treasure_half.png"),
      open: require("./gacha/treasure/treasure_open.png"),
      rays: require("./gacha/treasure/treasure_rays.png"),
      static: require("./gacha/treasure/treasure_static.png"),
    },

    scroll: {
      // 중앙 정지/완전열림 기본 아트
      static: require("./gacha/scroll/scroll_static.png"),
      // 프레임들(닫힘→열림 순서로 정렬)

      f0: require("./gacha/scroll/scroll_f0.png"),
      f1: require("./gacha/scroll/scroll_f1.png"),
      f2: require("./gacha/scroll/scroll_f2.png"),
      f3: require("./gacha/scroll/scroll_f3.png"),
      f4: require("./gacha/scroll/scroll_f4.png"),
      f5: require("./gacha/scroll/scroll_f5.png"),
      f6: require("./gacha/scroll/scroll_f6.png"),
      f7: require("./gacha/scroll/scroll_f7.png"),
      
      frames: [
        require("./gacha/scroll/scroll_f0.png"),
        require("./gacha/scroll/scroll_f1.png"),
        require("./gacha/scroll/scroll_f2.png"),
        require("./gacha/scroll/scroll_f3.png"),
        require("./gacha/scroll/scroll_f4.png"),
        require("./gacha/scroll/scroll_f5.png"),
        require("./gacha/scroll/scroll_f6.png"),
        require("./gacha/scroll/scroll_f7.png"),
      ],
    },

    widgets: {
      scroll: require("./gacha/widgets/widgets_scroll.png"),
      shop: require("./gacha/widgets/widgets_shop.png"),
      treasure: require("./gacha/widgets/widgets_treasure.png"),
    },
  },

  monkey: {
    run: require("./monkey/monkey_run.png"),
    write: require("./monkey/monkey_write.png"),
  },

  placeholder: {
    map: require("./placeholder/map_placeholder.png"),
    monkeyBoard: require("./placeholder/monkey_placeholder_board.png"),
    monkeyList: require("./placeholder/monkey_placeholder_list.png"),
  },

  places: {
    activity: require("./places/activity.png"),
    cafe: require("./places/cafe.png"),
    eat: require("./places/eat.png"),
    shopping: require("./places/shopping.png"),
  },
};

// ---------- 헬퍼 ----------

/** 스크롤(배경 뽑기) 프레임: progress(0~1) -> 해당 이미지 */
export function getScrollFrame(progress = 0) {
  const frames = Images.gacha.scroll.frames;
  const p = Math.max(0, Math.min(1, progress));
  const idx = Math.round(p * (frames.length - 1));
  return frames[idx];
}

/** TreasureOpening에 바로 꽂아쓸 source 세트 (상자) */
export function getTreasureSources() {
  const t = Images.gacha.treasure;
  return { closed: t.closed, mid: t.half, open: t.open, rays: t.rays };
}

/** TreasureOpening에 바로 꽂아쓸 source 세트 (두루마리 0/2/4프레임) */
export function getScrollSources() {
  const s = Images.gacha.scroll.frames;
  // 0=닫힘, 2=중간, 4=열림
  return {
    closed: s[0],
    mid: s[2],
    open: s[4],
    rays: Images.gacha.treasure.rays,
  };
}
